# Overview

The main thing to keep in mind when looking at this extension is that its purpose is to download a file and add the ".qz" extension to the name of the downloaded file.

For various reasons, Chrome's extension framework makes you jump through some hoops to do this, so we end up with a few hundred lines of JavaScript.

# Where to Look

The "background.js" file is the JavaScript that implements the extension. It divides into two main parts:

* The first part of the script is my code for performing the download and setting the file extension.
* The second part is code for some header processing that is lifted directly from https://github.com/mozilla/pdf.js . It purely does data munging, no network access. (Why did I cram it into the same file here? An upcoming change in Chrome extensions makes it more difficult to load an extension from multiple script files, so I'm looking ahead to that.)

So we'll just look at that first part of "background.js".

# The Interesting Part

There's a bunch of cruft in "background.js" that has to do with inserting the "Open with Quake" option into the right-click menu, handling various download events and errors, and managing the little extension badge in the Chrome toolbar. The most important thing to see though is when and how the extension does communication outside the browser.

To that end, note that there is only one spot that does an outgoing network request, with "fetch(url)". This is inside a function attached to the right-click menu, so look through the code for this line:
```javascript
chrome.contextMenus.onClicked.addListener(
```
and scroll down. The code in here is commented pretty well if you want to get a handle on what is leading up to the "fetch".

You'll see that the URL given to "fetch" is the user-selected link (url = info.linkUrl). If that returns a redirect to some other URL, subsequent code will set "url" to that new URL and loop back up to try the fetch one more time.

Once the code has successfully fetched data from the URL into a "blob" in memory, it uses "chrome.downloads.download" to download that blob to a file on your disk. The name of that file has ".qz" added to the end of its filename.
```javascript
    chrome.downloads.download(
      {
        url: URL.createObjectURL(blob),
        filename: file + '.qz',
        conflictAction: 'uniquify'
      },
      handleDownloadStarted
    );
```

That's it!