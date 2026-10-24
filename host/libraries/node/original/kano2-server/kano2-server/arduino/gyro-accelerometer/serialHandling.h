/* Copyright 2016 Kano Computing Ltd. */
#ifndef SERIALHANDLING_H
#define SERIALHANDLING_H

#include "Arduino.h"

#define USBSERIAL 1

#if USBSERIAL
typedef Serial_ kanoSerial;
#else
typedef Uart kanoSerial;
#endif

void serialInit();
void onSerialEvent();
kanoSerial* getSerialInstance();

#endif  // SERIALHANDLING_H
