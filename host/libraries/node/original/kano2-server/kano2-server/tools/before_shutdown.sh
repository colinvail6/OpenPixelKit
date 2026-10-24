sudo umount / || rc=$?
if [ $rc -ne 0 ]; then
    echoerr "unmount failed with code $rc"
    exit 2
fi
sudo fsck -p
