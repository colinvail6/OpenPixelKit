# This script reads out various information from the banana pi and prints it out
# in CVS format for filling into a spreadsheet. 
# Where information has to be obtained manially, a placeholder string is inserted.
# Columns are:
#  GPU usage (placeholder)
#  Number of enabled CPUs
#  Average cpu frequency limit (over cores)
#  Maximum cpu frequency limit
#  Average current frequency (over cores)
#  Maximum current frequency 
#  ddr frequency
#  soc temperature
#  memory temperature (placeholder)
#  Current (placeholder)

import psutil, os

cpu = psutil.cpu_percent(interval=1)
def get(fname):
    if os.path.exists(fname):
       return int(open(fname).read().rstrip())
    else:
       return 0

def getc(fname, cpu):
    return get(fname.format(cpu))

temp = get("/sys/class/thermal/thermal_zone1/temp")

mf = [getc("/sys/devices/system/cpu/cpu{}/cpufreq/scaling_max_freq", c) for c in range(4)]
mc = [getc("/sys/devices/system/cpu/cpu{}/cpufreq/scaling_cur_freq", c) for c in range(4)]
on = [getc("/sys/devices/system/cpu/cpu{}/online", c) for c in range(4)]
ddr = get("/sys/devices/platform/sunxi-ddrfreq/devfreq/sunxi-ddrfreq/cur_freq")
count=float(sum(on))
print ", ".join(map(str,[cpu,'"fill in gpu"',sum(on),sum(mf)/count,max(mf), sum(mc)/count,max(mc), ddr, temp, '"fill in mem temp"','"fill in current"']))

