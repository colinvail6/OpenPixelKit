'use strict';

const SerialBridge = require('../lib/serial_bridge'),
      Lightboard = require('../lib/lightboard'),
      ModeManager = require('../mode-manager'),
      Wifi = require('../lib/wifi'),
      WifiFoundAnimation = require('../lib/programs/lightboard/animations/wifi-found'),
      WifiSearchingAnimation = require('../lib/programs/lightboard/animations/wifi-searching');

let monitorWifi;

class MonitorWifi {
    constructor (config) {
        this.config = config;
        this.serialBridge = SerialBridge(this.config);

        this.lightboard = new Lightboard(this.serialBridge, this.config);
        this.renderCallback = this.lightboard.render.bind(this.lightboard);
        this.modeManager = ModeManager(config);

        this.foundAnimation = new WifiFoundAnimation(this.config, this.renderCallback);
        this.searchingAnimation = new WifiSearchingAnimation(this.config, this.renderCallback);

        this._onConnectionStarted = this._onConnectionStarted.bind(this);
        this._onConnectionSuccess = this._onConnectionSuccess.bind(this);
        this._onConnectionFailure = this._onConnectionFailure.bind(this);

        this.scanning = false;

    }

    _onConnectionStarted () {
        if (!this.scanning) {
            if (this.modeManager.startNotification()) {
                this.searchingAnimation.start();
            }
        }
        this.scanning = true;
    }

    _onConnectionSuccess () {
        this.scanning = false;
        this.searchingAnimation.stop();
        this.foundAnimation.start();
        this.foundAnimation.finished.then(() => {
            this.modeManager.stopNotification();
        });
        setTimeout(() => {
            this.foundAnimation.stop();
        }, 5000);
    }

    _onConnectionFailure () {
        this.scanning = false;
        this.searchingAnimation.stop();
        this.modeManager.stopNotification();
    }

    start () {
        // Listen to events
        Wifi.on('connection-attempt', this._onConnectionStarted);
        Wifi.on('connection-success', this._onConnectionSuccess);
        Wifi.on('connection-failure', this._onConnectionFailure);
    }

    stop () {
        // Unbind events
        Wifi.removeListener('connection-attempt', this._onConnectionStarted);
        Wifi.removeListener('connection-success', this._onConnectionSuccess);
        Wifi.removeListener('connection-failure', this._onConnectionFailure);
    }
}


module.exports = function getOrCreateMonitorWifi(config) {
    if (!monitorWifi) {
        monitorWifi = new MonitorWifi(config);
    }
    return monitorWifi;
}
