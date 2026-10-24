"use strict";

const AbstractLightboard = require('./abstract'),
      Microphone = require('../microphone'),
      EVENTS_TO_PROXY = ['button-down', 'button-up'],
      MAX_FPS = 20;

let hardwareLightboard;

class HardwareLightboard extends AbstractLightboard {
    constructor (serialBridge, config) {
        super(serialBridge, config);
        this.config = config;

        this.lastEvent = Date.now();

        this.microphone = Microphone(this.config);
        this.microphoneOnVolumeThresholdCb = this.microphoneOnVolumeThreshold.bind(this);

        this.methods = {
            'lightboard:on': (data) => {
                this.throttle(() => {
                    if (Array.isArray(data.pixels)) {
                        this.render(data.pixels);
                    }
                });
            },
            'lightboard:init': (info) => {}
        }
    }

    throttle(cb) {
        var currentDate = Date.now(),
            diff = (currentDate - this.lastEvent),
            maxDelay = 1000 / MAX_FPS;
        if (diff > maxDelay) {
            cb();
            this.lastEvent = currentDate;
        }
    }

    registerSerialMethods (deviceControl) {
        this.serialListeners = Object.keys(this.methods).reduce((acc, eventName) => {
            // Wrap the method and invoke the callback with no error;
            let method = (data, callback) => {
                this.methods[eventName](data);
                callback(null);
            };
            deviceControl.on(eventName, method);
            // Store the wrapper method for unregistering purposes
            acc[eventName] = method;
            return acc;
        }, {});
        // Add listeners to the serialBridge and proxy the events to the serial connection
        // Save these listeners so we can remove them later on
        this.serialBridgeListeners = EVENTS_TO_PROXY.reduce((acc, eventName) => {
            // Listener wrapper
            let method = (data) => {
                deviceControl.emit(eventName, data);
            };
            // Listen on the serial bridge
            this.serialBridge.on(eventName, method);
            // Store the listener under the event name
            acc[eventName] = method
            return acc;
        }, {});
        this.serialRegistered = true;
    }

    unregisterSerialMethods (deviceControl) {
        if (!this.serialRegistered) {
            return;
        }
        // Stop listening to the serial connection events
        Object.keys(this.serialListeners).forEach((eventName, listener) => {
            deviceControl.removeListener(eventName, listener);
        });
        // Stop proxying the events from the serial bridge to the serial connection
        Object.keys(this.serialBridgeListeners).forEach(eventName => {
            // FIXME For some reason, the removeListener method errors sometimes. Investigate to remove the try/catch
            try {
                this.serialBridge.removeListener(eventName, this.serialBridgeListeners[eventName]);
            } catch (e) {}
        });
        this.serialRegistered = false;
    }

    registerWSMethods (socket) {
        Object.keys(this.methods).forEach(eventName => {
            socket.on(eventName, this.methods[eventName]);
        });
        this.wsBridgeListeners = EVENTS_TO_PROXY.reduce((acc, eventName) => {
            let method = (data) => {
                socket.emit(eventName, data);
            };
            this.serialBridge.on(eventName, method);
            acc[eventName] = method
            return acc;
        }, {});
        this.startMicrophoneEmitter(socket);
        this.wsRegistered = true;
    }

    unregisterWSMethods (socket) {
        if (!this.wsRegistered) {
            return;
        }
        // Stop listening to the web socket connection events
        Object.keys(this.methods).forEach(eventName => {
            socket.removeListener(eventName, this.methods[eventName]);
        });
        // Stop proxying the events from the serial bridge to the web socket connection
        Object.keys(this.wsBridgeListeners).forEach(eventName => {
            // FIXME For some reason, the removeListener method errors sometimes. Investigate to remove the try/catch
            try {
                this.serialBridge.removeListener(eventName, this.wsBridgeListeners[eventName]);
            } catch (e) {}
        });
        this.stopMicrophoneEmitter();
        this.wsRegistered = false;
    }

    microphoneOnVolumeThreshold (volume) {
        this.currentVolume = volume;
    }

    startMicrophoneEmitter (socket) {
        this.stopMicrophoneEmitter();
        this.microphone.onVolumeThreshold(1, this.microphoneOnVolumeThresholdCb);

        this.microphoneEmitInterval = setInterval(() => {
            socket.emit('volume', this.currentVolume);
        }, 50); // TODO: Interval has to be adjusted
    }

    stopMicrophoneEmitter () {
        this.microphone.removeOnVolumeThreshold(this.microphoneOnVolumeThresholdCb);
        this.microphoneEmitInterval = clearInterval(this.microphoneEmitInterval);
    }

    displayOnHW () {
        let packet = [{ map: this.toStringBase64() }];

        this.serialBridge.call('grid-bmp', packet, function () {});
    }

    playTone (freq, duration) {
        if (freq && duration) {
            let packet = [{ freq, duration }];
            this.serialBridge.call('play-tone', packet, () => {});
        }
    }

    turnLightOn (id) {
        if (id) {
            let packet = [{ id }];
            this.serialBridge.call('led-turn-on', packet, () => {});
        }
    }

    turnLightOff (id) {
        if (id) {
            let packet = [{ id }];
            this.serialBridge.call('led-turn-off', packet, () => {});
        }
    }

}

module.exports = function getOrCreateHardwareLightboard(serialBridge, config) {
    if (!hardwareLightboard) {
        hardwareLightboard = new HardwareLightboard(serialBridge, config);
    }
    return hardwareLightboard;
};
