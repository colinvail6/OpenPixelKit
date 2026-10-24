/* Copyright 2016 Kano Computing Ltd. */
#include "Potentiometer.h"
#include <math.h>
#include "Arduino.h"

#define MAX_VALUE 1024

Potentiometer::Potentiometer(int pin,
                             unsigned int samplingFreq,
                             unsigned int oversamplingRatio) {
    unsigned int effectiveSampling = samplingFreq * oversamplingRatio;

    this->pinNo = pin;

    if (effectiveSampling >= 1 && effectiveSampling <= 10000) {
        this->samplingFreq = samplingFreq;
        this->oversamplingRatio = oversamplingRatio;
    } else {
        // Some reasonable defaults
        this->samplingFreq = 2;
        this->oversamplingRatio = 4;
        effectiveSampling = this->samplingFreq * this->oversamplingRatio;
    }

    this->lastSampleTimeMs = 0;
    // the following is equivalent to floor(1/effectiveSampling)
    this->samplingPeriodMs = 1000U / effectiveSampling;
    resetOversampling();
}

void Potentiometer::begin() {}

void Potentiometer::resetOversampling() {
    this->oversamplingAcc = 0;
    this->oversamplingIndex = 0;
}

void Potentiometer::track() {
    unsigned long currentTime;
    int sample;

    currentTime = millis();

    if ((currentTime - lastSampleTimeMs) > samplingPeriodMs) {
        sample = analogRead(pinNo);

        oversamplingAcc += sample;
        oversamplingIndex++;

        if (oversamplingIndex == oversamplingRatio) {
            // Values go up to 1020 hence the division by 102
            prevValue = lastValue;
            lastValue = oversamplingAcc / oversamplingRatio * 102 / MAX_VALUE;
            resetOversampling();
            onSample();
        }
        lastSampleTimeMs = currentTime;
    }
}

void Potentiometer::onSample() {}

int Potentiometer::getValue() {
    return this->lastValue;
}
