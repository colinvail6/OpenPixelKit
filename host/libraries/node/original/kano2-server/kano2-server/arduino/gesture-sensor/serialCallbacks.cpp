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


void device_info_cb(const rpc_request_t *req) {
    StaticJsonBuffer<JSON_OBJECT_SIZE(4) + JSON_OBJECT_SIZE(2)> jsonBuffer;
    rpc_response_t res;
    char out_buf[180];

    JsonObject& root = jsonBuffer.createObject();

    init_rpc_response(req, &res);

    JSON_response(&root, &res);

    JsonObject& nestedValue = root.createNestedObject("value");

    nestedValue["vendor"] = "kano";
    nestedValue["product"] = "gesture-sensor";

    root.printTo(out_buf, COUNT_OF(out_buf));
    getSerialInstance()->println(out_buf);
}
