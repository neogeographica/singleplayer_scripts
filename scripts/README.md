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
You may then want/need to install some of the various tools mentioned at the bottom of the atool webpage. For example, I already had tar, zip, gzip, and p7zip... but I needed to install rar as well in order to handle .rar archives.

**2. Install optional Python module "expak"**

The main script can also optionally use my Python module [expak](https://github.com/neogeographica/expak) to look inside pak files and make better decisions about things like what map to launch and whether a gamedir is "standalone" (has its own progs.dat). To use this module, you will need Python 2 or Python 3 installed; the script will use whatever executable has the name "python". The expak module will need to be installed for that version of Python with:
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

The scripts are meant to be used through desktop integration, but you can also run them manually. Each script can take one argument, which should be an absolute path to some file or directory.

"quakelaunch" with zero arguments will just launch Quake.

"quakelaunch" with one argument represents what will happen when you use the desktop integration to "open a file" for "Quake". The argument to "quakelaunch" can be a zip archive, some other kind of archive, a Quake gamedir, a ".quake" shortcut, or a bsp file inside the maps directory of a gamedir. This will trigger the various features/behaviors described in the top-level readme.

"quakecleanup" with one argument represents what will happen when you use the desktop integration to "open a file" for "Quake mod cleanup". The argument to "quakecleanup" can be a Quake gamedir or a ".quake" shortcut. It will delete a gamedir and its associated shortcut(s).

The sections below cover some of the interesting parts of these behaviors that can affect how you want to set up the "quakelaunch.conf" config file, and how you will use the features once they are installed.

## What is a "gamedir" really?

Basically a gamedir is a directory whose name can be used with the "-game" argument when launching Quake, to make Quake see the files in that directory. In the original Quake and in many new Quake engines, this is simply a directory that exists within the "basedir" directory, i.e. next to "id1".

In some Quake engines however, the directory for the gamedir may instead be located within a "userdata" directory, somewhere under your own home directory. Or there may be a directory of that name **both** in the basedir and **also** in the userdata, with Quake loading files from both locations. If your Quake engine makes use of a userdata directory then you'll need to set a couple of options in quakelaunch.conf accordingly. More about that in the [userdata](userdata.md) readme.

When the text below talks about a "gamedir" it is referring to the directory under "basedir" as well as the userdata subdirectory of the same name (if that exists). If there's any confusion about what that might mean in a particular context then the [userdata](userdata.md) readme will hopefully clear that up. To be clear though, if your Quake engine doesn't do the userdata thing (e.g. if you're using an official Quakespasm build) then you can ignore all that userdata stuff.

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

If your Quake engine is using a [userdata](userdata.md) directory, only savegames in userdata subdirectories can be loaded, so only those savegames will be considered here.

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

If the gamedir contains a document that mentions a dependency on quoth, hipnotic, or rogue, then "quakelaunch" will honor that dependency when launching it... unless the gamedir appears to be "standalone" i.e. comes with its own progs.dat.

An attempt to launch a gamedir with such a dependency will stop with an error if the necessary base gamedir is not present.

## Arcane Dimensions and Copper

"quakelaunch" will similarly look in docs for mentions of Arcane Dimensions or Copper (unless the gamedir is standalone). If it finds such a mention, that will be interpreted as a dependency on that mod.

Unlike the situation with Quoth and missionpack dependencies however, not all Quake engines can handle launching non-standalone AD/Copper-dependent content that is installed in its own separate gamedir. If you have a Quake engine that can do it, you can set the relevant options in your "quakelaunch.conf" file. I do know that [FTE](http://fte.triptohell.info/), [Quakespasm-Spiked](http://triptohell.info/moodles/qss/), [vkQuake](https://github.com/Novum/vkQuake) (after version 1.04.1), and [DarkPlaces](https://icculus.org/twilight/darkplaces/) can do it, and I've included examples in the conf file that work with those engines.

(BTW if you are making your own build of Quakespasm, [multigame-support.md](multigame-support.md) describes how you can add this capability to Quakespasm. vkQuake users may also want to check that document if currently using vkQuake 1.04.1 or earlier.)

If you try to launch a non-standalone gamedir that depends on AD or Copper, and you are **not** set up in quakelaunch.conf to handle AD/Copper as a base gamedir, you'll get an error message and the gamedir will not be launched. You can override this behavior if you want, by editing the per-gamedir config (see below).

## Per-gamedir configs

A "quakelaunch.conf" file inside a gamedir folder can be used to set behaviors specific to that gamedir. If such a file does not exist when a gamedir is launched, then the script will create it.

**Note:** If your Quake engine makes use of a "userdata" directory, this gamedir-specific quakelaunch.conf file will end up in the relevant subdirectory there. See [userdata.md](userdata.md) for details.

You can edit this file as you wish. Many of the options in the main "quakelaunch.conf" file can affect how a gamedir is launched, and if you specify a value for any of those options in this gamedir-specific config then that value will override the value from the main config.

This file will also contain a "basegame_args" option that specifies how any base gamedir dependecies (described above) affect the launch arguments for Quake. You can edit this value if it looks like the script has made the wrong conclusions. For example, if you have a gamedir that requires Quoth but doesn't mention that fact in any of its docs, then the script will initially set the "basegame_args" value to emptystring (nothing) since it couldn't detect the dependency. In that case you would want to manually change the "basegame_args" value to "-quoth".

You can also set a "extra_quake_args" option in this file if you want to specify additional command-line arguments to use with this gamedir. For example, if a gamedir is a "bots" mod that requires being launched with listen-server settings, then in its gamedir-specific config you can insert a line that sets the "extra_quake_args" option to a value of "-listen 16".

There are other options you might wish to set in this file. If you use the "readme and config preview" feature described below, you'll get to see more commentary about those options.

## Readme and config preview

If you set the value of "preview_readme_and_config" to true, this activates a feature that triggers on the first launch of any gamedir. Before Quake starts, you will get the chance to view any readme files or other documents in the gamedir. You will also get a chance to view and edit the gamedir-specific "quakelaunch.conf" file. Quake will not start until you have closed the editor window for that config file.

So for example you could look at the readme to note any base gamedir dependencies. Then you could check the "basegame_args" value in the config to see if it is correct, and fix it if not.

(Subsequent runs of the gamedir will skip the viewing/editing stuff and go straight to launching Quake.)

If "preview_readme_and_config" is true, you must also provide a value for "config_editor". This value describes how to launch an editor program for the gamedir-specific "quakelaunch.conf" file. The comments in the main "quakelaunch.conf" file describe the requirements for how you set this up. In the provided example I've chosen to use the "gedit" editor, which is a nice GUI text editor available on many Linux variants. If you don't have gedit, you could install it ("sudo apt install gedit")... or use some other editor as long as you can meet the requirements.

You can also provide values for txt_viewer, html_viewer, doc_viewer, and pdf_viewer to define how those document types can be viewed. In my example I use gedit again for .txt files, and xdg-open for all other file types to just use whatever the system default is.

## Mapjam helper

Some packs of maps don't include a custom start map; or maybe they do, but it's just a giant collection of slipgates and it's annoying to keep track of where you've already been. In these cases I usually just want to play through the maps in some order, so I would use the Quake console to get a list of maps and manually load the next map.

This script provides an optional helper to make that process a bit nicer. If you define a value for jam_keybind in "quakelaunch.conf", that key will be bound to an alias that will load the "next map" in a list of maps from the gamedir. So when you first load up the map pack, press that key to be taken to the first non-startmap map in the pack. Or if you're just in the Quake console rather than in a startmap, you can enter the "jam" command in the console.

When you're done with that first map (either before or after you go through its exit portal), press the key again to go to the next map. Etc. If you've played through the whole list then pressing the key will just generate a beep and the message "All Done" in the upper-left-hand corner of the screen.

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

Give the "quakelaunch" script one argument that is an absolute path to a bsp file within an existing Quake gamedir. It should launch Quake with that gamedir activated and that bsp file loaded.

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
