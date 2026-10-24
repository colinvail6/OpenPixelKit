"use strict";
const LightboardProgram = require('./program'),
      GamesMenuManager = require('./menus/games-menu');

class LightboardOfflineP2 extends LightboardProgram {
    constructor (lightboard, config) {
        super(lightboard);
        this.running = false;
        this.config = config;
    }

    start (serialBridge) {
        this.running = true;
        this.serialBridge = serialBridge;
        this.gamesMenuManager = new GamesMenuManager(this.config, this.lightboard.render.bind(this.lightboard));

        if (!this.paused) {
            this._run();
        }
    }

    getRunningManager () {
        return this.gamesMenuManager.getRunningManager();
    }

    pause () {
        this.paused = true;
    }

    _run () {
        if (this.running) {
            console.log('Running offline P2');
            this.gamesMenuManager.start(this.serialBridge);
        }
    }

    stop () {
        this.running = false;
        this.gamesMenuManager.stop();
    }

}

module.exports = LightboardOfflineP2;
