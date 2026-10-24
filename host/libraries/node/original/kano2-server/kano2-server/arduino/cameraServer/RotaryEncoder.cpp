/* Copyright 2016 Kano Computing Ltd. */
#include "RotaryEncoder.h"
#include "Arduino.h"
#include "serialHandling.h"

#define DEBUG_ROT 0


// Rotation Pulses
#define CCW_ROTATION_A 0x3
#define CCW_ROTATION_B 0x9

#define CW_ROTATION_A 0x9
#define CW_ROTATION_B 0x3

RotaryEncoder::RotaryEncoder(int pinA, int pinB)
    : pinANo(pinA), pinBNo(pinB), pinAStream(0), pinBStream(0) {}

void RotaryEncoder::begin() {
    pinMode(pinANo, INPUT_PULLUP);
    pinMode(pinBNo, INPUT_PULLUP);
}

void RotaryEncoder::track() {
    int n, k;
#if defined (DEBUG_ROT) && DEBUG_ROT == 1
    char buf[16];
#endif
    n = digitalRead(pinANo);
    k = digitalRead(pinBNo);
    if (((pinAStream & 0x1) != n) || ((pinBStream & 0x1) != k)) {
      // Fist make space at the LSB for the latest pulse
      pinAStream = pinAStream << 1;
      pinBStream = pinBStream << 1;

      // Set LSB to the values just read of PinA and PinB
      pinAStream ^= (-n ^ pinAStream) & 1;
      pinBStream ^= (-k ^ pinBStream) & 1;

      if ((pinAStream & 0xf) == CCW_ROTATION_A && ((pinBStream & 0xf) == CCW_ROTATION_B)) {
        onCCW();
        resetStreams();
      }

      if ((pinAStream & 0xf) == CW_ROTATION_A && ((pinBStream & 0xf) == CW_ROTATION_B)) {
        onCW();
        resetStreams();
      }
#if defined (DEBUG_ROT) && DEBUG_ROT == 1
     snprintf(buf, sizeof(buf), "PINA: 0x%02x", pinAStream & 0xf);
     getSerialInstance()->println(buf);
     snprintf(buf, sizeof(buf), "PINB: 0x%02x", pinBStream & 0xf);
     getSerialInstance()->println(buf);
#endif
    }
}

void RotaryEncoder::resetStreams() {
    pinAStream = 0;
    pinBStream = 0;
}
void RotaryEncoder::onCCW() {}

void RotaryEncoder::onCW() {}
