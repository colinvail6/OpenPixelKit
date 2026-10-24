/* Copyright 2016 Kano Computing Ltd. */
#include "ModeRotaryEncoder.h"
#include "utils.h"
#include "Arduino.h"
#include "serialHandling.h"

#define INITIAL_MODE 0

#define MODE_EVENT_FMT(EVT) "{"\
    "\"type\":\"event\","        \
    "\"name\":\"" EVT "\","      \
    "\"detail\":"                \
        "{\"mode\":\"%s\"}" \
    "}"

static const char* modes[] = {
    "offline-1",
    "offline-2",
    "online-p1",
    "online-p2",
    "online-p3"
};


ModeRotaryEncoder::ModeRotaryEncoder(int pinA, int pinB)
    : RotaryEncoder(pinA, pinB), mode(INITIAL_MODE) {}

void ModeRotaryEncoder::onCCW() {
    nextMode();
    sendModeOnSerial();
}

void ModeRotaryEncoder::onCW() {
    prevMode();
    sendModeOnSerial();
}

void ModeRotaryEncoder::nextMode() {
    mode = (mode + 1) % COUNT_OF(modes);
}

void ModeRotaryEncoder::prevMode() {
    mode = mode == 0 ? COUNT_OF(modes) - 1 : mode - 1;
}

void ModeRotaryEncoder::sendModeOnSerial() {
    char buf[85];
    snprintf(buf, sizeof(buf), MODE_EVENT_FMT("mode-change"), modes[mode]);
    getSerialInstance()->println(buf);
}
