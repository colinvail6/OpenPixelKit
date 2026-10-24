"use strict";
let Lightboard = require("../../../lightboard"),
    ProgramNotFoundAnimation = require('./program-not-found').ProgramNotFoundAnimation,
    ProgramNotFoundInactiveAnimation = require('./program-not-found').ProgramNotFoundInactiveAnimation,
    MissingWifiAnimation = require('./missing-wifi'),
    MissingDongleAnimation = require('./missing-dongle'),
    name = require('../../../name'),
    sharedPrograms;

class SharedPrograms {
    constructor(config, serialBridge) {
        this.config = config;
        this.serialBridge = serialBridge;
        this.lightboard = new Lightboard(serialBridge, this.config);
        this.renderCallback = this.lightboard.render.bind(this.lightboard);
        name.init(this.config);
    }

    programNotFound (id) {
        this.stop();
        if (name.getName()) {
            this.programNotFoundAnimation = new ProgramNotFoundAnimation(this.config, this.renderCallback);
        } else {
            this.programNotFoundAnimation = new ProgramNotFoundInactiveAnimation(this.config, this.renderCallback);
        }
        this.programNotFoundAnimation.setId(id);
        this.programNotFoundAnimation.start();
    }

    missingWifi () {
        this.stop();
        this.missingWifiAnimation = this.missingWifiAnimation ||  new MissingWifiAnimation(this.config, this.renderCallback);
        this.missingWifiAnimation.start();
    }

    missingDongle (id) {
        this.stop();
        this.missingDongleAnimation = this.missingDongleAnimation || new MissingDongleAnimation(this.config, this.renderCallback);
        this.missingDongleAnimation.setId(id);
        this.missingDongleAnimation.start();
    }

    stop() {
        ['missingWifiAnimation', 'programNotFoundAnimation', 'missingDongleAnimation'].forEach((elem) => {
            if (this[elem]) {
                this[elem].stop();
            }
        });
    }
}

module.exports = function getOrCreateSharedPrograms(config, serialBridge) {
    if (!sharedPrograms) {
        sharedPrograms = new SharedPrograms(config, serialBridge);
    }
    return sharedPrograms;
};
