"use strict";
const gameLoop = require('node-gameloop'),
    Color = require('color'),
    Canvas = require('canvas'),
    p5 = require('../utils/kano-p5'),

class Trail {
    constructor(ctx, x, y) {
        this.ctx = ctx;
        this.x = p5.random(0, 16);
        this.y = p5.random(0,-20);
        this.trailLength = p5.random(3,8);
        this.prevx = this.x;
        this.prevy = this.y;
        this.color = Color({
            'h': 26,
            's': 85,
            'v': 96
        });
    }

    move () {
      this.y++;
      if (this.y > 20) {
        this.x = Math.round(p5.random(0,16));
        this.y = Math.round(p5.random(0,-20));
      }
    }

    render() {
        for (var i = 0; i < this.trailLength; i++) {
          let currentColor = Color({
            'h': this.color.hue(),
            's': this.color.saturation(),
            'v': this.color.lightness()-(i*5)-p5.random(-10,10)
          });
          p5.point(this.ctx, currentColor.hex(), this.x, this.y-i);

        }

    }
}


/**
 * Creates a player to manage the snake game
 * The constructor is invoked with number of rows, number of colums and a callback to render
 * on a linear LED board (real or virtual).
 */
class TrailManager {
    constructor (config, renderCallback) {
        let i;

        this.config = config;
        this.offset = 0.0;
        this.speed = 0.5;

        this.canvas = new Canvas(
            this.config.lightboard.x_count,
            this.config.lightboard.y_count
        );
        this.ctx = this.canvas.getContext('2d');

        this.trailsHolder = new Array(10);

        for (i = 0; i < this.trailsHolder.length; i++) {
            this.trailsHolder[i] = new Trail(this.ctx, 200, 200);
        }

        this.renderCallback = renderCallback;
        this._linearBoard = new Array(this.CELLS_NUM).fill(this.config.games.background_color);
    }

    _draw () {
        let i;
        for (i = 0; i < this.trailsHolder.length; i++) {
            this.trailsHolder[i].move();
            this.trailsHolder[i].render();
        }
    }

    /**
     * Evolves the game at every tick
     */
    tick() {
        this._draw();
        this._drawOnBoard();
    }

    /**
     * Starts the game
     */
    start (serialBridge, exitCallback) {
        this.serialBridge = serialBridge;
        this.exitCallback = exitCallback;

        this.gameId = gameLoop.setGameLoop(() => {
            this.tick();
        }, 1000 / this.config.lightshow.frame_rate);
    }

    stop () {
        gameLoop.clearGameLoop(this.gameId);
    }

    /**
     * Draws on the board using the renderCallback
     */
    _drawOnBoard () {
        let pos, i, j, colorData;

        for (i = 0; i < this.config.lightboard.y_count; i++) {
            for (j = 0; j < this.config.lightboard.x_count; j++) {
                colorData = this.ctx.getImageData(j, i, 1, 1).data;
                pos = i * this.config.lightboard.x_count + j;
                this._linearBoard[pos] = (Color.rgb(colorData[0], colorData[1], colorData[2]).hex());
            }
        }

        // Render
        this.renderCallback(this._linearBoard);

        this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

if (typeof module !== "undefined") {
    module.exports = TrailManager;
}
