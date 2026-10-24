"use strict";
let express = require('express'),
    tmp = require('tmp'),
    exec = require('child_process').exec;


function getRouter(config) {
    let router = express.Router();

    router.get('/all', (req, res, next) => {
        tmp.file((err, path, fd, cleanupCallback) => {
            if (err) {
                res.status(500).send("Error while creating the logs file.");
                return;
            }

            let prc = exec(`sudo journalctl --unit kano2-server-lightboard > ${path}`, (error, stdout, stderr) => {
                if (error) {
                    res.status(500).send("Error while generating the logs.");
                    return;
                }
                res.sendFile(path);
            });
        })
    });

    return router;
}

module.exports = getRouter;
