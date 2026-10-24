// Copyright 2017 Kano Computing Ltd.
#include <stdio.h>
#include <string.h>

#include "deviceBusRPC.h"

static const char response_label[] = "rpc-response";

static request_type_t typeFromLabel(const char *label) {
    request_type_t ret_value;

    if (label == NULL) {
        return INVALID_TYPE;
    }

    if (strcmp("rpc-request", label) == 0) {
        ret_value = RPC_REQUEST;
    } else if (strcmp("rpc-response", label) == 0) {
        ret_value = RPC_RESPONSE;
    } else if (strcmp("event", label) == 0) {
        ret_value = EVENT;
    } else {
        ret_value = INVALID_TYPE;
    }

    return ret_value;
}

request_type_t typeFromParsedJSON(JsonObject* root) {
    if (root == NULL) {
        return INVALID_TYPE;
    }

    if (!root->containsKey("type") || !(*root)["type"].is<const char*>()) {
        return INVALID_TYPE;
    }

    return typeFromLabel((*root)["type"].as<const char*>());
}

static bool isValidRPCRequest(JsonObject* root) {
    // At this point we assume it is valid and contains a "type" key

    if (root == NULL) {
        return false;
    }

    if (!root->containsKey("id") || !(*root)["id"].is<const char*>()) {
        return false;
    }

    if (!root->containsKey("params") || !(*root)["params"].is<JsonArray&>()) {
        return false;
    }

    return true;
}

static bool isValidRPCResponse(JsonObject* root) {
    // At this point we assume it is valid and contains a "type" key

    if (root == NULL) {
        return false;
    }

    if (!root->containsKey("id") || !(*root)["id"].is<const char*>()) {
        return false;
    }

    if (!root->containsKey("err")) {
        return false;
    }

    if (!root->containsKey("value")) {
        return false;
    }

    return true;
}

static bool isValidRPCEvent(JsonObject* root) {
    // At this point we assume it is valid and contains a "type" key

    if (root == NULL) {
        return false;
    }

    if (!root->containsKey("name") || !(*root)["id"].is<const char*>()) {
        return false;
    }

    if (!root->containsKey("detail")) {
        return false;
    }

    return true;
}

bool isValidRPCFormat(JsonObject* root) {
    request_type_t type = INVALID_TYPE;
    bool ret_value = false;

    if (root == NULL) {
        return false;
    }

    if (!root->success()) {
        return false;
    }

    if (!root->containsKey("type") || !(*root)["type"].is<const char*>()) {
        return false;
    }

    type = typeFromParsedJSON(root);

    switch (type) {
        case RPC_REQUEST:
            ret_value = isValidRPCRequest(root);
            break;
        case RPC_RESPONSE:
            ret_value = isValidRPCResponse(root);
            break;
        case EVENT:
            ret_value = isValidRPCEvent(root);
            break;
        case INVALID_TYPE:
        default:
            ret_value = false;
    }

    return ret_value;
}

void rpc_request_from_parsed_JSON(JsonObject* root, rpc_request_t * req) {
    // This fn assumes that you've already checked that root is a valid
    //  RPC Request fmt
    req->method = (*root)["method"].as<const char*>();
    req->id = (*root)["id"].as<const char*>();
    req->params = &((*root)["params"].asArray());
}

void init_rpc_response(const rpc_request_t *req , rpc_response_t *res) {
    if (!res || !req) {
        return;
    }

    res->err = NULL;
    res->id = req->id;
    res->value = NULL;
}

void JSON_response(JsonObject* root, const rpc_response_t * res) {
    root->set("type", response_label);
    root->set("id", res->id);
    root->set("err", res->err);
    root->set("value", NULL);
}
