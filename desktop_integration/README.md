# What?

These are the files necessary to connect the script behaviors to desktop actions.

Once these files have been used to set up desktop integration, the features described in the [top-level readme](../README.md) will be available. And if you want, you can then do the [browser integration](../browser_integration/README.md) for Chrome or Firefox.

# Setup

If you have already installed [the scripts](../scripts/README.md) that we're going to hook into the desktop, great! If not go do that first.

There are five steps in the desktop integration process. Those steps are numbered and called out below, with some other context and discussion around them.

## Prerequisites

**1. Use "desktop_integration" as your working directory**

Make sure that you are in a shell with this "desktop_integration" directory as the working directory, before proceeding to the sections below. Some of the example commands will assume this working directory.

## Filetypes

**2. Define the filetypes**

The ".xml" files here will be used to define types for files with the ".quake" extension and for files with bsp (compiled Quake map) content. This will then allow us to define the default and optional ways of opening such files.

The commands below show how you would define the filetypes, from a shell prompt that is currently working in this "desktop_integration" directory. This includes setting an icon for ".quake" files. I'll show the commands first and then discuss how you might want to tweak them.
```bash
xdg-mime install --novendor --mode user x-quake.xml
xdg-icon-resource install --context mimetypes --novendor --mode user --size 128 icons/quake-icon-128.png application-x-quake
xdg-icon-resource install --context mimetypes --novendor --mode user --size 512 icons/quake-icon-512.png application-x-quake
xdg-mime install --novendor --mode user x-bsp-map.xml
update-mime-database ~/.local/share/mime
```
There's a few reasons you might want to do things slightly differently, e.g.:
* You might not want to install the x-quake filetype if you're not going to use ".quake" shortcuts, in which case you would skip the first two commands.
* You might want to have the x-quake filetype but give it a different icon, in which case you would change the icon filepath and maybe the icon size in the xdg-icon-resource command(s) that you use.
* You might not want to install the x-bsp-map filetype if you will never care about directly opening individual mapfiles.

Up to you!

