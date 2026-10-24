"use strict";
let animationLoop = require('node-gameloop'),
    pixelFont = require('../../../../utils/pixelFont'),
    Color = require('color');

class ProgramNotFoundAnimation {
    constructor(config, renderCallback) {
        this.config = config;
        this.renderCallback = renderCallback;
        this.linearBoard = new Array(
            this.config.lightboard.x_count * this.config.lightboard.y_count
        );

        this.finished = new Promise((resolve, reject) => {
            this.exitCallback = resolve;
        });

        this.id = 1;
    }

    _displayText(text, color) {
        let fontText = pixelFont.processPixelText(text),
            offset,
            maxWidth = 0;

        fontText.forEach((line) => {
            if (line.length > maxWidth) {
                maxWidth = line.length;
            }
        });

        offset = Math.floor((this.config.lightboard.x_count - maxWidth) / 2);

        fontText.forEach((line, index_line) => {
            line.forEach((pixel, index_board) => {
                if (pixel) {
                    let pos = this.config.lightboard.x_count * index_line + offset + index_board;
                    this.linearBoard[pos] = color;
                }
            });
        });
    }

    tick() {
        this.linearBoard.fill(this.config.lightboard.background_color);

        this.color = (this.frameCount % 20 < 10) ?
            Color({'h': 22, 's': 100, 'v': 100}) :
            Color({'h': 22, 's': 100, 'v': 80});

        if (this.frameCount % 200 < 100) {
            this.text = `P${this.id}`;
        } else {
            if (this.frameCount % 200 > 140) {
                this.text = `???`;
            } else if (this.frameCount % 200 > 120) {
                this.text = `??`;
            } else if (this.frameCount % 200 > 100) {
                this.text = `?`;
            }

        }

        this._displayText(this.text, this.color.hex());
        this.drawOnBoard();
    }

    drawOnBoard() {
        this.renderCallback(this.linearBoard);
    }

    setId (id) {
        this.id = id;
    }

    start () {
        if (this.animationId) {
            animationLoop.clearGameLoop(this.animationId);
        }
        this.frameCount = 0;

        this.animationId = animationLoop.setGameLoop(() => {
            this.frameCount++;
            this.tick();
        }, 1000 / this.config.games.frame_rate);
    }

    stop () {
        animationLoop.clearGameLoop(this.animationId);
        this.exitCallback();
        this.finished = new Promise((resolve, reject) => {
            this.exitCallback = resolve;
        });
    }
}

class ProgramNotFoundInactiveAnimation {
    constructor (config, renderCallback) {
        this.config = config;
        this.renderCallback = renderCallback;
        this.linearBoard = new Array(
            this.config.lightboard.x_count * this.config.lightboard.y_count
        );

        this.finished = new Promise((resolve, reject) => {
            this.exitCallback = resolve;
        });

        this.id = 1;
    }

    _displayText (text, color) {
        let fontText = pixelFont.processPixelText(text),
            offset = parseInt(this.frameCount / 4),
            maxWidth = 0, i, restart = 1;

        fontText.forEach((line, index_line) => {
            for (i = 0; i < 16; i++) {
                if (line[i + offset]) {
                    this.linearBoard[(this.config.lightboard.x_count * index_line) + i] = color;
                    restart = 0;
                }
            }
        });

        if (restart) {
            this.frameCount = 0;
        }
    }

    tick () {
        this.linearBoard.fill(this.config.lightboard.background_color);

        this.color = Color({r: 255, g: 255, b: 255}).hex();
        this.text = `www.kano.me/app`;

        this._displayText(this.text, this.color);
        this.drawOnBoard();
    }

    drawOnBoard () {
        this.renderCallback(this.linearBoard);
    }

    setId (id) {
        this.id = id;
    }

    start () {
        if (this.animationId) {
            animationLoop.clearGameLoop(this.animationId);
        }
        this.frameCount = 0;

        this.animationId = animationLoop.setGameLoop(() => {
            this.frameCount++;
            this.tick();
        }, 1000 / this.config.games.frame_rate);
    }

    stop () {
        animationLoop.clearGameLoop(this.animationId);
        this.exitCallback();
        this.finished = new Promise((resolve, reject) => {
            this.exitCallback = resolve;
        });
    }
}

module.exports = {
    ProgramNotFoundAnimation,
    ProgramNotFoundInactiveAnimation
};
