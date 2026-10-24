/****************************************************************
ProximityTest.ino
APDS-9960 RGB and Gesture Sensor
Shawn Hymel @ SparkFun Electronics
October 28, 2014
https://github.com/sparkfun/APDS-9960_RGB_and_Gesture_Sensor

Tests the proximity sensing abilities of the APDS-9960.
Configures the APDS-9960 over I2C and polls for the distance to
the object nearest the sensor.

Hardware Connections:

IMPORTANT: The APDS-9960 can only accept 3.3V!

Arduino Pin  APDS-9960 Board  Function

3.3V         VCC              Power
GND          GND              Ground
A4           SDA              I2C Data
A5           SCL              I2C Clock

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
#include <math.h>
#include <Arduino.h>
#include <SparkFun_APDS9960.h>

#include "errors.h"
#include "serialHandling.h"

// Global Variables
SparkFun_APDS9960 apds = SparkFun_APDS9960();
uint8_t proximity_data = 255;
uint8_t last_value = 255;

bool initError = false;
Serial_ *serialHandle = &Serial;

unsigned int samplingPeriodMs = 100;

unsigned long lastSampleTimestamp = 0;


void setup() {
    // Initialize Serial port
    serialInit();

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

    // Start running the APDS-9960 proximity sensor (no interrupts)
    if (!apds.enableLightSensor(true)) {
        // Add a wee bit of delay here to ensure the serial is up before
        // spewing characters into it
        delay(100);
        print_error_event(serialHandle, "Failed to start the Light sensor");
        initError = true;
    }
}

void loop() {
    unsigned long nowTimeStamp = 0;
    last_value = proximity_data;

    nowTimeStamp = millis();

    if (labs(nowTimeStamp - lastSampleTimestamp) > samplingPeriodMs) {
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

    if (Serial.available()) {
        onSerialEvent();
    }
}
