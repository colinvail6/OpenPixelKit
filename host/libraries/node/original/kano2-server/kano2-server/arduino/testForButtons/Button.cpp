/* Copyright 2016 Kano Computing Ltd. */
#include "Button.h"
#include "Arduino.h"
#include "serialHandling.h"


#define INITIAL_BUTTON_VALUE HIGH
#define DEBOUNCE_PERIOD 250

#define BUTTON_EVENT_FMT(EVT) "{"\
    "\"type\":\"event\","        \
    "\"name\":\"" EVT "\","      \
    "\"detail\":"                \
        "{\"button-id\":\"%s\"}" \
    "}"

Button::Button(int pinBtn, const char *btnId)
    : btnPin(pinBtn),
      previousValue(INITIAL_BUTTON_VALUE) {
    strncpy(buttonId, btnId, sizeof(buttonId));
    buttonId[sizeof(buttonId) - 1] = '\0';
}

void Button::begin() {
    pinMode(btnPin, INPUT_PULLUP);
}

void Button::track() {
    int buttonValue = digitalRead(btnPin);
    unsigned long curTime;

    if (buttonValue != previousValue) {
        curTime = millis();
        if (abs(curTime - lastDownEvent) > DEBOUNCE_PERIOD &&
                buttonValue == LOW) {
            lastDownEvent = curTime;
            keyDownCb();
        }
        if (abs(curTime - lastUpEvent) > DEBOUNCE_PERIOD &&
                buttonValue == HIGH) {
            lastUpEvent = curTime;
            keyUpCb();
        }
        previousValue = buttonValue;
    }
}

void Button::keyDownCb() {
    const char format[] = BUTTON_EVENT_FMT("button-down");
    char buf[80];

    snprintf(buf, sizeof(buf), format, buttonId);
    getSerialInstance()->println(buf);
}

void Button::keyUpCb() {
    const char format[] = BUTTON_EVENT_FMT("button-up");;
    char buf[80];

    snprintf(buf, sizeof(buf), format, buttonId);
    getSerialInstance()->println(buf);
}
