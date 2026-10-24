/* Copyright 2016 Kano Computing Ltd. */
#ifndef COLOURHELPERS_H
#define COLOURHELPERS_H
#include <stdint.h>

void hexToRgb(const char* clrHex, unsigned int &r, unsigned int &g, unsigned int &b);
void base64ToRgb(const char* inpbuf, uint16_t* colours);
void hslToRGB(float hue, float saturation, float luminance, uint8_t *red, uint8_t *green, uint8_t *blue);



#endif  // COLOURHELPERS_H
