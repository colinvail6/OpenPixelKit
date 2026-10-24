'use strict';

const fs = require('fs'),
      spawn = require('child_process').spawn,
      EventEmitter = require('events').EventEmitter,
      HEADER_REGEXP = /\[(.+)\]	(.+):(.*)/;

let battery;

class Battery extends EventEmitter {
    constructor(config) {
        super();
        this.config = config

        this.log = config.log;

        this.data = {};
        this.batteryProcessBlock = 0;

        this.readDiskState();
        this.spawnBatteryProcess();
        this.buffer = '';
    }

    processMessage (message) {
        switch (message.device) {
            case '/org/freedesktop/UPower/devices/battery_battery':
                return this.processBatteryMessage(message);
            default:
                break;
        }
    }

    processBatteryMessage (message) {
        if (!message.battery) {
            return;
        }
        let percent = parseInt(message.battery.percentage),
            status = message.battery.state;
        this.updateData({ percent, status });
    }

    static normaliseStatus (status) {
        switch (status) {
            case 'Not charging':
                return 'discharging';
            case 'pending-charge':
                return 'charging'
            default:
                return status.toLowerCase();
        }
    }

    static readFile (p) {
        return new Promise((resolve, reject) => {
            fs.readFile(p, 'utf8', (err, data) => {
                if (err) {
                    return reject(err);
                }

                resolve(data.toString('utf-8').trim());
            });
        });
    }

    readDiskState () {
        return Promise.all([
            Battery.readFile(this.config.device_control.battery_capacity),
            Battery.readFile(this.config.device_control.battery_status)
        ]).then(values => {
            let data = {};
            data.error = false;
            data.percent = parseInt(values[0]);
            data.status = Battery.normaliseStatus(values[1]);
            this.updateData(data);
            return this.data;
        }, err => {
            this.data.error = err;
        });
    }

    updateData (data) {
        let prevData = this.data;
        this.data = data;
        if (prevData.percent !== data.percent) {
            this.emit('percent-update', data.percent);
        }
        if (prevData.status !== data.status) {
            this.emit('status-update', data.status);
        }
    }

    _parseBuffer () {
        let lines = this.buffer.split('\n'),
            startLine, endLine,
            message;
        // Ignore end of line from the split
        lines.pop();
        for (let i = 0; i < lines.length; i++) {
            if (HEADER_REGEXP.test(lines[i])) {
                startLine = i;
                break;
            }
        }
        // The start line was found
        if (typeof startLine !== 'undefined') {
            // Remove unmatched data before the start line
            lines.splice(0, startLine);
            // Look for the end line
            for (let j = 0; j < lines.length; j++) {
                // An empty line is the end of a message
                if (lines[j] === '') {
                    endLine = j;
                    break;
                }
            }
        }

        if (typeof startLine !== 'undefined' && typeof endLine !== 'undefined') {
            let l = lines.splice(0, endLine);
            // Remove line return after
            lines.shift();
            // Found message
            message = this.parseMessage(l);
            this.processMessage(message);

            this.buffer = lines.join('\n');

            // Parse again, in case there are multiple messages in the buffer
            this._parseBuffer();
            return;
        }
        this.buffer = lines.join('\n') + '\n';
    }

    parseMessage (lines) {
        let header = lines.shift(),
            message = {},
            m;
        if (!header) {
            return message;
        }
        m = header.match(HEADER_REGEXP);
        if (m && m[2] && m[3]) {
            message.type = m[2].trim();
            message.device = m[3].trim();
            this.parseSection(lines, message, 0);
        }

        return message;
    }

    parseSection (lines, root, depth) {
        depth = typeof depth === 'undefined' ? 0 : depth;
        let spaces = (depth + 1) * 2,
            line, lineSpaces, parsedLine, prevKey;
        while (lines.length) {
            line = lines.shift();
            lineSpaces = this.countSpaces(line);
            if (lineSpaces === spaces) {
                parsedLine = this.parseLine(line);
                if (!parsedLine.key) {
                    prevKey = line.trim();
                } else {
                    root[parsedLine.key] = parsedLine.value;
                }
            } else if (lineSpaces === spaces + 2) {
                root[prevKey] = {};
                this.parseSection(lines, root[prevKey], depth + 1);
            }
        }
        return root;
    }

    parseLine (line) {
        let colonPos = line.indexOf(':'),
            parsedLine = {};
        if (colonPos !== -1) {
            parsedLine.key = line.substring(0, colonPos).trim();
            parsedLine.value = line.substring(colonPos + 1, line.length).trim();
        }
        return parsedLine;
    }

    countSpaces (line) {
        let index = 0;
        while (line.charAt(index) === ' ') {
            index++;
        }
        return index;
    }

    spawnBatteryProcess () {
        this.batteryProcess = spawn('upower', ['--monitor-detail']);

        this.batteryProcess.stdout.on('data', (data) => {
            this.buffer += data.toString();
            this._parseBuffer();
        });

        this.batteryProcess.stderr.on('data', (data) => {
            this.log.error('Battery monitor process', data, 'Starting again');
            this.spawnBatteryProcess();
        });

        this.batteryProcess.on('close', (data) => {
            this.log.info('Battery monitor process closed', data);
        });
    }

    getStatus() {
        if (!this.data) {
            return { error: true };
        }
        return this.data;
    }
}

let Singleton = function getOrCreateBattery(config) {
    if (!battery) {
        battery = new Battery(config);
    }
    return battery;
};

Singleton.CHARGING = 'charging';
Singleton.DISCHARGING = 'discharging';

module.exports = Singleton;
