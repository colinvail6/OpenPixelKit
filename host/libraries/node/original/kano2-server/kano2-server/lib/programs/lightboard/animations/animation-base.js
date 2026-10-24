"use strict";
let animationLoop = require('node-gameloop'),
    Canvas = require('canvas'),
    Color = require('color');

class AnimationBase {
    constructor (config, renderCallback) {
        this.config = config;
        this.renderCallback = renderCallback;
        this.frameCount = 0;
        this.linearBoard = new Array(
            this.config.lightboard.x_count * this.config.lightboard.y_count
        );

        this.canvas = new Canvas(
            this.config.lightboard.x_count,
            this.config.lightboard.y_count
        );
        this.ctx = this.canvas.getContext('2d');
        this.finished = new Promise((resolve, reject) => {
            this.exitCallback = resolve;
        });
    }

    clearBoard () {
        this.ctx.save();
        this.ctx.fillStyle = this.config.lightboard.background_color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }

    drawOnBoard () {
        let i, j, pos, colorData;

        this.linearBoard.fill(this.config.lightboard.background_color);

        for (i = 0; i < this.config.lightboard.y_count; i++) {
            for (j = 0; j < this.config.lightboard.x_count; j++) {
                colorData = this.ctx.getImageData(j, i, 1, 1).data;
                pos = i * this.config.lightboard.x_count + j;
                if (colorData[3]) {
                    this.linearBoard[pos] = Color.rgb(colorData).hex();
                }
            }
        }

        this.renderCallback(this.linearBoard);

        this.clearBoard();
    }

    stop () {
        animationLoop.clearGameLoop(this.animationId);
        this.exitCallback();
        // reset the finished promise for future animations
        this.finished = new Promise((resolve, reject) => {
            this.exitCallback = resolve;
        });
    }
}

module.exports = AnimationBase;
