/* Copyright 2016 Kano Computing Ltd. */
#ifndef SERIALCALLBACKPIEZOBUZZER_H
#define SERIALCALLBACKPIEZOBUZZER_H

#include "deviceBusRPC.h"
#include <ArduinoJson.h>

void playTone(const rpc_request_t *req);
void stopTone(const rpc_request_t *req);
void isPlayingTone(const rpc_request_t *req);


#endif  // SERIALCALLBACKPIEZOBUZZER_H
