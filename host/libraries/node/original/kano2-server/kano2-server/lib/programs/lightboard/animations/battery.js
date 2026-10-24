"use strict";
let animationLoop = require('node-gameloop'),
    Canvas = require('canvas'),
    imageUtils = require('../utils/image-analyzer'),
    AnimationBase = require('./animation-base');

const BATTERY_GREEN = '#03FF63',
      BATTERY_RED = '#FF022C',
      BATTERY_OUTLINE = '#C8C8C8',
      BATTERY_HEAD = '#646464';

class Battery extends AnimationBase {
    constructor(config, renderCallback) {
        super(config, renderCallback);
        this.chargingAnimation = 0;
        this.mode = 'charging';
        this.charge = 0;
    }

    drawBattery () {
        this.ctx.fillStyle = BATTERY_OUTLINE;
        this.ctx.fillRect(1, 1, 12, 1);
        this.ctx.fillRect(1, 1, 1, 6);
        this.ctx.fillRect(1, 6, 12, 1);
        this.ctx.fillRect(12, 1, 1, 6);
        this.ctx.fillRect(14, 2, 1, 4);
        this.ctx.fillStyle = BATTERY_HEAD;
        this.ctx.fillRect(13, 2, 1, 4);
    }

    fadeOut () {
        this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBatteryEmpty () {
        let state = (this.time % 0.5) <= 0.25;
        if (state) {
            this.ctx.fillStyle = BATTERY_RED;
        } else {
            this.ctx.fillStyle = this.config.lightboard.background_color;
        }

        this.ctx.fillRect(2, 2, 2, 4);

        if (this.time >= 2) {
            this.stop();
        }
    }

    drawBatteryCharging () {
        // Make sure an animation will be displayed
        let charge = Math.max(10, Math.min(89, this.charge)),
            bat = charge + ((this.time * 100) % (110 - charge));
        bat = Math.min(Math.max(charge, bat), 100);

        // The battery animation went from full to current charge
        if (this.prevBat && bat < this.prevBat) {
            this.loops++;
            if (this.loops === 2) {
                this.prevBat = null;
                this.stop();
                return;
            }
            // Clean the inside of the battery
            this.emptyBattery();
        }
        // Stop if the time is over 2.5
        if (this.time >= 2.5) {
            this.prevBat = null;
            this.stop();
            return;
        }
        this.prevBat = bat;

        this.ctx.fillStyle = BATTERY_GREEN;
        this.ctx.fillRect(2, 2, Math.floor(charge / 10), 4);
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillRect(2, 2, Math.floor(bat / 10), 4);
        this.ctx.restore();
    }

    emptyBattery () {
        this.ctx.save();
        this.ctx.fillStyle = this.config.lightboard.background_color;
        this.ctx.fillRect(2, 2, 10, 4);
        this.ctx.restore();
    }

    tick () {
        if (this.charging) {
            this.drawBatteryCharging();
        } else {
            this.drawBatteryEmpty();
        }
        this.drawOnBoard();
        this.time += 0.02;
    }

    clearBoard () {
        // Do nothing, we clear internally
    }

    setMode (mode) {
        this.mode = mode;
    }

    setCharge (charge) {
        this.charge = charge;
    }

    start () {
        this.charging = (this.mode === 'charging') ? true : false;
        this.empty = (this.mode === 'empty') ? true : false;

        if (this.animationId) {
            animationLoop.clearGameLoop(this.animationId);
        }

        this.time = 0;
        this.loops = 0;

        this.drawBattery();
        this.emptyBattery();

        this.animationId = animationLoop.setGameLoop(() => {
            this.tick();
        }, 1000 / this.config.lightshow.frame_rate);
    }
}

module.exports = Battery;
