/* Copyright 2016 Kano Computing Ltd. */
#ifndef SERIALCALLBACKS_H
#define SERIALCALLBACKS_H

#include "deviceBusRPC.h"
#include <ArduinoJson.h>

void device_info_cb(const rpc_request_t *req);

#endif  // SERIALCALLBACKS_H
