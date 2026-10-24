/* Copyright 2016 Kano Computing Ltd. */
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <math.h>

#include "colourHelpers.h"
#include <Base64.h>


void hexToRgb(const char* clrHex, unsigned int &r, unsigned int &g, unsigned int &b) {
    unsigned long int converted = 0UL;

    if (strlen(clrHex) != 7 || clrHex[0] != '#') {
        return;
    }

    converted = strtoul(&(clrHex[1]), NULL, 16);
    r = (converted & (0xffUL << 16)) >> 16;
    g = (converted & (0xffUL << 8)) >> 8;
    b = (converted & 0xffUL);
}

void base64ToRgb(const char* inpbuf, uint16_t* colours) {
    char bhu_inp[9];
    char buf[7] = {0};

    snprintf(bhu_inp, sizeof(bhu_inp), "%s", inpbuf);
    if (!inpbuf || !colours) {
        return;
    }

    if (strlen(inpbuf) < 8) {
        return;
    }

    Base64.decode(buf, bhu_inp, 8);

    colours[0] = buf[0] << 8| (uint8_t) buf[1];
    colours[1] = buf[2] << 8| (uint8_t) buf[3];
    colours[2] = buf[4] << 8| (uint8_t) buf[5];
}

// Adapted the algorithm from http://www.easyrgb.com/index.php?X=MATH&H=19#text19
inline float hueToRGB(float var1, float var2, float varH) {
    if (varH < 0)
        varH += 1;

    if (varH > 1)
        varH -= 1;

    if ( ( 6.0 * varH ) < 1.0 )
        return ( var1 + ( var2 - var1 ) * 6.0 * varH );
    if ( ( 2.0 * varH ) < 1.0 )
        return ( var2 );
    if ( ( 3.0 * varH ) < 2.0 )
        return ( var1 + ( var2 - var1 ) * ( ( 2.0 / 3.0 ) - varH ) * 6.0 );
    return var1;
}

void hslToRGB(float hue, float saturation, float luminance, uint8_t *red, uint8_t *green, uint8_t *blue) {
    // hsl in [0, 1]
    // rgb in [0, 255]
    float var_1, var_2;

    if (saturation == 0.0) {
        *red = roundf(255.0 * luminance);
        *green = roundf(255.0 * luminance);
        *blue = roundf(255.0 * luminance);
    } else {
        if (luminance < 0.5) {
            var_2 = luminance * (1.0 + saturation);
        } else {
            var_2 = (luminance + saturation) - (saturation * luminance);
        }

        var_1 = 2.0 * luminance - var_2;

        *red = roundf(255.0 * hueToRGB(var_1, var_2, hue + (1.0 / 3.0)));
        *green = roundf(255.0 * hueToRGB(var_1, var_2, hue));
        *blue = roundf(255.0 * hueToRGB(var_1, var_2, hue - (1.0 / 3.0)));
    }
}
