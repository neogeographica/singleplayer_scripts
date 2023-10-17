/* Copyright 2022 Joel Baxter and 2017 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * The first section of this file (until a comment similar to this one) is
 * copyright Joel Baxter.
 */

const CONTEXT_MENU_ID = "OPEN_WITH_QUAKE";

// The purpose of this extension is just to download a file as the
// application/x-qz MIME type, giving it the ".qz" extension. For this to
// actually do "Open with Quake", you need to have done a few other things
// on your system:
// - Register the application/x-qz MIME type for files with ".qz" extension.
// - Set the Quake app as the default handler for opening application/x-qz
//   files. This is specifically the Quake app from the "Linux desktop
//   integration" stuff described at neogeographica.com.
// - When first downloading a .qz file in Firefox, tell it to "Always open
//   similar files". Future downloads will open automatically.
// This is described in more detail at neogeographica.com.

// We're going this route because it isn't possible to explicitly open a
// downloaded file from within a Firefox extension without requiring further
// user interaction.

// When this extension is loaded in, set up our context menu item.
browser.runtime.onInstalled.addListener(
  function() {
    browser.menus.create(
      {
        id: CONTEXT_MENU_ID,
        title: "Open with Quake",
        contexts: ["link"]
      }
    );
  }
);

// Global vars used by listener callbacks.
var archiveFilename = "";
var tempTab = null;

// Set the Content-Disposition header with desired filename as attachment,
// and Content-Type with the appropriate MIME type for .qz files.
function setHeaders(e) {
  if (archiveFilename === "") {
    console.log("setHeaders called without archiveFilename set");
    return {};
  }
  if (e.originUrl != browser.runtime.getURL('')) {
    console.log("setHeaders called from non-extension origin");
    return {};
  }
  const contentDisposition = {
    name: 'Content-Disposition',
    value: 'attachment;filename=' + archiveFilename,
  };
  const contentType = {
    name: 'Content-Type',
    value: 'application/x-qz',
  };
  let newHeaders = [contentDisposition, contentType];
  for (var i = 0; i < e.responseHeaders.length; ++i) {
    if (e.responseHeaders[i].name.toUpperCase() === contentDisposition.name.toUpperCase()) {
      continue;
    } else if (e.responseHeaders[i].name.toUpperCase() === contentType.name.toUpperCase()) {
      continue;
    }
    newHeaders.push(e.responseHeaders[i]);
  }
  return {responseHeaders: newHeaders};
};

// Status-update function. Controls whether menu item is enabled and what
// message to show. When done, removes the response listeners (if needed),
// resets global vars, and removes the temporary tab.
function setStatus(inProgress, message) {
  browser.browserAction.setBadgeText({text: message});
  if (inProgress) {
    browser.browserAction.setBadgeBackgroundColor({color: [0, 0, 0, 0]});
  } else {
    if (browser.webRequest.onHeadersReceived.hasListener(setHeaders)) {
      browser.webRequest.onHeadersReceived.removeListener(setHeaders);
    }
    if (browser.webRequest.onCompleted.hasListener(finalize)) {
      browser.webRequest.onCompleted.removeListener(finalize);
    }
    archiveFilename = "";
    if (tempTab) {
      tempTab.then(
        (tabObj) => {browser.tabs.remove(tabObj.id);},
        (reason) => {},
      );
      tempTab = null;
    }
    if (message !== "") {
      // Error.
      browser.browserAction.setBadgeBackgroundColor({color: [255, 0, 0, 255]});
      // Need to clear this color & message after a bit. Let's say 5 seconds.
      setTimeout(
        function() {
          browser.browserAction.getBadgeBackgroundColor(
            {},
            function(result) {
              // Only clear the color if it is still red. Conceivably some
              // other operation could now be in progress.
              if (result[0] === 255) {
                browser.browserAction.setBadgeText({text: ""});
                browser.browserAction.setBadgeBackgroundColor({color: [0, 0, 0, 0]});
              }
            }
          );
        },
        5000
      );
    }
  }
  browser.menus.update(CONTEXT_MENU_ID, {enabled: !inProgress});
}

