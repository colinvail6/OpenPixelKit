"use strict";

var commandLineArgs = require('command-line-args');

function getCliParser(config) {
    var cli = commandLineArgs([
      { name: 'loglevel', alias: 'l', type: Boolean },
      { name: 'device', alias: 'd', type: String },
      { name: 'serialPath', alias: 'p', type: String },
      { name: 'deviceName', alias: 'n', type: String }
    ]);
    return cli;
}


module.exports = getCliParser;
