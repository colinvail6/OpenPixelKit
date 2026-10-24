# This script loops back data from the serial port
# It expects to be run on linux; to run on OSX edit
# the device name.
# It also assumes pyserial is installed either via pip or
# debian.

import serial
import tty

port = serial.Serial('/dev/ttyACM0',timeout=0.1)
tty.setraw(port.fd)

while True:
   d=port.read(10240)
   if len(d):
     print 'xxx',d
   port.write(d)
port.close()

