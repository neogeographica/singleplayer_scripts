# Overview

The main thing to keep in mind when looking at this extension is that its purpose is to download a file and add the ".qz" extension to the name of the downloaded file.

For various reasons, Firefox's extension framework makes you jump through some hoops to do this, so we end up with a few hundred lines of JavaScript.

# Examining the Files

The source files in this directory are used to build the .xpi package that installs the extension into Firefox. To truly examine the code, you should unpack the .xpi package in the "web-ext-artifacts" folder  rather than looking at these source files.

A .xpi file is just a zipfile with a different extension, so you can use "unzip" to unpack it.

# Where to Look

The "background.js" file is the JavaScript that implements the extension. It divides into two main parts:

* The first part of the script is my code for performing the download and setting the file extension.
* The second part is code for some header processing that is lifted directly from https://github.com/mozilla/pdf.js . It purely does data munging, no network access. (Why did I cram it into the same file here? This extension was developed from a shared codebase with a Chrome extension, which has some aspects that make it more difficult to load an extension from multiple script files.)

So we'll just look at that first part of "background.js".

# The Interesting Part

There's a bunch of cruft in "background.js" that has to do with inserting the "Open with Quake" option into the right-click menu, handling various download events and errors, and managing the little extension badge in the browser toolbar. The most important thing to see though is when and how the extension does communication outside the browser.

To that end, note that there are only two spots that do an outgoing network request.

The first outgoing request is the code that does "fetch(url)". This is inside a function attached to the right-click menu, so look through the code for this line:
```javascript
browser.menus.onClicked.addListener(
```
and scroll down. The code in here is commented pretty well if you want to get a handle on what is leading up to the "fetch".

You'll see that the URL given to "fetch" is the user-selected link (url = info.linkUrl). If that returns a redirect to some other URL, subsequent code will set "url" to that new URL and loop back up to try the fetch one more time.

The purposes of this fetch are to find the final URL (after any redirects) and, if it's actually a file rather than an HTML webpage, get the filename and proceed with the "real" download.

That real download is the second outgoing request, where the code opens a new background tab on that final URL:
```javascript
    tempTab = browser.tabs.create({
      active: false,
      url: url
    });
```

You'll also see that just before that download is started, the code sets up two handlers "setHeaders" (which will run when we receive the headers for the download) and "finalize" (which will run when the download is done). Both of those handler functions are defined earlier in the file.

The setHeaders function makes two changes to the incoming download headers so that the downloaded file will properly open as a ".qz" file. It changes the destination filename to a name that ends in ".qz" (using the Content-Disposition header), and it sets the file type to "application/x-qz" (using the Content-Type header).

The finalize function just calls setStatus to mark that everything is done... this clears any text from the extension badge and re-enables the "Open with Quake" menu item.

That's it!
