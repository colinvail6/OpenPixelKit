"use strict";

const LightboardProgram = require('./program');

class LightboardLive extends LightboardProgram {
    constructor (lightboard, config) {
        super(lightboard);
        this.running = false;
        this.paused = false;
        this.config = config;
    }

    start () {
        if (this.paused) {
            this.paused = false;
        }
        this.running = true;
    }

    pause () {
        this.paused = true;
    }

    stop () {
        this.running = false;
    }

    getRunningManager () {
        return this;
    }
}

module.exports = LightboardLive;
