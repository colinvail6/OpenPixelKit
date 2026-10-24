"use strict";
const LightboardProgram = require('./program'),
      LightshowMenuManager = require('./menus/lightshow-menu');

class LightboardOfflineP1 extends LightboardProgram {
    constructor(lightboard, config) {
        super(lightboard);
        this.running = false;
        this.paused = false;
        this.config = config;
        this.lightshowMenuManager = null;
        this.lightshowMenuManager = null;
    }

    start (serialBridge) {
        this.running = true;
        this.serialBridge = serialBridge;
        this.lightshowMenuManager = new LightshowMenuManager(this.config, this.lightboard.render.bind(this.lightboard));

        if (!this.paused) {
            this._run();
        }
    }

    getRunningManager () {
        return (this.lightshowMenuManager) ? this.lightshowMenuManager.getRunningManager() : this;
    }

    pause () {
        this.paused = true;
    }

    _run () {
        if (this.running) {
            console.log("Running offline P1 - " + new Date().toISOString());
            this.lightshowMenuManager.start(this.serialBridge);
        }
    }

    stop () {
        this.running = false;
        this.lightshowMenuManager.stop();
    }
}

module.exports = LightboardOfflineP1;
