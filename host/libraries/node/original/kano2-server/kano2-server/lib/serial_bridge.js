"use strict";
let RPCClient = require('kano2-shared-lib/lib/device-bus/client'),
    RPCEventStream = require('kano2-shared-lib/lib/device-bus/event-stream'),
    SerialChannel = require('kano2-shared-lib/lib/device-bus/channels/serial'),
    serialBridge;

class SerialBridge {
    constructor (config) {
        let channel = new SerialChannel(config.kit_device.serial_path, {
            baudRate: config.kit_device.baud_rate,
            // the KS pixel kit has buffer overflows unless we use software flow control.
            xon: true,
            xoff: true,
            padLength: config.kit_device.pad_length
        });
        this.channel = channel;
        this.client = new RPCClient(channel);
        this.eventStream = new RPCEventStream(channel);
    }

    call () {
        this.client.call.apply(this.client, arguments);
        return this;
    }

    resetSerial (callback) {
        // send a break for 5ms
        this.channel.sendBreak(5, callback);
    }

    on () {
        this.eventStream.on.apply(this.eventStream, arguments);
        return this;
    }

    removeListener () {
        this.eventStream.removeListener.apply(this.eventStream, arguments);
        return this;
    }

    removeAllListeners () {
        this.eventStream.removeAllListeners.apply(this.eventStream, arguments);
        return this;
    }
}

module.exports = function getOrCreateInstance(config) {
    if (!serialBridge) {
        serialBridge = new SerialBridge(config);
        serialBridge.on('error', (detail) => {
            console.log('Serial bridge error', detail.stack);
        });
    }
    return serialBridge;
};
