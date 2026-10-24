'use strict';
let storage = require('kano2-shared-lib/lib/storage'),
    scoreManager;

class ScoreManager {
    constructor(config) {
        this.storage = storage.init(config);
    }

    getHighestScore(gameId) {
        return this.storage.get(`game.${gameId}.highestScore`);
    }

    updateHighestScore(gameId, score) {
        let currentHigh = this.storage.get(`game.${gameId}.highestScore`);
        if (!currentHigh || currentHigh < score) {
            this.storage.put(`game.${gameId}.highestScore`, score);
        }
    }
}

module.exports = function getOrCreate(config) {
    if (!scoreManager) {
        scoreManager = new ScoreManager(config);
    }
    return scoreManager;
};
