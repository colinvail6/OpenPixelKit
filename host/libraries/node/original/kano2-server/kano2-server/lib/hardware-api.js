"use strict";

const SerialBridge = require('./serial_bridge'),
      LightboardDriver = require('./lightboard'),
      Microphone = require('./microphone'),
      Devices = require('kano2-shared-lib/lib/devices/devices'),
      EventEmitter = require('events');

class VirtualDevice {
    constructor (options) {
        this.id = options.id;
        this.product = options.product;
        this.vendor = options.vendor;
        this.serialNumber = options.serialNumber;
    }
}

class PowerUpDevice extends VirtualDevice {
    constructor (options, device) {
        super(options);

        this.device = device;

        this.emitter = new EventEmitter();
    }

    on () {
        this.emitter.on.apply(this.emitter, arguments);
    }

    removeListener () {
        this.emitter.removeListener.apply(this.emitter, arguments);
    }

    removeAllListeners () {
        this.emitter.removeAllListeners.apply(this.emitter, arguments);
    }
}

class MotionSensor extends PowerUpDevice {
    constructor (options, device) {
        super(options, device);

        this.device.on(`proximity-data`, (value) => {
            this.emitter.emit('proximity-data', value);
        });
        this.device.on(`gesture`, (value) => {
            this.emitter.emit('gesture', value);
        });
    }
    setMode (mode) {
        this.device.callMethod('setMode', mode, () => {});
    }
    setUpdateInterval (interval) {
        this.device.callMethod('setUpdateInterval', interval, () => {});
    }
}

class TiltSensor extends PowerUpDevice {
    constructor (options, device) {
        super(options, device);

        this.device.on('gyro-data', (value) => {
            this.emitter.emit('gyro-data', value);
        });

        this.device.on('accelerometer-data', (value) => {
            this.emitter.emit('accelerometer-data', value);
        });
    }
}

class Lightboard extends VirtualDevice {
    constructor (serialBridge, config) {
        super({
            id: 'kano-lightboard-0',
            product: 'lightboard',
            vendor: 'kano',
            serialNumber: '1337'
        });

        this.serialBridge = serialBridge;
        this.driver = new LightboardDriver(serialBridge, config);
    }

    drawBitmap (bitmap) {
        this.driver.render(bitmap);
    }

    on () {
        this.serialBridge.on.apply(this.serialBridge, arguments);
    }

    removeListener () {
        this.serialBridge.removeListener.apply(this.serialBridge, arguments);
    }

    removeAllListeners () {
        this.serialBridge.removeAllListeners.apply(this.serialBridge, arguments);
    }
}

const productToClassMap = {
    'gyro-accelerometer': TiltSensor,
    'motion-sensor': MotionSensor
};

class HardwareAPI extends EventEmitter {
    constructor (config) {
        super();

        this.parts = [];
        this.partsToDevicesMap = {};
        this.virtualDevices = [];

        this.microphone = Microphone(config);

        if (config) {
            this.config(config);
        }
    }

    config (config) {
        let lightboard;
        this.c = config;

        this.devices = new Devices();
        this.devices.on('device-added', (devices) => {
            this._reassignDevices();
        });

        this.devices.on('device-removed', (devices) => {
            this._reassignDevices();
        });

        this.serialBridge = SerialBridge(config);
        this.device = config.device;

        lightboard = new Lightboard(this.serialBridge, config);

        this.virtualDevices.push(lightboard);
    }

    _cleanupDeviceMap () {
        this.virtualDevices.forEach((dev, index) =>  {
            if (!(dev instanceof Lightboard)) {
                if (!this.devices.getDeviceById(dev.id)) {
                    this.virtualDevices.splice(index, 1);
                }
            }
        });

        let existingPartsIds = this.parts.map(part => part.id),
            existingDevicesIds = this.virtualDevices.map(dev => dev.id);

        Object.keys(this.partsToDevicesMap).forEach((partId) => {
            let dev = this.partsToDevicesMap[partId];

            if (existingPartsIds.indexOf(partId) < 0 ||
                existingDevicesIds.indexOf(dev.id) < 0) {

                this.emit(`${partId}-mapping-changed`, {
                    detail: {
                        oldDevice: this.partsToDevicesMap[partId],
                        newDevice: null
                    }
                });
                delete this.partsToDevicesMap[partId];
            }
        });
    }

    _reassignDevices () {
        // Remove mapping to non-existent parts
        // Destroy non-existent virtual devices
        // Unmap non-existent virtual devices
        this._cleanupDeviceMap();

        // Create virtual devices for any that don't have one
        this.devices.devices.forEach((dev) => {
            let id = dev.getId(),
                virtual = this.getDeviceById(id),
                opts;

            if (!virtual) {
                opts = {
                    id,
                    product: dev.product,
                    vendor: dev.vendor,
                    serialNumber: dev.serialNumber
                };
                virtual = new productToClassMap[dev.product](opts, dev);
                this.virtualDevices.push(virtual);
            }
        });

        // Map devices to parts
        this.parts.forEach((part) => {
            if (!this.partsToDevicesMap[part.id]) {
                this.virtualDevices.filter((dev) => {
                    // filter out assigned devices
                    return !this.getPartForDevice(dev.id);
                }).forEach((freeDev) => {
                    if ((part.supportedHardware && part.supportedHardware.indexOf(freeDev.product) >= 0) ||
                        (part.type === freeDev.product)) {

                        this.partsToDevicesMap[part.id] = freeDev;
                        process.nextTick(() => {
                            this.emit(`${part.id}-mapping-changed`, {
                                detail: {
                                    oldDevice: null,
                                    newDevice: this.partsToDevicesMap[part.id]
                                }
                            });
                        });
                    }
                });
            }
        });
    }

    setParts (parts) {
        this.parts = parts;

        this._reassignDevices();
    }

    allPartsMatched () {
        return this.parts.filter((part) => {
            return !this.partsToDevicesMap[part.id];
        }).length === 0;
    }

    getDeviceById (id) {
        for (let i = 0; i < this.virtualDevices.length; i++) {
            if (this.virtualDevices[i].id === id) {
                return this.virtualDevices[i];
            }
        }
    }

    getAllDevices () {
        return this.virtualDevices;
    }

    getPartForDevice (deviceId) {
        let partIds = Object.keys(this.partsToDevicesMap);

        for (let i = 0; i < partIds.length; i++) {
            let partId = partIds[i],
                dev = this.partsToDevicesMap[partId];

            if (dev.id === deviceId) {
                return this._getPartById(partId);
            }
        }

        return null;
    }

    _getPartById (partId) {
        for (let i = 0; i < this.parts.length; i++) {
            if (this.parts[i].id === partId) {
                return this.parts[i];
            }
        }

        return null;
    }

    getDeviceForPart (partId) {
        return this.partsToDevicesMap[partId];
    }
}

module.exports = HardwareAPI;
