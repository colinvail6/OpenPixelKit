"use strict";

let LightboardEvents = require('./lightboard'),
    Devices = require('kano2-shared-lib/lib/devices/devices'),
    devices = new Devices({ autostart: false }),
    ModeManager = require('../mode-manager');

/**
 * Creates a socket enabled server from the express app
 * @param  {Object} app    The express app
 * @param  {Object} config The app global configuration
 * @return {Object}        An object containing the newly created server and express app
 */
module.exports = (app, config) => {
    let server = require('http').createServer(app),
        io = require('socket.io').listen(server, {
            'pingTimeout': 2000,
            'pingInterval': 3000,
            'upgradeTimeout': 1000
        }),
        socket,
        modeManager = ModeManager(config),
        lightboardEvents = LightboardEvents(config);

    devices.setSocket(io);

    io.on('connection', (s) => {
        // Prevent multiple connections by rejecting new ones when a socket exists
        if (socket) {
            return s.disconnect();
        }
        socket = s;
        socket.on('error', (e) => {
            console.log(e);
        });
        modeManager.enableLiveMode({ connection: 'ws' })
            .then(() => {
                // Load devices modules
                lightboardEvents.subscribe(socket);
            })
            .catch(err => {
                console.log("Unable to enable the Live Mode when there's a new ws connection.");
            });

        // Reset the socket on disconnect to allow next connection
        socket.on('disconnect', () => {
            modeManager.disableLiveMode({ connection: 'ws' });
            lightboardEvents.unsubscribe(socket);
            socket = null;
            devices.setSocket(null);
        });
    });

    return {express: app, server};
};
