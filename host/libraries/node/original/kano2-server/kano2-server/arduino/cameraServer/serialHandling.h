/* Copyright 2016 Kano Computing Ltd. */
#ifndef SERIALHANDLING_H
#define SERIALHANDLING_H

#include "Arduino.h"

#ifndef USBSERIAL
#define USBSERIAL 0
#endif

void serialInit();
void onSerialEvent();
void serialResetCheck();
BaseSerial* getSerialInstance();

typedef struct{
  uint16_t before;
  uint16_t after;
  uint16_t total;
  bool seenNonPad;
}SerialPadCount;

extern SerialPadCount serialPadCount;


#endif  // SERIALHANDLING_H
