"use strict";

const du = require('diskusage'),
      ROOT = '/';

function getUsage(callback) {
    du.check(ROOT, (err, info) => {
        if (err) {
            return callback(err);
        }

        callback(null, {
            available: info.available,
            total: info.total
        });
    });
}

module.exports = { getUsage };
