"use strict";

const LightboardLive = require('./lightboard-live'),
      LightboardOff = require('./lightboard-off'),
      LightboardOffline1 = require('./lightboard-offline-1'),
      LightboardOffline2 = require('./lightboard-offline-2'),
      UserProgram = require('../user-program'),
      Lightboard = require('../../lightboard');

module.exports = (serialBridge, config) => {
    let lightboard = new Lightboard(serialBridge, config);
    return {
        registerSerialMethods (deviceControl) {
            lightboard.registerSerialMethods(deviceControl);
        },
        unregisterSerialMethods (deviceControl) {
            lightboard.unregisterSerialMethods(deviceControl);
        },
        clearBoardLeds() {
            lightboard.clearBoardLeds();
        },
        modes: {
            "live" : new LightboardLive(lightboard, config),
            "off" : new LightboardOff(lightboard, config),
            "offline-1": new LightboardOffline1(lightboard, config),
            "offline-2": new LightboardOffline2(lightboard, config),
            "online-p1": new UserProgram(config, '1'),
            "online-p2": new UserProgram(config, '2'),
            "online-p3": new UserProgram(config, '3')
        }
    };
};
