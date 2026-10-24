"use strict";

const assert = require("assert"),
      readline = require("readline"),
      SerialPort = require("serialport"),
      COMBSTRING = 'abcdefefghijk',
      FRAMEDELAY = 16,
      RIGHTPAD = 'helloThisMessageWillBePrependedToTheCombinationsTheLongerItIsTheMoreRealisticThisWillBeForTheLightboard';

let handle = new SerialPort('/dev/ttyS2', {
        baudrate: 115200,
        parser: SerialPort.parsers.readline('\r\n')
    }),
    totalCombinations = Math.pow(2, COMBSTRING.length) - 1,   // no empty set so -1
    receiveGen,
    outstanding,
    writeGen,
    runningInterval;

/* Doesn't return the empty set */
function* combinations(str) {
    function* combinationsAcc(active, rest) {
        if (!active && !rest) {
            return;
        }
        if (!rest) {
            yield active;
        } else {
            yield* combinationsAcc(active + rest[0], rest.slice(1));
            yield* combinationsAcc(active, rest.slice(1));
        }
    }
    yield* combinationsAcc("", str);
}

function updateCurrentLine(newVal) {
    readline.clearLine(process.stdout, -1);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(newVal);
}


writeGen = combinations(COMBSTRING);
function writeNextString() {
    let genObj = writeGen.next();

    if (!genObj.done) {
        handle.write(genObj.value + RIGHTPAD + '\r\n', function writeCb(err) {
            if (err) {
                console.error(`Couldn't write to serial port: ${err}`);
            }
        });
        updateCurrentLine(genObj.value);
        outstanding++;
    } else {
        clearInterval(runningInterval);
        runningInterval = undefined;
    }
}

outstanding = 0;

handle.on('open', (err) => {

    if (err) {
        console.error(`Couldn't open the port: ${err}`);
        return;
    }

    console.log('Port opened successfully! Will start sending to it');
    runningInterval = setInterval(writeNextString, FRAMEDELAY);

    /*
    for (let buf of combinations(COMBSTRING)) {
        handle.write(buf + '\r\n', errorCb);
        outstanding++;
    }
    */
});


receiveGen = combinations(COMBSTRING);

handle.on('data', (data) => {
    let genObj = receiveGen.next();

    if (genObj.done) {
        console.error('Generator completed, but got another value');
        return;
    }

    if (data !== genObj.value + RIGHTPAD) {
        console.error(`Values don't match. Expected ${genObj.value} got ${data}`);
        if (typeof runningInterval !== 'undefined') {
            clearInterval(runningInterval);
            runningInterval = undefined;
        }
        throw new Error('Yo');
    } else {
        totalCombinations--;
        outstanding--;
    }

    if (totalCombinations === 0) {
        assert(outstanding === 0, "Something weird has happenned");
        updateCurrentLine(" ");
        console.log('Test complete, all combinations validated');
        handle.close();
    }
});

console.log(String.raw`    _____ __________  _______    __ `);
console.log(String.raw`   / ___// ____/ __ \/  _/   |  / / `);
console.log(String.raw`   \__ \/ __/ / /_/ // // /| | / /  `);
console.log(String.raw`  ___/ / /___/ _, _// // ___ |/ /___`);
console.log(String.raw` /____/_____/_/ |_/___/_/  |_/_____/`);


console.log(`Max length of payload: ${RIGHTPAD.length + COMBSTRING.length}`);
console.log(`Min length of payload: ${RIGHTPAD.length + 1}`);
console.log(`Payload Count to be attempted: ${Math.pow(2, COMBSTRING.length) - 1}`);
console.log(`Delay between frames: ${FRAMEDELAY} ms`);
console.log(`Time needed for test (lower bound): ${(Math.pow(2, COMBSTRING.length) - 1) * FRAMEDELAY / 1000} s`);
console.log("");
