"use strict";

let SimulatorLightboard = require('./simulator'),
    HardwareLightboard = require('./hardware'),
    Lightboard;

if (process.env.SIMULATOR) {
    Lightboard = SimulatorLightboard;
} else {
    Lightboard = HardwareLightboard;
}

module.exports = Lightboard;
