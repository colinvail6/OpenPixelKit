"use strict";

const net = require('net'),
      spawn = require('child_process').spawn,
      EventEmitter = require('events');

class Simulator extends EventEmitter {

    constructor (appPath) {
        super();
        this.appPath = appPath;
    }

    getClient () {
        if (!this.electronEnabled) {
            return Promise.reject();
        }
        if (!this.lsProcess) {
            this.start();
        }
        if (!this.connectedToSimulator) {
            return this.connect().then(() => {
                return this.client;
            });
        } else {
            return Promise.resolve(this.client);
        }
    }

    write (data) {
        return this.getClient().then((client) => {
            return client.write(JSON.stringify(data) + '\n');
        });
    }

    start () {
        if (this.lsProcess) {
            return;
        }
        this.connectedToSimulator = false;
        this.lsPort = Simulator.basePort++;
        let onElectronFail = () => {
            this.electronEnabled = false;
            console.log('Electron is not installed on your system. Starting without lightboard simulator.');
        };
        // Ligthboard simulator
        try {
            this.lsProcess = spawn('electron', [this.appPath, '--port', this.lsPort]);
            this.lsProcess.on('error', onElectronFail);
            this.lsProcess.on('close', () => {
                this.disconnect();
                this.lsProcess = null;
                this.connectedToSimulator = false;
            });
            process.on('exit', () => {
                this.lsProcess.kill();
            });
            this.client = new net.Socket();
            this.electronEnabled = true;
            this.getClient().then((client) => {
                client.on('data', (d) => {
                    let ev = JSON.parse(d.toString());
                    this.emit('event', ev);
                });
            });
        } catch (e) {
            onElectronFail();
        }
    }

    connect (retry) {
        retry = retry || 0;
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (this.previousAttemptHandler) {
                    this.client.removeListener('error', this.previousAttemptHandler);
                }
                this.previousAttemptHandler = this.connect.bind(this, retry + 1);
                this.client.on('error', this.previousAttemptHandler);
                this.client.connect(this.lsPort, '127.0.0.1', () => {
                    this.connectedToSimulator = true;
                    if (this.previousAttemptHandler) {
                        this.client.removeListener('error', this.previousAttemptHandler);
                        this.previousAttemptHandler = null;
                    }
                    resolve();
                });
            }, retry * 200);
        });
    }

    disconnect () {
        this.client.destroy();
    }
}

Simulator.basePort = 8888;

module.exports = Simulator;
