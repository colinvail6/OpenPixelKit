#!/bin/bash

readonly TARGETDIR="$(eval echo ~${SUDO_USER})/videoenc"
readonly BASEDIR=$(realpath $(dirname "$0"))
readonly BIN_NAME="videoenc"

# make sure we are running as root
if [ "$(id -u)" != "0" ]; then
    echo "Needs to be run as root. Try again with sudo"
    exit 1
fi

if [ -d "${TARGETDIR}" ]; then
    echo "Dir already exists, skipping installation" 1>&2
    exit 5
fi

echo "Cloning the repository"
git clone --depth 1 https://github.com/rosimildo/videoenc.git "${TARGETDIR}" &> /dev/null

if [ ! -d "${TARGETDIR}" ]; then
    echo "Folder not found failed" 1>&2
    exit 1
fi

# Make sure source is useable for a kano user
chown -R "$(logname):$(logname)" ${TARGETDIR}

pushd ${TARGETDIR} &> /dev/null

echo "Installing binary blobs"
tar xzf blobs/cedarx_blobs.tar.gz -C /

if [ "$?" -ne 0 ]; then
    echo "Could not install binary blobs" 1>&2
    exit 2
fi

# Add blob libaries
echo "Adding cedarx library configuration"
cp ${BASEDIR}/cedarx.conf /etc/ld.so.conf.d/cedarx.conf

ldconfig

if [ "$?" -ne 0 ]; then
    echo "Couldn't configure dynamic linker" 1>&2
    exit 3
fi

echo "Building the app"
make

if [ -e "${BIN_NAME}" ]; then
    cp "${BIN_NAME}" /usr/bin/"${BIN_NAME}"
fi

echo "Adding kano to sudoers"
cp ${BASEDIR}/sudoers-videoenc /etc/sudoers.d/sudoers-videoenc

popd &> /dev/null
