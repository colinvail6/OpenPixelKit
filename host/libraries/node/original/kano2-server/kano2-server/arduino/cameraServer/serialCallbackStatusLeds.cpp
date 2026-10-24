// Copyright 2016 Kano Computing Ltd.
#include "serialCallbackStatusLeds.h"
#include "Arduino.h"
#include "StatusLed.h"
#include "errors.h"
#include "utils.h"
#include "parameterFormatHelpers.h"
#include "serialHandling.h"

#include <string.h>
#include <ArduinoJson.h>

extern StatusLed battLed;

typedef enum states {
    LED_UNKNOWN_STATE,
    LED_ON,
    LED_OFF
} led_state_t;


static bool changeLedState(StatusLed* ledToBeChanged, led_state_t targetState) {
  if (ledToBeChanged == NULL) {
      return false;
  }

  switch (targetState) {
      case LED_ON:
        ledToBeChanged->turnOn();
        break;
      case LED_OFF:
        ledToBeChanged->turnOff();
        break;
      default:
        return false;
  }
  return true;
}

static led_state_t getLedState(StatusLed* led)
{
    if (led == NULL) {
        return LED_UNKNOWN_STATE;
    }

    return led->isOn() ? LED_ON: LED_OFF;
}

static StatusLed* parseLedID(const char *ledId)
{
    if (strcmp(battLed.ledId, ledId) == 0) {
        return &battLed;
    }
    return NULL;
}

static bool checkInputParams(const rpc_request_t *req) {
    JsonObject *data;

    if (!verify_input_params(req, getSerialInstance())) {
        return false;
    }

    data = &(req->params->get<JsonObject&>(0));

    if (!key_exists_and_is_string(req, data, "id", getSerialInstance())) {
        return false;
    }

    return true;
}

void turnLedOn(const rpc_request_t *req) {
    StatusLed* led;
    const char *paramId;
    JsonObject *data;
    bool ok;

    if (!checkInputParams(req)) {
        // we've already printed an error message
        return;
    }

    data = &(req->params->get<JsonObject&>(0));

    paramId = (*data)["id"].asString();
    led = parseLedID(paramId);

    ok = changeLedState(led, LED_ON);

    if (!ok) {
        print_error_response(
            getSerialInstance(),
            req,
            "failed, led id was probably wrong");
        return;
    } else {
        print_success_response(getSerialInstance(), req);
        return;
    }
}

void turnLedOff(const rpc_request_t * req)
{
    StatusLed* led;
    const char *paramId;
    JsonObject *data;
    bool ok;

    if (!checkInputParams(req)) {
        // we've already printed an error message
        return;
    }

    data = &(req->params->get<JsonObject&>(0));

    paramId = (*data)["id"].asString();
    led = parseLedID(paramId);

    ok = changeLedState(led, LED_OFF);
    if (!ok) {
        print_error_response(
            getSerialInstance(),
            req,
            "failed, led id was probably wrong");
        return;
    } else {
        print_success_response(getSerialInstance(), req);
        return;
    }
}

void isLedOn(const rpc_request_t * req)
{
    StatusLed* led;
    const char *paramId;
    JsonObject *data;
    led_state_t state;
    StaticJsonBuffer<JSON_OBJECT_SIZE(4) + JSON_OBJECT_SIZE(2)> jsonBuffer;
    rpc_response_t res;
    char out_buf[128];

    if (!checkInputParams(req)) {
        // we've already printed an error message
        return;
    }

    data = &(req->params->get<JsonObject&>(0));

    paramId = (*data)["id"].asString();
    led = parseLedID(paramId);

    state = getLedState(led);

    if (state == LED_UNKNOWN_STATE) {
        print_error_response(
            getSerialInstance(),
            req,
            "led id was probably wrong");
        return;
    }

    JsonObject& root = jsonBuffer.createObject();

    init_rpc_response(req, &res);
    JSON_response(&root, &res);

    JsonObject& nestedValue = root.createNestedObject("value");
    nestedValue["state"] = state == LED_ON ? "on": "off";

    root.printTo(out_buf, COUNT_OF(out_buf));
    getSerialInstance()->println(out_buf);
}
