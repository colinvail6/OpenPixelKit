#!/bin/sash -f

# for some reason stdout and stderr are not attached to
# the console, and sash doesn't support reopening or
# subshells, so we have this horrible redirection on every line

echo "Starting readonly_boot.sh"  >>/dev/ttyS0 2>&1

# check if we need to reset
mount /dev/mmcblk0p1 /mnt -o ro   >>/dev/ttyS0 2>&1
ls /mnt                           >>/dev/ttyS0 2>&1
# sorry, sash doesn't do multiline if
[ -f /mnt/do_reset ] && echo "resetting "      >>/dev/ttyS0 2>&1
[ -f /mnt/do_reset ] && /sbin/reset_fs.sh

umount /mnt                       >>/dev/ttyS0 2>&1

mount /writable
mount -t aufs -o br=/writable=rw:/=rr,noplink none /overlays/merged
cd /overlays/merged
pivot_root . oldroot
mount --move {/oldroot/,}/dev
mount --move {/oldroot/,}/proc
mount --move {/oldroot/,}/sys
-chroot .
exec /sbin/init
