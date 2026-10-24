'use strict';

const Battery = require('../lib/battery'),
      SerialBridge = require('../lib/serial_bridge'),
      Lightboard = require('../lib/lightboard'),
      ModeManager = require('../mode-manager'),
      BatteryAnimation = require('../lib/programs/lightboard/animations/battery'),
      SHUT_DOWN_CMD = 'sudo systemctl poweroff';

let monitorBattery;

class MonitorBattery {
    constructor (config) {
        this.config = config;
        this.serialBridge = SerialBridge(this.config);

        this.lightboard = new Lightboard(this.serialBridge, this.config);
        this.renderCallback = this.lightboard.render.bind(this.lightboard);
        this.modeManager = ModeManager(config);

        this.battery = Battery(this.config);
        this.batteryAnimation = new BatteryAnimation(this.config, this.renderCallback);

        this.batteryChanged = this.batteryChanged.bind(this);

        this.interval = null;
        this.status = null;
        this.percent = null;

        this.displayedLowLevelAnimation = false;
        this.displayedChargingAnimation = false;

        this.battFlashingInterval = null;
    }

    resetSerial () {
        return new Promise ((resolve, reject) => {
            this.serialBridge.call('reset-serial', [], function (err, value) {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        });
    }

    changeLedState (state) {
        this.battLedOn = state;
        this.serialBridge.call(`led-turn-${state}`, [{"id": "batt"}], function (err, value) {});
    }

    batteryStatusCallback (data) {
        if (data.err) {
            this.status = this.percent = null;
            this.displayedChargingAnimation = this.displayedLowLevelAnimation = false;
            if (this.battFlashingInterval) {
                this.battFlashingInterval = clearInterval(this.battFlashingInterval);
            }
            if (this.battLedOn) {
                this.changeLedState('off');
            }
            return;
        }

        this.status = data.status;
        this.percent = data.percent;

        if (this.percent <= 0 && this.status === Battery.DISCHARGING) {
            console.log("Not enough battery, shutting down the board.");
            if (this.modeManager.startNotification()) {
                this.displayedLowLevelAnimation = true;
                this.displayNotification('empty').then(() => {
                    exec(SHUT_DOWN_CMD, (err, stdout, stderr) => {
                        if (err) {
                            console.log("Not able to shut down the board");
                        }
                    });
                });
            }
            return;
        }

        // Reset
        if (this.status === Battery.DISCHARGING) {
            this.displayedChargingAnimation = false;
            if (this.battFlashingInterval) {
                this.battFlashingInterval = clearInterval(this.battFlashingInterval);
            }
            if (this.percent > 10 && this.battLedOn === 'on') {
                this.changeLedState('off');
            }
        } else {
            this.displayedLowLevelAnimation = false;
        }

        // Manage led
        if (!this.battFlashingInterval && this.status === Battery.CHARGING) {
            this.battFlashingInterval = setInterval(() => {
                this.changeLedState((this.battLedOn === 'on') ? 'off' : 'on');
            }, 1000);
        } else if (this.percent <= 10 && this.status !== Battery.CHARGING) {
            this.changeLedState('on');
        }

        // Display animation
        if (this.status === Battery.CHARGING) {
            if (this.displayedChargingAnimation || this.modeManager.isLive) {
                return;
            }

            if (this.modeManager.startNotification()) {
                this.displayedChargingAnimation = true;
                this.displayNotification('charging').then(() => {
                    this.modeManager.stopNotification();
                });
            }

        } else {
            if (this.percent > 10 || this.displayedLowLevelAnimation || this.modeManager.isLive) {
                return;
            }

            if (this.modeManager.startNotification()) {
                this.displayedLowLevelAnimation = true;
                this.displayNotification('empty').then(() => {
                    this.modeManager.stopNotification();
                });
            }
        }
    }

    batteryChanged () {
        this.batteryStatusCallback(this.battery.getStatus());
    }

    displayNotification (mode) {
        this.batteryAnimation.setMode(mode);
        this.batteryAnimation.setCharge(this.percent);
        this.batteryAnimation.start();
        return this.batteryAnimation.finished;
    }

    start () {
        this.battery.on('percent-update', this.batteryChanged);
        this.battery.on('status-update', this.batteryChanged);
    }

    stop () {
        this.battery.removeListener('percent-update', this.batteryChanged);
        this.battery.removeListener('status-update', this.batteryChanged);
        clearInterval(this.battFlashingInterval);
    }
}


module.exports = function getOrCreateMonitorBattery(config) {
    if (!monitorBattery) {
        monitorBattery = new MonitorBattery(config);
    }
    return monitorBattery;
}
