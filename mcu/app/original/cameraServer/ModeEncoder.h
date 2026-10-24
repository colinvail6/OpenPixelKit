/* Copyright 2016 Kano Computing Ltd. */
#ifndef MODEENCODER_H
#define MODEENCODER_H

#include "Potentiometer.h"

class ModeEncoder : public Potentiometer {
 private:
    unsigned short int mode;
    unsigned short int fromValueToModeIndex();
    unsigned short int valueToModeIndex(int value, int a[]);
    void sendModeOnSerial();
 public:
    ModeEncoder(int pin, unsigned int samplingFreq, unsigned int oversamplingRatio);
    void getCurrentMode(const char **ptrToMode);
    void onSample();
};
#endif  // MODEENCODER_H
