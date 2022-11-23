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
const ICON_CLEAR_ALARM = "iconClear";

// The purpose of this extension is just to download a file as the
// application/x-qz MIME type, giving it the ".qz" extension. For this to
// actually do "Open with Quake", you need to have done a few other things
// on your system:
// - Register the application/x-qz MIME type for files with ".qz" extension.
// - Set the Quake app as the default handler for opening application/x-qz
//   files. This is specifically the Quake app from the "Linux desktop
//   integration" stuff described at neogeographica.com.
// - When first downloading a .qz file in Chrome, select "Always open files
//   of this type" using the dropdown menu next to that file in the download
//   shelf. Then you can open it. Future downloads will open automatically.
// This is described in more detail at neogeographica.com.

// We're going this route because it isn't possible to explicitly open a
// downloaded file from within a Chrome extension without requiring further
// user interaction.


// When this extension is loaded in, set up our context menu item and
// "offscreen" page.
chrome.runtime.onInstalled.addListener(
  function() {
    chrome.contextMenus.create(
      {
        id: CONTEXT_MENU_ID,
        title: "Open with Quake",
        contexts: ["link"]
      }
    );
    chrome.offscreen.createDocument(
      {
        url: 'offscreen.html',
        reasons: ['DOM_SCRAPING'],
        justification: 'parsing received page to find any meta-refresh redirect'
      }
    );
  }
);

// Define a listener to clear the icon some time after an error.
chrome.alarms.onAlarm.addListener(
  function(alarm) {
    if (alarm.name !== ICON_CLEAR_ALARM) {
      // Bail out now if not our alarm.
      return;
    }
    chrome.action.getBadgeBackgroundColor(
      {},
      function(result) {
        // Only clear the color if it is still red. This is just a backstop
        // against a possible weird race between clearing the alarm,
        // starting a new op, and processing a handler triggered just before
        // the alarm was cleared.
        if (result[0] === 255) {
          chrome.action.setBadgeText({text: ""});
          chrome.action.setBadgeBackgroundColor({color: [0, 0, 0, 0]});
        }
      }
    );
  }
);

// Status-update function. Controls whether menu item is enabled and what
// progress percentage to show.
function setStatus(inProgress, message) {
  chrome.contextMenus.update(CONTEXT_MENU_ID, {enabled: !inProgress});
  chrome.action.setBadgeText({text: message});
  if (inProgress) {
    chrome.action.setBadgeBackgroundColor({color: [0, 0, 0, 0]});
  } else {
    if (message !== "") {
      // Error.
      chrome.action.setBadgeBackgroundColor({color: [255, 0, 0, 255]});
      // Need to clear this color & message after a bit. Minimum alarm time
      // is 1 minute so I guess we'll do that!
      chrome.alarms.create(ICON_CLEAR_ALARM, { delayInMinutes: 1 });
    }
  }
}

// Need to track blob content in a global so that our fetch event listener can
// access it. We can currently have only one blob "active" at a time, but
// let's go ahead and make this an array indexed by URL for future-proofness
// and for paranoia against edge cases.
var blobForUrl = []

// Set the fetch event listener for our "virtual" downloaded-content URLs.
self.addEventListener(
  'fetch',
  function(event) {
    if (event.request.url in blobForUrl) {
      try {
        event.respondWith(
          new Response(
            blobForUrl[event.request.url],
            {
              status: 200,
              headers: {'Content-Disposition': 'attachment'}
            }
          )
        );
        delete blobForUrl[event.request.url];
        setStatus(false, "");
      } catch(err) {
        console.log("error handling fetch for content: " + err);
        delete blobForUrl[event.request.url];
        setStatus(false, "err");
      }
    }
  }
);

// Define what happens when our context menu item is used.
chrome.contextMenus.onClicked.addListener(
  async function(info, tab) {
    if (info.menuItemId !== CONTEXT_MENU_ID) {
      // Bail out now if not our item.
      return;
    }
    // Make sure there's not an existing icon-clear alarm pending.
    chrome.alarms.clear(ICON_CLEAR_ALARM);
    // Disable the menu item.
    setStatus(true, "");
    // Note that we can't give the original url to chrome.downloads.download
    // because that will force the MIME type and the file extension, ignoring
    // whatever type/extension we request. So let's fetch it internally.
    let url = info.linkUrl;
    let didRedirect = false;
    let chunks;
    let file;
    // Start a loop in order to support one META-refresh-style redirect.
    while (true) {
      // It would be nice to set our user agent to look like a simple
      // command-line tool to avoid getting some HTML page response from
      // certain download servers that try to be clever. However:
      //   https://bugs.chromium.org/p/chromium/issues/detail?id=571722
      // So for now let's not even try that.
      // Note that fetch will by default handle any 301 redirect.
      let response = await fetch(url);
      if (response.status !== 200) {
        // Can't get it, too bad.
        console.log("bad status trying to fetch URL: " + response.status);
        setStatus(false, response.status.toString());
        return;
      }
      // Make sure we're working with the actual final URL (might have had
      // a 301 redirect).
      url = response.url
      // Now pull the content.
      const reader = response.body.getReader();
      const contentLength = +response.headers.get('Content-Length');
      const contentType = response.headers.get('Content-Type');
      const isHTML = contentType.startsWith("text/html");
      let receivedLength = 0;
      chunks = [];
      while (true) {
        const {done, value} = await reader.read();
        if (done) {
          break;
        }
        chunks.push(value);
        receivedLength += value.length;
        if ((receivedLength <= contentLength) && !isHTML) {
          setStatus(true, Math.trunc(receivedLength * 100 / contentLength) + "%");
        } else {
          setStatus(true, "...");
        }
      }
      // Don't check that we received the reported content length... sometimes
      // the server misreports. Just do what a "normal" download would do
      // and go ahead to try to process it.
      // If not an HTML page that's good. Break out of this loop and proceed.
      if (!isHTML) {
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
        file = path.substring(path.lastIndexOf('/') + 1);
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
      const htmlBlob = new Blob(chunks, {type : "text/html"});
      const page = await new Response(htmlBlob).text();
      // Need to parse the page HTML to look for a meta element that indicates
      // a redirect. In Manifest V3 we can't do that here in the background
      // script (no DOMParser allowed) so we'll ask our "offscreen" page to
      // do it.
      let redirectUrl = await chrome.runtime.sendMessage(page);
      if (redirectUrl) {
        console.log("redirecting to " + url);
        url = redirectUrl;
        didRedirect = true;
      } else {
        // It's not a redirect (or at least not one we understand) so...
        console.log("link goes to an HTML page");
        setStatus(false, "err");
        return;
      }
    }
    // Compose a virtual URL representing this content.
    virtualUrl = chrome.runtime.getURL(file + ".qz");
    // Create a "blob" from the fetched chunks, with the MIME type we want.
    blobForUrl[virtualUrl] = new Blob(chunks, {type : 'application/x-qz'});
    // Open a new tab to trigger the fetch.
    let newTab = await chrome.tabs.create({
      active: false,
      url: virtualUrl
    });
    if (!newTab) {
      console.log("failed to open new tab with the virtual URL");
      delete blobForUrl[virtualUrl];
      setStatus(false, "err");
    }
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
