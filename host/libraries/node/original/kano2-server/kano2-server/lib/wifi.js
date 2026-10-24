"use strict";

const exec = require('child_process').exec,
      spawn = require('child_process').spawn,
      path = require('path'),
      EventEmitter = require('events').EventEmitter,
      IFNAME = 'wlan0',
      IS_CONNECTED_CMD = 'sudo nmcli -terse -fields connectivity general status connectivity',
      CONNECTION_INFO_CMD = 'sudo nmcli --terse connection show',
      ACTIVE_CONNECTION_NAME_CMD = 'sudo nmcli --terse --fields device,state,connection device status',
      ACTIVE_CONNECTION_STATUS_CMD = 'sudo ./wifi/status.sh',
      RESTART_WPA_SUPPLICANT_CMD = 'sudo systemctl restart wpa_supplicant.service',
      DELETE_CONNECTION_CMD = 'sudo nmcli connection delete',
      GET_SAVED_CONNECTIONS_CMD = 'sudo nmcli --terse --fields name connection show',
      DISCONNECT_CMD = 'sudo nmcli device disconnect',
      LIST_CMD = 'sudo nmcli --terse --fields ssid,signal,rate,security device wifi list ifname',
      RESCAN_CMD = 'sudo nmcli device wifi rescan ifname',
      CONNECTION_UP_CMD = 'sudo nmcli connection up',
      DEVICE_CONNECT_CMD = 'sudo nmcli device connect',
      WPA_SUPPLICANT_RESTART_DELAY = 3000;

let connectionStatus = null;

class ConnectionInfo {
    constructor (dataString) {
        this.data = this.parseConnectionData(dataString);
    }

    parseConnectionData (data) {
        let connection = {};
        for (let line of data.split('\n')) {
            if (line.trim().length > 0) {
                let keyval = line.split(':'),
                    key = keyval[0].trim(),
                    val = keyval[1].trim();

                connection[key] = val;
            }
        }

        return connection;
    }

    getIP () {
        if (this.data['IP4.ADDRESS[1]']) {
            let value = this.data['IP4.ADDRESS[1]'],
                ipRe = /ip = ([0-9.]+)(\/[0-9]{2})/,
                match = ipRe.exec(value);

            if (match) {
                return match[1];
            }
        }
    }

    /* TODO add more functions based on what we need */
}

class WifiUtils extends EventEmitter {
    constructor () {
        super();
        this.connectionStatus = null;

        this.startWifiConnectionStatusProcess();
    }

    static runCmd (cmd, opts) {
        return new Promise((resolve, reject) => {
            console.log('Running ' + cmd);
            exec(cmd, opts, (err, stdout, stderr) => {
                if (err) {
                    return reject(err);
                }
                resolve(stdout);
            });
        });
    }

    isConnected () {
        return WifiUtils.runCmd(IS_CONNECTED_CMD).then(stdout => {
            return stdout.trim() === 'full';
        }).catch(e => {
            return false;
        });
    }

    /**
     * Get various details about a connection associated with the ssid.
     *
     * @return {Promise}
     */
    getConnectionInfo (ssid) {
        let cmd = CONNECTION_INFO_CMD + ' "' + ssid + '"';

        return WifiUtils.runCmd(cmd).then(stdout => {
            return new ConnectionInfo(stdout);
        }).catch(e => {
            /* rc=10 signifies that the connection doesn't exist */
            if (e.code === 10) {
                return null;
            }
            throw err;
        });
    }

    getActiveConnectionName () {
        return WifiUtils.runCmd(ACTIVE_CONNECTION_NAME_CMD).then(stdout => {
            for (let line of stdout.split('\n')) {
                if (line.trim().length > 0) {
                    let fields = line.split(':'),
                        dev = fields[0].trim(),
                        status = fields[1].trim(),
                        connection = fields[2].trim();

                    if (dev === IFNAME) {
                        if (status === 'connected') {
                            return connection;
                        }

                        return null;
                    }
                }
            }
            throw new Error('Interface not found');
        });
    }

    getActiveConnectionStatus () {
        if (this.connectionStatus) {
            return Promise.resolve(this.connectionStatus);
        }

        return this.getActiveConnectionData();
    }

    getActiveConnectionData () {
        return WifiUtils.runCmd(ACTIVE_CONNECTION_STATUS_CMD, {
            cwd: path.join(__dirname, '../tools'),
            shell: '/bin/bash'
        }).then(stdout => {
            return new ConnectionInfo(stdout);
        }).then(connection => {
            return {
                connected: true,
                ssid: connection.data['connection.id'],
                ip: connection.getIP()
            };
        }).catch(e => {
            return { connected: false }
        });
    }

