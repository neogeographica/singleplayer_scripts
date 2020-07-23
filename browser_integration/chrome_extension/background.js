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
    const url = info.linkUrl;
    let response = await fetch(url);
    if (response.status !== 200) {
      // Can't get it, too bad. Note that we also can't handle redirects.
      console.log("bad status trying to fetch URL: " + response.status);
      setStatus(false, response.status.toString());
      return;
    }
    const reader = response.body.getReader();
    const contentLength = +response.headers.get('Content-Length');
    let receivedLength = 0;
    let chunks = [];
    while (true) {
      const {done, value} = await reader.read();
      if (done) {
        break;
      }
      chunks.push(value);
      receivedLength += value.length;
      setStatus(true, Math.trunc(receivedLength * 100 / contentLength) + "%");
    }
    if (receivedLength !== contentLength) {
      // Didn't receive the whole thing. (Or received too much??)
      console.log("bytes received != content-length");
      setStatus(false, "err");
      return;
    }
    // Create a "blob" from the fetched chunks, with the MIME type we want.
    const blob = new Blob(chunks, {type : 'application/x-qz'});
    // Now use chrome.downloads.download to handle the blob. Add the ".qz"
    // extension to the filename.
    chrome.downloads.download(
      {
        url: URL.createObjectURL(blob),
        filename: url.substring(url.lastIndexOf('/') + 1) + '.qz',
        conflictAction: 'uniquify'
      },
      handleDownloadStarted
    );
  }
);
