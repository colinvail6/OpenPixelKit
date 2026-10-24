'use strict';

const SerialBridge = require('../lib/serial_bridge'),
    exec = require('child_process').exec,
    WiFi = require('../lib/wifi'),
    storage = require('kano2-shared-lib/lib/storage');

let factoryReset;
class FactoryReset {
    constructor (config) {
        this.config = config;
        this.storage = storage.init(this.config);
        this.serialBridge = SerialBridge(this.config);
        this.resetButtonTimeout;
    }

    start (callback) {
        this.serialBridge.on('button-down', data => {
            if (data['button-id'] == 'btn-reset') {
                this.resetButtonTimeout = setTimeout(() => {
                    callback();
                    let cmd = 'sudo /bin/bash tools/trigger_reset.sh';
                    exec(cmd, (err, stdout, stderr) => {
                        console.log("Resetting system err: ", err);
                    });

                }, this.config.device_control.factory_reset_timeout);
            }
        });
        this.serialBridge.on('button-up', data => {
            if (data['button-id'] == 'btn-reset') {
                clearTimeout(this.resetButtonTimeout);
            }
        });
    }
}


module.exports = function (config) {
    if (!factoryReset) {
        factoryReset = new FactoryReset(config);
    }
    return factoryReset;
};
