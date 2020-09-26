## Who's this document for?

This document is a about an issue that should probably **not** matter to you if you are using an officially-released or built-from-default-configuration binary of [Quakespasm](http://quakespasm.sourceforge.net/) or a Quakespasm variant like [Quakespasm-Spiked](http://triptohell.info/moodles/qss/) or [vkQuake](https://github.com/Novum/vkQuake). It might matter though if you are using a custom build.

It **does** likely matter to you if you are using an official release of [FTE](http://fte.triptohell.info/) or [DarkPlaces](https://icculus.org/twilight/darkplaces/). Possibly some other Quake engines as well.

I'll describe below how to check for sure whether this issue is relevant for you.

## What's the problem?

In the original Quake, when it creates a savegame or a config file it will just write it into a subdirectory of "basedir" (your Quake installation directory). So if you're playing the original campaign it will write stuff to the "id1" subdirectory of the basedir; if you're playing the mod "honey" then it will write to the "honey" subdirectory there, etc.

In modern operating systems this can cause problems if that basedir is in some protected location that normal users aren't allowed to modify. So some Quake engines introduced a new behavior to play more nicely with this situation: any files that are created by Quake will instead go into a subdirectory somewhere under the user's home directory. These subdirectories can also be used for placing mods and any other additional user-added files, so a user never needs to modify the directories or files of the main Quake installation.

The location of this "userdata" directory depends on which Quake engine you're using. Also (as of the time when this doc was written), some of these Quake engines have this behavior active by default in official releases, while others will not. For the Quake engines that don't normally have this behavior, it can be possible to activate it if you (or someone) does a custom build that turns on the behavior.

The table below lists the directory that each Quake engine will use for userdata, and whether the userdata behavior is normally active in a build of that engine that most folks are likely to be using.

| engine            | userdata directory       | active by default |
| ----------------- | ------------------------ | :-----: |
| Quakespasm        | $HOME/.quakespasm        | no      |
| Quakespasm-Spiked | $HOME/.quakespasm        | no      |
| vkQuake           | $HOME/.vkquake           | no      |
| FTE               | $HOME/.local/share/quake | **YES** |
| DarkPlaces        | $HOME/.darkplaces        | **YES** |

You should double-check though to make sure what the Quake program you are using is actually doing. There's a lot of ways to check this, both from within Quake and without, but here's one foolproof way that works in all cases:
* Start up your Quake program.
* Start a new game of the original campaign.
* Make a quicksave.
* Quit out of Quake.
* Check in the "id1" subdirectory of your Quake basedir, and see if a quicksave is there with the right timestamp.

If you see the savegame you created there (in "id1" under the basedir), then your Quake engine is **not** currently using a userdata directory and you can ignore the rest of this doc.

If you don't see the savegame though, you need to go find it! For the Quake engines in the table above it's probably in an "id1" subdirectory of the userdata directory shown in the table.

So for example if you're using FTE, the savegame has probably been created in the "$HOME/.local/share/quake/id1" directory. For DarkPlaces it's probably in "$HOME/.darkplaces/id1". Etc. Once you've found the savegame you created, you know for sure what userdata directory is being used by your Quake engine.

You may benefit from this userdata feature if you have Quake installed in a system-wide location and shared by multiple users. However this behavior does have some downsides, since it can confuse users or programs (including the quakelaunch script) who expect the original Quake behavior.

## What's the easy solution?

The easiest solution is to turn off the userdata behavior if you don't need/want it. All of the Quake engines mentioned in this doc allow you to disable userdata with the "-nohome" commandline argument.

If you want to make sure that the "-nohome" argument is always provided when you launch Quake, then make the "quake_args" option in quakelaunch.conf specify it. E.g. you could just have a line in your quakelaunch.conf that looks like this:
```
quake_args="-nohome"
```

## OK well is there some other solution?

If on the other hand you **do** want the userdata behavior, and therefore you are **not** going to use the "-nohome" option, then you should tell quakelaunch where userdata subdirectories will be stored. You can do this with the value of the "userdata_home" option.

I.e. for FTE you would set
```
userdata_home="$HOME/.local/share/quake"
```

Or for DarkPlaces you would set
```
userdata_home="$HOME/.darkplaces"
```

Generally speaking, if "userdata_home" is set, then whenever quakelaunch needs to look for files it will look both in the relevant directory under basedir (if it exists) and in the relevant userdata subdirectory. For example this behavior will kick in when the script goes looking for savegames and maps; it also covers cases where the script looks for readme files/documents and quakelaunch.conf files.

(This does raise the question, what if a gamedir-specific quakelaunch.conf file happens to exist in the subdirectory under basedir as well as in the userdata subdirectory? In that case quakelaunch will honor both of them, with values from the one in the userdata subdirectory taking precedence. This is potentially confusing but seems to be the best resolution.)

And whenever quakelaunch needs to generate a file (quakelaunch.conf or jam_helper.cfg), that file will be created in the userdata subdirectory.

If you set "userdata_home", you should also set a true or false value for the "install_to_userdata" option. "install_to_userdata" controls where files end up when you install a gamedir through quakelaunch. Should they go under the Quake basedir, or into a userdata directory? If your Quake basedir is not writeable by normal users then you should definitely set this option to true.

The "install_to_userdata" option also affects the behavior of the quakecleanup script when "userdata_home" is set. If "userdata_home" is set and "install_to_userdata" is true then it will **not** try to remove the corresponding basedir subdirectory when doing "Quake mod cleanup". (It will always remove the userdata subdirectory.)