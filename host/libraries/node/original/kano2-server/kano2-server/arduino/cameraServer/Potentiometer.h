/* Copyright 2016 Kano Computing Ltd. */
#ifndef POTENTIOMETER_H
#define POTENTIOMETER_H

class Potentiometer {
 private:
    int pinNo;
    unsigned int samplingFreq;
    unsigned int oversamplingRatio;
    unsigned int oversamplingIndex;
    unsigned int samplingPeriodMs;
    unsigned long lastSampleTimeMs;
    int oversamplingAcc;

 protected:
     void resetOversampling();
     int prevValue, lastValue;

 public:
    Potentiometer(int pin, unsigned int samplingFreq, unsigned int oversamplingRatio);
    virtual void begin();
    virtual void track();
    virtual void onSample();
    int getValue();
};

#endif  // POTENTIOMETER_H
