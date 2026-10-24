// Copyright 2016 Kano Computing Ltd.
#include "serialHandling.h"
#include "ReceiveBuffer.h"
#include "utils.h"
#include "Arduino.h"

#define BAUD 115200
#define SIZE_OF_COMMAND 32

static recv_buf_t recvBuf;

void serialInit() {
    getSerialInstance()->begin(BAUD, SERIAL_8N1);
    clearRecvBuf(&recvBuf);
}


void readyCb(char *rxBuf) {
    getSerialInstance()->println(rxBuf);
}

void onSerialEvent() {
    int newChar;
    bool appendRc;

    newChar = getSerialInstance()->read();

    if (newChar != '\n' ||
            getLastChar(&recvBuf) != '\r') {
        appendRc = appendCharacter(&recvBuf, static_cast<char>(newChar));
        if (!appendRc) {
            clearRecvBuf(&recvBuf);
        }
    } else {
        dropLastChar(&recvBuf);
        readyCb(recvBuf.buf);

        // We are done, now clear the buffer
        clearRecvBuf(&recvBuf);
    }
}

kanoSerial* getSerialInstance(){
#if USBSERIAL
    return &SerialUSB;
#else
    return &Serial1;
#endif
}
