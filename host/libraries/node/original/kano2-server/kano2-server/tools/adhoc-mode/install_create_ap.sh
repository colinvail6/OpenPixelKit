#!/bin/bash

CREATE_AP_INST_DIR="create_ap"
DEPENDENCIES=(make git)

if [ $EUID -ne 0 ]; then
    >&2 echo "Must be ran as root"
    exit 1
fi

for i in "${DEPENDENCIES[@]}"; do
    which $i &> /dev/null
    rc=$?
    if [ $rc -ne 0 ]; then
        >&2 echo "$i is not installed, please install and re-run"
        exit 2
    fi
done

echo "Downloading CreateAP"
git clone https://github.com/oblique/create_ap $CREATE_AP_INST_DIR &>/dev/null
pushd $CREATE_AP_INST_DIR &>/dev/null
echo "Installing to system"
make install &> /dev/null
popd &>/dev/null
rm -r $CREATE_AP_INST_DIR

echo "Installing Systemd Service"
cp kano2-hostap.service /lib/systemd/system &>/dev/null

echo "Install runtime dependencies"
apt-get update &> /dev/null
apt-get install -y util-linux procps hostapd iproute2 iw dnsmasq &> /dev/null

echo "Reloading SystemD daemon"
systemctl daemon-reload
echo "Done"
