/* Copyright 2017 Kano Computing Ltd. */
#ifndef SERIALCALLBACKS_H
#define SERIALCALLBACKS_H

#include "deviceBusRPC.h"
#include <ArduinoJson.h>

void device_info_cb(const rpc_request_t *req);

// {"type":"rpc-request","id":"1234","params":[],"method":"device-info"}
#endif  // SERIALCALLBACKS_H
