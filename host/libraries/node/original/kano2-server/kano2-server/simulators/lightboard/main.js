"use strict";

const {app, BrowserWindow, ipcMain} = require('electron'),
    argv = require('yargs').argv,
    net = require('net');

let mainWindow,
    socket,
    buffer = '';

let server = net.createServer((s) => {
    socket = s;
    socket.on('data', (buf) => {
        let pieces;
        buffer += buf.toString();
        pieces = buffer.split('\n');
        if (pieces.length > 1) {
            buffer = pieces.pop();
            pieces.forEach((piece) => {
                let ev = JSON.parse(piece);
                mainWindow.webContents.send(ev.type, ev.data);
            });
        }
    });
});

ipcMain.on('event', (event, data) => {
    if (socket) {
        socket.write(JSON.stringify(data));
    }
});

server.listen(argv.port);

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 612,
        height: 429,
        titleBarStyle: 'hidden',
        title: 'Kano Lightboard Simulator'
    });

    mainWindow.loadURL('file://' + __dirname + '/index.html');
});
