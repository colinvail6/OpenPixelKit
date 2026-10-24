/* Copyright 2016 Kano Computing Ltd. */
#ifndef SERIALCALLBACKLEDRING_H
#define SERIALCALLBACKLEDRING_H

#include "deviceBusRPC.h"
#include <ArduinoJson.h>

void flashRing(const rpc_request_t *req);
void setLedNPxlsRing(const rpc_request_t *req);

#endif  // SERIALCALLBACKLEDRING_H
