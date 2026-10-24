"use strict";

const storage = require('kano2-shared-lib/lib/storage'),
      KEY = 'name';

let store;

function init(config) {
    store = storage.init(config);
}

function setName(name) {
    store.put(KEY, name);
}

function getName() {
    return store.get(KEY);
}

function resetName() {
    setName(null);
}

module.exports = {
    init,
    setName,
    getName,
    resetName
};
