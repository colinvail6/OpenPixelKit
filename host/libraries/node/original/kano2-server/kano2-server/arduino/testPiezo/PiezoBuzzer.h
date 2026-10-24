/* Copyright 2016 Kano Computing Ltd. */
#ifndef PIEZOBUZZER_H
#define PIEZOBUZZER_H

class PiezoBuzzer {
 private:
    int pinNo;
    unsigned long lastToneStarted;
    unsigned int lastToneDuration;
    bool playForever;
 public:
    PiezoBuzzer(int pin);
    void begin();
    void playTone(unsigned int toneFreq);
    void playTone(unsigned int toneFreq, unsigned int durationMs);
    void stopTone();
    bool isPlaying();
};

#endif  // PIEZOBUZZER_H
