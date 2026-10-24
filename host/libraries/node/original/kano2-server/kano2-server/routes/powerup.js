"use strict";

const deviceModules = require('kano2-shared-lib/devices'),
      Devices = require('kano2-shared-lib/lib/devices/devices'),
      express = require('express');

module.exports = (config) => {
    let devices = new Devices({autostart: false, storage: config.storage}),
        router = express.Router();

    for (let module of deviceModules) {
        if (module.api) {
            router.use(module.api.root, module.api.getRouter(module, devices));
        }
    }

    return router;
};
