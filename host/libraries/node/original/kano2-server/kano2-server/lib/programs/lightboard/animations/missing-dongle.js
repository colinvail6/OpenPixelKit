"use strict";
let animationLoop = require('node-gameloop'),
    Canvas = require('canvas'),
    imageUtils = require('../utils/image-analyzer'),
    Color = require('color'),
    AnimationBase = require('./animation-base');

class MissingDongleAnimation extends AnimationBase {
    constructor(config, renderCallback) {
        super(config, renderCallback);

        this.animationFrames = [];
        this.imageOffset = this.config.lightboard.y_count + 1;
        this.currentFrame = 0;

        // Load the error icon
        this.loaded = imageUtils.getImage(this.config.animations.error).then((data) => {
            let img = new Canvas.Image();
            img.src = data;
            this.errorImg = img;
        });

        this.id = 'motion-sensor';
    }

    tick () {
        if (this.imageOffset > 1 && this.frameCount % 10 === 0) {
            this.imageOffset--;
        } else if (this.frameCount % 120 === 0) {
            this.imageOffset = this.config.lightboard.y_count + 1;
        }
        this.ctx.drawImage(this.img, 1, 1 - this.imageOffset, this.img.width, this.img.height);

        if (this.frameCount % 60 < 30) {
            this.ctx.drawImage(this.errorImg, 9, 1, this.errorImg.width, this.errorImg.height);
        }

        this.drawOnBoard();

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setId (id) {
        this.id = id;
    }

    start () {
        if (this.animationId) {
            animationLoop.clearGameLoop(this.animationId);
        }
        this.frameCount = 0;
        this.imageOffset = this.config.lightboard.y_count + 1;

        this.loaded.then(() => {
            // Load the dongle icon
            imageUtils.getImage(this.config.animations.missing_dongle[this.id]).then((data) => {
                let img = new Canvas.Image();
                img.src = data;
                this.img = img;
                this.animationId = animationLoop.setGameLoop(() => {
                    this.frameCount++;
                    this.tick();
                }, 1000 / this.config.games.frame_rate);
            });
        });
    }
}

module.exports = MissingDongleAnimation;
