/* Copyright 2016 Kano Computing Ltd. */
#ifndef DEVICEBUSRPC_H
#define DEVICEBUSRPC_H

#define SEND_BUFFER_SIZE 128
#define STRINGIFY(TXT) #TXT

#include <ArduinoJson.h>


typedef enum request_type {
    INVALID_TYPE,
    RPC_REQUEST,
    RPC_RESPONSE,
    EVENT
} request_type_t;

typedef struct rpc_request {
    const char* method;
    const char* id;  //currently we are using a 128 bit uuid which ends up being 36 chars
    const JsonArray *params;
} rpc_request_t;

typedef struct rpc_response {
    const char *err;
    const char *id;  //currently we are using a 128 bit uuid which ends up being 36 chars
    JsonObject *value;
} rpc_response_t;

typedef struct rpc_event {
    char *name;
    JsonObject *detail;
} rpc_event_t;

request_type_t typeFromParsedJSON(JsonObject* root);
bool isValidRPCFormat (JsonObject* root);
void rpc_request_from_parsed_JSON(JsonObject* root, rpc_request_t * req);
void init_rpc_response(const rpc_request_t *req , rpc_response_t *res);
void JSON_response(JsonObject* root, const rpc_response_t * res);


#endif  // DEVICEBUSRPC_H
