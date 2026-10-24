/* Copyright 2017 Kano Computing Ltd. */
#ifndef SERIALCALLBACKS_H
#define SERIALCALLBACKS_H

#include "deviceBusRPC.h"
#include <ArduinoJson.h>

void device_info_cb(const rpc_request_t *req);
void set_mode_cb(const rpc_request_t *req);
void set_interval_cb(const rpc_request_t *req);

// {"type":"rpc-request","id":"1234","params":[],"method":"device-info"}

// {"type":"rpc-request","id":"1234","params":[{"mode":"gesture"}],"method":"set-mode"}
// {"type":"rpc-request","id":"2345","params":[{"mode":"proximity"}],"method":"set-mode"}

// {"type":"rpc-request","id":"3456","params":[{"interval":50}],"method":"set-interval"}



#endif  // SERIALCALLBACKS_H
