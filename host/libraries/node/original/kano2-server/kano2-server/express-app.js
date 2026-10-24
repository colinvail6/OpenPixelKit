"use strict";
var express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    app = express();


function getApp(config) {
    app.use(cors());

    app.use(bodyParser.json({ limit: '5mb' }));
    app.use(bodyParser.urlencoded({ extended: false }));

    app.use('/program', require('./routes/program')(config));
    app.use('/powerup', require('./routes/powerup')(config));
    app.use('/config', require('./routes/config_routes')(config));
    app.use('/logging', require('./routes/logging')(config));
    app.use('/util', require('./routes/util')(config));

    // development error handler
    // will print stacktrace
    if (app.get('env') === 'development') {
        app.use(function (err, req, res, next) {
            res.status(err.status || 500).send(err.message);
        });
    }

    // production error handler
    // no stacktraces leaked to user
    app.use(function (err, req, res, next) {
        console.log(err.message);
        res.status(err.status || 500).send(err.message);
    });

    // Load the socket module
    return require('./socket')(app, config);
}

module.exports = getApp;
