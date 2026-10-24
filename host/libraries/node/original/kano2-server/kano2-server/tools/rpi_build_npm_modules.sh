#!/bin/bash

set -e

function echoerr()
{
    echo "$@" 1>&2
}

function download_file()
{
    local ret_code=0
    wget "$@" || ret_code=$?
    case "$ret_code" in
        0)
            echo "Successfully dowloaded file"
            ;;
        1)
            echoerr "Wget failed with Generic Error code"
            exit 2
            ;;
        2)
            echoerr "Wget failed with parse error"
            exit 2
            ;;
        3)
            echoerr "Wget failed with File I/O error"
            exit 2
            ;;
        4)
            echoerr "Wget failed with network failure error"
            exit 2
            ;;
        5)
            echoerr "Wget failed with SSL verification error"
            exit 2
            ;;
        7)
            echoerr "Wget failed with protocol errors"
            exit 2
            ;;
        8)
            echoerr "Wget failed because server issued error response"
            exit 2
            ;;
        *)
            echoerr "Wget failed with unknown error $rc"
            exit 2
            ;;
    esac
}


if [ "$(id -u)" != "0" ]; then
    echo "Needs to be run as root. Try again with sudo"
    exit 1
fi


rc=0
nmcli -terse -fields connectivity general status connectivity | grep -q 'full' || rc=$?
echo "Checking if RPI is connected to the Internet"
nmcli -terse -fields connectivity general status connectivity | grep -q 'full' || rc=$?

if [ $rc -ne 0 ]; then
    echo "Not connected. We need to be connected in order to install the dependencies"
    exit 1
fi

echo "Testing Node"
command -v node || rc=$?
if [ $rc -ne 0 ]; then
    echo "Node not installed, will install now"
    # install node
    echo "Downloading Node 6.10.3"
    download_file https://nodejs.org/dist/v6.10.3/node-v6.10.3-linux-armv7l.tar.xz --no-check-certificate
    echo "Extracting files in /usr/local"
    tar --strip-components=1 -xvf node-v6.10.3-linux-armv7l.tar.xz -C /usr/local 2>&1
    echo "Removing temporary unnecessary files"
    rm node-v6.10.3-linux-armv7l.tar.xz
else
    echo "Node found, checking version"
    version="$(node --version)"
    if [ "$version" != "v6.10.3" ]; then
        echo "Node version installed is not v6.10.3, exiting"
        exit 3
    else
        echo "Correct version of node found"
    fi
fi

echo "Updating Debian Sources"
apt-get update || apt-get update || rc=$?
if [ $rc -ne 0 ]; then
    echoerr "Apt update exited with rc $rc (which is probably fine)"
fi

echo "Installing Debian Packages - Build deps"
apt-get install -y python-minimal make g++ libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev libudev-dev libsystemd-journal-dev || rc=$?
if [ $rc -ne 0 ]; then
    echoerr "Apt install exited with rc $rc (which is probably fine)"
fi

echo "Installing Debian Packages - Runtime deps"
# FIXME ffmpeg breaks install
apt-get install -y fswebcam streamer libcairo2 libgif4 libpango-1.0-0 || rc=$?
if [ $rc -ne 0 ]; then
    echoerr "Apt install exited with rc $rc (which is probably fine)"
fi