> Note that if you install an icon for ".quake" shortcuts using the xdg-icon-resource command above, but shortcut files still do not display the icon, then you probably need to install the icon specifically for your current desktop theme.
>
> How you determine the current desktop theme will vary. You may be able to find it in a settings GUI. There are also ways to find the theme using the command line. For example if your desktop environment is based on GNOME, you could use this command:
> ```bash
> gsettings get org.gnome.desktop.interface icon-theme
> ```
> Or if based on KDE, this command:
> ```bash
> kreadconfig5 --group Icons --key Theme
> ```
> (For XFCE, or for older versions of GNOME/KDE, you may need to use different commands. See the [UNIX & Linux StackExchange](https://unix.stackexchange.com/questions/419895/if-i-have-a-mime-type-how-do-i-get-its-associated-icon-from-the-current-appearan) for a more detailed discussion.)
>
> Once you know the theme, you can use it in the "--theme" argument to the xdg-icon-resource command. For example in Pop!\_OS 22.04 LTS, which used a GNOME desktop environment, the above gsettings command told me that my theme was called "Pop". Then used the following xdg-icon-resource commands to install the icon... same as the earlier example, just with an additional "--theme" argument:
> ```bash
> xdg-icon-resource install --theme Pop --context mimetypes --novendor --mode user --size 128 icons/quake-icon-128.png application-x-quake
> xdg-icon-resource install --theme Pop --context mimetypes --novendor --mode user --size 512 icons/quake-icon-512.png application-x-quake
> ```

## Applications

Application definitions in ".desktop" files can be used to support launching applications from your system's apps menu, and for defining programs that can process certain filetypes. We'll be making use of both of those behaviors.

The "quake.desktop" file included here is an application definition for Quake, which can be used either to launch Quake normally or to perform the install-and-launch features described here.

The "quakecleanup.desktop" application supports the feature of right-click deletion of Quake gamedirs and shortcuts.

If you already have an existing application definition for launching Quake, you could either get rid of it before proceeding, or let two Quake apps exist together (maybe renaming one of them), or figure out how to make a single merged app definition that has all the properties you want. That topic has too many possibilities to get into here. 

### Configuration

**3. Edit the ".desktop" files (optional)**

The provided "quake.desktop" and "quakecleanup.desktop" files should work out-of-the-box, if you do all of the setup documented here.

However, power users may want to edit them. For example, the default setup will make the "quake" application use the same icon as the quakelaunch-associated files; if you want a different icon you can specify that for the Icon key in the "quake.desktop" file. You can specify the icon file basename of any icon already installed in your system.

Other aspects of the .desktop files are editable too of course. Some notes:
* The quakecleanup application is only meant to be used from an "Open With" context menu, and doesn't ever need to be started from the main application launcher. In GNOME you can hide it from the application launcher by changing NoDisplay to true in the "quakecleanup.desktop" file. In other desktop environments though, that setting may make quakecleanup more difficult or impossible to use from the "Open With" context menu.
* The MimeType list declares the types of files this application is expected to be able to open. The list you'll see in these .desktop files is complete for the basic/common filetypes we expect to deal with. Note that if you later choose to open other kinds of files with the app (such as 7z archives, rar archives, etc.) those associations will also get remembered. Normally there's no need to modify this list.
* The name of the desktop file itself ("quake.desktop" or "quakecleanup.desktop") is also significant, so don't change it unless you know what you're doing. This name is referenced when setting the default app for filetypes as described below, and it's also referenced inside the scripts when sending error notifications.

Final and probably most important note: There's a potential gotcha if the directory containing the "quakelaunch" script is one that was added to your PATH by your shell startup scripts, for example something like "\~/.local/bin" instead of "/usr/local/bin". In that case, the Linux application launcher may or may not see that addition to the PATH, and therefore may or may not be able to find the "quakelaunch" application when it is launched from GUI actions. This is usually not an issue if your Linux variant uses a recent version of the "sddm" login program, but in other cases the app launcher may fail to recognize your PATH changes unless they are specifically done in a "\~/.profile" file in a format readable by the "sh" shell.

PATH issues are too much of a rabbit hole to get into more here, but if you have placed "quakelaunch" in a directory you added to PATH and it is not getting launched, there are a few different things you can try:
* Move "quakelaunch" to a default PATH directory such as "/usr/local/bin".
* Edit the "quakelaunch.desktop" file to use a complete absolute path to the "quakelaunch" location, in the value for the "Exec" key.
* Have a "\~/.profile" file that does the necessary PATH modifications in a sh-compatible format.

### Installation

**4. Install the icon**
To install the default quakelaunch icon -- which is the same as the icon for the files associated with quakelaunch -- you can execute these commands:
```bash
xdg-icon-resource install --context apps --novendor --mode user --size 128 icons/quake-icon-128.png quakelaunch
xdg-icon-resource install --context apps --novendor --mode user --size 512 icons/quake-icon-512.png quakelaunch
```

If you changed the .desktop file above to reference some other icon path, you can skip this step.

If you do this step but the icon does not show up for the "quake" application, there may be an icon-theme issue to deal with as described in step 2.

**5. Install the applications**

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
* If you chose not to define the x-quake filetype, you could skip the third command.
* If you chose not to define the x-bsp-map filetype, you could skip the fourth command.

# Usage notes

The typical setup of these filetypes and applications will create these desktop behaviors:
* Double-click on a ".quake" or ".bsp" file will launch the "Quake" application (which runs the "quakelaunch" script).
* Right-click on a ".quake" file will also give you an "Open with" menu option to open with the "Quake mod cleanup" application (which runs the "quakelaunch" script with a special initial "--cleanup" argument).
* Double-click on a directory should have the same behavior as before -- i.e., opens it in a desktop window -- but right-click on a directory will give the option to open the directory with "Quake" or with "Quake mod cleanup"
* Double-click on a ".zip" file should have the same behavior as before, but right-click on a ".zip" file will give the option to open with "Quake".

You can also open and install types of archives other than ".zip", but "Quake" won't immediately be shown in the right-click-open menu for other archive types the first time you do so. You can choose to open with "Other Application", then "View All Applications" to get a list of more applications. Find and select "Quake" in that list.

Just make sure you do *not* set "Quake" as the *default* application for an archive type, as that is typically not what you want. E.g. in elementary OS there is a "Set as default" checkbox that I would make sure remains unchecked.

Once you have opened a particular archive type this way, "Quake" will be presented as a right-click-open choice for that archive type in the future.

# Testing

Note that any testing should be done using a window that was opened after you finished the desktop integration.

If you right-click a file with the ".quake" extension it should show as "application/x-quake" type in its Properties dialog. Similarly if you installed the definition for bsp files, their Properties should now show them as "application/x-bsp-map" type.

If you installed an icon for the x-quake type, then any ".quake" shortcut file should display that icon.

"Quake" should appear in your desktop applications launcher, in the "Games" category. You should be able to launch it from that UI and Quake will start up normally.

If that all works so far, you can try out the various right-click and double-click behaviors described in the usage notes above, for the filetypes and applications that you decided to install.

# Uninstallation

The full set of removal commands is shown below, in case you want to completely undo the desktop integration. The commands should be executed from a shell prompt that is currently working in this "desktop_integration" directory. If you didn't install something you can skip the corresponding command for uninstalling it.

To remove the applications:
```bash
xdg-desktop-menu uninstall --mode user quake.desktop
xdg-desktop-menu uninstall --mode user quakecleanup.desktop
xdg-icon-resource uninstall --context apps --mode user --size 128 quakelaunch
xdg-icon-resource uninstall --context apps --mode user --size 512 quakelaunch
update-desktop-database ~/.local/share/applications
```

At this point you may want to also clean up any remaining references to these applications in your "\~/.config/mimeapps.list" file (or in "\~/.local/share/applications/mimeapps.list" in older versions of Ubuntu). These dangling references are harmless but you can remove them if you are a neatfreak about this kind of thing. This will involve deleting any instance of "quake.desktop" or "quakecleanup.desktop" in that file, and deleting an entire line from the file if it is left with nothing after the "=" sign. So for example a line like this should be removed entirely:
```
application/x-quake=quake.desktop
```

To remove the special Quake-related filetypes you can execute these commands:
```bash
xdg-icon-resource uninstall --context mimetypes --mode user --size 128 application-x-quake
xdg-icon-resource uninstall --context mimetypes --mode user --size 512 application-x-quake
xdg-mime uninstall --mode user x-quake.xml
xdg-mime uninstall --mode user x-bsp-map.xml
update-mime-database ~/.local/share/mime
```

Note that if you originally installed the icon using an additional "--theme" argument, you should also use that same theme argument when uninstalling it.
