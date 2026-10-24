#!/bin/bash

ARG=$1

if [  "$ARG" != "server_build" ] ; then
    SUPPRESS_OUTPUT= &>/dev/null
else
    SUPPRESS_OUTPUT=
fi

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
# see https://www.mankier.com/1/nmcli
if [  "$ARG" != "server_build" ] ; then
    echo "Checking if BPI is connected to the Internet"
    nmcli -terse -fields connectivity general status connectivity | grep -q 'full' || rc=$?
fi

if [ $rc -ne 0 ]; then
    echo "Not connected. We need to be connected in order to install the dependencies"
    exit 1
fi

echo "Testing Node"
command -v node $SUPPRESS_OUTPUT || rc=$?
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
apt-get update $SUPPRESS_OUTPUT || apt-get update $SUPPRESS_OUTPUT || rc=$?
if [ $rc -ne 0 ]; then
    echoerr "Apt update exited with rc $rc (which is probably fine)"
fi

echo "Installing Debian Packages - Build deps"
apt-get install -y python-minimal make g++ libcairo2-dev libjpeg-dev libudev-dev libsystemd-journal-dev $SUPPRESS_OUTPUT || rc=$?
if [ $rc -ne 0 ]; then
    echoerr "Apt install exited with rc $rc (which is probably fine)"
fi

echo "Installing Debian Packages - Runtime deps"
apt-get install -y upower libcairo2 $SUPPRESS_OUTPUT || rc=$?
if [ $rc -ne 0 ]; then
    echoerr "Apt install exited with rc $rc (which is probably fine)"
fi
if [  "$ARG" == "server_build" ] ; then
    # on the server, we already have a netowrk connection so we can automatically install network-manager
    apt-get install -y  network-manager || rc=$?
    if [ $rc -ne 0 ]; then
        echoerr "Apt install exited with rc $rc (which is probably fine)"
    fi
fi

echo "Checking files are in place"

if [ ! -e "node_modules" ]; then
    echo "Node modules folder not found, will attempt to download it from S3"
    download_file "https://s3-eu-west-1.amazonaws.com/kano2-server-node-modules/node_modules/kano2-server-node-modules.tar.gz"
    echo "Will now extract downloaded node modules"
    if [ -e kano2-server-node-modules.tar.gz ]; then
        tar -xzf kano2-server-node-modules.tar.gz -C . 2>&1
        chown -R "$(logname):$(logname)" node_modules
        echo "Cleaning up unnecessary tar file"
        rm kano2-server-node-modules.tar.gz
    fi

fi


# echo "Installing Node Dependencies"
# npm install serialport --build-from-source
# npm install
# echo "Done installing Node packages"c


echo "Setting up readonly_root"
./tools/make_readonly.sh
echo "Done setting up readonly_root"


echo "Offering kano2-server services on systemd"
cp kano2-server-*.service /etc/systemd/system/
echo "enabling service"
KANO2_SERVICE=kano2-server-lightboard.service
ln -s /etc/systemd/system/$KANO2_SERVICE /etc/systemd/system/default.target.wants/$KANO2_SERVICE
KANO2_SHUTDOWN=kano2-server-shutdown.service
ln -s /etc/systemd/system/$KANO2_SHUTDOWN /etc/systemd/system/default.target.wants/$KANO2_SHUTDOWN

if [  "$ARG" != "server_build" ] ; then
    systemctl daemon-reload
fi

# Make sure the udev rules file is empty
dd if=/dev/null of=/etc/udev/rules.d/70-persistent-net.rules

# Add udev rule ot have a fixed wlan address
dd of=/etc/udev/rules.d/70-persistent-net.rules oflag=append conv=notrunc <<EOF
SUBSYSTEM=="net", ACTION=="add", DRIVERS=="?*", ATTR{address}=="*", ATTR{dev_id}=="0x0", ATTR{type}=="1", KERNEL=="wlan*", NAME="wlan0"
EOF


if [ -e tools/power-btn/install_acpi_service.sh ]; then
    echo "Installing ACPI service"
    pushd tools/power-btn $SUPPRESS_OUTPUT

    bash install_acpi_service.sh
    popd $SUPPRESS_OUTPUT
fi

# disable adb so 1) wondows isn't confused and 2) avoid triggering kernel issue
mv /var/lib/bananapi/bpi-autorun.d/{S,s}30-adbd.sh

# prevent low power mode in wifi which causes latency problems
cp tools/wlan0_low_power.sh /etc/NetworkManager/dispatcher.d/pre-up.d/

# enable otg hotplug detection
cp tools/otg_detect/75-otg.rules /etc/udev/rules.d/75-otg.rules
cp tools/otg_detect/otg_detect.sh /sbin/


echo 'Done installing dependencies. To get the server up and running, please reboot and run:'
echo 'For Development:'
echo 'node bin/start --device=camera'
echo ' -- or --'
echo 'node bin/start --device=lightboard'
echo '**'
echo 'For production:'
echo 'sudo systemctl start kano2-server-lightboard'
echo '-- or --'
echo 'sudo systemctl start kano2-server-camera'
