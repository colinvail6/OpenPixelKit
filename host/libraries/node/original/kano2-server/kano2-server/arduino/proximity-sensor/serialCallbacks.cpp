// Copyright 2016 Kano Computing Ltd.
#include "serialCallbacks.h"
#include <stdint.h>
#include <string.h>

#include "Arduino.h"
#include "utils.h"
#include "errors.h"
#include "parameterFormatHelpers.h"

#include <ArduinoJson.h>

#define MIN_PERIOD 250


extern Serial_ *serialHandle;
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
    nestedValue["product"] = "proximity-sensor";

    root.printTo(out_buf, COUNT_OF(out_buf));
    serialHandle->println(out_buf);
}


void set_sampling_period(const rpc_request_t *req) {
    JsonObject *data;
    unsigned int valueFromRequest;

    if (!verify_input_params(req, serialHandle)) {
        // We've already printed an error message, not we can exit
        return;
    }

    data = &(req->params->get<JsonObject&>(0));

    if (!key_exists_and_is_uint(req, data, "period", serialHandle)) {
        return;
    }

    valueFromRequest = (*data)["period"].as<unsigned int>();

    if (valueFromRequest < MIN_PERIOD) {
        print_error_response(
            serialHandle,
            req,
            "sampling period value too small");
        return;
    }

    samplingPeriodMs = (*data)["period"].as<unsigned int>();

    print_success_response(serialHandle, req);
}
