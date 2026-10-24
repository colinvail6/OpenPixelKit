"use strict";
var express = require('express');

function getRouter(config) {
    let router = express.Router();

    router.get('/version', function (req, res, next) {
        res.json({version: config.version});
    });

    return router;
}


module.exports = getRouter;
