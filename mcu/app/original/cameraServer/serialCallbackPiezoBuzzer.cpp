// Copyright 2016 Kano Computing Ltd.
#include "serialCallbackPiezoBuzzer.h"
#include <stdio.h>
#include "PiezoBuzzer.h"
#include "utils.h"
#include "errors.h"
#include "Arduino.h"
#include "parameterFormatHelpers.h"
#include "serialHandling.h"

#include <ArduinoJson.h>

extern PiezoBuzzer buzz;

void playTone(const rpc_request_t *req) {
    unsigned int toneFreq;
    unsigned int duration;
    JsonObject *data;

    if (!verify_input_params(req, getSerialInstance())) {
        return;
    }

    data = &(req->params->get<JsonObject&>(0));

    if (!key_exists_and_is_uint(req, data, "freq", getSerialInstance())) {
        return;
    }

    toneFreq = (*data)["freq"].as<unsigned int>();

    if (optional_key_exists_and_is_uint(req, data, "duration", getSerialInstance())) {
        duration = (*data)["duration"].as<unsigned int>();

        buzz.playTone(toneFreq, duration);
        print_success_response(getSerialInstance(), req);
        return;
    } else {
        buzz.playTone(toneFreq);
        print_success_response(getSerialInstance(), req);
    }
}

void stopTone(const rpc_request_t *req) {
    buzz.stopTone();
    print_success_response(getSerialInstance(), req);
}

void isPlayingTone(const rpc_request_t *req) {
    StaticJsonBuffer<JSON_OBJECT_SIZE(4) + JSON_OBJECT_SIZE(2)> jsonBuffer;
    rpc_response_t res;
    char out_buf[128];

    JsonObject& root = jsonBuffer.createObject();

    init_rpc_response(req, &res);

    JSON_response(&root, &res);

    JsonObject& nestedValue = root.createNestedObject("value");

    nestedValue["is-playing"] = buzz.isPlaying();

    root.printTo(out_buf, COUNT_OF(out_buf));
    getSerialInstance()->println(out_buf);
}
