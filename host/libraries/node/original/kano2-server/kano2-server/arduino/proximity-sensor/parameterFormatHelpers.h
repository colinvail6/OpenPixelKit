/* Copyright 2016 Kano Computing Ltd. */
#ifndef PARAMETERFORMATHELPERS_H
#define PARAMETERFORMATHELPERS_H

#include "deviceBusRPC.h"
#include "Arduino.h"
#include <ArduinoJson.h>

bool verify_input_params(const rpc_request_t *req, Serial_ *serialHandle);
bool key_exists_and_is_string(const rpc_request_t *req, JsonObject *data,
                              const char* key, Serial_ *serialHandle);
bool key_exists_and_is_uint(const rpc_request_t *req, JsonObject *data,
                            const char* key, Serial_ *serialHandle);
bool key_exists_and_is_int(const rpc_request_t *req, JsonObject *data,
                           const char* key, Serial_ *serialHandle);
bool key_exists_and_is_bool(const rpc_request_t *req, JsonObject *data,
                            const char* key, Serial_ *serialHandle);
bool optional_key_exists_and_is_uint(const rpc_request_t *req, JsonObject *data,
                                     const char* key, Serial_ *serialHandle);
bool optional_key_exists_and_is_bool(const rpc_request_t *req, JsonObject *data,
                                     const char* key, Serial_ *serialHandle);

#endif  // PARAMETERFORMATHELPERS_H
