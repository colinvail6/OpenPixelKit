/* Copyright 2016 Kano Computing Ltd. */
#include "parameterFormatHelpers.h"
#include "errors.h"

#include "Arduino.h"


bool verify_input_params(const rpc_request_t *req, kanoSerial *serialHandle) {
    if (req == NULL) {
        print_error_event(
            serialHandle,
            "Didn't pass request to the controller");
        return false;
    }

    if (!req->params->success()) {
        print_error_response(serialHandle, req, "Couldn't decode params array");
        return false;
    }

    if (req->params->size() != 1) {
        print_error_response(
            serialHandle,
            req,
            "Params array must contain 1 object");

        return false;
    }

    if (!req->params->get(0).is<JsonObject &>()) {
        print_error_response(
            serialHandle,
            req,
            "1st element of the list isn't an object");
        return false;
    }
    return true;
}

static bool key_exists(const rpc_request_t *req, JsonObject *data,
                       const char* key, kanoSerial *serialHandle) {
    char err_msg[32];

    if (data == NULL) {
        return false;
    }

    if (!data->containsKey(key)) {
        const char err_fmt[] = "%s key not found";

        snprintf(err_msg, sizeof(err_msg), err_fmt, key);

        print_error_response(serialHandle, req, err_msg);
        return false;
    }

    return true;
}

static bool optional_key_exists(const rpc_request_t *req, JsonObject *data,
                                const char *key) {
    if (data == NULL) {
        return false;
    }

    if (!data->containsKey(key)) {
        return false;
    }

    return true;
}

bool key_exists_and_is_string(const rpc_request_t *req, JsonObject *data,
                              const char* key, kanoSerial *serialHandle) {
    if (data == NULL) {
        return false;
    }

    if (!key_exists(req, data, key, serialHandle)) {
        return false;
    }

    if (!(*data)[key].is<const char*>()) {
        char err_msg[32];
        const char err_fmt[] = "value of %s isn't a string";

        snprintf(err_msg, sizeof(err_msg), err_fmt, key);

        print_error_response(serialHandle, req, err_msg);
        return false;
    }

    return true;
}

bool key_exists_and_is_int(const rpc_request_t *req, JsonObject *data,
                            const char* key, kanoSerial *serialHandle) {
    char err_msg[32];
    if (data == NULL) {
        return false;
    }

    if (!key_exists(req, data, key, serialHandle)) {
        return false;
    }

    if (!(*data)[key].is<int>()) {
        const char err_fmt[] = "value of %s isn't an int";

        snprintf(err_msg, sizeof(err_msg), err_fmt, key);

        print_error_response(serialHandle, req, err_msg);
        return false;
    }

    return true;
}

bool key_exists_and_is_uint(const rpc_request_t *req, JsonObject *data,
                            const char* key, kanoSerial *serialHandle) {
    char err_msg[32];
    if (data == NULL) {
        return false;
    }

    if (!key_exists(req, data, key, serialHandle)) {
        return false;
    }

    if (!(*data)[key].is<unsigned int>()) {
        const char err_fmt[] = "value of %s isn't a uint";

        snprintf(err_msg, sizeof(err_msg), err_fmt, key);

        print_error_response(serialHandle, req, err_msg);
        return false;
    }

    if ((*data)[key].as<int>() < 0) {
        const char err_fmt[] = "value of %s is negative";

        snprintf(err_msg, sizeof(err_msg), err_fmt, key);

        print_error_response(serialHandle, req, err_msg);
        return false;
    }

    return true;
}

bool optional_key_exists_and_is_uint(const rpc_request_t *req, JsonObject *data,
                                     const char* key, kanoSerial *serialHandle) {
    char err_msg[32];
    if (data == NULL) {
        return false;
    }

    if (!optional_key_exists(req, data, key)) {
        return false;
    }

    if (!(*data)[key].is<unsigned int>()) {
        const char err_fmt[] = "value of %s isn't a uint";

        snprintf(err_msg, sizeof(err_msg), err_fmt, key);

        print_error_response(serialHandle, req, err_msg);
        return false;
    }

    if ((*data)[key].as<int>() < 0) {
        const char err_fmt[] = "value of %s is negative";

        snprintf(err_msg, sizeof(err_msg), err_fmt, key);

        print_error_response(serialHandle, req, err_msg);
        return false;
    }

    return true;
}

bool optional_key_exists_and_is_bool(const rpc_request_t *req, JsonObject *data,
                                     const char* key, kanoSerial *serialHandle) {
    char err_msg[32];
    if (data == NULL) {
        return false;
    }

    if (!optional_key_exists(req, data, key)) {
        return false;
    }

    if (!(*data)[key].is<bool>()) {
        const char err_fmt[] = "value of %s isn't a bool";

        snprintf(err_msg, sizeof(err_msg), err_fmt, key);

        print_error_response(serialHandle, req, err_msg);
        return false;
    }

    return true;
}
