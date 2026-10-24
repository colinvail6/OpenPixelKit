/* Copyright 2016 Kano Computing Ltd. */
#ifndef UTILS_H
#define UTILS_H

#define COUNT_OF(X) (sizeof(X) / sizeof(X[0]))

#define ERROR_BUF_SIZE 120
#define DEBUG_PRINT(X) do {       \
        char buf[ERROR_BUF_SIZE]; \
        snprintf(buf, sizeof(buf), "%s:%d - %s", __func__, __LINE__, X); \
        serialHandle->println(buf); \
    }while(0)


#endif  // UTILS_H
