"use strict";
const AnimationBase = require('./animation-base'),
      gameLoop = require('node-gameloop'),
      Color = require('color'),
      Canvas = require('canvas'),
      p5 = require('../utils/kano-p5');

/**
 * Creates a player to manage the snake game
 * The constructor is invoked with number of rows, number of colums and a callback to render
 * on a linear LED board (real or virtual).
 */
class WifiSearchingAnimation extends AnimationBase {
    constructor (config, renderCallback) {
        super(config, renderCallback);
    }

    _draw () {
        let radius, currentColor, nextX, nextY;

        radius = this.time % 16;
        currentColor = Color({
            'h': 0,
            's': 100,
            'l': 95 - (radius * 5)
        });
        for (let i = 0; i < 6; i += 0.1) {
            nextX = (this.canvas.width - 1) / 2 + Math.sin(i) * radius;
            nextY = (this.canvas.height - 1) / 2 + Math.cos(i) * radius;
            p5.point(this.ctx, currentColor.hex(), nextX, nextY);
        }
    }

    /**
     * Evolves the game at every tick
     */
    tick () {
        this.time += 0.2;
        this._draw();
        this.drawOnBoard();
    }

    /**
     * Starts the game
     */
    start () {
        this.time = 0;
        this.gameId = gameLoop.setGameLoop(() => {
            this.tick();
        }, 1000 / this.config.lightshow.frame_rate);
    }

    clearBoard () {
        this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

}

module.exports = WifiSearchingAnimation;
