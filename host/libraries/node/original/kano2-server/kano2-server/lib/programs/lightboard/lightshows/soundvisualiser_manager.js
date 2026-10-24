'use strict';

const gameLoop = require('node-gameloop'),
    p5 = require('../utils/kano-p5'),
    Color = require('color'),
    Canvas = require('canvas'),
    Microphone = require('../../../microphone');

class SoundVisualiserManager {
    constructor(config, renderCallback) {
        this.config = config;
        this.renderCallback = renderCallback;

        this.canvas = new Canvas(
            this.config.lightboard.x_count,
            this.config.lightboard.y_count
        );
        this.ctx = this.canvas.getContext('2d');
        this.waveform = new Array(16);
        this.hueVar = 262;

        this.buttonPressed = {};
        this._linearBoard = new Array(128);

        this.sampledVolume = 0;
        this.sampledVolumeNum = 0;

        this.buttonDownCb = this.buttonDownCallback.bind(this);
        this.buttonUpCb = this.buttonUpCallback.bind(this);
    }

    microphoneCallback (data) {
        this.sampledVolume += data;
        this.sampledVolumeNum += 1;
    }

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
    }

    _draw () {
        this.waveform.shift();
        this.waveform.push(((this.sampledVolume / this.sampledVolumeNum) / 50) * 8);

        this.sampledVolume = 0;
        this.sampledVolumeNum = 0;

        this.waveform.forEach((elem, index) => {
            p5.line(
                this.ctx, Color({h: this.hueVar + elem, s: 100, v: 100}).hex(),
                index, 8 - elem, index, 8
            );
        });
    }

    tick () {
        // Reset the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this._draw();
        this._drawOnBoard();
    }

    updateHue (hueValue) {
        this.hueVar = (360 + this.hueVar + hueValue) % 360;
    }

    moveAction (id, hueValue) {
        // Overwrite the interval if this case happens
        if (this.buttonPressed[id] !== undefined) {
            this.buttonPressed[id] = clearInterval(this.buttonPressed[id]);
        }

        this.buttonPressed[id] = setInterval(((id, hueValue) => {
            this.updateHue(hueValue);
        }).bind(this, id, hueValue), 100);
    }

    buttonDownCallback (data) {
        let moveMap = {
            'js-up': () => { this.moveAction('js-up', 5) },
            'js-down': () => { this.moveAction('js-down', -5) },
            'btn-B': () => {
                this.stop();
                this.exitCallback();
            }
        };

        if (typeof moveMap[data['button-id']] === 'function') {
            moveMap[data['button-id']]();
        }
    }

    buttonUpCallback (data) {
        if (data['button-id']) {
            this.buttonPressed[data['button-id']] = clearInterval(this.buttonPressed[data['button-id']]);
        }
    }

    start (serialBridge, exitCallback) {
        if (!this.paused) {
            this.serialBridge = serialBridge;
            this.exitCallback = exitCallback;
        }

        // Microphone setup
        this.mic = Microphone(this.config);
        this.mic.onVolumeThreshold(1, this.microphoneCallback.bind(this));

        this.serialBridge.on('button-down', this.buttonDownCb);
        this.serialBridge.on('button-up', this.buttonUpCb);

        this.gameId = gameLoop.setGameLoop(() => {
            this.tick();
        }, 1000 / this.config.lightshow.frame_rate);
        this.paused = false;
    }

    pause () {
        this.paused = true;
        this.stop();
    }

    stop () {
        this.mic.stopRecording();
        this.serialBridge.removeListener('button-down', this.buttonDownCb);
        this.serialBridge.removeListener('button-up', this.buttonUpCb);

        // Make sure that the button intervals are cleared
        Object.keys(this.buttonPressed).forEach(id => {
            this.buttonPressed[id] = clearInterval(this.buttonPressed[id]);
        });

        gameLoop.clearGameLoop(this.gameId);
    }
}

module.exports = SoundVisualiserManager;
