#!/bin/bash

function echoerr()
{
    echo "$@" 1>&2
}

if [ "$(id -u)" != "0" ]; then
    echoerr "Needs to be run as root. Try again with sudo"
    exit 1
fi

echo "Checking whether avahi is installed"
dpkg -l | grep 'avahi-daemon' -q

if [ $? -eq 1 ]; then
    # Avahi is not installed, should install it now
    echo "Avahi not installed, will install now"
    apt-get update && apt-get -y install avahi-daemon
fi

echo "Installing kano2-hostname service"
cp kano2-hostname.service /etc/systemd/system

echo "Enabling the service on boot"
systemctl daemon-reload
systemctl enable kano2-hostname.service

echo "Done"
