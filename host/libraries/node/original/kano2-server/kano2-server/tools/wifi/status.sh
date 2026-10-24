#!/bin/bash
sudo nmcli -terse -fields connectivity general status connectivity | grep full &> /dev/null
rc=$?
if [[ $rc == 0 ]]; then
    SSID=$(sudo nmcli --terse --fields device,state,connection device status | awk '/:connected:/ {split($0,a,":"); print a[3]}')
    sudo nmcli --terse connection show "$SSID"
else
    exit 1
fi
