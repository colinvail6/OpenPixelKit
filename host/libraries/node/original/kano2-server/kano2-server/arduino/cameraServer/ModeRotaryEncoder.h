/* Copyright 2016 Kano Computing Ltd. */
#ifndef MODEROTARYENCODER_H
#define MODEROTARYENCODER_H

#include "RotaryEncoder.h"


class ModeRotaryEncoder : public RotaryEncoder {
 private:
    unsigned short int mode;
    void nextMode();
    void prevMode();
    void sendModeOnSerial();
 public:
    ModeRotaryEncoder(int pinA, int pinB);
    void onCCW();
    void onCW();
};

#endif  // MODEROTARYENCODER_H
