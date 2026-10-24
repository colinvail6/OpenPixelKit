"use strict";

const storage = require('kano2-shared-lib/lib/storage'),
      HardwareAPI = require('../hardware-api'),
      Part = require('./part'),
      fetch = require('node-fetch'),
      vm = require('vm'),
      Request = fetch.Request,
      Response = fetch.Response,
      Headers = fetch.Headers,
      LightboardAnimations = require('./lightboard/animations'),
      WiFi = require('../wifi');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


class UserProgram {
    constructor (config, name) {
        this.log = config.log;
        this.running = false;
        this.config = config;
        this.name = name;
        this.store = storage.init(config);
    }

    start (serialBridge) {
        this.serialBridge = serialBridge;
        this.running = true;
        this._run();
    }

    getLightboardAnimations() {
        this.lightboardAnimations = this.lightboardAnimations || new LightboardAnimations(this.config, this.serialBridge);
        return this.lightboardAnimations;
    }

    findDependencies(parts) {
        return new Promise((resolve, reject) => {
            let presentDependencies = this.hardwareAPI.getAllDevices().map((elem) => {
                return elem.product;
            });

            // TODO reimplement using HW api
            parts.forEach((part) => {
                if (this.config.lightboard.supported_dongles.indexOf(part.type) !== -1 &&
                    presentDependencies.indexOf(part.type) === -1) {
                    this.getLightboardAnimations().missingDongle(part.type);
                    reject();
                    return;
                }
            });

            WiFi.getActiveConnectionStatus().then(status => {
                parts.forEach((part) => {
                    if (this.config.lightboard.wifi_dependant.indexOf(part.id) !== -1 && !status.connected) {
                        this.getLightboardAnimations().missingWifi();
                        reject();
                        return;
                    }
                });
                resolve();
            });
        });
    }

    _run () {
        if (this.running) {
            let program = this.store.get("programs." + this.name);

            if (!program) {
                this.getLightboardAnimations().programNotFound(this.name);
                return;
            }

            this.context = {
                window: {},
                clearInterval,
                clearTimeout,
                setTimeout,
                setInterval,
                console,
                requestAnimationFrame (cb) {
                    return setTimeout(() => {
                        let hrTime = process.hrtime(),
                            micro = hrTime[0] * 1000000 + hrTime[1] / 1000;
                        cb(micro / 1000);
                    }, 1000 / 60);
                },
                cancelAnimationFrame (id) {
                    clearTimeout(id);
                },
                fetch,
                Response,
                Headers,
                Request
            };

            let kanoCodeLib = `(() => {"use strict";\n${program.kanoCodeLib}})()`,
                // Create a script to run in a vm
                kanoCodeLibScript = new vm.Script(kanoCodeLib),
                // Create the context with the prepared sandbox
                vmContext = new vm.createContext(this.context),
                script,
                parts,
                PartsAPI,
                modePart,
                listeners;
            this.hardwareAPI = new HardwareAPI(this.config);
            this.config.hardwareAPI = this.hardwareAPI;
            // Run the kanoCodeLib code in the vm context
            kanoCodeLibScript.runInContext(vmContext, {displayErrors: true, timeout: 5000});
            // Reference the APIs we need in the global context
            this.context.Kano = this.context.window.Kano;
            this.appModules = this.context.Kano.AppModules.createStandalone();
            this.appModules.config(this.config);
            // Reference the PartsAPI
            PartsAPI = this.context.Kano.MakeApps.PartsAPI;
            // Generate an object of parts using the PartsAPI and adding the part sent as the model
            parts = program.parts.reduce((acc, model) => {
                let part = new Part(),
                    mixin;
                // The key of the mixin is either the type of the part or its partType
                mixin = PartsAPI[model.type] || PartsAPI[model.partType] || PartsAPI.Base;
                PartsAPI.Base.applyMixin(part, mixin);
                part.model = model;

                acc[model.id] = part;
                return acc;
            }, {});
            // Add the mode as an accessible part
            modePart = new Part();
            PartsAPI.Base.applyMixin(modePart, PartsAPI[program.mode]);
            parts[program.mode] = modePart;

            listeners = PartsAPI[program.mode].listeners;
            // Process mode listeners
            if (listeners) {
                // Listen to the events defined on all the parts
                Object.keys(listeners).forEach(eventName => {
                    Object.keys(parts).forEach(id => {
                        // When the event occurs, call the method and wrap the result in a detail object
                        parts[id].addEventListener(eventName, data => {
                            modePart[listeners[eventName]].call(modePart, { detail: data });
                        });
                    });
                });
            }

            this.appModules.loadParts(parts);

            this.parts = parts;

            Object.keys(parts).forEach(partKey => {
                parts[partKey].onCreated();
            });

            this.hardwareAPI.setParts(program.parts);

            // If the dependencies are not present, display animation and return
            this.findDependencies(program.parts).then(
                () => {
                    // Stop running animations;
                    this.getLightboardAnimations().stop();

                    // Register the parts in the appModules, let the parts module know which parts are accessible
                    this.context.AppModules = this.appModules;

                    // Generate the code from the program and the appModules prefix
                    let appCode = this.appModules.createAppCode('AppModules', program.code);
                    script = new vm.Script(`(() => {"use strict";\n${appCode}})()`);

                    // Mark that the process is running a stored app
                    process.KanoserProgramStarted = true;

                    // Evaluate the program
                    script.runInContext(vmContext);

                    // Run the start lifecycle step
                    this.appModules.start();
                },
                () => {
                    // Error: If one of the parts wasn't found try again in 4 seconds.
                    setTimeout(() => {
                        this._run();
                    }, 4000);

                }).catch((err) => {
                    console.log("ERROR:", err.stack);
                });
        }
    }

    stop () {
        if (this.lightboardAnimations) {
            this.lightboardAnimations.stop();
        }

        if (this.running && this.appModules) {
            this.appModules.stop();
        }
        if (this.parts) {
            Object.keys(this.parts).forEach(partKey => {
                this.parts[partKey].onDestroyed();
            });
        }
        this.running = false;

        // Mark that the process stopped running a stored app
        process.KanoserProgramStarted = false;
    }
}

module.exports = UserProgram;