// Clean up when request is done.
function finalize(e) {
  if (e.originUrl != browser.runtime.getURL('')) {
    console.log("finalize called from non-extension origin");
    return {};
  }
  setStatus(false, "");
}

// Define what happens when our context menu item is used.
browser.menus.onClicked.addListener(
  async function(info, tab) {
    if (info.menuItemId !== CONTEXT_MENU_ID) {
      // Bail out now if not our item.
      return;
    }
    // Disable the menu item.
    setStatus(true, "...");
    // Get the headers from the original URL and prepare to download it.
    let url = info.linkUrl;
    let response;
    let didRedirect = false;
    // Start a loop in order to support one META-refresh-style redirect.
    while (true) {
      // Note that fetch will by default handle any 301 redirect.
      response = await fetch(url);
      if (response.status !== 200) {
        // Can't get it, too bad.
        console.log("bad status trying to fetch URL: " + response.status);
        setStatus(false, response.status.toString());
        return;
      }
      // Make sure we're working with the actual final URL (might have had
      // a 301 redirect).
      url = response.url
      // Check to see if this is an HTML document.
      const contentType = response.headers.get('Content-Type');
      if (!contentType.startsWith("text/html")) {
        break;
      }
      // Hmm. This may be a page trying to redirect us with a META element,
      // e.g. what t.co does.
      // We will only tolerate one such redirect, to avoid getting stuck in
      // a loop.
      if (didRedirect) {
        console.log("redirect led to another HTML page");
        setStatus(false, "err");
        return;
      }
      // OK we haven't tried a redirect yet so let's see if this page is
      // asking us to do that.
      const page = await response.text();
      let parser = new DOMParser();
      const doc = parser.parseFromString(page, "text/html");
      for (element of doc.getElementsByTagName("META")) {
        const attrs = element.attributes;
        const httpEquiv = attrs.getNamedItem("http-equiv")
        if ((httpEquiv !== null) && (httpEquiv.value.toLowerCase() === "refresh")) {
          const contentValue = attrs.getNamedItem("content");
          if (contentValue !== null) {
            const urlMarker = contentValue.value.indexOf('=');
            if (urlMarker !== -1) {
              // OK I guess it's a redirect! We'll follow it.
              url = contentValue.value.substring(urlMarker + 1)
              console.log("redirecting to " + url);
              didRedirect = true;
              break;
            }
          }
        }
      }
      if (!didRedirect) {
        // It's not a redirect (or at least not one we understand) so...
        console.log("link goes to an HTML page");
        setStatus(false, "err");
        return;
      }
    }
    // The filename will either be taken from the URL (using URL parsing
    // to make sure we ignore any URL parameters) or from the
    // Content-Disposition header if that exists.
    const dispHeader = response.headers.get('Content-Disposition');
    let path;
    if (dispHeader === null) {
        path = new URL(url).pathname;
    } else {
        path = getFilenameFromContentDispositionHeader(dispHeader)
    }
    // Add the .qz extension.
    archiveFilename = path.substring(path.lastIndexOf('/') + 1) + ".qz";
    // Set up our listeners for this URL.
    browser.webRequest.onHeadersReceived.addListener(
      setHeaders,
      {urls: [url]},
      ["blocking", "responseHeaders"],
    );
    browser.webRequest.onCompleted.addListener(
      finalize,
      {urls: [url]},
      [],
    );
    // Open a new background tab to do the download.
    tempTab = browser.tabs.create({
      active: false,
      url: url
    });
    tempTab.then(
      {},
      (reason) => {
        console.log("failed to open tab with the archive file URL: " + reason);
        setStatus(false, "err");
      },
    );
  }
);


/*
 * The remainder of this file is copyright Mozilla Foundation.
 */


