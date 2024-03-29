## Who's this document for?

This may be interesting to you if you are compiling your own build of Quakespasm.

## What's the problem?

As mentioned in the [readme](README.md), it's handy to have "multiple gamedir" support in Quake. That allows you to easily work with foundational mods like Arcane Dimensions, Copper, and Alkaline which can have additional map releases based on them. You can keep those "other releases" in their own separate gamedirs and just instruct Quake to use the foundational mod as a base gamedir to build on top of.

Any modern Quake engine that is meant for singleplayer will support this nice behavior for Quoth. You can just give it the "-quoth" argument to indicate that a gamedir depends on Quoth. For example if you have a gamedir named "ne_tower" that depends on your "quoth" gamedir as a foundation, you can launch Quake with the arguments "-quoth -game ne_tower".

For other mods though, multiple gamedir support has traditionally been spotty.

[FTE](http://fte.triptohell.info/), [Quakespasm-Spiked](http://triptohell.info/moodles/qss/), and [DarkPlaces](https://icculus.org/twilight/darkplaces/) take care of this by allowing you to specify multiple gamedirs as arguments to Quake. For example if you have a gamedir named "ctsj" that depends on your "copper" gamedir as a foundation, you can launch one of those Quake engines with the arguments "-game copper -game ctsj" and everything will work fine.

Happily a couple of other engines have also taken this feature onboard in recent releases. [vkQuake](https://github.com/Novum/vkQuake) has this feature in releases 1.05.0 and later, and [Ironwail](https://github.com/andrei-drexler/ironwail) has it in releases 0.4.0 and later.

If you're using a Quake engine that supports this feature, you can specify the "ad_basegame_args" and "copper_basegame_args" values in quakelaunch.conf to handle automatic installation of releases that depend on Arcane Dimensions or Copper.

If you're using a Quake engine that does **not** support this feature, you have to manually do file-merges of AD/Copper/Alkaline-based releases into the main AD/Copper/Alkaline directory.

## What's the solution?

I've ported the relevant multiple-gamedir code from Quakespasm-Spiked into the Quakespasm codebase for my own use, and you can get that for your own Quakespasm build if you like. The specific change is https://github.com/neogeographica/Quakespasm/commit/605fe187bc23960b5799a390c7525ae4c35565cf and I also keep that change maintained in a branch named "qss-multigame" based on or near the current master branch tip of that forked repository.

Let me know if you try building with this change and you encounter any issues.
