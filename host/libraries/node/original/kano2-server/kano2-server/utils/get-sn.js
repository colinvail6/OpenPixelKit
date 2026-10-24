"use strict";

const os = require('os'),
      fs = require('fs'),
      exec = require('child_process').exec,
      serialBridge = require('../lib/serial_bridge'),
      CPU_INFO_PATH = '/sys/class/sunxi_info/sys_info';

function getSNOSX(callback) {
    exec('system_profiler SPHardwareDataType', (err, stdout, stderr) => {
        let lines,
            tokens;
        if (err) {
            return callback('Failed to exec ' + err);
        }

        lines = stdout.split('\n');

        for (let i = 0; i < lines.length; i++) {
            tokens = lines[i].split(':');
            if (tokens.length === 2 && tokens[0].trim() === 'Serial Number (system)') {
                return callback(null, tokens[1].trim());
            }
        }

        callback("Platform ID not found");
    });
}

function getSNBananaPi(callback) {
    serialBridge().call("device-info", [], (err, value) => {
        if (err) {
            console.log("getSNBananaPi ERR");
            return;
        }
        callback(null, value.serialNumber);
    });
}

function getSN(callback) {
    if (os.platform() === 'darwin') {
        getSNOSX(callback);
    } else {
        getSNBananaPi(callback);
    }
}

module.exports = getSN;
