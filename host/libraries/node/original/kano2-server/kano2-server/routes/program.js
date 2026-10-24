"use strict";

const express = require('express'),
      storage = require('kano2-shared-lib/lib/storage'),
      ModeManager = require('../mode-manager'),
      ALLOWED_PROGRAM_NAMES = ['1', '2', '3'];

function isProgramNameValid(programName) {
    return ALLOWED_PROGRAM_NAMES.indexOf(programName) >= 0;
}

function getRouter(config) {
    let router = express.Router(),
        store = storage.init(config),
        modeManager = ModeManager(config);

    router.get('/:program', function (req, res, next) {
        let programName = req.params.program,
            program = store.get('programs.' + programName);

        if (isProgramNameValid(programName) && program) {
            res.json({program: program});
        } else {
            res.status(404).json({
                error: 'Program ' + programName + ' not found.',
                status: "fail"
            });
        }
    });

    router.post('/:program', function (req, res, next) {
        let programName = req.params.program,
            program;

        if (isProgramNameValid(programName) && req.body.program) {
            program = req.body.program;
            // in case the body is an empty object
            if (Object.keys(program).length === 0 && program.constructor === Object) {
                program = undefined;
            }
            store.put('programs.' + programName, program);
            modeManager.refreshProgram(`online-p${programName}`);
            res.json({status: 'ok'});
        } else {
            res.status(400).send('Bad request');
        }
    });

    return router;
}


module.exports = getRouter;
