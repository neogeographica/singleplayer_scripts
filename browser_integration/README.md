# What?

These are the files necessary to set up your web browser (Chrome or Firefox) to auto-install-and-run a Quake mod/maps package from a download link on a web page. Completely optional!

Because of the limitations on browser extensions, we can't quite implement a feature that would do "download this file and then open it with the desired app". What we *can* do is make the browser put a special file extension ".qz" on the downloaded file, and we can associate ".qz" with our Quake app. Then once the file is downloaded you can click to open it from your browser's downloads shelf, or even set the browser to auto-open all ".qz" files when downloaded. This will give you the browser-integration behavior described in the [top-level readme](../README.md).

Keep in mind that for non-standalone releases that depend on Arcane Dimensions, Copper, or Alkaline, this feature requires a Quake engine like [FTE](http://fte.triptohell.info/), [Quakespasm-Spiked](http://triptohell.info/moodles/qss/), [vkQuake](https://github.com/Novum/vkQuake), [Ironwail](https://github.com/andrei-drexler/ironwail) or [DarkPlaces](https://icculus.org/twilight/darkplaces/) that supports specifying multiple "game" directories to use when loading a mod or maps. (See the "Arcane Dimensions, Copper, and Alkaline" section of the [scripts readme](../scripts/README.md) for more details.) If you don't have that capability, and you try to do "Open with Quake" on a browser link to such an AD/Copper/Alkaline release, then after the download you'll get a desktop notification about the error and the gamedir will not be launched.

# Setup

If you have already done the [desktop integration](../desktop_integration/README.md), great! If not go do that first.

There are six steps in the browser integration process. Those steps are numbered and called out below, with some other context and discussion around them.

**Note:** Currently there are two versions of the Chrome extension available here: one in the "chrome_extension" folder, and one in the "chrome_extension_old" folder. **The version in the "chrome_extension" folder is the current stable version, and if you're using Chrome then that's the one you should use. It works in Chrome version 110.0.5469.0 or later.** So the directions below will assume that.

The version in the "chrome_extension_old" folder is the older "Manifest V2" implementation. At some point, Chrome may remove support for this kind of extension... "Manifest V3" is their way forward. For now though I'm leaving this older version in the repo just in case someone needs/wants it, since it does still work (as of writing this in November 2023).

## Prerequisites

**1. Use "browser_integration" as your working directory**

Make sure that you are in a shell with this "browser_integration" directory as the working directory, before proceeding to the sections below. All the example shell commands will assume this working directory.

## Filetype

The ".xml" file here will be used to define a type for files with the ".qz" extension. This will allow us to define the default way of opening such files.

### Installation

**2. Define the filetype**

The commands below show how you would define the filetype for the ".qz" extension, from a shell prompt that is currently working in this "browser_integration" directory.
```bash
xdg-mime install --novendor --mode user x-qz.xml
update-mime-database ~/.local/share/mime
```

### App association

**3. Associate the filetype with Quake**

As described at the top, we want the Quake app to be used to open files of this type.
```bash
xdg-mime default quake.desktop application/x-qz
```

## Browser extension

The browser extension adds an "Open with Quake" context menu item available when you right-click on a link in a webpage. All this really does is download the file from the link with ".qz" added to the end of the downloaded file's name.

This extension is available for both Chrome and Firefox. Follow the appropriate section below depending on which browser you are using.

### Chrome extension

Because this is a niche extension that requires other system setup to be useful, I'm not putting it on the Chrome web store.

I'm not even packaging it up, because I encourage you to look into the "chrome_extension" subdirectory here and examine the files that implement the extension.

Originally I had a very simple explanation of the JavaScript here, but over time the extension has inevitably become more complicated, so I've offloaded the explanation to a README.md file inside the "chrome_extension" folder. I'm less sanguine now about the usefulness of me just saying "hey there's nothing nefarious in this code, examine it yourself"... but that's what I'm stuck with at the moment. And I don't have an indication that there are many/any other users of this, so I'll leave it as-is for now.

**4. Load the extension**

If you've checked that out to your satisfaction, here's how you load the extension into Chrome.
* Open the Extensions page. You can either click on the Extensions puzzle-piece icon in the toolbar and select "Manage Extensions", or you can open the drop-down menu from the right end of the toolbar, select "More Tools", and then "Extensions".
* Turn on the "Developer mode" switch on the top right corner of this page.
* Click the "Load unpacked" button near the top left.
* Browse to the "chrome_extension" subdirectory here, select that, and click Open.
* You can now turn "Developer mode" back off again if you want to.

At this point you should see the "Open with Quake" extension among the extensions shown on this page. You can leave the "Extensions" page now if you want.

Note that the Chrome extension will never be automatically updated in your browser. If any changes are made to the extension in this git repo, you'll need to download those changed files and then reload the extension (using the circular-arrow "reload me" button on the "Open with Quake" tile in the extensions manager).

**5. Pin the extension (optional)**

The extension icon for "Open with Quake", visible in the Extensions puzzle-piece menu, will have a progress percent overlaid on it when downloading something. It will also have a momentary red badge if a download error happens. If you want to make this info more visible, you can "pin" the extension so it will always be shown in the toolbar. You can do this from the Extensions puzzle-piece menu by clicking on the pin icon to the right of "Open with Quake".

**6. Set auto-open for ".qz" files (optional)**

The first time you use the "Open with Quake" menu item to download something, you should end up with a downloaded file that has the ".qz" extension, as shown in Chrome's download-popup. You could click on it now to open it with the Quake app. Or you can at this point arrange for such files to always be immediately opened without requiring a click.

If you want these ".qz" files to always be opened automatically, rather than requiring you to click on them, you can right click on the download-popup and select "Always open files of this type". This will take effect the next time you use "Open with Quake".

### Firefox extension

Because this is a niche extension that requires other system setup to be useful, I'm not putting it on the Firefox web store.

Unlike the Chrome extension, I do have to package this one (into a ".xpi" file), because otherwise it would disappear from Firefox each time you restart the browser.

However I still encourage you to look at the code. The README.md file inside the "firefox_extension" folder explains how to extract the code from the xpi archive and how to interpret what's going on in there.

**4. Load the extension**

If you've checked that out to your satisfaction, here's how you load the extension into Firefox.

* Open the Add-ons Manager. You can either click on the Extensions puzzle-piece icon in the toolbar and select "Manage extensions", or you can open the drop-down menu from the right end of the toolbar and select "Add-ons and themes".
* Click the settings gear icon near the upper-right corner of this page, and select "Install Add-on From File".
* Browse into the firefox_extension/web-ext-artifacts subfolder and choose the xpi file there.

At this point you should see the "Open with Quake" extension among the extensions shown on this page.

I recommend that you click the "..." to the right of "Open with Quake", select "Manage", scroll down a bit in that list of settings and turn "Allow automatic updates" to "off". I'm actually not sure yet what (if anything) I will do with versioning and updates for this packaged extension, but since it has wide privileges and I am just some random guy on the internet, you shouldn't take new updates of this extension without checking its code again.

You can leave the "Add-ons Manager" page now if you want.

**5. Pin the extension (optional)**

The extension icon for "Open with Quake", visible in the Extensions puzzle-piece menu, will have a "..." badge overlaid on it when downloading something. It will also have a momentary red badge if a download error happens. If you want to make this info more visible, you can "pin" the extension so it will always be shown in the toolbar. You can do this from the Extensions puzzle-piece menu by clicking on the gear icon to the right of "Open with Quake" and selecting "Pin to Toolbar".

**6. Set auto-open for ".qz" files (optional)**

The first time you use the "Open with Quake" menu item to download something, you should end up with a downloaded file that has the ".qz" extension, as shown in Firefox's download-popup. You could click on it now to open it with the Quake app. Or you can at this point arrange for such files to always be immediately opened without requiring a click.

If you want these ".qz" files to always be opened automatically, rather than requiring you to click on them, you can right click on the file in the download-popup and select "Always Open Similar Files". This will take effect the next time you use "Open with Quake".

# Usage notes

Keep in mind what the extension is actually doing: downloading the file in a way that makes it openable with the Quake app. Once file-open has been triggered, all the notes about the behavior of the Quake app apply here too.

In Firefox (not in Chrome), a background tab will exist while the file is being downloaded. It will auto-close once the download is done.

You can only have one "Open with Quake" operation active at a time. The context menu item will be disabled while it is working on a request.

If any error happens during download, a red badge will be shown on the "Open with Quake" extension icon for 5 seconds (or until you try "Open with Quake" again). If the error was an unexpected status code, that code will be shown in the badge, like "404" for file-not-found. If some other weird problem, then the badge will just say "err". (If you are already accustomed to debugging extension behavior you can find some other error info logged to the extension's background page.)

If an error happens during the attempt to auto-install, or if you have cleanup_archive set to false in your quakelaunch.conf, then the downloaded archive file *without* the added ".qz" extension will be left in your Chrome downloads directory.

# Uninstallation

## Chrome extension

If you want to remove Chrome's behavior of automatically opening ".qz" files:
* Open the Settings page in Chrome.
* Click on Downloads on the left.
* Next to "Open certain file types automatically after downloading", click the "Clear" button.

To remove the Chrome extension:
* Open the "Extensions" page in Chrome.
* In the "Open with Quake" tile, click the "Remove" button.

## Firefox extension

If you want to remove Firefox's behavior of automatically opening ".qz" files:
* Open the Settings page in Firefox.
* Scroll to the Applications section.
* Find the row in the table for the "Quake archive" content type. Click the down-arrow at the right end of that row, and select "Save File" from that dropdown menu.

To remove the Firefox extension:
* Open the "Add-ons Manager" page in Firefox.
* Click the "..." to the right of "Open with Quake" and select "Remove".

## Filetype

To remove the special ".qz" filetype you can execute these commands:
```bash
xdg-mime uninstall --mode user x-qz.xml
update-mime-database ~/.local/share/mime
```

At this point you may want to also clean up any remaining references to this filetype in your "\~/.config/mimeapps.list" file (or in "\~/.local/share/applications/mimeapps.list" in older versions of Ubuntu). This dangling reference is harmless but you can remove it if you are a neatfreak about this kind of thing. This will involve deleting the following line from that file:
```
application/x-qz=quake.desktop
```
