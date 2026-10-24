#!/usr/bin/env python
"""
usage:
   release_firmware [--keeptemp] <product> <image>
"""


import json
import docopt
import subprocess
import os
import datetime
import sys

ARDUINO_BIN = '/Applications/Arduino.app/Contents/MacOS/Arduino'
TOOL_PATH = '~/Library/Arduino15/packages/arduino/tools/arm-none-eabi-gcc/4.8.3-2014q1/bin/'
RELEASE_CONF = 'release_conf.json'
MERGE_CMD = '/usr/local/bin/hexmerge.py'
BOOTLOADER = 'samd21_sam_ba_both_interfaces.hex'


config = json.loads(open(RELEASE_CONF).read())
opts = docopt.docopt(__doc__)

def runcmd(cmd, *args, **kwargs):
    print "Running: ",cmd
    try:
        subprocess.check_call(cmd, *args, **kwargs)
    except:
        print >>sys.stderr, "Failed: ",cmd
        raise



class Release:
    def __init__(self, product, image, conf):
        self.product = product
        self.image = image
        self.conf = conf
        self.relname = self.release_name()
        with open("release_name","w") as f:
           print >>f, self.relname
        self.relpath = os.path.join(os.getcwd(), "release",self.relname)
        self.log_path = os.path.join(self.relpath, 'build.log')


    def get_arduino_command(self):
        cmd = "{bin} --board {board} --verify --verbose-build --preserve-temp-files {inofile} 2>&1 |tee -a {logfile}".format(
            bin=ARDUINO_BIN,
            board=self.conf['board'],
            inofile=self.conf['inofile'],
            logfile=self.log_path
            )
        return cmd

    def release_name(self):
        return "{product}_{image}_{version}_{date}".format(
            product=self.product,
            image=self.image,
            version=self.conf['version'],
            date=datetime.date.strftime(datetime.datetime.now(), "%d%m%y-%H%M%S")
        )

    def get_bin_path(self):
        # no obvious way of getting binary path, extract it from the log
        logfile = open(self.log_path).readlines()
        bin_name = self.conf['inofile']+'.bin'
        copy_line = [line for line in logfile if bin_name in line][0]
        bin_path = copy_line.split()[-1].strip('"')
        return os.path.dirname(bin_path)

    def make_hex(self):
        elffile = os.path.join(self.relpath, self.conf['inofile']+'.elf')
        hexfile = os.path.join(self.relpath, self.conf['inofile']+'.hex')
        outputfile = os.path.join(self.relpath, self.conf['inofile']+'_bootloader.hex')
        cmd = '{tool_path}/arm-none-eabi-objcopy -I elf32-littlearm -O ihex "{sourceelf}" "{sourcehex}"'.format(
            tool_path=TOOL_PATH,
            sourceelf=elffile,
            sourcehex=hexfile
            )
        runcmd(cmd, shell=True)

        mergecmd = 'python {merge} "{bootloader}" "{sourcehex}:0x200:0x10000" -o {output}'.format(
            merge=MERGE_CMD,
            bootloader=os.path.join("..", "bootloader", BOOTLOADER),
            sourcehex=hexfile,
            output=outputfile
            )
        runcmd(mergecmd, shell=True)

    def build(self, keeptemp):
        name = self.relpath
        runcmd("mkdir -p release", shell=True)
        os.chdir(self.conf['sourcedir'])
        # make build dir
        runcmd("rm -rf {}".format(name), shell=True)
        runcmd("mkdir -p {}".format(name), shell=True)

        # do the build
        runcmd("git describe --always |tr '/' '_' >{}".format(self.log_path), shell=True)
        runcmd(self.get_arduino_command(), shell=True)

        # copy files to the release dir
        runcmd("cp -r {build_dir}/*.{{elf,json,map}} {release_dir}".format(
            build_dir=self.get_bin_path(),
            release_dir=name
            ),
            shell=True
        )

        # make the hex file
        self.make_hex()

        # compress
        os.chdir('../release')
        runcmd("zip -r {name}.zip {name}".format(name=self.relname), shell=True)
        runcmd("md5 {name}.zip >{name}.md5".format(name=self.relname), shell=True)
        if not keeptemp:
            runcmd("rm  -rf {name}".format(name=self.relname), shell=True)

product = opts['<product>']
image = opts['<image>']
release = Release(product,
                  image,
                  config[product][image])

release.build(opts['--keeptemp'])
