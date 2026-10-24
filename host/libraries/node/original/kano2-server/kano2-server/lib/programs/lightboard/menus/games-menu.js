"use strict";
let BaseMenuManager = require('./base-menu'),
    SnakeManager = require('../games/snake_manager'),
    RunnerManager = require('../games/runner_manager'),
    BreakoutManager = require('../games/breakout_manager'),
    gamesMenu;


class GamesMenuManager extends BaseMenuManager {
    constructor (config, renderCallback) {
        super(config, renderCallback);

        [
            {
                name: "Super Snake",
                path: this.config.games.snake_icon,
                manager: SnakeManager
            },
            {
                name: "Rainbow Runner",
                path: this.config.games.rainbow_icon,
                manager: RunnerManager
            },
            {
                name: "Breakout",
                path: this.config.games.breakout_icon,
                manager: BreakoutManager
            }
        ].forEach((program) => {
            this.loadIcon(program.path)
            this.programsClasses.push(program.manager);
        });
    }
}

module.exports = function getOrCreateGamesMenuManager(rows, cols, renderCallback) {
    if (!gamesMenu) {
        gamesMenu = new GamesMenuManager(rows, cols, renderCallback);
    }
    return gamesMenu;
};
