# This script is to test the serial over USB OTG.
# To run, first do, as root:
#  modprobe g_serial
#  echo -n 2 > /sys/bus/platform/devices/sunxi_usb_udc/otg_role
# 
# On the other side you can run dd if=/dev/ttyACM0 of=/dev/ttyACM0 bs=1
#  For any block size.
#  The device name must be chaneged for a different OS.



try:
  import serial
except:
  print "you need to run 'sudo apt-get -y install python-serial' before you can use this"
  exit(1)

import random

NUMTESTS = 5000

MAXLEN = 1000


port = serial.Serial('/dev/ttyGS0', 115200)

import tty
tty.setcbreak(port.fd)



for i in xrange(NUMTESTS):
   print "test", i
   out1 = str(i) + '\n'
   port.write(out1)
   num = random.randint(10, MAXLEN)
   
   out2 = '01'*num
   
   port.write(out2)

   checkdata = out1 + out2

   res = port.read(len(checkdata))

   if res != checkdata:
     print "ERROR", checkdata, res
