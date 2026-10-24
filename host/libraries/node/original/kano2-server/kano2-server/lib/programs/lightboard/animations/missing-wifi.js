"use strict";
let animationLoop = require('node-gameloop'),
    Canvas = require('canvas'),
    imageUtils = require('../utils/image-analyzer'),
    AnimationBase = require('./animation-base');

class MissingWifiAnimation extends AnimationBase {
    constructor(config, renderCallback) {
        super(config, renderCallback);

        let frames = this.config.animations.missing_wifi.frames;
        frames.push(this.config.animations.error);

        this.animationFrames = [];
        this.currentFrame = 0;
        this.errorDisplayed = false;

        this.loaded = Promise.all(frames.map((elem, index) => {
            return imageUtils.getImage(elem).then((data) => {
                let img = new Canvas.Image();
                img.src = data;
                this.animationFrames[index] = img;
            });
        })).then(() => {
            this.errorImg = this.animationFrames[this.animationFrames.length - 1];
        });

    }

    tick () {
        // Intentionally go too far to leave an empty frame
        this.currentFrame = (this.currentFrame + 1) % (this.animationFrames.length);
        this.drawOnBoard();
    }

    drawOnBoard () {
        let img;

        // Don't render for the empty frame
        if (this.currentFrame < this.animationFrames.length - 1) {
            img = this.animationFrames[this.currentFrame];
            this.ctx.drawImage(img, 1, 1, img.width, img.height);
        }

        if (!this.errorDisplayed) {
            this.ctx.drawImage(this.errorImg, 9, 1, this.errorImg.width, this.errorImg.height);
            this.errorDisplayed = true;
        } else {
            this.errorDisplayed = false;
        }
        super.drawOnBoard();
    }

    start () {
        if (this.animationId) {
            animationLoop.clearGameLoop(this.animationId);
        }

        this.currentFrame = 0;
        this.errorDisplayed = false;
        this.loaded.then(() => {
            this.animationId = animationLoop.setGameLoop(() => {
                this.tick();
            }, 1000 / (this.config.games.frame_rate / 30));
        });
    }
}

module.exports = MissingWifiAnimation;
