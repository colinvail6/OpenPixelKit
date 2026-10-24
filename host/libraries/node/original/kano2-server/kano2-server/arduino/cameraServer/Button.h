/* Copyright 2016 Kano Computing Ltd. */
#ifndef GENERICKANOBUTTON_H
#define GENERICKANOBUTTON_H


class Button {
 private:
    int btnPin;
    int previousValue;
    unsigned long lastDownEvent;
    unsigned long lastUpEvent;

 protected:
    char buttonId[16];

 public:
    Button(int pinBtn, const char *btnId);
    virtual void begin();
    virtual void track();
    virtual void keyDownCb();
    virtual void keyUpCb();
};

#endif  // GENERICKANOBUTTON_H
