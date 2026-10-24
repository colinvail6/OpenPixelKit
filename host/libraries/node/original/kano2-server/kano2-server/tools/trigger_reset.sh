#!/bin/bash

# Write a sentinel file, which should cause the system to reset, and reboot.
sudo mount /dev/mmcblk0p1 /mnt
sudo touch /mnt/do_reset
sudo umount /mnt
sudo reboot
