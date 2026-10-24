// Copyright 2016 Kano Computing Ltd.
#include "serialCallbacks.h"
#include <stdint.h>
#include <string.h>

#include "Arduino.h"
#include "utils.h"
#include "errors.h"
#include "parameterFormatHelpers.h"
#include "ModeEncoder.h"
#include "serialHandling.h"
#include "wdog.h"

#include <ArduinoJson.h>

extern ModeEncoder pote;

void resetSystem(const rpc_request_t *req) {
    print_success_response(getSerialInstance(), req);

    NVIC_SystemReset();
}

void resetWatchdog(const rpc_request_t *req) {
    watchdog_reset();
    print_success_response(getSerialInstance(), req);

}

void enableWatchdog(const rpc_request_t *req) {
    watchdog_enable();
    print_success_response(getSerialInstance(), req);

}

void disableWatchdog(const rpc_request_t *req) {
    watchdog_disable();
    print_success_response(getSerialInstance(), req);

}

void resetSerial(const rpc_request_t *req) {
    rpc_request_t req_local;
    char id[52];

    strncpy(id, req->id, sizeof(id));

    req_local.id = id;
    serialInit();
    print_success_response(getSerialInstance(), &req_local);
}

void device_info_cb(const rpc_request_t *req) {
    StaticJsonBuffer<JSON_OBJECT_SIZE(4) + JSON_OBJECT_SIZE(3)> jsonBuffer;
    rpc_response_t res;
    char out_buf[190];

    JsonObject& root = jsonBuffer.createObject();

    init_rpc_response(req, &res);

    JSON_response(&root, &res);

    uint32_t val1, val2, val3, val4;
    uint32_t *ptr1 = (uint32_t *)0x0080A00C;
    val1 = *ptr1;
    uint32_t *ptr = (uint32_t *)0x0080A040;
    val2 = *ptr;
    ptr++;
    val3 = *ptr;
    ptr++;
    val4 = *ptr;

    char buf[33];
    sprintf(buf, "%8x%8x%8x%8x", val1, val2, val3, val4);

    JsonObject& nestedValue = root.createNestedObject("value");

    nestedValue["vendor"] = "kano";
    nestedValue["product"] = "awesomeKit";
    nestedValue["serialNumber"] = buf;

    root.printTo(out_buf, COUNT_OF(out_buf));
    getSerialInstance()->println(out_buf);
}

void get_current_mode_cb(const rpc_request_t *req) {
    StaticJsonBuffer<JSON_OBJECT_SIZE(4) + JSON_OBJECT_SIZE(2)> jsonBuffer;
    rpc_response_t res;
    const char *mode;
    char out_buf[128];

    JsonObject& root = jsonBuffer.createObject();

    init_rpc_response(req, &res);

    JSON_response(&root, &res);

    JsonObject& nestedValue = root.createNestedObject("value");

    pote.getCurrentMode(&mode);

    nestedValue["mode"] = mode;

    root.printTo(out_buf, COUNT_OF(out_buf));
    getSerialInstance()->println(out_buf);
}

void peek_cb(const rpc_request_t *req) {
    StaticJsonBuffer<JSON_OBJECT_SIZE(4) + JSON_OBJECT_SIZE(2)> jsonBuffer;
    rpc_response_t res;
    const char *mode;
    char out_buf[128];
    const char *paramId;
    uint32_t addr, val;
    unsigned int size;

    JsonObject *data;

    if (!verify_input_params(req, getSerialInstance())) {
        return;
    }

    data = &(req->params->get<JsonObject&>(0));

    if (!key_exists_and_is_uint(req, data, "size", getSerialInstance())) {
        return;
    }

    size = (*data)["size"].as<unsigned int>();

    if (!key_exists_and_is_uint(req, data, "addr", getSerialInstance())) {
        return;
    }

    addr = (*data)["addr"].as<unsigned int>();
    switch(size) {
    case 1:
      val = *(volatile uint8_t *)addr;
      break;
    case 2:
      val = *(volatile uint16_t *)addr;
      break;
    case 4:
      val = *(volatile uint32_t *)addr;
      break;
    default:
      print_error_response(getSerialInstance(), req, "invalid size");

    }

    JsonObject& root = jsonBuffer.createObject();

    init_rpc_response(req, &res);

    JSON_response(&root, &res);

    JsonObject& nestedValue = root.createNestedObject("value");

    nestedValue["data"] = val;

    root.printTo(out_buf, COUNT_OF(out_buf));
    getSerialInstance()->println(out_buf);
}
void poke_cb(const rpc_request_t *req) {
    StaticJsonBuffer<JSON_OBJECT_SIZE(4) + JSON_OBJECT_SIZE(2)> jsonBuffer;
    rpc_response_t res;
    const char *mode;
    char out_buf[128];
    const char *paramId;
    uint32_t addr, val;
    unsigned int size;

    JsonObject *data;

    if (!verify_input_params(req, getSerialInstance())) {
        return;
    }

    data = &(req->params->get<JsonObject&>(0));

    if (!key_exists_and_is_uint(req, data, "size", getSerialInstance())) {
        return;
    }


    if (!key_exists_and_is_uint(req, data, "addr", getSerialInstance())) {
        return;
    }

    if (!key_exists_and_is_uint(req, data, "val", getSerialInstance())) {
        return;
    }

    size = (*data)["size"].as<unsigned int>();
    addr = (*data)["addr"].as<unsigned int>();
    val = (*data)["val"].as<unsigned int>();
    switch(size) {
    case 1:
      *(volatile uint8_t *)addr = val;
      break;
    case 2:
      *(volatile uint16_t *)addr = val;
      break;
    case 4:
      *(volatile uint32_t *)addr = val;
      break;
    default:
      print_error_response(getSerialInstance(), req, "invalid size");
    }

    print_success_response(getSerialInstance(), req);
}



void serialInfo(const rpc_request_t *req) {
    StaticJsonBuffer<JSON_OBJECT_SIZE(4) + JSON_OBJECT_SIZE(3)> jsonBuffer;
    rpc_response_t res;
    const char *mode;
    char out_buf[136];

    JsonObject& root = jsonBuffer.createObject();

    init_rpc_response(req, &res);

    JSON_response(&root, &res);

    JsonObject& nestedValue = root.createNestedObject("value");

    pote.getCurrentMode(&mode);

    nestedValue["padBefore"] = serialPadCount.before;
    nestedValue["padAfter"] = serialPadCount.after;
    nestedValue["padTotal"] = serialPadCount.total;

    root.printTo(out_buf, COUNT_OF(out_buf));
    getSerialInstance()->println(out_buf);
}
