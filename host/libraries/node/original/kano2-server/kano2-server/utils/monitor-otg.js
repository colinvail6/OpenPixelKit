'use strict';
const dgram = require('dgram');

let monitorOTG;

class MonitorOTG {
    constructor(config) {
       this.config = config;
       return this;
    }

    start(callback) {
        this.callback = callback;
        this.server = dgram.createSocket('udp4');
        this.server.on('message', this.callback);
        this.server.bind(22410, "localhost");
    }
}
module.exports = function getOrCreateMonitorOTG(config) {
    if (!monitorOTG) {
        monitorOTG = new MonitorOTG(config);
    }
    return monitorOTG;
}
