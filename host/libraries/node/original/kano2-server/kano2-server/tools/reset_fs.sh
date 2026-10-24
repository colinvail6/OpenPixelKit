#!/bin/sash -f
echo "Reset requested: reformatting"     >>/dev/ttyS0 2>&1
umount /mnt                     >>/dev/ttyS0 2>&1
mkfs.ext4 -F -v /dev/mmcblk0p3  >>/dev/ttyS0 2>&1
mount /dev/mmcblk0p1 /mnt       >>/dev/ttyS0 2>&1
rm /mnt/do_reset                >>/dev/ttyS0 2>&1

