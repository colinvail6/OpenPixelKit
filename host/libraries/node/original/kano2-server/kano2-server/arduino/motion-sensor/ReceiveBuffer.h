/* Copyright 2017 Kano Computing Ltd. */
#ifndef RECEIVEBUFFER_H
#define RECEIVEBUFFER_H

#include <string.h>

#define SIZE_OF_RECEIVE_BUF 512  // ~425 chars sizeof a frame for Lightboard

typedef struct recv_buf {
    char buf[SIZE_OF_RECEIVE_BUF];
    size_t len;
} recv_buf_t;

void clearRecvBuf(recv_buf_t *bufRx);
bool appendCharacter(recv_buf_t *bufRx, char charToAppend);
char getLastChar(recv_buf_t *bufRx);
void dropLastChar(recv_buf_t *bufRx);

#endif  // RECEIVEBUFFER_H
