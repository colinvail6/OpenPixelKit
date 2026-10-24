#!/bin/bash

#Clone the repo

WIRINGPI_DIR="BPI-WiringPi"

if [ $EUID -ne 0 ]; then
    >&2 echo "Must be ran as root"
    exit 1
fi

echo "Cloning WiringPi dir"
git clone https://github.com/BPI-SINOVOIP/BPI-WiringPi.git -b BPI_M2P "$WIRINGPI_DIR" &> /dev/null

if [ -d "$WIRINGPI_DIR" ]; then
    pushd $WIRINGPI_DIR &> /dev/null

    chmod +x ./build
    echo "Build and installing"
    ./build
    popd

    rm -r $WIRINGPI_DIR
else
    exit 1
fi

echo "Installing Systemd Service"
cp kano-uart2.service /lib/systemd/system &>/dev/null

echo "Reloading SystemD daemon"
systemctl daemon-reload

echo "Starting the new unit file by default"
systemctl enable kano-uart2.service
echo "Done"
