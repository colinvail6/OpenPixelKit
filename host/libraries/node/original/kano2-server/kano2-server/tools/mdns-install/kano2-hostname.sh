#!/bin/bash
set -e

function echoerr()
{
    echo "$@" 1>&2
}

function random_str()
{
    local char_count=$((($1+1)/3*4))
    echo "$(dd if=/dev/urandom bs=$char_count count=1 2>/dev/null | base64 | head -c $1)"
}

if [ "$(id -u)" != "0" ]; then
    echoerr "Needs to be run as root. Try again with sudo"
    exit 1
fi

echo "Current hostname: $(hostname)"

rc=0
echo "$(hostname)" | grep -e '^kano-lightboard-.*$' -q || rc=$?

if [ $rc -eq 1 ]; then
    new_hostname="kano-lightboard-$(random_str 20)"
    echo "Will change hostname to $new_hostname"
    hostnamectl set-hostname "$new_hostname"
fi

exit 0
