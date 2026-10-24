/* Copyright 2016 Kano Computing Ltd. */
#ifndef SERIALCALLBACKSSTATUSLEDS_H
#define SERIALCALLBACKSSTATUSLEDS_H

#include "deviceBusRPC.h"
#include <ArduinoJson.h>

void turnLedOn(const rpc_request_t * req);
void turnLedOff(const rpc_request_t * req);
void isLedOn(const rpc_request_t * req);

#endif  // SERIALCALLBACKSSTATUSLEDS_H
