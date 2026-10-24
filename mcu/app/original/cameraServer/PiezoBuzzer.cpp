/* Copyright 2016 Kano Computing Ltd. */
#include "PiezoBuzzer.h"
#include "Arduino.h"

PiezoBuzzer::PiezoBuzzer(int pin)
    :pinNo(pin) {}

void PiezoBuzzer::begin() {
    pinMode(pinNo, OUTPUT);
}

void PiezoBuzzer::playTone(unsigned int toneFreq) {
    tone(pinNo, toneFreq);
    lastToneStarted = millis();
    playForever = true;
}

void PiezoBuzzer::playTone(unsigned int toneFreq, unsigned int durationMs) {
    tone(pinNo, toneFreq, durationMs);
    lastToneStarted = millis();
    lastToneDuration = durationMs;
    playForever = false;
}

void PiezoBuzzer::stopTone() {
    playForever = false;
    lastToneDuration = 0;
    noTone(pinNo);
}

bool PiezoBuzzer::isPlaying() {
    unsigned long currentTime;

    // Fist check whether we have started a sound playing that plays forever
    if (playForever) {
        return true;
    }

    // Otherwise check whether the duration has expired
    currentTime = millis();
    if (currentTime - lastToneStarted <= lastToneDuration) {
        return true;
    }

    return false;
}
