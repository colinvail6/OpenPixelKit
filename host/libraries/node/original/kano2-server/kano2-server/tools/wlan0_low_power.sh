#!/bin/bash

# for wlan0, switch off power_save mode
# to avoid latency issue

if [ "$DEVICE_IFACE" = "wlan0" ] ; then
   iw dev wlan0 set power_save off
fi
