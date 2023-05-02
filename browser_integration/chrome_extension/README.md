# Overview

The main thing to keep in mind when looking at this extension is that its purpose is to download a file and add the ".qz" extension to the name of the downloaded file.

For various reasons, Chrome's extension framework makes you jump through some hoops to do this, especially in the new "Manifest V3" regime. So we end up with a few hundred lines of JavaScript.

# Where to Look

The "background.js" file contains most of the JavaScript that implements the extension. It divides into two main parts:

* The first part of the script is my code for performing the download and setting the file extension.
* The second part is code for some header processing that is lifted directly from https://github.com/mozilla/pdf.js . It purely does data munging, no network access. (Why did I cram it into the same file here? Manifest V3 makes it more difficult to load an extension from multiple script files.)

So we'll just look at that first part of "background.js".

"offscreen.js" implements an HTML-parsing function that can be invoked by some code in "background.js". We'll cover that when we get to the relevant part of "background.js".

"offscreen.html" exists only to load and run "offscreen.js".

# The Interesting Part

There's a bunch of cruft in "background.js" that has to do with inserting the "Open with Quake" option into the right-click menu, handling various download events and errors, and managing the little extension badge in the Chrome toolbar. The most important thing to see though is when and how the extension does communication outside the browser.

To that end, note that there is only one spot that does an outgoing network request, with "fetch(url)". This is inside a function attached to the right-click menu, so look through the code for this line:
```javascript
chrome.contextMenus.onClicked.addListener(
```
and scroll down. The code in here is commented pretty well if you want to get a handle on what is leading up to the "fetch".

You'll see that the URL given to "fetch" is the user-selected link (url = info.linkUrl). If that returns a redirect to some other URL, subsequent code will set "url" to that new URL and loop back up to try the fetch one more time.

Part of that redirect-handling can involve parsing some page HTML to see if it's trying to redirect us somewhere. Another manifest-v3-ism is that we can't do that parsing here in "background.js". So we use "chrome.offscreen.createDocument" to create our own little internal page (from "offscreen.html") whose only purpose is to run the JavaScript in "offscreen.js" which will do that parsing for us.

Once the code has successfully fetched data from the URL into memory (in an array named "chunks"), it opens a new tab on a "virtual" URL that we create to be associated with that blob:
```javascript
    // Compose a virtual URL representing this content.
    virtualUrl = chrome.runtime.getURL(file + ".qz");
    // Create a "blob" from the fetched chunks, with the MIME type we want.
    blobForUrl[virtualUrl] = new Blob(chunks, {type : 'application/x-qz'});
    // Open a new tab to trigger the fetch.
    let newTab = await chrome.tabs.create({
      active: false,
      url: virtualUrl
    });
```
The "virtualUrl" here is sort of a fake URL that will look something like this: "chrome-extension://2c127fa4-62c7-7e4f-90e5-472b45eecfdc/name-of-downloaded-file.qz"

So what happens when Chrome tries to get that URL? Scroll back up in "background.js" to find this function:
```javascript
self.addEventListener(
  'fetch',
```
The following code defines a handler that will respond to that URL by providing the contents of the correct blob, which Chrome will then download to a file on your disk.

That's it! (whew)