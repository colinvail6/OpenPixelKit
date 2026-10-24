"use strict";
const AnimationBase = require('./animation-base'),
      gameLoop = require('node-gameloop'),
      Color = require('color'),
      Canvas = require('canvas'),
      p5 = require('../utils/kano-p5');

class WifiFoundAnimation extends AnimationBase {

    constructor (config, renderCallback) {
        super(config, renderCallback);
    }

    _draw () {
        let radius, currentColor, nextX, nextY;

        for (let t = 0; t < 16; t += 4) {
            for (let i = 0; i < 6; i += 0.1) {
                radius = (this.time - t) % 16;
                currentColor = Color({
                    'h': 117,
                    's': 68,
                    'l': 95 - (radius * 3)
                });
                nextX = (this.canvas.width - 1) / 2 + Math.sin(i) * radius;
                nextY = (this.canvas.height - 1) / 2 + Math.cos(i) * radius;
                p5.point(this.ctx, currentColor.hex(), nextX, nextY);
            }
        }
    }

    /**
     * Evolves the game at every tick
     */
    tick () {
        this.time += 0.3;
        this._draw();
        this.drawOnBoard();
    }

    clearBoard () {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Starts the game
     */
    start () {
        // Makes sure we don't show the beginning of the circles spreading
        this.time = 16;
        this.gameId = gameLoop.setGameLoop(() => {
            this.tick();
        }, 1000 / this.config.lightshow.frame_rate);
    }

}

module.exports = WifiFoundAnimation;
