"use strict";
const gameLoop = require('node-gameloop'),
    Color = require('color'),
    Canvas = require('canvas'),
    p5 = require('../utils/kano-p5'),

/**
 * Creates a player to manage the snake game
 * The constructor is invoked with number of rows, number of colums and a callback to render
 * on a linear LED board (real or virtual).
 */
class SpinnerManager {
    constructor (config, renderCallback) {
        let i;

        this.config = config;
        this.time = 0.0;

        this.canvas = new Canvas(
            this.config.lightboard.x_count,
            this.config.lightboard.y_count
        );
        this.ctx = this.canvas.getContext('2d');

        this.renderCallback = renderCallback;
        this._linearBoard = new Array(this.CELLS_NUM).fill(this.config.games.background_color);
    }

    _draw () {
      for (var i = 0; i < 5; i++) {
        let currentColor = Color({
          'h': 0,
          's': 100,
          'l': 75+(Math.cos(this.time*0.2)*25)
        });

        // This is a just a work around so we don't have to do a proper ellipse function
        let ellipseX = (this.canvas.width-1)/2  +(Math.sin(this.time+i)*(Math.sin(this.time*0.1)*4));
        let ellipseY = (this.canvas.height-1)/2 +(Math.cos(this.time+i)*(Math.sin(this.time*0.1)*4));
        if (i >= 3) {
          //     X
          //    XXX
          //     X    3x3 Ellipse8
          p5.point(this.ctx, currentColor.hex(), ellipseX, ellipseY);
          p5.point(this.ctx, currentColor.hex(), ellipseX-1, ellipseY);
          p5.point(this.ctx, currentColor.hex(), ellipseX+1, ellipseY);
          p5.point(this.ctx, currentColor.hex(), ellipseX, ellipseY+1);
          p5.point(this.ctx, currentColor.hex(), ellipseX, ellipseY-1);
        } else if (i < 3){
          //     XX
          //     XX   2x2 ellipse
          p5.point(this.ctx, currentColor.hex(), ellipseX-0.5, ellipseY-0.5);
          p5.point(this.ctx, currentColor.hex(), ellipseX-0.5, ellipseY+0.5);
          p5.point(this.ctx, currentColor.hex(), ellipseX+0.5, ellipseY-0.5);
          p5.point(this.ctx, currentColor.hex(), ellipseX+0.5, ellipseY+0.5);
        } else if (i <= 1){
          // 1 pixel "ellipse"
          p5.point(this.ctx, currentColor.hex(), ellipseX, ellipseY);
        }
      }

    }

    /**
     * Evolves the game at every tick
     */
    tick() {
      this.time += 0.2;
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
    module.exports = SpinnerManager;
}
