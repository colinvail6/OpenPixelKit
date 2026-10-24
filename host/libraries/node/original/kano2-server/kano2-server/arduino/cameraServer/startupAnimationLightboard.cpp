/* Copyright 2016 Kano Computing Ltd. */
#include <math.h>
#include <stdint.h>

#include <Adafruit_NeoMatrix.h>
#include <ArduinoJson.h>

#include "PiezoBuzzer.h"
#include "colourHelpers.h"
#include "serialHandling.h"
#include "startupAnimationLightboard.h"
#include "parameterFormatHelpers.h"
#include "errors.h"

extern Adafruit_NeoMatrix stripGrid;
extern PiezoBuzzer buzz;

LightboardAnimation* startAnimation;


static int lerpr(float start, float end, float progress) {
    return floorf(start + progress *(end - start));
}

static int wrap(int i, int i_max) {
    int mod_result;
    int x = 0;

    mod_result = i % i_max;

    if (i > -1) {
        return mod_result;
    }

    x = i_max + mod_result;

    if (x == i_max) {
        return 0;
    }
    return x;
}

short int fauxSin[] = {
    -10, -9, -8, -7, -6, -5, -4, -3, -2, -1,
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
    -1, -2, -3, -4, -5, -6, -7, -8, -9
};

typedef struct {
  short unsigned int freq;
  short unsigned int millis;
}note;

static note startup_notes[] = {
{ 0 , 150 },
{ 587.33, 100},
{ 739.99, 100},
{880.00,  100},
{1174.66, 140},
{ 0 , 50 },
  {0,0}, // end sentinel
};

LightboardAnimation::LightboardAnimation()
    : pxl_count(128),
      lastFrame(0UL),
      firstNote(millis()),
      nextNoteEvent(startup_notes[0].millis),
      noteNum(0),
      sat(0),
      xTween(0.0),
      yTween(0.1),
      satTween(0.0),
      t(0.1),
      brightness(50),
      blackout(0),
      blackoutIncrement(0),
      amp(103),
      sineTimer(1) {}

inline void LightboardAnimation::clearColumn(int colIndex) {
    const int max_row = 8;
    stripGrid.drawFastVLine(colIndex, 0, max_row, 0);
}

inline void LightboardAnimation::clearRow(int rowIndex) {
    const int max_col = 16;
    stripGrid.drawFastHLine(0, rowIndex, max_col, 0);
}
inline void LightboardAnimation::tune(unsigned long now) {
    const int maxNotes = sizeof(startup_notes)/sizeof(note)-1;
    if(noteNum>=maxNotes)
        return;
    if(now > nextNoteEvent) {
        noteNum = noteNum + 1;
        nextNoteEvent += startup_notes[noteNum].millis;
        if(startup_notes[noteNum].freq == 0) {
            buzz.stopTone();
        }else{
            buzz.playTone(startup_notes[noteNum].freq);
        }
    }
}

inline void LightboardAnimation::frame() {
    int i, j;
    uint8_t red, green, blue;
    int hue;

    for (i=0; i < 16; i++) {
        for (j=0; j < 8; j++) {
            // The following may be improved with trigonometric identities
            hue = wrap(fauxSin[i]*fauxSin[j] + sineTimer, 360);
            hslToRGB(
                hue / 360.0,
                sat / 100.0,
                (50.0 + random(0, brightness)) * (255.0 - blackout) / 255.0 /100.0,
                &red,
                &green,
                &blue);
            stripGrid.drawPixel(i, j, stripGrid.Color(red, green, blue));
        }
    }

    if (xTween < 0.9) {
        xTween = fmodf(t, 1.0);
    } else if (yTween < 0.9) {
        xTween = 1.0;
        yTween = fmodf(t, 1.0);
    } else if (satTween < 0.9) {
        xTween = 1.0;
        yTween = 1.0;
        satTween = fmodf(t, 1.0);
    } else {
        xTween = 1.0;
        yTween = 1.0;
        satTween = 1.0;
    }
    if (blackout < 255) {
         blackout += blackoutIncrement;
         if (blackout > 255) {
             blackout = 255;
         }

    }

    for (j = 0; j < lerpr(5, -1, yTween); j++) {
        clearRow(j);
    }
    for (j = lerpr(5, 9, yTween); j < 8; j++) {
        clearRow(j);
    }
    for (i = 0; i < lerpr(8, -1, xTween); i++) {
        clearColumn(i);
    }
    for (i = lerpr(9, 18, xTween); i < 16; i++) {
        clearColumn(i);
    }

    sat = lerpr(0.0, 100.0, satTween);
    brightness = lerpr(50.0, 0.0, satTween);

    stripGrid.show();
    t += 0.1;
    sineTimer += 10;
}

bool LightboardAnimation::isDone() {
    return blackout >= 255;
}

void LightboardAnimation::track() {
    unsigned long timeNow;

    if (!isDone()) {
        timeNow = millis();

        tune(millis()-firstNote);

        if (abs(timeNow - lastFrame) > 64) {
            lastFrame = timeNow;
            frame();
        }
    }
}
void LightboardAnimation::setBlackoutIncrement(unsigned int incr) {
    blackoutIncrement = incr;
}

LightboardAnimation::~LightboardAnimation() {}

void startAnimControl(const rpc_request_t *req){
    JsonObject *data;
    data = &(req->params->get<JsonObject&>(0));
    if (startAnimation) {
        if(!key_exists_and_is_uint(req, data, "blackout-incr", getSerialInstance())) {
            return;
        }
        unsigned int incr = (*data)["blackout-incr"].as<unsigned int>();

        startAnimation->setBlackoutIncrement(incr);
        print_success_response(getSerialInstance(), req);
    } else {
        print_success_response(getSerialInstance(), req);
    }
}
