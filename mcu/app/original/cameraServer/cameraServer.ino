#include <Adafruit_GFX.h>
#include <Adafruit_NeoMatrix.h>
#include <gamma.h>
#include <new>
#include <Adafruit_NeoPixel.h>

#include <ArduinoJson.h>

#include "colourHelpers.h"
#include "serialHandling.h"
#include "Button.h"
#include "ModeRotaryEncoder.h"
#include "ModeEncoder.h"
#include "DelayShutterButton.h"
#include "FiveWayJoystick.h"
#include "StatusLed.h"
#include "PiezoBuzzer.h"
#include "startupAnimationLightboard.h"

#define CAMERAKIT 0
#define LIGHTBOARD 1

//PIN LOCATIONS
static const unsigned int batt_led_pin = 9;
static const unsigned int piezoBuzzer_pin = 8;

#if defined(__SAMD21G18A__)
#define MODE_POTENTIOMETER_PIN A3
#elif defined(__SAMD21E16A__)
#define MODE_POTENTIOMETER_PIN A0
#endif


#if CAMERAKIT
 #define LED_RING_DATA 11
 #define LED_STRIP_COUNT 10

 #define DELAY_SHUTTER_BTN  4
 #define DELAY_SHUTTER_PINA 6
 #define DELAY_SHUTTER_PINB 5

 #define FLASH_TOGGLE_PIN 7
#endif

#if LIGHTBOARD
static const unsigned int button_a_pin = 3;
static const unsigned int button_b_pin = 4;
#if defined(__SAMD21G18A__)
static const unsigned int button_reset_pin = 13;
#elif defined(__SAMD21E16A__)
static const unsigned int button_reset_pin = 17;
#endif

static const unsigned int lightboard_data_pin = 11;

// Joystick pin definitions
#if defined(__SAMD21G18A__)
static const unsigned int joystick_up_pin = 4;
static const unsigned int joystick_down_pin = 5;
static const unsigned int joystick_left_pin = 6;
static const unsigned int joystick_right_pin = 7;
static const unsigned int joystick_click_pin = 8;
#elif defined(__SAMD21E16A__)
static const unsigned int joystick_up_pin = 13;
static const unsigned int joystick_down_pin = 10;
static const unsigned int joystick_left_pin = 15;
static const unsigned int joystick_right_pin = 12;
static const unsigned int joystick_click_pin = 16;
#endif
#endif

#define LED_BASE_BRIGHTNESS 24


// COMMON GLOBALS
StatusLed battLed = StatusLed(batt_led_pin, "batt");
PiezoBuzzer buzz = PiezoBuzzer(piezoBuzzer_pin);
ModeEncoder pote = ModeEncoder(MODE_POTENTIOMETER_PIN,
                               1,  /* Sampling freq in HZ */
                               8  /* Oversampling ratio for reducing noise */);


// CAMERAKIT GLOBALS
#if CAMERAKIT
Adafruit_NeoPixel strip = Adafruit_NeoPixel(LED_STRIP_COUNT, LED_RING_DATA, NEO_GRB + NEO_KHZ800);
DelayShutterButton shutterEncoder = DelayShutterButton(DELAY_SHUTTER_BTN, DELAY_SHUTTER_PINA, DELAY_SHUTTER_PINB);
Button flashToggle = Button(FLASH_TOGGLE_PIN, "flash-toggle");
#else
Adafruit_NeoPixel strip;
#endif

// LIGHTBOARD GLOBALS
#if LIGHTBOARD
Adafruit_NeoMatrix stripGrid = Adafruit_NeoMatrix(16, 8, 1, 1, lightboard_data_pin, NEO_MATRIX_TOP + NEO_MATRIX_LEFT +
    NEO_MATRIX_ROWS + NEO_MATRIX_PROGRESSIVE + NEO_TILE_TOP + NEO_TILE_LEFT + NEO_TILE_ROWS + NEO_TILE_PROGRESSIVE  , NEO_GRB + NEO_KHZ800);
FiveWayJoystick stick = FiveWayJoystick(joystick_up_pin, joystick_down_pin, joystick_left_pin, joystick_right_pin, joystick_click_pin);
Button buttonA = Button(button_a_pin, "btn-A");
Button buttonB = Button(button_b_pin, "btn-B");
Button buttonReset = Button(button_reset_pin, "btn-reset");

#else
Adafruit_NeoMatrix stripGrid = Adafruit_NeoMatrix(0, 0, 0, 0, 1000, NEO_MATRIX_TOP + NEO_MATRIX_LEFT +
    NEO_MATRIX_ROWS + NEO_MATRIX_PROGRESSIVE + NEO_TILE_TOP + NEO_TILE_LEFT + NEO_TILE_ROWS + NEO_TILE_PROGRESSIVE  , NEO_GRB + NEO_KHZ800);
#endif

static char lightboardAnimMem[sizeof(LightboardAnimation)];

inline void commonInit() {
    serialInit();
    battLed.begin();
    buzz.begin();
    pote.begin();
}

// LIGHTBOARD ONLY
#if LIGHTBOARD
inline void lightboardKitInit() {
    stripGrid.begin();
    stripGrid.setBrightness(LED_BASE_BRIGHTNESS);
    stripGrid.fillScreen(0);
    stripGrid.show();

    buttonA.begin();
    buttonB.begin();
    buttonReset.begin();
    stick.begin();

    startAnimation = new((void *)lightboardAnimMem) LightboardAnimation();

}
#endif

// CAMERAKIT ONLY
#if CAMERAKIT
inline void cameraKitInit() {
    strip.begin();
    strip.setBrightness(LED_BASE_BRIGHTNESS);
    shutterEncoder.begin();
    flashToggle.begin();
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
    pote.track();
#if CAMERAKIT
    shutterEncoder.track();
    flashToggle.track();
#endif

#if LIGHTBOARD
    if (startAnimation != NULL) {
        startAnimation->track();
        if (startAnimation->isDone()) {
            // Can't delete as we are doing placement new, but the destructor doesn't do anything anyway 
            //delete startAnimation;
            startAnimation = NULL;
        }
    } else {
        stick.track();
        buttonA.track();
        buttonB.track();
        buttonReset.track();
    }
#endif

    /*
     * SERIAL COMMS HANDLING
     */
    if (getSerialInstance()->available()) {
      onSerialEvent();
    }

    serialResetCheck();

}
