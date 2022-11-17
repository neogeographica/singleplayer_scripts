#!/usr/bin/env bash

gzip -k quakelaunch-defaults.conf
cat quakelaunch-script quakelaunch-defaults.conf.gz > ../quakelaunch
chmod +x ../quakelaunch
rm quakelaunch-defaults.conf.gz
