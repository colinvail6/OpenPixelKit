// Copyright 2016 Kano Computing Ltd.
#include "DelayShutterButton.h"
#include "Arduino.h"
#include "serialHandling.h"

DelayShutterButton::DelayShutterButton(int pinBtn, int pinEncA, int pinEncB)
    : RotaryEncoder(pinEncA, pinEncB),
      Button(pinBtn, "shutter-button") {}

void DelayShutterButton::begin() {
    RotaryEncoder::begin();
    Button::begin();
}

void DelayShutterButton::onCCW() {
    getSerialInstance()->println(F("{\"cmd\":\"timer-changed\",\"data\":{\"direction\":\"ccw\"}}"));
}

void DelayShutterButton::onCW() {
    getSerialInstance()->println(F("{\"cmd\":\"timer-changed\",\"data\":{\"direction\":\"cw\"}}"));
}

void DelayShutterButton::track() {
    RotaryEncoder::track();
    Button::track();
}
