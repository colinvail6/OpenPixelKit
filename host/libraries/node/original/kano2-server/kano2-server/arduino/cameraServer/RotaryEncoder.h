/* Copyright 2016 Kano Computing Ltd. */
#ifndef ROTARYENCODER_H
#define ROTARYENCODER_H

#define DEBUG_ROT 0
class RotaryEncoder {
 private:
    int pinANo;
    int pinBNo;
    int pinAStream;
    int pinBStream;
    static const int ccwRotationA = 0x3;
    static const int ccwRotationB = 0x9;

    static const int cwRotationA  = 0x9;
    static const int cwRotationB = 0x3;

 public:
    RotaryEncoder(int pinA, int pinB);
    virtual void begin();
    virtual void track();
    void resetStreams();
    virtual void onCCW();
    virtual void onCW();
};

#endif  // ROTARYENCODER_H
