/* Copyright 2016 Kano Computing Ltd. */
#ifndef SERIALCALLBACKS_H
#define SERIALCALLBACKS_H

#include "deviceBusRPC.h"
#include <ArduinoJson.h>

void device_info_cb(const rpc_request_t *req);
void get_current_mode_cb(const rpc_request_t *req);
void resetSystem(const rpc_request_t *req);
void resetSerial(const rpc_request_t *req);
void serialInfo(const rpc_request_t *req);
void resetWatchdog(const rpc_request_t *req);
void enableWatchdog(const rpc_request_t *req);
void disableWatchdog(const rpc_request_t *req);
void peek_cb(const rpc_request_t *req);
void poke_cb(const rpc_request_t *req);


#endif  // SERIALCALLBACKS_H
