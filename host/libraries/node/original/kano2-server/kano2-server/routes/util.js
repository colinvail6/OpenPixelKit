"use strict";

const express = require('express'),
      nameMod = require('../lib/name'),
      disk = require('../lib/disk'),
      config = require('../config.json').default,
      Battery = require('../lib/battery'),
      wifi = require('../lib/wifi'),
      name = require('../lib/name');

function getRouter(config) {
    let router = express.Router();

    nameMod.init(config);

    router.get('/disk-usage', function (req, res) {
        disk.getUsage((err, usage) => {
            if (err) {
                console.log("Failed to get disk space: ", err);
                res.status(500).json({
                    error: 'Failed to get disk space',
                    status: "fail"
                });

                return;
            }

            res.json(usage);
        });
    });

    router.get('/battery', function (req, res) {
        res.json(Battery(config).getStatus());
    });

    router.post('/factory-reset', function (req, res) {
        let msg = 'Bad request',
            code = 400;

        if (req.body) {
            if (req.body.name === nameMod.getName()) {
                res.status(200).json({
                    error: null,
                    status: 'success'
                });

                // TODO implement the reset procedure here

                return;
            }
            msg = 'Incorrect kit name, aborting reset.';
            code = 403;
        }

        res.status(code).json({
            error: msg,
            status: 'fail'
        });
    });

    router.get('/wifi-connection-status', function (req, res) {
        wifi.getActiveConnectionStatus()
            .then((data) => {
                res.status(200).json(data);
            });
    });

    router.post('/set-name', function (req, res) {
        let msg = 'Bad request',
            code = 400;

        if (req.body && req.body.newName) {
            name.setName(req.body.newName.toString());

            res.status(200).json({
                error: null,
                status: 'success'
            });
            return;
        }

        res.status(code).json({
            error: msg,
            status: 'fail'
        });
    });

    return router;
}


module.exports = getRouter;
