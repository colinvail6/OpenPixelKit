"use strict";
const LightBoard = require('../lib/lightboard'),
      SerialBridge = require('../lib/serial_bridge');

module.exports = (config) => {
    let serialBridge = SerialBridge(config),
        lightboard = new LightBoard(serialBridge, config);
    return {
        subscribe (socket, config) {
            lightboard.registerWSMethods(socket);
        },
        unsubscribe (socket, config) {
            lightboard.unregisterWSMethods(socket);
        }
    };
};
