/******************************************************************************
  MinimalistExample.ino

  Marshall Taylor @ SparkFun Electronics
  May 20, 2015
https://github.com/sparkfun/LSM6DS3_Breakout
https://github.com/sparkfun/SparkFun_LSM6DS3_Arduino_Library

Description:
Most basic example of use.

Example using the LSM6DS3 with basic settings.  This sketch collects Gyro and
Accelerometer data every second, then presents it on the serial monitor.

Resources:
Uses Wire.h for i2c operation
Uses SPI.h for SPI operation
Either can be omitted if not used

Development environment specifics:
Arduino IDE 1.6.4
Teensy loader 1.23

Hardware connections:
Connect I2C SDA line to A4
Connect I2C SCL line to A5
Connect GND and 3.3v power to the IMU

This code is released under the [MIT License](http://opensource.org/licenses/MIT).

Please review the LICENSE.md file included with this example. If you have any questions
or concerns with licensing, please contact techsupport@sparkfun.com.

Distributed as-is; no warranty is given.
 ******************************************************************************/
#include <math.h>
#include "SparkFunLSM6DS3.h"
#include "Wire.h"
#include "SerialHandling.h"

LSM6DS3 myIMU; //Default constructor is I2C, addr 0x6B


unsigned int samplingPeriodMs = 50;

unsigned long lastSampleTimestamp = 0;

void setup() {
    // put your setup code here, to run once:
    serialInit();

    //Call .begin() to configure the IMU
    myIMU.begin();
}


void loop()
{
    unsigned long nowTimeStamp = 0;

    nowTimeStamp = millis();
    //Get all parameters
    if (labs(nowTimeStamp - lastSampleTimestamp) > samplingPeriodMs) {
        Serial.print("{\"type\": \"event\", \"name\": \"accelerometer-data\", \"detail\": {\"x\": ");
        Serial.print(myIMU.readFloatAccelX(), 4);
        Serial.print(", \"y\": ");
        Serial.print(myIMU.readFloatAccelY(), 4);
        Serial.print(", \"z\": ");
        Serial.print(myIMU.readFloatAccelZ(), 4);
        Serial.println("}}");

        Serial.print("{\"type\": \"event\", \"name\": \"gyro-data\", \"detail\": {\"x\": ");
        Serial.print(myIMU.readFloatGyroX(), 4);
        Serial.print(", \"y\": ");
        Serial.print(myIMU.readFloatGyroY(), 4);
        Serial.print(", \"z\": ");
        Serial.print(myIMU.readFloatGyroZ(), 4);
        Serial.println("}}");

        lastSampleTimestamp = nowTimeStamp;
    }
    if (Serial.available()) {
        onSerialEvent();
    }
}
