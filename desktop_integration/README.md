# What?

These are the files necessary to connect the script behaviors to desktop actions.

You should have the scripts installed and working before tackling this.

# Installation

## Filetypes

The .xml files here will be used to define types for files with the ".quake" and ".bsp" extensions. This will allow us to make our script the default app for opening such files, enabling the double-click method of launching stuff.

If you don't care about either using ".quake" shortcuts or launching from ".bsp" files, then you can skip this section and go ahead to the Applications part below.

### Safety check

It should always be fine to make a definition for the ".quake" extension, since no other app should be using that.

Before you do anything for the ".bsp" extension though, you might want to check whether it is already being used for something. Right-click on an existing bsp file and choose Properties. In vanilla Ubuntu you want to see what is in parentheses next to the Type value; in elementary OS the interesting part is shown as the "Media type". If this says "application/octet-stream" it means that Linux doesn't have any particular interpretation for a ".bsp" extension; it just sees the file as a generic bucket of bits. In that case it will be safe to define our own interpretation.

When I first tried this though, I saw that bsp files were treated as "application/x.stl-binary" on my system. This means they were seen as binary-format [STL](https://en.wikipedia.org/wiki/STL_(file_format)) files. In my case I was happy to override that definition because a) I don't do anything with STL, and b) I don't think that ".bsp" is an extension really used for STL files anyway.

In your case, you may or may not want to set up a Quake-specific interpretation of ".bsp" files. If you don't, that's fine, and it won't affect much of the functionality of these scripts.

The instructions in this doc will assume that you *are* doing things for the ".bsp" extension, but if you have decided not to, then just skip the steps that deal with the "x-bsp-map" filetype.

### Installation

The commands below show how you would define the filetypes for the ".quake" and ".bsp" extensions, from a shell prompt that is currently working in this "desktop_integration" directory. I'll show the commands first and then discuss how you might want to tweak them.
```bash
xdg-mime install --novendor --mode user x-quake.xml
xdg-icon-resource install --context mimetypes --novendor --mode user --size 128 icons/quake-icon-128.png application-x-quake
xdg-mime install --novendor --mode user x-bsp-map.xml
update-mime-database ~/.local/share/mime
```
There's a few reasons you might want to do things slightly differently, e.g.:
* You might not want to install the x-quake filetype if you're not going to use ".quake" shortcuts, in which case you would skip the first two commands.
* You might want to have the x-quake filetype but give it a different icon (or no icon at all), in which case you would change the icon filepath and maybe the icon size in the second command.
* You might not want to install the x-bsp-map filetype if the ".bsp" extension is already being used for some other important purpose, in which case you would skip the third command.

Up to you!

## Applications

Application definitions in ".desktop" files can be used to support launching applications from your system's apps menu, and for defining programs that can process certain filetypes. We'll be making use of both of those behaviors.

The "quake.desktop" file included here is an application definition for Quake, which can be used either to launch Quake normally or to implement the install-and-launch features described here.

The "quakecleanup.desktop" application supports the feature of right-click deletion of Quake gamedirs and shortcuts.

### Configuration

Before you can install these .desktop files, you'll need to customize them. In both of them the value for the Exec path needs to be edited to point to the location where you have placed the "quakelaunch" or "quakecleanup" script accordingly. A "%f" should be placed after the path to indicate that the script can accept a filepath argument.

For example, if you have placed the "quakelaunch" script at "/home/bin/bin/quakelaunch", then in your "quake.desktop" file the Exec line must look like this:
```
Exec=/home/bin/bin/quakelaunch %f
```

Similarly if you intend to use the gamedir/shortcut cleanup feature, you must edit the Exec value in "quakecleanup.desktop" so that it uses the path where you have placed the "quakecleanup" script.

You'll also want an icon graphic for the Quake application. An example icon "quake-icon-512.png" is included in the "icons" directory here; if you want to use that icon then place it in some permanent location where it won't get deleted. Then edit the Icon value in "quake.desktop" to be that icon's filepath.

Note for power users: If you already have a Quake .desktop file that you use and like, you can edit it rather than replacing it. The important thing is for its Exec path to point at your "quakelaunch" script as described above. You would also need to make sure to correctly identify your desired .desktop file when setting the default app for filetypes as described below.

### Installation

The commands below show how you would install these application definitions, from a shell prompt that is currently working in this "desktop_integration" directory. I'll show the commands first and then discuss how you might want to tweak them.
```bash
xdg-desktop-menu install --novendor --mode user quake.desktop
xdg-desktop-menu install --novendor --mode user quakecleanup.desktop
xdg-mime default quake.desktop application/x-quake
xdg-mime default quake.desktop application/x-bsp-map
update-desktop-database ~/.local/share/applications
```
There's a few reasons you might want to do things slightly differently, e.g.:
* If you don't want the gamedir/shortcut cleanup feature, then you can skip the second command.
* If you chose not to define the x-quake filetype, you should skip the third command.
* If you chose not to define the x-bsp-map filetype, you should skip the fourth command.
* If you're modifying an existing Quake .desktop file as described in the "power user" note above, you'll skip the first command and change commands three and four... but you probably already know that.

# Usage notes

The typical setup of these filetypes and applications will create these desktop behaviors:
* Double-click on a ".quake" or ".bsp" file will launch the "Quake" application (which runs the "quakelaunch" script).
* Right-click on a ".quake" file will give you an "Open with" menu option to open with the "Quake mod cleanup" application (which runs the "quakecleanup" script).
* Right-click on a directory (i.e. a gamedir) will give the option to open the directory with "Quake" or with "Quake mod cleanup"
* Right-click on a ".zip" file will give the option to open with "Quake".

You can also open and install types of archives other than ".zip", but they won't immediately be shown in the right-click-open menu the first time you do so. You can choose to open with "Other Application", then "View All Applications" to get a list of more applications. Find and select "Quake" in that list.

Once you have opened a particular archive type this way, "Quake" will be presented as a right-click-open choice for that archive type in the future. Just make sure you do *not* set "Quake" as the default application for an archive type as that is typically not what you want. E.g. in elementary OS there is a "Set as default" checkbox that I would make sure remains unchecked.

# Testing

Note that any testing should be done using a window that was opened after you finished the desktop integration.

If you right-click a file with the ".quake" extension it should show as "application/x-quake" type in its Properties dialog. Similarly if you installed the definition for bsp files, their Properties should now show them as "application/x-bsp-map" type.

If you installed an icon for the x-quake type, then any ".quake" shortcut file should display that icon.

"Quake" should appear in your desktop applications launcher, in the "Games" category. You should be able to launch it and Quake will start up normally.

If that all works so far, you can try out the various right-click and double-click behaviors described in the usage notes above, for the filetypes and applications that you decided to install.

# Uninstallation

The full set of removal commands is shown below, in case you want to completely undo the desktop integration. The commands should be executed from a shell prompt that is currently working in this "desktop_integration" directory. If you didn't install something you can skip the corresponding command for uninstalling it.

To remove the applications:
```bash
xdg-desktop-menu uninstall --mode user quake.desktop
xdg-desktop-menu uninstall --mode user quakecleanup.desktop
update-desktop-database ~/.local/share/applications
```

At this point you may want to also clean up any remaining references to these applications in your "\~/.config/mimeapps.list" file (or in "\~/.local/share/applications/mimeapps.list" in older versions of Ubuntu). These dangling references are harmless but you can remove them if you are OCD about this kind of thing (like me). This will involve deleting any instance of "quake.desktop" or "quakecleanup.desktop" in that file, and deleting an entire line from the file if it is left with nothing after the "=" sign. So for example a line like this should be removed entirely:
```
application/x-quake=quake.desktop
```

To remove the special Quake-related filetypes you can execute these commands:
```bash
xdg-icon-resource uninstall --context mimetypes --mode user --size 128 application-x-quake
xdg-mime uninstall --mode user x-quake.xml
xdg-mime uninstall --mode user x-bsp-map.xml
update-mime-database ~/.local/share/mime
```