    startWifiConnectionStatusProcess () {
        this.ls = spawn('dbus-monitor', ['--system', "type='signal',interface='org.freedesktop.NetworkManager.Device.Wireless'"]);
        let processBreak = false;

        this.ls.stdout.on('data', (data) => {
            if (processBreak) {
                return;
            }
            processBreak = true;
            this.getActiveConnectionData()
                .then(data => {
                    this.connectionStatus = {
                        connected: data.connected,
                        ssid: data.ssid,
                        ip: data.ip
                    };
                    setTimeout(() => {
                        processBreak = false;
                    }, 1000);
                });
        });

        this.ls.stderr.on('data', err => {
            console.log("Error dbus-monitor network. Will start the process again", err);
            startWifiConnectionStatusProcess();
        });

        this.ls.on('closed', (data) => {
            console.log("Dbus-monitor process closed");
        });
    }

    restartWPASupplicant () {
        return WifiUtils.runCmd(RESTART_WPA_SUPPLICANT_CMD);
    }

    addConnection (ssid, password) {
        this.emit('connection-attempt');
        return this.deleteConnection(ssid)
            .then(() => this.restartWPASupplicant())
            .catch(e => {
                console.log('Killing wpa_supplicant failed ', e);
                /* There's not much we can do if there's an error -- ignore it */
            })
            .then(() => {
                /* Give wpa_supplicant 3 sec to recover after the restart
                    before setting up the network. This avoids an occasional
                    'unknown error' when configuring it right away. */
                return new Promise((resolve, reject) => {
                    setTimeout(resolve, WPA_SUPPLICANT_RESTART_DELAY);
                });
            })
            .then(() => WifiUtils.runCmd(`sudo nmcli device wifi connect '${ssid}' password '${password}' ifname ${IFNAME} name '${ssid}'`))
            .then(() => this.getConnectionInfo(ssid))
            .then(info => {
                this.emit('connection-success');
                return info;
            })
            .catch(e => {
                this.emit('connection-failure');
                throw e;
            })
    }

    disconnectIfActive (ssid) {
        return this.getActiveConnectionName()
                .then(name => {
                    if (name !== null && (name === ssid || ssid === null)) {
                        return this.disconnect();
                    }
                });
    }

    deleteConnection (ssid) {
        return this.disconnectIfActive(ssid)
            .then(() => {
                return WifiUtils.runCmd(DELETE_CONNECTION_CMD + ' "' + ssid + '"');
            }).catch(e => {
                /* Connection not found, no need to fail */
                if (e.code !== 10) {
                    throw e;
                }
            });
    }

    ssidExists (ssid, networks) {
        for (let network of networks) {
            if (network.ssid === ssid) {
                return true;
            }
        }
        return false;
    }

    getSavedConnections () {
        return WifiUtils.runCmd(GET_SAVED_CONNECTIONS_CMD)
            .then(stdout => {
                let SSIDs = [], ssid;
                for (let line of stdout.split('\n')) {
                    ssid = line.trim();
                    if (ssid.length > 0) {
                        SSIDs.push(ssid);
                    }
                }
            });
    }

    deleteSavedConnections () {
        return this.getSavedConnections()
            .then(connections => {
                return Promise.all(connections.map(connSSID => {
                    return this.deleteConnection(connSSID);
                }))
            });
    }

    /**
     * Activate a wifi connection -- either let network manager make the best
     * pick or specify a ssid to connect to.
     *
     * The ssid must have been registered earlier using newConnection()
     */
    connect (ssid) {
        let cmd;

        if (ssid) {
            cmd = CONNECTION_UP_CMD + ' "' + ssid + '"';
        } else {
            cmd = DEVICE_CONNECT_CMD + ' ' + IFNAME;
        }

        return WifiUtils.runCmd(cmd);
    }

    disconnect () {
        return WifiUtils.runCmd(DISCONNECT_CMD + ' "' + IFNAME + '"');
    }

    getIP () {
        return this.getActiveConnectionName().then((name) => {
            return this.getConnectionInfo(name);
        }).then((info) => {
            if (!info) {
                throw new Error('Connection not found');
            }

            return info.getIP();
        });
    }

    scan () {
        this.emit('scan-started');
        return WifiUtils.runCmd(RESCAN_CMD + ' ' + IFNAME)
            .catch(err => {
                console.log(err);
            })
            .then(() => {
                return WifiUtils.runCmd(LIST_CMD + ' ' + IFNAME);
            }).then(stdout => {
                let networks = [];

                for (let line of stdout.split('\n')) {
                    if (line.trim().length > 0) {
                        let fields = line.split(':'),
                            network = {
                                ssid: fields[0],
                                signal: fields[1],
                                rate: fields[2],
                                security: fields[3]
                            };

                        // TODO filter networks we don't support or with low signal?
                        if (!this.ssidExists(network.ssid, networks)) {
                            networks.push(network);
                        }
                    }
                }
                this.emit('scan-finished');
                return networks;
            });
    }
}

module.exports = new WifiUtils();
