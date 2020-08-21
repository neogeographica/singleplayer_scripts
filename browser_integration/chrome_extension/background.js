const CONTEXT_MENU_ID = "OPEN_WITH_QUAKE";

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


// When this extension is loaded in, set up our context menu item.
chrome.runtime.onInstalled.addListener(
  function() {
    chrome.contextMenus.create(
      {
        id: CONTEXT_MENU_ID,
        title: "Open with Quake",
        contexts: ["link"]
      }
    );
  }
);

// Status-update function. Controls whether menu item is enabled and what
// progress percentage to show.
function setStatus(inProgress, message) {
  chrome.contextMenus.update(CONTEXT_MENU_ID, {enabled: !inProgress});
  chrome.browserAction.setBadgeText({text: message});
  if (inProgress) {
    chrome.browserAction.setBadgeBackgroundColor({color: [0, 0, 0, 0]});
  } else {
    if (message !== "") {
      // Error.
      chrome.browserAction.setBadgeBackgroundColor({color: [255, 0, 0, 255]});
      // Need to clear this color & message after a bit. Let's say 5 seconds.
      setTimeout(
        function() {
          chrome.browserAction.getBadgeBackgroundColor(
            {},
            function(result) {
              // Only clear the color if it is still red. Conceivably some
              // other operation could now be in progress.
              if (result[0] === 255) {
                chrome.browserAction.setBadgeText({text: ""});
                chrome.browserAction.setBadgeBackgroundColor({color: [0, 0, 0, 0]});
              }
            }
          );
        },
        5000
      );
    }
  }
}

// Callback function triggered when a download we initiated has started.
// Note that this is the internal "download" from the blob we already fetched
// (see the context menu handler below).
function handleDownloadStarted(downloadId) {
  if (downloadId === undefined) {
    console.log("failed to trigger download handling");
    // Failed for some reason. Bail out, but first clear status.
    setStatus(false, "err");
    return;
  }
  // Define the callback function we'll run on any download update.
  const callback = function handleDownloadChanged(downloadDelta) {
    if (downloadDelta.id !== downloadId) {
      // We only want to do things if this is the download we initiated.
      return;
    }
    if (downloadDelta.endTime === undefined) {
      // Not done yet.
      return;
    }
    // All done. Remove this callback.
    chrome.downloads.onChanged.removeListener(handleDownloadChanged);
    // Clear status.
    setStatus(false, "");
  }
  // Register the callback we defined.
  chrome.downloads.onChanged.addListener(callback);
}

// Define what happens when our context menu item is used.
chrome.contextMenus.onClicked.addListener(
  async function(info, tab) {
    if (info.menuItemId !== CONTEXT_MENU_ID) {
      // Bail out now if not our item.
      return;
    }
    // Disable the menu item.
    setStatus(true, "");
    // Note that we can't give the original url to chrome.downloads.download
    // because that will force the MIME type and the file extension, ignoring
    // whatever type/extension we request. So let's fetch it internally.
    let url = info.linkUrl;
    let didRedirect = false;
    let chunks;
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
    // Create a "blob" from the fetched chunks, with the MIME type we want.
    const blob = new Blob(chunks, {type : 'application/x-qz'});
    // Now use chrome.downloads.download to handle the blob. Add the ".qz"
    // extension to the filename. We'll use URL parsing to make sure we
    // ignore any URL parameters.
    const path = new URL(url).pathname;
    const file = path.substring(path.lastIndexOf('/') + 1);
    chrome.downloads.download(
      {
        url: URL.createObjectURL(blob),
        filename: file + '.qz',
        conflictAction: 'uniquify'
      },
      handleDownloadStarted
    );
  }
);
