"use strict";

const readline = require("readline"),
      SerialPort = require("serialport"),
      FRAMEDELAY = 16;

let handle = new SerialPort('/dev/cu.usbmodem14222', {
        baudrate: 9600,
        parser: SerialPort.parsers.readline('\r\n')
    });

function updateCurrentLine(newVal) {
    readline.clearLine(process.stdout, -1);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(newVal);
}

function replyBack(str) {
    updateCurrentLine(str);
    handle.write(str + '\r\n', function writeCb(err) {
        if (err) {
            console.error(`Couldn't write to serial port: ${err}`);
        }
    });
}


handle.on('open', (err) => {

    if (err) {
        console.error(`Couldn't open the port: ${err}`);
        return;
    }

    console.log('Port opened successfully! Will echo anything received');
});


handle.on('data', (data) => {
    setTimeout(replyBack.bind(null, data), FRAMEDELAY);
});

console.log(String.raw`   _____           _       __   ______     __         `);
console.log(String.raw`  / ___/___  _____(_)___  / /  / ____/____/ /_  ____  `);
console.log(String.raw`  \__ \/ _ \/ ___/ / __ \/ /  / __/ / ___/ __ \/ __ \ `);
console.log(String.raw` ___/ /  __/ /  / / /_/ / /  / /___/ /__/ / / / /_/ / `);
console.log(String.raw`/____/\___/_/  /_/\__,_/_/  /_____/\___/_/ /_/\____/  `);
console.log(String.raw`                                                      `);

process.on('exit', handle.close);
process.on('SIGINT', process.exit);