// stringToBytes is from
//   https://github.com/mozilla/pdf.js/blob/4a4c6b98515ed233b3f078422ad805beee1cd760/src/shared/util.js

function stringToBytes(str) {
  if (typeof str !== "string") {
    unreachable("Invalid argument for stringToBytes");
  }
  const length = str.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; ++i) {
    bytes[i] = str.charCodeAt(i) & 0xff;
  }
  return bytes;
}


// The remainder of this file is from
//   https://github.com/mozilla/pdf.js/blob/d642d345005500cdedde596ae28cd364f6ab625c/src/display/content_disposition.js
// which in turn was adapted from
//   https://github.com/Rob--W/open-in-browser/blob/7e2e35a38b8b4e981b11da7b2f01df0149049e92/extension/content-disposition.js


/**
 * Extract file name from the Content-Disposition HTTP response header.
 *
 * @param {string} contentDisposition
 * @returns {string} Filename, if found in the Content-Disposition header.
 */
function getFilenameFromContentDispositionHeader(contentDisposition) {
  let needsEncodingFixup = true;

  // filename*=ext-value ("ext-value" from RFC 5987, referenced by RFC 6266).
  let tmp = toParamRegExp("filename\\*", "i").exec(contentDisposition);
  if (tmp) {
    tmp = tmp[1];
    let filename = rfc2616unquote(tmp);
    filename = unescape(filename);
    filename = rfc5987decode(filename);
    filename = rfc2047decode(filename);
    return fixupEncoding(filename);
  }

  // Continuations (RFC 2231 section 3, referenced by RFC 5987 section 3.1).
  // filename*n*=part
  // filename*n=part
  tmp = rfc2231getparam(contentDisposition);
  if (tmp) {
    // RFC 2047, section
    const filename = rfc2047decode(tmp);
    return fixupEncoding(filename);
  }

  // filename=value (RFC 5987, section 4.1).
  tmp = toParamRegExp("filename", "i").exec(contentDisposition);
  if (tmp) {
    tmp = tmp[1];
    let filename = rfc2616unquote(tmp);
    filename = rfc2047decode(filename);
    return fixupEncoding(filename);
  }

  // After this line there are only function declarations. We cannot put
  // "return" here for readability because babel would then drop the function
  // declarations...
  function toParamRegExp(attributePattern, flags) {
    return new RegExp(
      "(?:^|;)\\s*" +
        attributePattern +
        "\\s*=\\s*" +
        // Captures: value = token | quoted-string
        // (RFC 2616, section 3.6 and referenced by RFC 6266 4.1)
        "(" +
        '[^";\\s][^;\\s]*' +
        "|" +
        '"(?:[^"\\\\]|\\\\"?)+"?' +
        ")",
      flags
    );
  }
  function textdecode(encoding, value) {
    if (encoding) {
      if (!/^[\x00-\xFF]+$/.test(value)) {
        return value;
      }
      try {
        const decoder = new TextDecoder(encoding, { fatal: true });
        const buffer = stringToBytes(value);
        value = decoder.decode(buffer);
        needsEncodingFixup = false;
      } catch (e) {
        // TextDecoder constructor threw - unrecognized encoding.
      }
    }
    return value;
  }
  function fixupEncoding(value) {
    if (needsEncodingFixup && /[\x80-\xff]/.test(value)) {
      // Maybe multi-byte UTF-8.
      value = textdecode("utf-8", value);
      if (needsEncodingFixup) {
        // Try iso-8859-1 encoding.
        value = textdecode("iso-8859-1", value);
      }
    }
    return value;
  }
  function rfc2231getparam(contentDispositionStr) {
    const matches = [];
    let match;
    // Iterate over all filename*n= and filename*n*= with n being an integer
    // of at least zero. Any non-zero number must not start with '0'.
    const iter = toParamRegExp("filename\\*((?!0\\d)\\d+)(\\*?)", "ig");
    while ((match = iter.exec(contentDispositionStr)) !== null) {
      let [, n, quot, part] = match; // eslint-disable-line prefer-const
      n = parseInt(n, 10);
      if (n in matches) {
        // Ignore anything after the invalid second filename*0.
        if (n === 0) {
          break;
        }
        continue;
      }
      matches[n] = [quot, part];
    }
    const parts = [];
    for (let n = 0; n < matches.length; ++n) {
      if (!(n in matches)) {
        // Numbers must be consecutive. Truncate when there is a hole.
        break;
      }
      let [quot, part] = matches[n]; // eslint-disable-line prefer-const
      part = rfc2616unquote(part);
      if (quot) {
        part = unescape(part);
        if (n === 0) {
          part = rfc5987decode(part);
        }
      }
      parts.push(part);
    }
    return parts.join("");
  }
  function rfc2616unquote(value) {
    if (value.startsWith('"')) {
      const parts = value.slice(1).split('\\"');
      // Find the first unescaped " and terminate there.
      for (let i = 0; i < parts.length; ++i) {
        const quotindex = parts[i].indexOf('"');
        if (quotindex !== -1) {
          parts[i] = parts[i].slice(0, quotindex);
          parts.length = i + 1; // Truncates and stop the iteration.
        }
        parts[i] = parts[i].replace(/\\(.)/g, "$1");
      }
      value = parts.join('"');
    }
    return value;
  }
  function rfc5987decode(extvalue) {
    // Decodes "ext-value" from RFC 5987.
    const encodingend = extvalue.indexOf("'");
    if (encodingend === -1) {
      // Some servers send "filename*=" without encoding 'language' prefix,
      // e.g. in https://github.com/Rob--W/open-in-browser/issues/26
      // Let's accept the value like Firefox (57) (Chrome 62 rejects it).
      return extvalue;
    }
    const encoding = extvalue.slice(0, encodingend);
    const langvalue = extvalue.slice(encodingend + 1);
    // Ignore language (RFC 5987 section 3.2.1, and RFC 6266 section 4.1 ).
    const value = langvalue.replace(/^[^']*'/, "");
    return textdecode(encoding, value);
  }
  function rfc2047decode(value) {
    // RFC 2047-decode the result. Firefox tried to drop support for it, but
    // backed out because some servers use it - https://bugzil.la/875615
    // Firefox's condition for decoding is here: https://searchfox.org/mozilla-central/rev/4a590a5a15e35d88a3b23dd6ac3c471cf85b04a8/netwerk/mime/nsMIMEHeaderParamImpl.cpp#742-748

    // We are more strict and only recognize RFC 2047-encoding if the value
    // starts with "=?", since then it is likely that the full value is
    // RFC 2047-encoded.

    // Firefox also decodes words even where RFC 2047 section 5 states:
    // "An 'encoded-word' MUST NOT appear within a 'quoted-string'."
    if (!value.startsWith("=?") || /[\x00-\x19\x80-\xff]/.test(value)) {
      return value;
    }
    // RFC 2047, section 2.4
    // encoded-word = "=?" charset "?" encoding "?" encoded-text "?="
    // charset = token (but let's restrict to characters that denote a
    //       possibly valid encoding).
    // encoding = q or b
    // encoded-text = any printable ASCII character other than ? or space.
    //        ... but Firefox permits ? and space.
    return value.replace(
      /=\?([\w-]*)\?([QqBb])\?((?:[^?]|\?(?!=))*)\?=/g,
      function (matches, charset, encoding, text) {
        if (encoding === "q" || encoding === "Q") {
          // RFC 2047 section 4.2.
          text = text.replace(/_/g, " ");
          text = text.replace(/=([0-9a-fA-F]{2})/g, function (match, hex) {
            return String.fromCharCode(parseInt(hex, 16));
          });
          return textdecode(charset, text);
        } // else encoding is b or B - base64 (RFC 2047 section 4.1)
        try {
          text = atob(text);
        } catch (e) {}
        return textdecode(charset, text);
      }
    );
  }

  return "";
}
