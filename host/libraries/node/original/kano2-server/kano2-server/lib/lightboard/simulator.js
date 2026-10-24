"use strict";

let AbstractLightboard = require('./abstract'),
    Simulator = require('../simulator'),
    colourHelpers = require("../../utils/colourHelpers");

class SimulatorLightboard extends AbstractLightboard {
    constructor (serialBridge, config) {
        super(serialBridge, config);
        this.prevPixels = [];
        SimulatorLightboard.serialBridge = serialBridge;
        SimulatorLightboard.simulator.start();
    }

    displayOnHW() {
        let i,
            rgb565,
            simArray = new Array(this.totalPixels);

        for (i = 0; i < this.totalPixels; i++) {
            rgb565 = new Buffer(2);
            this._internalRepresentation.copy(rgb565, 0, i * 2, i * 2 + 2);
            simArray[i] = colourHelpers.colorRGB565ToHex(rgb565);
        }

        SimulatorLightboard.simulator.write({ type: 'pixels', data: simArray }).then(() => {});
    }
}

// Static simulator shared across instances
SimulatorLightboard.simulator = new Simulator('./simulators/lightboard');
SimulatorLightboard.simulator.on('event', (data) => {
    if (SimulatorLightboard.serialBridge) {
        SimulatorLightboard.serialBridge.eventStream.emit(data.type, data.data);
    }
});

module.exports = SimulatorLightboard;
