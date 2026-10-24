"use strict";
/** @module colourHelpers */


/**
 * ClampedToRGB565 - Helper fn to convert between an 8bit Uint RGBA8888 Array to a RGB565 Buffer
 *
 * @param  {Uint8ClampedArray} buf888 Buffer with raw Data from Canvas `getImageData` method
 *                                    includes 8-bit Uint data in R-G-B-A order
 * @return {Buffer}                   Returns a Buffer with the same data only compressed to the
 *                                    16 bit per pixel RGB565 format
 */
let clampedToRGB565 = function clampedToRGB565(buf888) {
        let plxCount = Math.floor(buf888.length / 4),  //input is RGBA8888 32-bit
            length565 = plxCount * 2,                  //output is RGB565 16-bit
            i,
            rgb888,
            rgb565,
            buf565,
            data;

        buf565 = new Buffer(length565);
        data = new Buffer(buf888);

        for (i = 0; i < plxCount; i++) {
            // rgb888 = rrggbbaa (in hex)
            rgb888 = data.readUInt32BE(i * 4);

            rgb888 = rgb888 >> 8; //Drop A
            rgb565 = (rgb888 & 0xF8) >> 3 | (rgb888 & 0xFC00) >> 5 | (rgb888 & 0xF80000) >> 8;
            buf565.writeUInt16BE(rgb565, i * 2);
        }

        return buf565;
    },

    /**
     * isValidColourFormat - Helper Fn to check if a hex colour value is valid
     *
     * @param  {string} colour Colour in hex format, will match if #xxxxxx
     * @return {boolean}        Trur iff it is valid
     */
    isValidColourFormat = function isValidColourFormat(colour) {
        if (typeof colour === "string" && colour.length === 7 && /#[0-9a-f]{6}/i.test(colour)) {
            return true;
        }
        return false;
    },


    /**
     * colorHexToRGB565 - Convert a color Hex string value to a 16-bit Uint RGB565 number
     *
     * @param  {string} colour A string hex representation of a colour (#xxxxxx)
     * @return {Buffer}        A 16 bit Buffer containing the uint RGB565 binary form of the input colour
     */
    colorHexToRGB565 = function colorHexToRGB565(colour) {
        let rgb888,
            rgb565,
            retBuf = new Buffer(2);

        if (!isValidColourFormat(colour)) {
            retBuf.writeUInt16BE(0x0000, 0);
            return retBuf;
        }
        rgb888 = parseInt(colour.substring(1, 7), 16);
        //                blue                 green                  red
        rgb565 = (rgb888 & 0xF8) >> 3 | (rgb888 & 0xFC00) >> 5 | (rgb888 & 0xF80000) >> 8;

        retBuf.writeUInt16BE(rgb565, 0);
        return retBuf;
    },

    /**
     * colorRGB565ToHex - Convert a color Hex string value to a 16-bit Uint RGB565 number
     *
     * @param  {Buffer} colour A string hex representation of a colour (#xxxxxx)
     * @return {Buffer}        A 16 bit Buffer containing the uint RGB565 binary form of the input colour
     */
    colorRGB565ToHex = function colorRGB565ToHex(colour) {
        let rgb888,
            rgb565;

        if (colour.length !== 2) {
            throw new Error("Input not in a 16 bit buffer");
        }
        rgb565 = colour.readUInt16BE(0);

        //                blue                 green                  red
        rgb888 =  (rgb565 & 0x1f) << 3 | (rgb565 & 0x7e0)  << 5 | (rgb565 & 0xf800) << 8;

        return "#" + ("000000" + rgb888.toString(16)).substring(rgb888.toString(16).length);
    },

    /**
     * colorHexToRGB888 - Convert a color Hex string value to a 24-bit Uint RGB888 number
     *
     * @param  {string} colour A string hex representation of a colour (#xxxxxx)
     * @return {Buffer}        A 24 bit Buffer containing the uint RGB888 binary form of the input colour
     */
    colorHexToRGB888 = function colorHexToRGB888(colour) {
        if (!isValidColourFormat(colour)) {
            throw new Error("Input not in the format #xxxxxx", colour);
        }

        return new Buffer(colour.substring(1, 7), 'hex');
    };

module.exports = {
    clampedToRGB565,
    isValidColourFormat,
    colorHexToRGB565,
    colorHexToRGB888,
    colorRGB565ToHex
};
