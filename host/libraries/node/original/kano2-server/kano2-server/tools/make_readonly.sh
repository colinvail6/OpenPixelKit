#!/bin/bash
set -e
set -x

# Set up the system for a readonly root partition with deltas going to /writable

# we assume that /init is not present, so we can install a wrapper there
# around /sbin/init


# underlying root partition root will appear as /oldroot
sed -i '/mmcblk0p2/ s: / : /oldroot :' /etc/fstab
# add fstab entry for /writable
echo '/dev/mmcblk0p3 /writable ext4 defaults,noatime,nodiratime,commit=600,errors=remount-ro 0 1' >>/etc/fstab


apt-get -y install sash

mkdir -p /oldroot
mkdir -p /writable
mkdir -p /overlays/merged
cp tools/readonly_boot.sh /sbin/
cp tools/reset_fs.sh /sbin/
ln -s /sbin/readonly_boot.sh /init

