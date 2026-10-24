/* Copyright 2016 Kano Computing Ltd. */
#include "ModeEncoder.h"
#include <math.h>
#include "utils.h"
#include "Arduino.h"
#include "serialHandling.h"
#include "limits.h"

#define INITIAL_MODE 0
#define MAX_POTENTIOMETER_VALUE 100

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

int left_border[] = {12, 41, 73, 94, INT_MAX};
int right_border[] = {17, 49, 78, 95, INT_MAX};

ModeEncoder::ModeEncoder(int pin,
                         unsigned int samplingFreq,
                         unsigned int oversamplingRatio)
    : Potentiometer(pin, samplingFreq, oversamplingRatio), mode(INITIAL_MODE) {}

void ModeEncoder::getCurrentMode(const char **ptrToMode) {
    if (ptrToMode == NULL) {
        return;
    }

    *ptrToMode = modes[this->mode];
}

unsigned short int ModeEncoder::valueToModeIndex(int value, int a[]) {
    unsigned short int i = 0;
    while (value > a[i]) {
        i++;
    }
    return i;
}

unsigned short int ModeEncoder::fromValueToModeIndex() {
    if (prevValue == lastValue) {
        // Avoid recalculating the mode if the values don't change.
        return mode;
    }

    if (prevValue < lastValue) {
        return valueToModeIndex(lastValue, right_border);
    } else {
        return valueToModeIndex(lastValue, left_border);
    }
}

void ModeEncoder::sendModeOnSerial() {
    char buf[85];
    snprintf(buf, sizeof(buf), MODE_EVENT_FMT("mode-change"), modes[mode]);
    getSerialInstance()->println(buf);
}


void ModeEncoder::onSample() {
    unsigned short int newMode;

    newMode = fromValueToModeIndex();
    if (mode != newMode) {
        mode = newMode;
        sendModeOnSerial();
    }
}
