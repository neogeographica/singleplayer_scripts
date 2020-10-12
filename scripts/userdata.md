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
* Play a little more, then try reloading from the quicksave. Hopefully this works! (If not, we'll get to that.)
* Quit out of Quake.
* Check in the "id1" subdirectory of your Quake basedir, and see if a "quick.sav" file is there with the right timestamp.

If you see the "quick.sav" savegame you created there (in "id1" under the basedir), then your Quake engine is **not** currently using a userdata directory and you can ignore the rest of this doc.

If you don't see the savegame though, you need to go find it! For the Quake engines in the table above it's probably in an "id1" subdirectory of the userdata directory shown in the table.

So for example if you're using FTE, the savegame has probably been created in the "$HOME/.local/share/quake/id1" directory. For DarkPlaces it's probably in "$HOME/.darkplaces/id1". Etc. Once you've found the savegame you created, you know for sure what userdata home directory is being used by your Quake engine.

You may benefit from this userdata feature if you have Quake installed in a system-wide location and shared by multiple users. However this behavior does have some downsides, since it can confuse users or programs (including the quakelaunch script) who expect the original Quake behavior.

**!** Note that if creating or loading from the quicksave failed in the test above, then you should check whether your Quake installation's "id1" directory is user-modifiable. If it's not then you either need to change its permissions, or you may be in the precise situation where you do need a userdata feature in your Quake engine.

## What's the easy solution?

If you don't need/want the userdata behavior, the best and easiest solution is to turn it off. All of the Quake engines mentioned in this doc allow you to disable userdata with the "-nohome" commandline argument.

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

Generally speaking, if "userdata_home" is set, then whenever quakelaunch needs to look for files it will look both in the relevant directory under basedir (if it exists) and in the relevant userdata subdirectory. The only exception to this is the treatment of savegames, which will only be looked for in the userdata subdirectory.

(This does raise the question, what if a gamedir-specific quakelaunch.conf file happens to exist in the subdirectory under basedir as well as in the userdata subdirectory? In that case quakelaunch will honor both of them, with values from the one in the userdata subdirectory taking precedence. This is potentially confusing but seems to be the best resolution.)

Whenever quakelaunch needs to generate a file (quakelaunch.conf or jam_helper.cfg), that file will be created in the userdata subdirectory.

If you set "userdata_home", you should also set a true or false value for the "install_to_userdata" option. This option controls where files end up when you install a gamedir through quakelaunch. Should they go under the Quake basedir, or into a userdata subdirectory? If your Quake basedir is not writeable by normal users then you should definitely set this option to true.
