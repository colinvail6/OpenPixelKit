// Copyright 2016 Kano Computing Ltd.
#include "serialHandling.h"
#include "serialCallbacks.h"
#include "serialCallbackLedRing.h"
#include "serialCallbackStatusLeds.h"
#include "serialCallbackLedGrid.h"
#include "serialCallbackPiezoBuzzer.h"
#include "startupAnimationLightboard.h"
#include "deviceBusRPC.h"
#include "ReceiveBuffer.h"
#include "utils.h"
#include "errors.h"
#include "Arduino.h"

#include <ArduinoJson.h>
#include <new>

#define BAUD 115200
#define SIZE_OF_COMMAND 32

typedef struct routeTableEntry {
    char key[SIZE_OF_COMMAND];
    void (*controller)(const rpc_request_t *);
} routeTableEntry;

static recv_buf_t recvBuf;
static bool doSerialReset;
SerialPadCount serialPadCount;


void padCount(char chr){
  if(chr == '\0'){

    if(serialPadCount.seenNonPad)
      {
        serialPadCount.after++;
      }
    else
      {
        serialPadCount.before++;
      }
    serialPadCount.total++;
  }
  else{
    serialPadCount.seenNonPad = true;
    serialPadCount.after = 0;
  }
}
void padCountClear(){
  serialPadCount.before = 0;
  serialPadCount.after = 0;
  serialPadCount.total = 0;
  serialPadCount.seenNonPad = false;
}

routeTableEntry routeTable[] = {
    {"device-info", device_info_cb},
    {"current-mode", get_current_mode_cb},
    {"reset-system", resetSystem},
    {"reset-serial", resetSerial},
    {"serial-info", serialInfo},
    {"ring-set-n-pixels", setLedNPxlsRing},
    {"flash-ring", flashRing},
    {"grid-bmp", setLedGripBitmap},
    {"led-turn-on", turnLedOn},
    {"led-turn-off", turnLedOff},
    {"led-get-state", isLedOn},
    {"play-tone", playTone},
    {"stop-tone", stopTone},
    {"is-playing-tone", isPlayingTone},
    {"start-anim-control", startAnimControl},
    {"watchdog-enable", enableWatchdog},
    {"watchdog-reset", resetWatchdog},
    {"watchdog-disable", disableWatchdog},
    {"peek", peek_cb},
    {"poke", poke_cb}
};

#define RPC_SERIAL_RESET_EVENT "{"      \
    "\"type\":\"event\","            \
    "\"name\":\"serial-reset\","            \
    "\"detail\": {"                  \
        "}"                          \
    "}"


void breakCallback(void){
  doSerialReset = true;
}

void serialResetCheck(void){
  if(doSerialReset){
    serialInit();
    getSerialInstance()->println(RPC_SERIAL_RESET_EVENT);
  }
}

void serialInit() {
    getSerialInstance()->setBreakCallback(breakCallback);
    getSerialInstance()->setFlow(true, 227+10);
    getSerialInstance()->begin(BAUD, SERIAL_8N1);
    clearRecvBuf(&recvBuf);
    padCountClear();
    doSerialReset = false;
}

void routeRequest(const rpc_request_t *req) {
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
            getSerialInstance(),
            req,
            "method not found");
    }
}

 ;
static char jsonDecodeBufferMem[sizeof(StaticJsonBuffer<JSON_OBJECT_SIZE(50)>)];


void readyCb(recv_buf_t *rb) {
    char *rxBuf = rb->buf;
    request_type_t type = INVALID_TYPE;
    rpc_request_t req;
    StaticJsonBuffer<JSON_OBJECT_SIZE(50)> *jsonDecodeBuffer =new((void *)jsonDecodeBufferMem) StaticJsonBuffer<JSON_OBJECT_SIZE(50)>();
    JsonObject& root = jsonDecodeBuffer->parseObject(rxBuf);
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
        print_error_event(getSerialInstance(), "Couldn't decode JSON");
        print_error_event_invalid(getSerialInstance(), rb);
    }
}



void onSerialEvent() {
    int newChar;
    bool appendRc;
    BaseSerial * s=getSerialInstance();
    newChar = s->read();
    padCount(newChar);
    if (newChar == '\0') {
        // these are used for padding, do nothing
    } else if (newChar != '\n' ||
            getLastChar(&recvBuf) != '\r') {
        appendRc = appendCharacter(&recvBuf, static_cast<char>(newChar));
        if (!appendRc) {
            clearRecvBuf(&recvBuf);
        }
    } else {
        dropLastChar(&recvBuf);
        readyCb(&recvBuf);

        // We are done, now clear the buffer
        padCountClear();
        clearRecvBuf(&recvBuf);
    }
}


BaseSerial* getSerialInstance(){
#if USBSERIAL
    return &SerialUSB;
#else
    return &Serial1;
#endif
}
