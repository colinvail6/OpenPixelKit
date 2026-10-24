"use strict";

const EventEmitter = require('events').EventEmitter;

/**
 * Matches a part from Kano Code. Implements the basic features from a Polymer component as `fire`, `set`,
 * `get`...
 * It also implements an EventEmitter API similar to the Web one.
 */
class Part extends EventEmitter {
    constructor () {
        super();
        this.timeoutIds = {};
        this.BOARD_WIDTH = 16;
        this.BOARD_HEIGHT = 8;
        this.PIXEL_SIZE = 27;
    }

    debounce (id, callback, delay) {
        clearTimeout(this.timeoutIds[id]);
        this.timeoutIds[id] = setTimeout(callback, delay);
    }

    addEventListener () {
        this.addListener.apply(this, arguments);
    }

    removeEventListener () {
        this.removeListener.apply(this, arguments);
    }

    fire () {
        this.emit.apply(this, arguments);
    }

    get (path) {
        let pieces = path.split('.'),
            value = this;
        pieces.forEach(piece => {
            value = value[piece];
        });
        return value;
    }

    set (path, value) {
        let pieces = path.split('.'),
            parent = this;
        for (let i = 0; i < pieces.length - 1; i++) {
            if (!parent[pieces[i]]) {
                return;
            }
            parent = parent[pieces[i]];
        }
        parent[pieces[pieces.length - 1]] = value;
    }

}

module.exports = Part;
