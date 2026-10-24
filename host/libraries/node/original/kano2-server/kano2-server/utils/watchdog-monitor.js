'use strict';

const SerialBridge = require('../lib/serial_bridge'),
      Logger = require('kano2-shared-lib/lib/logger');

let watchdogMonitor;
class WatchdogMonitor {
    constructor(config) {
        this.config = config;
        this.serialBridge = SerialBridge(this.config);
        this.timer = null;
        this.interval = 2000; // half the time which the MCU is set to reset after
        this.allowedReset = false;
        this.log = Logger.getLogger('kano2-server', config.logLevel);
    }

    timerTick() {
        if (this.allowedReset) {
            // if we reset last time, then stop the bootup animation
            this.serialBridge.call("start-anim-control", [{"blackout-incr": 100}], (err, value) => {
                this.log.debug("error calling start-anim-control", err);
            });
        }
        // assuming no reply, set interval to long, to allow a reset
        this.changeTimeout(this.interval * 3);
        this.allowedReset = true;
        this.serialBridge.call("watchdog-reset", [], () => {
            // we got a reply, so reduce timer to prevent resetting of MCU
            this.changeTimeout(this.interval);
            this.allowedReset = false;
        });
    }

    changeTimeout(timeout) {
        clearTimeout(this.timer);
        this.timer = setTimeout(() =>  this.timerTick(), timeout);
    }

    start() {
        this.serialBridge.call("watchdog-enable", [], () => {
            this.changeTimeout(this.interval);
        });
    }
}


module.exports = function (config) {
    if (!watchdogMonitor) {
        watchdogMonitor = new WatchdogMonitor(config);
    }
    return watchdogMonitor;
};
