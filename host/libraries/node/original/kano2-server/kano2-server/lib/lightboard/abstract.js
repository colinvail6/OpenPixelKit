"use strict";

const colourHelpers = require("../../utils/colourHelpers");


class AbstractLightboard {
    constructor (serialBridge, config) {
        let lightconf = config.lightboard;

        this.serialBridge = serialBridge;
        this.config = config;

        this.dimensions = {
            x: lightconf.x_count,
            y: lightconf.y_count
        };


        this.noOfChannels = this.config.lightboard.channels_per_px;
        this._internalRepresentation = new Buffer(this.totalPixels * this.noOfChannels, 0);
        this._internalRepresentation.fill(0);
    }

    setPixelColour(x, y, colour) {
        this.setPixelColourLinear((y * this.dimensions.x + x), colour);
    }

    setPixelColourLinear(pxlIndex, colour) {
        let colourBin;

        colourBin = colourHelpers.colorHexToRGB565(colour);
        colourBin.copy(this._internalRepresentation, pxlIndex * this.noOfChannels);
    }

    get totalPixels () {
        return this.dimensions.x * this.dimensions.y;
    }

    toStringBase64 () {
        return this._internalRepresentation.toString('base64');
    }

    fillBufferWithColour(colour) {
        let i,
            colourBin;
        colourBin = colourHelpers.colorHexToRGB565(colour);

        for (i = 0; i < this.totalPixels; i++) {
            colourBin.copy(this._internalRepresentation, i * this.noOfChannels);
        }
    }

    paintColour (colour) {
        this.fillBufferWithColour(colour);
        this.displayOnHW();
    }

    paintPixel (pxlIndex, colour) {
        this.setPixelColourLinear(pxlIndex, colour);
        this.displayOnHW();
    }

    clearBoardLeds () {
        this.render(new Array(this.totalPixels).fill(this.config.lightboard.background_color));
    }

    render (pixelsArr) {
        let plxIndex = 0,
            plsToUpdate = Math.min(pixelsArr.length, this.totalPixels);

        for (plxIndex = 0; plxIndex < plsToUpdate; plxIndex++) {
            if (pixelsArr[plxIndex]) {
                this.setPixelColourLinear(plxIndex, pixelsArr[plxIndex]);
            }
        }

        this.displayOnHW();

    }

    displayOnHW () {}

    playTone () {}

    registerSerialMethods () {}
    unregisterSerialMethods () {}
    registerWSMethods () {}
    unregisterWSMethods () {}
}

module.exports = AbstractLightboard;
