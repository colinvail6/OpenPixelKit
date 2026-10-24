// Copyright 2017 Kano Computing Ltd.
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

extern Serial_ *serialHandle;
extern bool proximity_enabled;
extern unsigned int samplingIntervalMs;
extern void setup_proximity();
extern void setup_gesture();

void device_info_cb(const rpc_request_t *req) {
    StaticJsonBuffer<JSON_OBJECT_SIZE(4) + JSON_OBJECT_SIZE(3)> jsonBuffer;
    rpc_response_t res;
    char out_buf[180];

    JsonObject& root = jsonBuffer.createObject();

    init_rpc_response(req, &res);

    JSON_response(&root, &res);

    JsonObject& nestedValue = root.createNestedObject("value");

    nestedValue["vendor"] = "kano";
    nestedValue["product"] = "motion-sensor";
    nestedValue["mode"] = (proximity_enabled) ? "proximity" : "gesture";

    root.printTo(out_buf, COUNT_OF(out_buf));
    getSerialInstance()->println(out_buf);
}

void set_mode_cb(const rpc_request *req) {
    JsonObject *data;
    const char * valueFromRequest;
    bool valid_mode = false;

    if (!verify_input_params(req, serialHandle)) {
        // We've already printed an error message, not we can exit
        return;
    }

    data = &(req->params->get<JsonObject&>(0));

    if (!key_exists_and_is_string(req, data, "mode", serialHandle)) {
        return;
    }

    valueFromRequest = (*data)["mode"].as<const char *>();

    if (strcmp(valueFromRequest, "proximity") == 0) {
        valid_mode = true;
        if (!proximity_enabled) {
            setup_proximity();
        }
        
    } else if (strcmp(valueFromRequest, "gesture") == 0) {
        valid_mode = true;
        if (proximity_enabled) {
            setup_gesture();
        }
    }

    if (!valid_mode) {
        print_error_response(serialHandle, req, "Invalid mode.");
    } else {
        print_success_response(serialHandle, req);
    }
}

void set_interval_cb(const rpc_request_t *req) {
    JsonObject *data;
    unsigned int valueFromRequest;

    if (!verify_input_params(req, serialHandle)) {
        // We've already printed an error message, not we can exit
        return;
    }

    data = &(req->params->get<JsonObject&>(0));

    if (!key_exists_and_is_uint(req, data, "interval", serialHandle)) {
        return;
    }

    valueFromRequest = (*data)["interval"].as<unsigned int>();

    if (valueFromRequest < MIN_INTERVAL) {
        print_error_response(
            serialHandle,
            req,
            "Interval value too small");
        return;
    }

    samplingIntervalMs = (*data)["interval"].as<unsigned int>();

    print_success_response(serialHandle, req);
}
