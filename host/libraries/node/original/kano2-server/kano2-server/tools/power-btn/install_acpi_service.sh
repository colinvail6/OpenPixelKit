#!/bin/bash
set -e

readonly ACPID_CONF_DIR="/etc/acpi"

if [ "$(id -u)" != "0" ]; then
    >&2 echo "Needs to be run as root. Try again with sudo"
    exit 1
fi

echo "Checking if acpid is installed"
rc=0
dpkg -l | grep 'acpid' &> /dev/null || rc=$?

if [ ${rc} -eq 1 ]; then
    echo "acpid is not installed, will install now"
    apt-get update &> /dev/null
    apt-get install -y acpid &> /dev/null || rc=$?
fi

echo "Creating Button power configuration file"

if [ -d ${ACPID_CONF_DIR} ]; then
    CURRENT_DIR=/home/kano/kano2-server/tools/power-btn
    cp $CURRENT_DIR/button_power "${ACPID_CONF_DIR}/events"
    cp $CURRENT_DIR/shutdown.sh "${ACPID_CONF_DIR}"
    chmod ug+x "${ACPID_CONF_DIR}/shutdown.sh"
fi

echo "Done"
