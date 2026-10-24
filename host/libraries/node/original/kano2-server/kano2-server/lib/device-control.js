"use strict";

const SerialChannel = require('kano2-shared-lib/lib/device-bus/channels/serial'),
      RPCServer = require('kano2-shared-lib/lib/device-bus/server'),
      exec = require('child_process').exec,
      wifi = require('./wifi'),
      Battery = require('./battery'),
      disk = require('./disk'),
      name = require('./name'),
      getSN = require('../utils/get-sn'),
      ENABLE_OTG_CMD = 'sudo /bin/bash tools/enable_otg.sh';

/*
 * This class implements a control interface for this server.
 *
 * You can export any functionality/behaviour to be triggered remotely
 * via this interface. The Electron bridge uses this server to set up
 * devices before use.
 *
 */
class DeviceControl extends RPCServer {
    constructor (config, device) {
        super(new SerialChannel(config.device_control.device_path, { reopenOnDisconnect: true }));

        this.log = config.log;

        name.init(config);

        this.battery = Battery(config);

        this.on('device-info', (callback) => {
            getSN((err, serialNumber) => {
                callback (null, {
                    vendor: 'kano',
                    product: device,
                    serialNumber: serialNumber,
                    name: name.getName(),
                    version: config.version
                });
            })
        });

        this.on('set-name', (_name, callback) => {
            name.setName(_name);
            callback(null, true);
        });

        this.on('wifi-scan', (callback) => {
            wifi.scan()
                .then(data => callback(null, data))
                .catch(e => callback(e));
        });

        this.on('wifi-connection-status', (callback) => {
            wifi.getActiveConnectionStatus()
                .then((data) => {
                    data.port = config.SERVER_PORT;
                    callback(null, data);
                })
                .catch(e => callback(e))
        });

        this.on('wifi-connect', (ssid, password, callback) => {
            wifi.addConnection(ssid, password).then((info) => {
                callback(null, {
                    ssid: ssid,
                    ip: info.getIP(),
                    connected: true
                });
            }).catch(err => callback(err));
        });

        this.on('battery-status', (callback) => {
            let status = this.battery.getStatus();
            if (status.error) {
                return callback(status.error);
            }
            return callback(null, status);
        });

        this.on('disk-usage', (callback) => {
            disk.getUsage((err, data) => {
                if (err) {
                    return callback(err);
                }
                callback(null, data);
            });
        });

        setTimeout(() => {
            exec(ENABLE_OTG_CMD, (err, stdout, stderr) => {
                if (err) {
                    this.log.error('Could not enable OTG', err);
                    return
                }
                this.log.info('OTG enabled');
            });
        }, 1000);
    }

    emit (eventName, data) {
        let packet = {
            name: eventName,
            detail: data
        };
        this.channel.send('event', packet, (err) => {
            if (err) {
                this.log.error('Failed to send event', err);
            }
        });
    }

    static getInstance (config, device) {
        if (!DeviceControl.instance) {
            DeviceControl.instance = new DeviceControl(config, device);
        }
        return DeviceControl.instance;
    }
}

module.exports = DeviceControl;
