/* Copyright 2016 Kano Computing Ltd. */
#ifndef STARTUPANIMATIONSLIGHTBOARD_H
#define STARTUPANIMATIONSLIGHTBOARD_H
#include <stdint.h>
#include "deviceBusRPC.h"

class LightboardAnimation {
 public:
    LightboardAnimation();
    ~LightboardAnimation();
    void track();
    bool isDone();
    inline void setBlackoutIncrement(unsigned int incr);

 private:
     inline void frame();
     inline void tune(unsigned long int time);
     inline void clearColumn(int colIndex);
     inline void clearRow(int rowIndex);

     const unsigned int pxl_count;
     unsigned long lastFrame;
     unsigned long firstNote;
     unsigned long nextNoteEvent;
     unsigned int noteNum;
     int sat;
     float xTween;
     float yTween;
     float satTween;
     float t;
     int brightness;
     int blackout;
     unsigned int blackoutIncrement;
     float amp;
     unsigned int sineTimer;
};

extern LightboardAnimation* startAnimation;

void startAnimControl(const rpc_request_t *req);


#endif  // STARTUPANIMATIONSLIGHTBOARD_H
