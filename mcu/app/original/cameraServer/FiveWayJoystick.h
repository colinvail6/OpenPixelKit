/* Copyright 2016 Kano Computing Ltd. */
#ifndef FIVEWAYJOYSTICK_H
#define FIVEWAYJOYSTICK_H

#include "Button.h"


class FiveWayJoystick {
 private:
    Button btnUp;
    Button btnDown;
    Button btnLeft;
    Button btnRight;
    Button btnCentre;


 public:
    FiveWayJoystick(int pinUp, int pinDown, int pinLeft, int pinRight, int pinCentre);
    virtual void begin();
    virtual void track();
};

#endif  // FIVEWAYJOYSTICK_H
