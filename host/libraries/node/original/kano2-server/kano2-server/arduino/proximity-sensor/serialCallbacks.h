/* Copyright 2016 Kano Computing Ltd. */
#ifndef SERIALCALLBACKS_H
#define SERIALCALLBACKS_H

#include "deviceBusRPC.h"
#include <ArduinoJson.h>

void device_info_cb(const rpc_request_t *req);
void set_sampling_period(const rpc_request_t *req);

#endif  // SERIALCALLBACKS_H


// {"type":"rpc-request","id":"1234","params":[],"method":"device-info"}
// {"type":"rpc-request","id":"1234","params":[{"period":4000}],"method":"set-period"}
