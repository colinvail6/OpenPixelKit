/* Copyright 2016 Kano Computing Ltd. */
#ifndef STARTUPANIMATIONSLIGHTBOARD_H
#define STARTUPANIMATIONSLIGHTBOARD_H
#include <stdint.h>

class LightboardAnimation {
 public:
    LightboardAnimation();
    ~LightboardAnimation();
    void track();
    bool isDone();

 private:
     inline void frame();
     inline void clearColumn(int colIndex);
     inline void clearRow(int rowIndex);

     const unsigned int pxl_count;
     unsigned long lastFrame;
     int sat;
     float xTween;
     float yTween;
     float satTween;
     float t;
     int brightness;
     int blackout;
     float amp;
     unsigned int sineTimer;
};


#endif  // STARTUPANIMATIONSLIGHTBOARD_H
