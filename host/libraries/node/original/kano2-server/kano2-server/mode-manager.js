"use strict";

const EventEmitter = require('events').EventEmitter,
      SerialBridge = require('./lib/serial_bridge'),
      LightboardPrograms = require('./lib/programs/lightboard'),
      LIVE_MODE_TYPES = ['ws', 'otg'];


let modeManager;

class ModeManager extends EventEmitter {
    constructor (config) {
        super();
        let MODES = {
                lightboard: LightboardPrograms
            },
            DEFAULT_MODES =  {
                lightboard: 'offline-1'
            };
        this.log = config.log;
        this.config = config;
        this.serialBridge = SerialBridge(config);
        this.device = config.device;
        this.isResetting = false;
        this.DEFAULT_MODES = DEFAULT_MODES;
        // Load the device mode selected when started
        // This will require only the programs needed for this device mode
        if (typeof MODES[this.device] === 'undefined') {
            throw new Error(`Unknown device: ${this.device}`);
        }
        this.programs = MODES[this.device](this.serialBridge, config);
        this.modes = this.programs.modes;

        this.runningProgram = null;
        this.closeCallback = null;
        this.firstReset = true;
        this.modeKey = null;

        this.systemMode = 'program';
        this.enabedLiveMode = {};

        this.serialClosedCb = this.serialClosedCallback.bind(this);

        // Catch 'TERM' signal and run stop().

        process.on('SIGTERM', () => {
            this.log.info('stopping');
            this.stop();
            setTimeout(() => {
                if (this.closeCallback) {
                    this.closeCallback();
                }
                this.log.info('exiting');
                process.exit(0);
            }, 1000);
        });
    }

    serialClosedCallback () {
        this.disableLiveMode({ connection: 'otg' });
        this.programs.unregisterSerialMethods(this.deviceControl);
        this.deviceControl.channel.removeListener('disconnect', this.serialClosedCb);
    }

    startDeviceControl () {
        // Lazy require is a bad pattern, but this allows a better boot time
        let DeviceControl = require('./lib/device-control');

        this.deviceControl = DeviceControl.getInstance(this.config, this.device || 'unspecified');
        this.deviceControl.on('enable-otg-control', () => {
            this.enableLiveMode({ connection: 'otg' })
                .then(() => {
                    this.programs.registerSerialMethods(this.deviceControl);
                })
                .catch(err => {
                    this.log.debug('Unable to enable the live mode', err);
                });
            this.deviceControl.on('disable-otg-control', this.serialClosedCb);
            this.deviceControl.channel.on('disconnect', this.serialClosedCb);
        });
    }

    setCloseCallback(cb) {
        this.closeCallback = cb;
        return this;
    }

    start () {
        let default_mode = this.DEFAULT_MODES[this.device];

        this.log.info('Started kano2-mode-app');

        if (this.device) {
            this.log.info('Running mode manager for', this.device);

            this.serialBridge.on('mode-change', (data) => {
                this.log.info('Received mode change');
                if (typeof data.mode === 'string') {
                    if (this.isLive) {
                        this._prevMode = data.mode;
                        return
                    }
                    this.changeToMode(data.mode);
                }
            });
        } else {
            this.log.info('Running for no specific kit');
        }

        /* Try to start the mode that the Arduino is already on, if not
         * go with the default that is specified above
         */
        return this.currentMode()
            .then(this.changeToMode.bind(this))
            .catch((err) => {
                this.log.error('Error occured couldn\'t get current mode', err);
                this.changeToMode(default_mode);
            })
            .then(() => {
                // Boot the device control after the mode started
                this.startDeviceControl();
            });
    }

    stop () {
        this.systemMode = 'program';
        if (!this.isResetting) {
            this.changeToMode('off');
        }
    }

    markReset () {
        this.isResetting = true;
    }

    /**
     * Indicate if the mode manager allows running programs right now
     */
    canChangeMode () {
        return this.systemMode !== 'notification';
    }

    /**
     * Will stop the current running program and start the new one if no notification is running
     * @param {String} modeKey
     */
    changeToMode (modeKey) {
        // Prevent any stop/start cycle if the mode is actually already running
        if (this.modeKey === modeKey) {
            return;
        }
        this.modeKey = modeKey;
        if (!this.canChangeMode()) {
            return;
        }
        if (this.runningProgram) {
            this.runningProgram.stop();
        }
        this.runningProgram = this.modes[modeKey];
        // No program found for the specified key
        if (!this.runningProgram) {
            return;
        }
        this.emit('mode-change', this.modeKey);
        process.nextTick(() => this.runningProgram.start(this.serialBridge));
    }

