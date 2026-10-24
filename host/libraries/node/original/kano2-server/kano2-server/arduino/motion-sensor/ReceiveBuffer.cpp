// Copyright 2017 Kano Computing Ltd.

#include "ReceiveBuffer.h"

void clearRecvBuf(recv_buf_t *bufRx) {
    if (!bufRx) {
        return;
    }

    memset(bufRx->buf, '\0', SIZE_OF_RECEIVE_BUF);
    bufRx->len = 0;
}

bool appendCharacter(recv_buf_t *bufRx, char charToAppend) {
    bool ret = false;

    if (!bufRx) {
        return ret;
    }

    if (bufRx->len < SIZE_OF_RECEIVE_BUF - 1) {
        bufRx->buf[bufRx->len] = charToAppend;
        bufRx->buf[bufRx->len + 1] = '\0';
        bufRx->len++;
        ret = true;
    }
    return ret;
}

char getLastChar(recv_buf_t *bufRx) {
    if (!bufRx) {
        return '\0';
    }
    return bufRx->buf[bufRx->len - 1];
}

void dropLastChar(recv_buf_t *bufRx) {
    if (!bufRx) {
        return;
    }

    if (bufRx->len > 0) {
        bufRx->buf[bufRx->len - 1] = '\0';
        bufRx->len--;
    }
    return;
}
