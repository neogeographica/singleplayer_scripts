As mentioned in the [readme](README.md), it's handy to have "multiple gamedir" support in Quake. It allows you to easily work with foundational mods like Quoth, Arcane Dimensions, and Copper which have additional map releases based on them. You can keep those "other releases" in their own separate gamedirs and just instruct Quake to use the foundational mod as a base gamedir to build on top of.

Any modern Quake engine that is meant for singleplayer will support this nice behavior for Quoth. You can just give it the "-quoth" argument to indicate that a gamedir depends on Quoth. For example if you have a gamedir named "ne_tower" that depends on your "quoth" gamedir as a foundation, you can launch Quake with the arguments "-quoth -game ne_tower".

For other mods though, multiple gamedir support is spotty.

[FTE](http://fte.triptohell.info/), [Quakespasm-Spiked](http://triptohell.info/moodles/qss/), and [DarkPlaces](https://icculus.org/twilight/darkplaces/) take care of this by allowing you to specify multiple gamedirs as arguments to Quake. For example if you have a gamedir named "ctsj" that depends on your "copper" gamedir as a foundation, you can launch one of those Quake engines with the arguments "-game copper -game ctsj" and everything will work fine.

Unfortunately Quakespasm and vkQuake don't support this feature. I usually use Quakespasm-Spiked these days, but occasionally there are reasons to use other engines. So for my own use, I've ported the relevant code from Quakespasm-Spiked into the Quakespasm and vkQuake codebases.

If you happen to be making your own build of Quakespasm or vkQuake, you could pick up this change for your build if it seems like something you would want.

For Quakespasm, the change is https://github.com/neogeographica/Quakespasm/commit/605fe187bc23960b5799a390c7525ae4c35565cf

For vkQuake, the change is https://github.com/neogeographica/vkQuake/commit/0d91eadd60ba7d39842c04b53cbd4b2aeafcada3

In both cases I keep that change maintained in a branch named "qss-multigame" based on or near the current master branch tip of those forked repositories.

Let me know if you try building with this change and you encounter any issues.
