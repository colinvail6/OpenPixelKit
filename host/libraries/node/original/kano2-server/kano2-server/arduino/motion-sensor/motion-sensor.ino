/****************************************************************
GestureTest.ino
APDS-9960 RGB and Gesture Sensor
Shawn Hymel @ SparkFun Electronics
May 30, 2014
https://github.com/sparkfun/APDS-9960_RGB_and_Gesture_Sensor

Tests the gesture sensing abilities of the APDS-9960. Configures
APDS-9960 over I2C and waits for gesture events. Calculates the
direction of the swipe (up, down, left, right) and displays it
on a serial console.

To perform a NEAR gesture, hold your hand
far above the sensor and move it close to the sensor (within 2
inches). Hold your hand there for at least 1 second and move it
away.

To perform a FAR gesture, hold your hand within 2 inches of the
sensor for at least 1 second and then move it above (out of
range) of the sensor.

Hardware Connections:

IMPORTANT: The APDS-9960 can only accept 3.3V!

 Arduino Pin  APDS-9960 Board  Function

 3.3V         VCC              Power
 GND          GND              Ground
 A4           SDA              I2C Data
 A5           SCL              I2C Clock
 2            INT              Interrupt

Resources:
Include Wire.h and SparkFun_APDS-9960.h

Development environment specifics:
Written in Arduino 1.0.5
Tested with SparkFun Arduino Pro Mini 3.3V

This code is beerware; if you see me (or any other SparkFun
employee) at the local, and you've found our code helpful, please
buy us a round!

Distributed as-is; no warranty is given.
****************************************************************/

#include <Wire.h>
#include <SparkFun_APDS9960.h>

#include "errors.h"
#include "serialHandling.h"

// Pins
#define APDS9960_INT    2 // Needs to be an interrupt pin

// Macros
#define GESTURE_EVENT(G) ("{\"type\": \"event\", \"name\": \"gesture\", \"detail\": {\"type\": \"" G "\"}}")

bool proximity_enabled = true;
bool pause_loop = false;

SparkFun_APDS9960 apds = SparkFun_APDS9960();

// Global Gesture Variables
int isr_flag = 0;

// Global Proximity Variables
uint8_t proximity_data = 255;
uint8_t last_value = 255;

bool initError = false;
Serial_ *serialHandle = &Serial;

unsigned int samplingIntervalMs = 50;

unsigned long lastSampleTimestamp = 0;

void setup_gesture() {
    pause_loop = true;
    // Set interrupt pin as input
    pinMode(APDS9960_INT, INPUT);

    // Initialize interrupt service routine
    attachInterrupt(APDS9960_INT, interruptRoutine, FALLING);

    // Initialize APDS-9960 (configure I2C and initial values)
    if ( !apds.init() ) {
        // Add a wee bit of delay here to ensure the serial is up before adding
        // spewing characters into it
        delay(100);
        print_error_event(serialHandle, "Failed to initialise device");
        initError = true;
    }

    // Start running the APDS-9960 gesture sensor engine
    if ( !apds.enableGestureSensor(true) ) {
        // Add a wee bit of delay here to ensure the serial is up before adding
        // spewing characters into it
        delay(100);
        print_error_event(serialHandle, "Failed to start the sensor");
        initError = true;
    }
    proximity_enabled = false;
    pause_loop = false;
}

void setup_proximity() {
    pause_loop = true;
    // Initialize APDS-9960 (configure I2C and initial values)
    if ( !apds.init() ) {
        // Add a wee bit of delay here to ensure the serial is up before adding
        // spewing characters into it
        delay(100);
        print_error_event(serialHandle, "Failed to initialise device");
        initError = true;
    }

    // Adjust the Proximity sensor gain
    if ( !apds.setProximityGain(PGAIN_2X) ) {
        // Add a wee bit of delay here to ensure the serial is up before
        // spewing characters into it
        delay(100);
        print_error_event(serialHandle, "Failed to setup the sensor");
        initError = true;
    }

    // Start running the APDS-9960 proximity sensor (no interrupts)
    if (!apds.enableProximitySensor(false)) {
        // Add a wee bit of delay here to ensure the serial is up before
        // spewing characters into it
        delay(100);
        print_error_event(serialHandle, "Failed to start the prox sensor");
        initError = true;
    }
    proximity_enabled = true;
    pause_loop = false;
}

void setup() {
    serialInit();

    if (proximity_enabled) {
        setup_proximity();
    } else {
        setup_gesture();
    }
}

void interruptRoutine() {
  isr_flag = 1;
}

void handleGesture() {
    if ( apds.isGestureAvailable() ) {
        // The current directions seem to be inverted.
        // TODO: Double check with the final hardware.
        switch ( apds.readGesture() ) {
            case DIR_UP:
                Serial.println(GESTURE_EVENT("down"));
                break;
            case DIR_DOWN:
                Serial.println(GESTURE_EVENT("up"));
                break;
            case DIR_LEFT:
                Serial.println(GESTURE_EVENT("right"));
                break;
            case DIR_RIGHT:
                Serial.println(GESTURE_EVENT("left"));
                break;
        }
    }
}

void loop_proximity() {
    unsigned long nowTimeStamp = 0;
    last_value = proximity_data;

    nowTimeStamp = millis();

    if (labs(nowTimeStamp - lastSampleTimestamp) > samplingIntervalMs) {
        lastSampleTimestamp = nowTimeStamp;

        // Read the proximity value
        if ( !apds.readProximity(proximity_data) ) {
            print_error_event(serialHandle, "Unable to proximity read data");
        } else {
            if (last_value != proximity_data) {
                Serial.print("{\"type\": \"event\", \"name\": \"proximity-data\", \"detail\": {\"proximity\": ");
                Serial.print(proximity_data);
                Serial.println("}}");
            }
        }
    }
}

void loop_gesture() {
    if( isr_flag == 1 ) {
        detachInterrupt(APDS9960_INT);
        handleGesture();
        isr_flag = 0;
        attachInterrupt(APDS9960_INT, interruptRoutine, FALLING);
    }
}

void loop() {
    if (pause_loop) {
        return;
    }
    if (proximity_enabled) {
        loop_proximity();
    } else {
        loop_gesture();
    }

    if (Serial.available()) {
        onSerialEvent();
    }
}
