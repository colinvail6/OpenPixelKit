// Copyright 2016 Kano Computing Ltd.
#include <stdio.h>
#include <string.h>

#include "utils.h"
#include "errors.h"


#define RPC_ERROR_RESPONSE_FMT "{"      \
    "\"type\":\"rpc-response\","  \
    "\"id\":\"%s\","              \
    "\"error\":\"%s\","           \
    "\"value\":null"                \
    "}"

#define RPC_SUCCESS_RESPONSE_FMT "{"      \
    "\"type\":\"rpc-response\","  \
    "\"id\":\"%s\","              \
    "\"error\":null,"           \
    "\"value\":null"                \
    "}"

#define RPC_ERROR_EVENT_FMT "{"      \
    "\"type\":\"event\","            \
    "\"name\":\"error\","            \
    "\"detail\": {"                  \
            "\"msg\":\"%s\""        \
        "}"                          \
    "}"

void format_error_event(char *dest, size_t dest_size, const char* err_msg) {
    size_t overall_length;

    if (dest == NULL) {
        return;
    }

    overall_length = COUNT_OF(RPC_ERROR_EVENT_FMT) + strlen(err_msg);

    if (dest_size < overall_length) {
        // Won't produce a valid response
        return;
    }

    snprintf(dest, dest_size, RPC_ERROR_EVENT_FMT, err_msg);
}

void print_error_event(kanoSerial *serialHandle, const char *err_msg) {
    char buf[ERROR_BUF_SIZE] = "\0";

    if (serialHandle == NULL) {
        return;
    }

    format_error_event(buf, sizeof(buf), err_msg);
    serialHandle->println(buf);
}

void format_error_response(char *dest, size_t dest_size, const rpc_request_t *req,
                           const char* err_msg) {
    size_t overall_length;

    if (dest == NULL) {
        return;
    }

    if (req == NULL) {
        return;
    }

    overall_length = COUNT_OF(RPC_ERROR_RESPONSE_FMT) + \
                     strlen(err_msg) + \
                     strlen(req->id);

    if (dest_size < overall_length) {
        // Won't produce a valid response
        return;
    }

    snprintf(dest, dest_size, RPC_ERROR_RESPONSE_FMT, req->id, err_msg);
}

void print_error_response(kanoSerial *serialHandle, const rpc_request_t *req,
                          const char *err_msg) {
    char buf[ERROR_BUF_SIZE] = "\0";

    if (serialHandle == NULL) {
        return;
    }

    format_error_response(buf, sizeof(buf), req, err_msg);

    serialHandle->println(buf);
}

void format_success_response(char *dest, size_t dest_size,
                             const rpc_request_t *req) {
    size_t overall_length;

    if (dest == NULL) {
        return;
    }

    if (req == NULL) {
        return;
    }

    overall_length = COUNT_OF(RPC_SUCCESS_RESPONSE_FMT) + \
                     strlen(req->id);
    if (dest_size < overall_length) {
        // Won't produce a valid response
        return;
    }

    snprintf(dest, dest_size, RPC_SUCCESS_RESPONSE_FMT, req->id);
}

void print_success_response(kanoSerial *serialHandle, const rpc_request_t *req) {
    char buf[ERROR_BUF_SIZE] = "\0";

    if (serialHandle == NULL) {
        return;
    }

    format_success_response(buf, sizeof(buf), req);
    serialHandle->println(buf);
}
