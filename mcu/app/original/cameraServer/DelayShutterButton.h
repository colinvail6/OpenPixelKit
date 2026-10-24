/* Copyright 2016 Kano Computing Ltd. */
#ifndef DELAYSHUTTERBUTTON_H
#define DELAYSHUTTERBUTTON_H

#include "RotaryEncoder.h"
#include "Button.h"

class DelayShutterButton : public RotaryEncoder, public Button {
 public:
    DelayShutterButton(int pinBtn, int pinEncA, int pinEncB);
    void begin();
    void onCCW();
    void onCW();
    void track();
};

#endif  // DELAYSHUTTERBUTTON_H