    _resetProm () {
        if (this.firstReset) {
            this.firstReset = false;
            return new Promise ((resolve, reject) => {
                this.serialBridge.resetSerial ((err) =>{
                    if (err) {
                        return reject(err);
                    }
                    return resolve();
                });
            });
        } else {
            // if not the first time, check if we need to reset
            // we don't want to reset if not necessary as it could cause dropped requests
            return new Promise ((resolve, reject) => {
                let continuation = (err) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve();
                };
                this.serialBridge.call('serial-info', [], (err, value) => {
                    if (err  || value.padAfter !== 0) {
                        // if we are out of alignment, or otherwise fail, reset
                        this.serialBridge.resetSerial(continuation);
                    } else {
                        continuation(err);
                    }
                });
            });
        }
    }

    currentMode () {
        if (this.systemMode === 'live') {
            // The live mode not being stored in the hardware.
            return 'live';
        }
        let resetProm = this._resetProm(),
            stopAnim = () => {
                return new Promise ((resolve, reject) => {
                    this.serialBridge.call('start-anim-control', [{ "blackout-incr": 8 }], function (err, value) {
                        if (err) {
                            return reject(err);
                        }

                        if (value && typeof value['already-stopped'] !== 'undefined') {
                            resolve();
                        } else {
                            return setTimeout(resolve, 2000);
                        }
                    });
                });
            },
            curMode = () => {
                return new Promise ((resolve, reject) => {
                    // The promise above has a timeout of 2 seconds, time in which the
                    // live mode could be enabled and overlapping issues will appear.
                    if (this.systemMode === 'live') {
                        return resolve('live');
                    }
                    this.serialBridge.call('current-mode', [], function (err, value) {
                        if (err) {
                            return reject(err);
                        }

                        if (typeof value.mode === 'undefined') {
                            const errMsg = "Response doesn't contain mode";
                            return reject(errMsg);
                        }
                        return resolve(value.mode);
                    });
                });
            };

        return resetProm.then(stopAnim).then(curMode);
    }

    /**
     * Sets the manager in notification mode and stop the current program if running
     */
    startNotification () {
        // Notifocation already displaying, do not run the second one
        if (this.systemMode === 'notification') {
            return false;
        }
        // A program is running, pause/stop it
        if (this.runningProgram) {
            // Get the manager of the program
            this._prevManager = typeof this.runningProgram.getRunningManager === 'function' && this.runningProgram.getRunningManager();
            if (this._prevManager) {
                // If the program has a manager ask this manager to pause for the notification
                this._prevManager.pause();
            } else {
                // If the program doesn't have a manager stop the program altogether
                this.runningProgram.stop();
            }
        }
        this._prevSystemMode = this.systemMode;
        this.systemMode = 'notification';
        return true;
    }

    /**
     * Sets the manager back to the state it was before the notification. Will restart the program
     * if one was running before the notification
     */
    stopNotification () {
        this.systemMode = this._prevSystemMode || 'program';
        // There was a program running, restart it
        if (this.canChangeMode()) {
            if (this._prevManager) {
                this._prevManager.start();
            } else if (!this.runningProgram) {
                // The system mode is ready for the user, but no prgram is running
                // Force an update of the program
                let modeKey = this._prevMode || this.modeKey;
                this.modeKey = null;
                this.changeToMode(modeKey);
            } else if (this.runningProgram) {
                this.runningProgram.start();
            }
        }
        this._prevManager = null;
        this._prevSystemMode = null;
    }

    get isLive () {
        return this.systemMode === 'live';
    }

    enableLiveMode (type) {
        return new Promise((resolve, reject) => {
            let handler = (mode) => {
                if (mode === 'live') {
                    this.removeListener('mode-change', handler);
                    resolve();
                }
            };
            this.on('mode-change', handler);
            if (LIVE_MODE_TYPES.indexOf(type.connection) !== -1) {
                this.enabedLiveMode[type.connection] = true;
            }
            if (this.systemMode === 'live') {
                return resolve();
            }
            // If a notification is displayed, only switch to live mode when finished
            if (this.systemMode === 'notification') {
                this._prevSystemMode = 'live';
                this._prevMode = 'live';
                if (this._prevManager) {
                    this._prevManager.stop();
                    this._prevManager = null;
                }
                if (this.runningProgram) {
                    this.runningProgram.stop();
                    this.runningProgram = null;
                }
                return resolve();
            }
            this._prevMode = this.modeKey;
            this.systemMode = 'live';
            this.changeToMode('live');
            setTimeout(() => {
                this.programs.clearBoardLeds()
            });
            return resolve();
        });
    }

    disableLiveMode (type) {
        if (LIVE_MODE_TYPES.indexOf(type.connection) !== -1) {
            this.enabedLiveMode[type.connection] = false;
        }
        if (this.systemMode !== 'live') {
            return;
        }
        // If a notification is displayed, only disable live mode afterwards
        if (this.systemMode === 'notification') {
            this._prevSystemMode = 'program';
            return;
        }
        // The live mode messages could arrive from different sources
        if (this.enabedLiveMode.ws || this.enabedLiveMode.otg) {
            return;
        }
        this.systemMode = 'program';
        this.modeKey = null;
        this.changeToMode(this._prevMode);
        this._prevMode = null;
    }

    otgPlugCallback(msg, info) {
        if (this.deviceControl) {
            if (msg.equals(Buffer('DISCONNECTED\n'))) {
                this.log.info('Inhibiting OTG messages');
                this.deviceControl.setPlugged(false);
            } else if (msg.equals(Buffer('CONFIGURED\n'))) {
                this.log.info('Allowing OTG messages');
                this.deviceControl.setPlugged(true);
            } else if (msg.equals(Buffer('CONNECTED\n'))) {
               // ignore, wait for configured
            } else {
                this.log.error('unknown OTG message', msg, info);
            }
        }
    }

    /**
     * Force reload a program
     * @param {String} key
     */
    refreshProgram (key) {
        if (this.canChangeMode() && this.modeKey === key) {
            this.modeKey = null;
            this.changeToMode(key);
        }
    }
}

module.exports = function getModeManager(config) {
    if (!modeManager) {
        modeManager = new ModeManager(config);
    }
    return modeManager;
};
