/* Copyright 2016 Kano Computing Ltd. */
#ifndef STATUSLED_H
#define STATUSLED_H

class StatusLed {
 private:
    int ledPin;
    bool currentValue;

 public:
    StatusLed(int ledPin, const char *ledName);
    void begin();
    void turnOn();
    void turnOff();
    bool isOn();
    char ledId[16];
};

#endif  // STATUSLED_H
