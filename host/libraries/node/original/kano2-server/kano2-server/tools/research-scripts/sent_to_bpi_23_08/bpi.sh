#!/bin/bash
DEV=/dev/ttyGS0

stty 4:0:cbd:0:3:1c:7f:8:4:0:1:0:11:13:1a:0:12:f:17:16:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0 -F $DEV


for ((i=0;i<1000000000; i++)) do
   echo $i >$DEV || break
   echo {1,2}{1,2}{1,2}{1,2}{1,2}{1,2}{1,2} >$DEV || break
done  &
WRITER_PID=$!
cat $DEV &
READER_PID=$!

wait


