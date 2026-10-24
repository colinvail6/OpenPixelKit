"use strict";
let animationLoop = require('node-gameloop'),
    pixelFont = require('../../../../utils/pixelFont'),
    Color = require('color');

class GameStartup {
    constructor(config, renderCallback) {
        this.config = config;
        this.renderCallback = renderCallback;
        this.frameCount = 0;
        this.linearBoard = new Array(
            this.config.lightboard.x_count * this.config.lightboard.y_count
        ).fill(this.config.lightboard.background_color);
    }

    drawNumber (number, color) {
        let pixelNumber,
            maxWidth = 0,
            offset;

        this.linearBoard.fill(this.config.games.background_color);
        pixelNumber = pixelFont.processScoreText(number.toString());

        pixelNumber.forEach((line) => {
            if (line.length > maxWidth) {
                maxWidth = line.length;
            }
        });

        offset = Math.floor((this.config.lightboard.x_count - maxWidth) / 2);

        pixelNumber.forEach((line, index_line) => {
            line.forEach((pixel, index_board) => {
                if (pixel) {
                    let pos = this.config.lightboard.x_count * index_line + offset + index_board;
                    this.linearBoard[pos] = color;
                }
            });
        });

        this.renderCallback(this.linearBoard);
    }

    startInitAnimation(colors) {
        this.stop();
        let promise = new Promise((resolve, reject) => {
            this.colors = colors.slice(0);
            this.frameCount = 0;
            this.currentColor = Color(this.colors.pop());
            this.mixColor = Color('#FFFFFF').mix(this.currentColor, 0.8);

            if (this.animationId) {
                animationLoop.clearGameLoop(this.animationId);
            }

            this.animationId = animationLoop.setGameLoop(() => {
                this.frameCount++;
                if (this.colors.length <= 0 && (this.frameCount % 30 === 0)) {
                    this.stop();
                    resolve();
                }

                if (this.frameCount % 20 === 0) {
                    this.currentColor = Color(this.colors.pop());
                    this.mixColor = Color('#FFFFFF').mix(this.currentColor, 10);
                }

                this.mixColor = this.mixColor.mix(this.currentColor, 0.6);
                this.drawNumber(this.colors.length + 1, this.mixColor.hex());
            }, 1000 / this.config.games.frame_rate);
        });

        return promise;
    }

    startScoreAnimation(highestScore, score, color) {
        let scoreToRender = score,
            promise = new Promise((resolve, reject) => {
            this.frameCount = 0;

            if (this.animationId) {
                animationLoop.clearGameLoop(this.animationId);
            }
            this.animationId = animationLoop.setGameLoop(() => {
                this.frameCount++;

                if (this.frameCount % 100 < 50) {
                    scoreToRender = score;
                    this.color = (this.frameCount % 10 < 5) ? "#FFFFFF" : "#b3b3b3";
                } else {
                    scoreToRender = highestScore;
                    this.color = (this.frameCount % 10 < 5) ? "#ffd500" : "#fa0fa0";
                }

                this.drawNumber(scoreToRender, this.color);
            });

            setTimeout(() => {
                animationLoop.clearGameLoop(this.animationId);
                resolve();
            }, 3000);
        });

        return promise;
    }

    stop () {
        if (this.animationId) {
            animationLoop.clearGameLoop(this.animationId);
        }
    }
}

module.exports = GameStartup;
