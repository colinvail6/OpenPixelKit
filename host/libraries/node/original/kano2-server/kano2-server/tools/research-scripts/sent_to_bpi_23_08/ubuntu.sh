#!/bin/bash
DEV=/dev/ttyACM0


for ((i=0;i<1000000000; i++)) do
   echo $i >$DEV || break
   echo {3,4}{3,4}{3,4}{3,4}{3,4}{3,4}{3,4} >$DEV || break
done  &
WRITER_PID=$!
cat $DEV &
READER_PID=$!

wait


