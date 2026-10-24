// Copyright 2016 Kano Computing Ltd.
#include "serialCallbacks.h"
#include <stdint.h>
#include <string.h>

#include "Arduino.h"
#include "utils.h"
#include "errors.h"
#include "parameterFormatHelpers.h"
#include "serialHandling.h"

#include <ArduinoJson.h>

#define MIN_INTERVAL 50

extern unsigned int samplingPeriodMs;

void device_info_cb(const rpc_request_t *req) {
    StaticJsonBuffer<JSON_OBJECT_SIZE(4) + JSON_OBJECT_SIZE(2)> jsonBuffer;
    rpc_response_t res;
    char out_buf[180];

    JsonObject& root = jsonBuffer.createObject();

    init_rpc_response(req, &res);

    JSON_response(&root, &res);

    JsonObject& nestedValue = root.createNestedObject("value");

    nestedValue["vendor"] = "kano";
    nestedValue["product"] = "gyro-accelerometer";

    root.printTo(out_buf, COUNT_OF(out_buf));
    getSerialInstance()->println(out_buf);
}

void set_interval_cb(const rpc_request_t *req) {
    JsonObject *data;
    unsigned int valueFromRequest;

    if (!verify_input_params(req, getSerialInstance())) {
        // We've already printed an error message, not we can exit
        return;
    }

    data = &(req->params->get<JsonObject&>(0));

    if (!key_exists_and_is_uint(req, data, "interval", getSerialInstance())) {
        return;
    }

    valueFromRequest = (*data)["interval"].as<unsigned int>();

    if (valueFromRequest < MIN_INTERVAL) {
        print_error_response(
            getSerialInstance(),
            req,
            "Interval value too small");
        return;
    }

    samplingPeriodMs = (*data)["interval"].as<unsigned int>();

    print_success_response(getSerialInstance(), req);
}
