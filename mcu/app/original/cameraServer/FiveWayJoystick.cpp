// Copyright 2016 Kano Computing Ltd.
#include "FiveWayJoystick.h"
#include "Button.h"

FiveWayJoystick::FiveWayJoystick(int pinUp, int pinDown, int pinLeft, int pinRight, int pinCentre)
    : btnUp(Button(pinUp, "js-up")),
      btnDown(Button(pinDown, "js-down")),
      btnLeft(Button(pinLeft, "js-left")),
      btnRight(Button(pinRight, "js-right")),
      btnCentre(Button(pinCentre, "js-click")) {}

void FiveWayJoystick::begin() {
    btnUp.begin();
    btnDown.begin();
    btnLeft.begin();
    btnRight.begin();
    btnCentre.begin();
}

void FiveWayJoystick::track() {
    btnUp.track();
    btnDown.track();
    btnLeft.track();
    btnRight.track();
    btnCentre.track();
}
