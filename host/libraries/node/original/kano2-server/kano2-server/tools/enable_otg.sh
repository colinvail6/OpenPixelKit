#!/bin/bash

set -e
 echo 247 >/sys/class/gpio/export || true
 echo out >/sys/class/gpio/gpio247/direction || true
 echo 1 >/sys/class/gpio/gpio247/value || true

if ! grep "acm" /sys/class/android_usb/android0/functions; then
    if grep 1 /sys/class/android_usb/android0/enable; then
    # To change config, first need to disable the driver
       echo "Reconfiguring OTG"
       echo 0 >/sys/class/android_usb/android0/enable
    fi
    # enable USB serial only in android driver
    echo -n "Enabling OTG..."

    # Now enable serial, and add one instance
    echo 'acm' >/sys/class/android_usb/android0/functions
    echo 1  >/sys/class/android_usb/android0/f_acm/instances

    # was set by /usr/local/bin/adbd.sh, now we have to do it ourselves
    echo 16D0 > /sys/class/android_usb/android0/idVendor
    echo 0D10 > /sys/class/android_usb/android0/idProduct

    # Enable driver again
    echo 1 >/sys/class/android_usb/android0/enable
else
    echo "OTG already enabled."
fi

echo "done"
