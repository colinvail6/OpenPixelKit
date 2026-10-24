/* Copyright 2017 Kano Computing Ltd. */
#ifndef PARAMETERFORMATHELPERS_H
#define PARAMETERFORMATHELPERS_H

#include "deviceBusRPC.h"
#include "Arduino.h"
#include "serialHandling.h"
#include <ArduinoJson.h>

bool verify_input_params(const rpc_request_t *req, kanoSerial *serialHandle);
bool key_exists_and_is_string(const rpc_request_t *req, JsonObject *data,
                              const char* key, kanoSerial *serialHandle);
bool key_exists_and_is_uint(const rpc_request_t *req, JsonObject *data,
                            const char* key, kanoSerial *serialHandle);
bool key_exists_and_is_int(const rpc_request_t *req, JsonObject *data,
                           const char* key, kanoSerial *serialHandle);
bool optional_key_exists_and_is_uint(const rpc_request_t *req, JsonObject *data,
                                     const char* key, kanoSerial *serialHandle);
bool optional_key_exists_and_is_bool(const rpc_request_t *req, JsonObject *data,
                                     const char* key, kanoSerial *serialHandle);

#endif  // PARAMETERFORMATHELPERS_H
