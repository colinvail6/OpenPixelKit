// Copyright 2016 Kano Computing Ltd.
#include "serialHandling.h"
#include "serialCallbacks.h"
#include "deviceBusRPC.h"
#include "ReceiveBuffer.h"
#include "utils.h"
#include "errors.h"
#include "Arduino.h"

#include <ArduinoJson.h>

#define BAUD 9600
#define SIZE_OF_COMMAND 32

typedef struct routeTableEntry {
    char key[SIZE_OF_COMMAND];
    void (*controller)(const rpc_request_t *);
} routeTableEntry;

extern Serial_ *serialHandle;

static recv_buf_t recvBuf;

routeTableEntry routeTable[] = {
    {"device-info", device_info_cb},
    {"set-period", set_sampling_period},
};


void serialInit() {
    serialHandle->begin(BAUD, SERIAL_8N1);
    clearRecvBuf(&recvBuf);
}

static void routeRequest(const rpc_request_t *req) {
    int i, routeTableSize;
    bool routeMatched = false;

    if (req == NULL) {
        return;
    }

    routeTableSize = COUNT_OF(routeTable);
    for (i=0; i < routeTableSize; i++) {
        if (strcmp(routeTable[i].key, req->method) == 0) {
            routeTable[i].controller(req);
            routeMatched = true;
            break;
        }
    }
    if (!routeMatched) {
        print_error_response(
            serialHandle,
            req,
            "method not found");
    }
}

static void readyCb(char *rxBuf) {
    request_type_t type = INVALID_TYPE;
    rpc_request_t req;
    StaticJsonBuffer<JSON_OBJECT_SIZE(128)> jsonDecodeBuffer;
    JsonObject& root = jsonDecodeBuffer.parseObject(rxBuf);
    if (root.success() && isValidRPCFormat(&root)) {
        type = typeFromParsedJSON(&root);
        switch (type) {
            case RPC_REQUEST:
                rpc_request_from_parsed_JSON(&root, &req);
                routeRequest(&req);
                break;
            case RPC_RESPONSE:
            case EVENT:
            case INVALID_TYPE:
                break;
        }
    } else {
        print_error_event(serialHandle, "Couldn't decode JSON");
    }
}

void onSerialEvent() {
    int newChar;

    newChar = serialHandle->read();

    if (newChar == '\0') {
        // these are used for padding, do nothing
    } else if (newChar != '\n' ||
            getLastChar(&recvBuf) != '\r') {
        appendCharacter(&recvBuf, static_cast<char>(newChar));
    } else {
        dropLastChar(&recvBuf);
        readyCb(recvBuf.buf);

        // We are done, now clear the buffer
        clearRecvBuf(&recvBuf);
    }
}
