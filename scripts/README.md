# What?

These are the scripts (and associated config file and sounds) used to do the heavy lifting for the features described in the [top-level readme](../README.md).

Once these are installed and working you can go over to the desktop_integration directory and follow the instructions in [the readme there](../desktop_integration/README.md) to hook up the desired right-click and double-click behaviors.

# Setup

Six steps are needed to get these scripts working. Those steps are numbered and called out below, with some other context and discussion around them.

## Prerequisites

**1. Install utility "aunpack"**

If you want to use the auto-install feature, you will need to have installed the utility "aunpack", which is part of [atool](https://www.nongnu.org/atool/). In my case I installed that utility and its dependencies with:
```bash
sudo apt-get install atool
```

**2. Install optional Python module "expak"**

The main script can also optionally use my Python module [expak](https://github.com/neogeographica/expak) to look inside pak files and make better decisions about what map to launch. To use this module, you will need Python 2 or Python 3 installed; the script will use whatever executable has the name "python". The expak module will need to be installed for that version of Python with:
```bash
sudo pip install expak
```

If you can't or don't want to install these things globally, there are various ways to tackle that, but I think that's outside the scope of this doc.

## Configuration

**3. Put the error sounds somewhere safe**

The "sounds" directory contains a selection of error beeps. If you want to use these sounds, make sure they are placed in a location where they will not get deleted. (Leaving them here among the files you downloaded for this repo is fine, if you're going to keep them intact.) Or find some other sounds you want to use.

**4. Edit "quakelaunch.conf"**

Now open "quakelaunch.conf" in a text editor, read through it, and modify it as necessary to reflect your own Quake setup. This includes customizing the paths that locate things such as Quake and the above error sounds, and other options to customize the behavior of the scripts. You *will* need to modify this file before the scripts will work. This file is commented thoroughly enough that it should be pretty self-explanatory, but the "Usage notes" section below covers some interesting bits.

## Installation

**5. Put "quakelaunch" and "quakelaunch.conf" somewhere safe**

The "quakelaunch" script must be placed somewhere that it will not get deleted. Make sure that it is marked as executable.

Your edited "quakelaunch.conf" file needs to be placed in the same location as the "quakelaunch" script.

**6. Put "quakecleanup" in that same place**

If you will be using ".quake" shortcuts (see below), it is nice to have an automated way to delete both the gamedir and its shortcut together. The "quakecleanup" script can be used for that. If you think you will want to use this script, you must put it in the same location as "quakelaunch" and "quakelaunch.conf", and make sure that it is marked executable.

# Usage notes

The scripts are meant to be used through desktop integration, but you can also run them manually. Each script can take one argument.

"quakelaunch" with zero arguments will just launch Quake.

"quakelaunch" with one argument represents what will happen when you use the desktop integration to "open a file" for "Quake". The argument to "quakelaunch" can be a zip archive, some other kind of archive, a Quake gamedir, a ".quake" shortcut, or a bsp file inside the maps directory of a gamedir. This will trigger the various features/behaviors described in the top-level readme.

"quakecleanup" with one argument represents what will happen when you use the desktop integration to "open a file" for "Quake mod cleanup". The argument to "quakecleanup" can be a Quake gamedir or a ".quake" shortcut. It will delete a gamedir and its associated shortcut(s).

The sections below cover some of the interesting parts of these behaviors that can affect how you want to set up the "quakelaunch.conf" config file, and how you will use the features once they are installed.

## Shortcuts

A shortcut is a file with the ".quake" extension. They're nice as a way to launch a Quake mod or maps with a double-click (once you've done the desktop integration). A directory full of shortcuts is basically your menu of Quake stuff you can play.

You can define a value for shortcuts_dir in the config file if you want the launcher to automatically create a shortcut file in a specified directory whenever it creates a new gamedir. You can also create shortcut files yourself by whatever means you want.

Generally you won't need to know much about how shortcuts work, but here's some details that might come in handy at some point:
* If a shortcut file contains the path to a gamedir, opening the shortcut (with "quakelaunch") will launch that gamedir. Shortcuts created by the launcher are like this.
* If a shortcut file is empty (doesn't contain any non-whitespace), then opening it will just launch the gamedir that has the same basename as the shortcut.
* If you use "quakecleanup" on a shortcut, it will also delete the gamedir that the shortcut points to.
* If you use "quakecleanup" on a gamedir, it will also delete any shortcuts in the current shortcuts_dir that point to that gamedir.

Note about "empty" shortcuts: you will want to make sure that they do contain some whitespace, even just a single space or carriage return character. This is because some Linux configurations will not correctly recognize the filetype of zero-length files, which undermines the desired shortcut behavior. So for example if you wanted to manually create an "empty"-style shortcut for the "hwjam2" gamedir, you could do:
```
echo > hwjam2.quake
```
to create a shortcut file that has a carriage return in it.

## Savegames

If a launched gamedir contains any savegames, the most recent one will be loaded. (Unless you had launched it by opening a specific bsp file.)

## Startmaps

If you launch a gamedir that contains no savegames, "quakelaunch" will try to choose a good initial map to load. The rules it goes by are:
* If there are pak files in the gamedir, and expak is not installed, then we can't figure out what maps there might be. Just activate the gamedir and don't load any map.
* Otherwise build a list of maps in any "loose" bsp files in the gamedir and in any of its paks.
* If there's only one map, load that.
* If there's a "start" map or some map that ends with "start", load that.
* Otherwise just activate the gamedir and don't load any map.

This is only a small convenience, so we don't want to make a mistake and accidentally skip the actual first map... I intentionally didn't get into more complicated map-picking rules that would be more likely to occasionally misfire.

If the script can't figure out which map to load, just use the console as usual to list and load maps.

## Quoth and missionpacks

If the gamedir contains a document that mentions using quoth, hipnotic, or rogue as a basegame, then "quakelaunch" will honor that when launching it. It will stop with an error if the necessary basegame is not present.

If you have a gamedir that requires one of these basegames but doesn't mention that fact in any of its docs, you can create a ".txt" file in the gamedir to trigger "quakelaunch" to use the correct basegame. The file should contain "-quoth", "-hipnotic", or "-rogue" accordingly. For example if you need a gamedir to use Quoth but it doesn't say that in its docs, you could do this inside the gamedir:
```
echo "-quoth" > basegame.txt
```
(I haven't yet found a need to do that though.)

## Arcane Dimensions and Copper

Some custom singleplayer releases make use of Arcane Dimensions or Copper, either as a standalone release or as additional files meant to be merged into the base mod. "quakelaunch" takes this to be the case if a document in the gamedir mentions one of those mods.

A "standalone" release is detected if it has a progs.dat or any pak files. If this is the case then it will be installed and launched like any other mod, in its own gamedir.

For a non-standalone release it's a little more complicated. As described in the top-level readme I like to keep each release in its own gamedir. Ideally I would want to put the new stuff in its own gamedir and use Arcane Dimensions or Copper as a base game directory that the new gamedir can build on... same as I do with content built for Quoth or the missionpacks. Many Quake engines don't have that feature, but I do know that [FTE](http://fte.triptohell.info/) and [Quakespasm-Spiked](http://triptohell.info/moodles/qss/) can do it, and I've included examples in the conf file that would work with those two engines. If you have a Quake engine that can do it, you can set the relevant options in your "quakelaunch.conf" file.

So if you try to install a non-standalone Arcane Dimensions or Copper release, different things will happen based on your configuration:
* If you're set up (in "quakelaunch.conf") to handle AD/Copper as a "basegame", the content will be installed in its own gamedir and launched accordingly.
* Otherwise, the script will exit without doing the installation, generating a desktop notification that tells you why it couldn't auto-install. You'll need to install the content manually, by merging files into the main AD/Copper mod directory or whatever you would normally do.

If you try to launch a non-standalone gamedir that mentions Arcane Dimensions or Copper in its docs:
* If you're set up to handle AD/Copper as a "basegame", the gamedir will be launched accordingly.
* Otherwise the gamedir will be launched normally without specifying any basegame. The script assumes you know what you're doing! (This might change in future releases.)

Note that because the script just looks for occurences of "Arcane Dimensions" or "Copper" in the readme files, if the readme says something like "built for vanilla id1 but also tested with Copper" then the gamedir will get launched with Copper. I haven't found this to be a real problem yet (and I like Copper anyway) &mdash; but if something like this does happen, and you want to force the script to launch the gamedir in id1, then you can edit the readme to remove the offending reference.

## Mapjam helper

Some packs of maps don't include a custom start map; or maybe they do, but it's just a giant collection of slipgates and it's annoying to keep track of where you've already been. In these cases I usually just want to play through the maps in some order, so I would use the Quake console to get a list of maps and manually load the next map.

This script provides an optional helper to make that process a bit nicer. If you define a value for jam_keybind in "quakelaunch.conf", that key will be bound to an alias that will load the "next map" in a list of maps from the gamedir. So when you first load up the map pack, press that key to be taken to the first non-startmap map in the pack. Or if you're just in the Quake console rather than in a startmap, you can enter the "jam" command in the console.

When you're done with that first map (either before or after you go through its exit portal), press the key again to go to the next map. Etc. If you've played through the whole list then pressing the key will just print the message "All Done!" in the upper-left-hand corner of the screen.

If you make a savegame and then come back later to pick up where you left off, using the autoload-latest-savegame feature, the mapjam helper will be set up correctly so that it starts at your current spot in the map list. The same is true if you use the launch-from-bsp feature to directly load a specific map.

Note that the config-scripting for this behavior doesn't have any magic way to know what map you are currently on; it just starts on a particular map and then works through a list as you press the key repeatedly. So if you manually load a different map or savegame after launching Quake you will not change its idea of what the "next map" is.

# Testing

If you want to test whether you've installed the expak module correctly, cd into your id1 directory and execute the following command. (Long line here, be sure to copy it all.)
```
python -c "import expak;print(' '.join([r for r in expak.resource_names(['pak0.pak','pak1.pak']) if r.lower().startswith('maps/')]))"
```
You should see this output:
> maps/e4m8.bsp maps/e4m1.bsp maps/e3m2.bsp maps/dm1.bsp maps/b_rock1.bsp maps/b_shell1.bsp maps/b_bh25.bsp maps/e1m7.bsp maps/e4m7.bsp maps/e3m5.bsp maps/e4m5.bsp maps/e2m3.bsp maps/dm3.bsp maps/end.bsp maps/start.bsp maps/e1m1.bsp maps/dm4.bsp maps/e2m4.bsp maps/dm6.bsp maps/e2m5.bsp maps/b_exbox2.bsp maps/e1m2.bsp maps/e2m6.bsp maps/b_bh10.bsp maps/b_batt1.bsp maps/dm5.bsp maps/e4m6.bsp maps/b_rock0.bsp maps/b_bh100.bsp maps/e1m6.bsp maps/e3m4.bsp maps/e4m3.bsp maps/e1m5.bsp maps/e3m6.bsp maps/e2m1.bsp maps/e4m4.bsp maps/e3m7.bsp maps/e4m2.bsp maps/b_batt0.bsp maps/e2m7.bsp maps/e3m1.bsp maps/e1m3.bsp maps/b_shell0.bsp maps/dm2.bsp maps/e3m3.bsp maps/e1m4.bsp maps/b_nail1.bsp maps/b_explob.bsp maps/e2m2.bsp maps/e1m8.bsp maps/b_nail0.bsp

There's no need to check that that is the exact list you get, the idea is just that you should be shown a long list of bsp files rather than some Python error.

Next, you can test the scripts from the shell command line.

Give the "quakelaunch" script one argument that is a path to a bsp file within an existing Quake gamedir. It should launch Quake with that gamedir activated and that bsp file loaded.

Now try running it with an argument that is a path to an existing gamedir. It should launch Quake with that gamedir activated, and possibly choosing a map to load as described above.

Finally, try running it with an argument that is a path to a zipfile containing a downloaded Quake mod or maps. It should install and then launch it.

If these tests work you're probably good to go, but you can certainly also test "quakelaunch" with other arguments like a ".quake" shortcut file, or archives of other types. You can also try out the "quakecleanup" script with a path to a shortcut or gamedir to check that it does the necessary deletions.

# Uninstallation

If you ever want to get rid of these scripts you can just delete the files (scripts, conf, and sounds) from wherever you put them.

If you installed the prereqs as above, and you need to uninstall them, you can do so with
```bash
sudo apt-get remove atool
sudo pip uninstall expak
```
