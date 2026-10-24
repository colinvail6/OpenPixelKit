#!/usr/bin/env python
# This script is to test the serial over USB OTG.
# To run, first do, as root:
#  modprobe g_serial
#  echo -n 2 > /sys/bus/platform/devices/sunxi_usb_udc/otg_role
# 
# On the other side you can run dd if=/dev/ttyACM0 of=/dev/ttyACM0 bs=1
#  For any block size.
#  The device name must be chaneged for a different OS.

"""
Usage: serial_test.py [options] write <device>
       serial_test.py [options] read <device>

Options: 
  --max=<n> [default: 1000]
  --num=<k> [default: 5000]

"""

try:
  import serial
except:
  print "you need to run 'sudo apt-get -y install python-serial' before you can use this"
  exit(1)

import random
import tty
import sys
import docopt

args = docopt.docopt(__doc__)

def getarg(args, val, default):
   v = args.get(val, default)
   if v is None:
      return default
   else:
      return v

NUMTESTS = int(getarg(args, '--num', 5000))
MAXLEN = int(getarg(args, '--max', 1000))



port = serial.Serial(args['<device>'], 115200)

tty.setcbreak(port.fd)

def sdata(seed):
  r=random.Random(int(seed))
  num = r.randint(10, MAXLEN)
  print seed, num
  return '01'*num + 'k' 

def writeData(port, seed):
  port.write(' '+ ('%08d' % seed))
  print seed
  out2 = sdata(seed)
  port.write(out2)

def readData(port):
  sep = ''
  while sep != ' ':
    sep = port.read(1)
  seed = int(port.read(8))
  expected = sdata(seed)
  got = port.read(len(expected))
  if got != expected:
    print 'ERROR'
    print 'expected: ', expected
    print 'got     : ', got
    return False
  return True

  

for i in xrange(NUMTESTS):

   if args['read']:
      print "read", i
      readData(port)
   else:
      print "write", i
      writeData(port, i)

