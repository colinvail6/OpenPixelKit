// Copyright 2016 Kano Computing Ltd.
#include "serialCallbackLedRing.h"
#include <stdint.h>
#include <string.h>

#include "colourHelpers.h"
#include "Arduino.h"
#include "StatusLed.h"
#include "deviceBusRPC.h"
#include "utils.h"
#include "errors.h"
#include "parameterFormatHelpers.h"
#include "serialHandling.h"

#include <ArduinoJson.h>
#include <gamma.h>

#include <Adafruit_NeoPixel.h>

extern Adafruit_NeoPixel strip;

void flashRing(const rpc_request_t *req) {
    unsigned int i;
    unsigned int pixelCount = 0;

    unsigned int brightness, duration, prev_brightnes;
    JsonObject *data;

    unsigned int r = 0;
    unsigned int g = 0;
    unsigned int b = 0;

    if (!verify_input_params(req, getSerialInstance())) {
        // We've already printed an error message, not we can exit
        return;
    }

    data = &(req->params->get<JsonObject&>(0));

    if (!key_exists_and_is_string(req, data, "colour", getSerialInstance())) {
        return;
    }

    if (!key_exists_and_is_uint(req, data, "brightness", getSerialInstance())) {
        return;
    }

    if (!key_exists_and_is_uint(req, data, "length", getSerialInstance())) {
        return;
    }

    pixelCount = strip.numPixels();
    hexToRgb((*data)["colour"].asString(), r, g, b);
    brightness = (*data)["brightness"].as<unsigned int>();
    duration = (*data)["length"].as<unsigned int>();

    prev_brightnes = strip.getBrightness();
    strip.setBrightness(brightness);

    for (i = 0; i < pixelCount; i++) {
        strip.setPixelColor(i, r, g, b);
    }

    strip.show();

    delay(duration);
    for (i = 0; i < pixelCount; i++) {
        strip.setPixelColor(i, 0, 0, 0);
    }

    strip.setBrightness(prev_brightnes);
    strip.show();

    print_success_response(getSerialInstance(), req);
}

void setLedNPxlsRing(const rpc_request_t *req) {
    unsigned int r = 0;
    unsigned int g = 0;
    unsigned int b = 0;
    unsigned int pixelCount = 0;
    unsigned int i, count;

    JsonObject *data;

    if (!verify_input_params(req, getSerialInstance())) {
        // We've already printed an error message, not we can exit
        return;
    }

    data = &(req->params->get<JsonObject&>(0));

    if (!key_exists_and_is_string(req, data, "colour", getSerialInstance())) {
        return;
    }

    if (!key_exists_and_is_uint(req, data, "count", getSerialInstance())) {
        return;
    }

    hexToRgb((*data)["colour"].asString(), r, g, b);

    pixelCount = strip.numPixels();

    count = (*data)["count"].as<unsigned int>();

    if (count > pixelCount) {
        print_error_response(
            getSerialInstance(),
            req,
            "count parameter contains more than total pixels");
        return;
    }

    for (i = 0; i < count; i++) {
        strip.setPixelColor(i, r, g, b);
    }
    for (i=count; i < pixelCount; i++) {
        strip.setPixelColor(i, 0, 0, 0);
    }
    strip.show();
    print_success_response(getSerialInstance(), req);
}
