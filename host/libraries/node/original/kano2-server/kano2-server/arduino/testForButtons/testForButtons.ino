#include <Adafruit_GFX.h>
#include <Adafruit_NeoMatrix.h>
#include <gamma.h>

#include <Adafruit_NeoPixel.h>

#include <ArduinoJson.h>

#include "colourHelpers.h"
#include "serialHandling.h"
#include "Button.h"
#include "startupAnimationLightboard.h"

#define CAMERAKIT 0
#define LIGHTBOARD 1

//PIN LOCATIONS

#if CAMERAKIT
 #define LED_RING_DATA 11
 #define LED_STRIP_COUNT 10

 #define DELAY_SHUTTER_BTN  4
 #define DELAY_SHUTTER_PINA 6
 #define DELAY_SHUTTER_PINB 5

 #define FLASH_TOGGLE_PIN 7
#endif

#if LIGHTBOARD
 #define LIGHTBOARD_PIN 11
#endif

#define LED_BASE_BRIGHTNESS 24


// CAMERAKIT GLOBALS
#if CAMERAKIT
Adafruit_NeoPixel strip = Adafruit_NeoPixel(LED_STRIP_COUNT, LED_RING_DATA, NEO_GRB + NEO_KHZ800);
#else
Adafruit_NeoPixel strip;
#endif

// LIGHTBOARD GLOBALS
#if LIGHTBOARD
Adafruit_NeoMatrix stripGrid = Adafruit_NeoMatrix(16, 8, 1, 1, LIGHTBOARD_PIN, NEO_MATRIX_TOP + NEO_MATRIX_LEFT +
    NEO_MATRIX_ROWS + NEO_MATRIX_PROGRESSIVE + NEO_TILE_TOP + NEO_TILE_LEFT + NEO_TILE_ROWS + NEO_TILE_PROGRESSIVE  , NEO_GRB + NEO_KHZ800);


Button buttons[] = {
    Button(2, "btn-2"),
    Button(3, "btn-3"),
    Button(4, "btn-4"),
    Button(5, "btn-5"),
    Button(6, "btn-6"),
    Button(7, "btn-7"),
    Button(8, "btn-8"),
    Button(9, "btn-9"),
    Button(10, "btn-10"),
    Button(12, "btn-12"),
    Button(13, "btn-13"),
    Button(14, "btn-14"),
    Button(15, "btn-15"),
    Button(16, "btn-16"),
    Button(17, "btn-17")
};

const size_t buttonCount = sizeof(buttons) / sizeof(buttons[0]);

LightboardAnimation* startAnimation;
#else
Adafruit_NeoMatrix stripGrid = Adafruit_NeoMatrix(0, 0, 0, 0, 1000, NEO_MATRIX_TOP + NEO_MATRIX_LEFT +
    NEO_MATRIX_ROWS + NEO_MATRIX_PROGRESSIVE + NEO_TILE_TOP + NEO_TILE_LEFT + NEO_TILE_ROWS + NEO_TILE_PROGRESSIVE  , NEO_GRB + NEO_KHZ800);
#endif

inline void commonInit() {
    serialInit();
}

// LIGHTBOARD ONLY
#if LIGHTBOARD
inline void lightboardKitInit() {
    stripGrid.begin();
    stripGrid.setBrightness(LED_BASE_BRIGHTNESS);
    stripGrid.fillScreen(0);
    stripGrid.show();

    for (int i=0; i<buttonCount ; i++) {
        buttons[i].begin();
    }

    startAnimation = new LightboardAnimation();
}
#endif

// CAMERAKIT ONLY
#if CAMERAKIT
inline void cameraKitInit() {
    strip.begin();
    strip.setBrightness(LED_BASE_BRIGHTNESS);
}
#endif

void setup() {
    // put your setup code here, to run once:
    commonInit();
#if CAMERAKIT
    cameraKitInit();
#endif

#if LIGHTBOARD
    lightboardKitInit();
#endif
}

void loop() {
    // put your main code here, to run repeatedly:
#if CAMERAKIT
#endif

#if LIGHTBOARD
    if (startAnimation != NULL) {
        startAnimation->track();
        if (startAnimation->isDone()) {
            delete startAnimation;
            startAnimation = NULL;
        }
    } else {

        for (int i=0; i<buttonCount; i++) {
            buttons[i].track();
        }
    }
#endif

    /*
     * SERIAL COMMS HANDLING
     */
    if (getSerialInstance()->available()) {
      onSerialEvent();
    }
}
