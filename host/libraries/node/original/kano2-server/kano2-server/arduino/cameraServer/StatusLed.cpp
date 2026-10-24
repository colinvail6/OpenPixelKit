/* Copyright 2016 Kano Computing Ltd. */
#include "StatusLed.h"
#include "Arduino.h"

StatusLed::StatusLed(int ledPin, const char *ledName)
    : ledPin(ledPin),
      currentValue(false) {
    strncpy(ledId, ledName, sizeof(ledId));
    ledId[sizeof(ledId) - 1] = '\0';
}

void StatusLed::begin() {
    pinMode(ledPin, OUTPUT);
    digitalWrite(ledPin, LOW);
}

void StatusLed::turnOn() {
    currentValue = true;
    digitalWrite(ledPin, HIGH);
}

void StatusLed::turnOff() {
    currentValue = false;
    digitalWrite(ledPin, LOW);
}

bool StatusLed::isOn() {
    return currentValue;
}
