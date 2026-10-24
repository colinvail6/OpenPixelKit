"use strict";
const LightboardProgram = require('./program');

class LightboardOff extends LightboardProgram {
    constructor (lightboard, config) {
        super(lightboard);
        this.running = false;
        this.config = config;
    }

    start (serialBridge) {
        this.serialBridge = serialBridge;
        this.running = true;
        this._run();
    }

    _run () {
        if (this.running) {
            console.error('clearing leds');
            this.serialBridge.call('watchdog-disable', [], () => {
                this.lightboard.paintColour('#000000');
                setTimeout(() => this._run(), 300);
            });
        }
    }

    stop () {
        this.running = false;
    }

}

module.exports = LightboardOff;
