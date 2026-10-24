/* Copyright 2016 Kano Computing Ltd. */
#ifndef ERRORS_H
#define ERRORS_H

#include "deviceBusRPC.h"
#include "Arduino.h"

void format_error_response(char *dest, size_t dest_size, const rpc_request_t *req,
                           const char* err_msg);
void format_error_event(char *dest, size_t dest_size, const char* err_msg);
void format_success_response(char *dest, size_t dest_size,
                             const rpc_request_t *req);

void print_error_event(Serial_ *serialHandle, const char *err_msg);
void print_error_response(Serial_ *serialHandle, const rpc_request_t *req,
                          const char *err_msg);
void print_success_response(Serial_ *serialHandle, const rpc_request_t *req);



#endif  // ERRORS_H
