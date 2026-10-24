// Copyright 2016 Kano Computing Ltd.
#include "serialCallbackLedGrid.h"
#include <stdint.h>
#include <string.h>

#include "colourHelpers.h"
#include "Arduino.h"
#include "deviceBusRPC.h"
#include "utils.h"
#include "errors.h"
#include "parameterFormatHelpers.h"
#include "serialHandling.h"

#include <ArduinoJson.h>
#include <Adafruit_NeoMatrix.h>
#include <gamma.h>

#include <Adafruit_NeoPixel.h>

extern Adafruit_NeoMatrix stripGrid;

void setLedGripBitmap(const rpc_request_t *req) {
    unsigned int i, j;
    div_t d;
    unsigned int offset = 0;
    bool draw = true;
    JsonObject *data;

    if (!verify_input_params(req, getSerialInstance())) {
        return;
    }

    data = &(req->params->get<JsonObject&>(0));

    if (!key_exists_and_is_string(req, data, "map", getSerialInstance())) {
        return;
    }

    if (optional_key_exists_and_is_uint(req, data, "of", getSerialInstance())) {
        offset = (*data)["of"].as<unsigned int>();
    }


    if (optional_key_exists_and_is_bool(req, data, "d", getSerialInstance())) {
        draw = (*data)["d"].as<bool>();
    }

    const char* map = (*data)["map"].asString();
    uint16_t buf[3] = {0};

    if (strlen(map) % 8 != 0) {
        print_error_response(getSerialInstance(), req, "length not 8byte aligned");
        return;
    }

    if (offset + strlen(map) * 3 / 8 > 128 + 6) {
        print_error_response(
            getSerialInstance(),
            req,
            "Implied length exceeds the size of the ledgrid!");

        return;
    }

    for (i = 0; i < strlen(map) / 8; i++) {
        base64ToRgb(&(map[i*8]), buf);
        for (j = 0; j < COUNT_OF(buf); j++) {
            d = div(offset + j + 3 * i, 16);
            if (d.quot < 8) {
                stripGrid.drawPixel(d.rem, d.quot, buf[j]);
            }
        }
    }

    if (draw) {
        stripGrid.show();
    }
    print_success_response(getSerialInstance(), req);
}
