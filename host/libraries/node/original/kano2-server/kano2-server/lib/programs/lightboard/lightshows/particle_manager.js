"use strict";
const gameLoop = require('node-gameloop'),
    HardwareAPI = require('../../../hardware-api'),
    Color = require('color'),
    Canvas = require('canvas'),
    p5 = require('../utils/kano-p5'),
    scaler = 0.008,
    distort = 0.05,
    angle = 0.0,
    width = 16,
    height = 8;

class Particle {
    constructor(ctx, x, y) {
        this.ctx = ctx;
        this.x = p5.random(0, 500);
        this.y = p5.random(0, 500);
        this.prevx = this.x;
        this.prevy = this.y;
        this.color = Color.hsv(p5.random(0, 360), 50, 100);
    }

    move (offset, speed, accelerometerData) {
        let ang;

        this.prevx = this.x;
        this.prevy = this.y;

        if (accelerometerData) {
            this.x += speed * accelerometerData.x;
            this.y += speed * accelerometerData.y * (-1);
        } else {
            ang = (Math.PI) * p5.noise(0 + (this.x * scaler), offset + (this.y * scaler));
            this.x += speed * Math.cos(ang + Math.random());
            this.y += speed * Math.sin(ang + Math.random());
        }

        if (this.x < -5) {
            this.x = width + 4;
            this.prevx = this.x;
            this.y = p5.random(0, 500) ;
            this.prevy = this.y;
        }
        if (this.y < -5) {
            this.y = height + 4;
            this.prevy = this.y;
            this.x = p5.random(0, 500) ;
            this.prevx = this.x;
        }
        if (this.x > width + 5) {
            this.x = -4 ;
            this.prevx = this.x;
            this.y = p5.random(0, 500) ;
            this.prevy = this.y;
        }
        if (this.y > height + 5) {
            this.y = -4 ;
            this.prevy = this.y;
            this.x = p5.random(0, 500);
            this.prevx = this.x;
        }
    }

    moveTo (_x,_y) {
        this.x = _x;
        this.y = _y;
    }

    render() {
        p5.point(this.ctx, this.color.hex(), this.x, this.y);
    }
}


/**
 * Creates a player to manage the snake game
 * The constructor is invoked with number of rows, number of colums and a callback to render
 * on a linear LED board (real or virtual).
 */
class ParticleManager {
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

        this.particleHolder = new Array(this.config.lightshow.particle_count);

        for (i = 0; i < this.particleHolder.length; i++) {
            this.particleHolder[i] = new Particle(this.ctx, 200, 200);
        }

        this.renderCallback = renderCallback;
        this._linearBoard = new Array(this.CELLS_NUM).fill(this.config.games.background_color);

        // Used to interact with the tilt sensor
        this.hardwareAPI = new HardwareAPI(this.config);

        this.accelerometerDataCb = this.accelerometerDataCallback.bind(this);

        this.hardwareAPI.devices.on('device-added', devices => {
            // Wait for the virtual devices to get initialised
            process.nextTick(() => {
                this.searchTiltSensor(this.hardwareAPI.getAllDevices());
            });
        });

        this.hardwareAPI.devices.on('device-removed', devices => {
            this.searchTiltSensor(this.hardwareAPI.getAllDevices());
        });

        this.buttonPressedCb = this.buttonPressedCallback.bind(this);
    }

    searchTiltSensor (devices) {
        let i;

        // Cleanup any old devices
        if (this.tiltSensor) {
            this.tiltSensor.removeListener('accelerometer-data', this.accelerometerDataCb);
            this.tiltSensor = null;
        }

        for (i = 0 ; i < devices.length; i++) {
            if (devices[i].product === 'gyro-accelerometer') {
                this.tiltSensor = devices[i];
                this.tiltSensor.on('accelerometer-data', this.accelerometerDataCb);
                break;
            }
        }

        // Let the default animation run if the tilt sensor is removed
        if (!this.tiltSensor) {
            this.accelerometerData = null;
        }
    }

    accelerometerDataCallback (data) {
        this.accelerometerData = data;
    }

    _draw () {
        let i;
        this.offset += distort;
        for (i = 0; i < this.particleHolder.length; i++) {
            this.particleHolder[i].move(this.offset, this.speed, this.accelerometerData);
            this.particleHolder[i].render();
        }
    }

    /**
     * Evolves the game at every tick
     */
    tick() {
        this._draw();
        this._drawOnBoard();
    }

    buttonPressedCallback (data) {
        if (this.paused) {
            return;
        }
        let conf = this.config.lightshow,
            moveMap = {
                'btn-B': () => {
                    this.stop();
                    this.exitCallback();
                }
            };

        if (typeof moveMap[data['button-id']] === 'function') {
            moveMap[data['button-id']]();
        }
    }

    /**
     * Starts the game
     */
    start (serialBridge, exitCallback) {
        if (!this.paused) {
            this.serialBridge = serialBridge;
            this.exitCallback = exitCallback;

            // Search for the sensor when the app starts
            this.searchTiltSensor(this.hardwareAPI.getAllDevices());
        }

        this.serialBridge.on('button-down', this.buttonPressedCb);

        this.gameId = gameLoop.setGameLoop(() => {
            this.tick();
        }, 1000 / this.config.lightshow.frame_rate);

        this.paused = false;
    }

    pause () {
        this.paused = true;
        this.serialBridge.removeListener('button-down', this.buttonPressedCb);
        gameLoop.clearGameLoop(this.gameId);
    }

    stop () {
        if (this.tiltSensor) {
            this.tiltSensor.removeListener('accelerometer-data', this.accelerometerDataCb);
            this.tiltSensor = null;
        }
        this.serialBridge.removeListener('button-down', this.buttonPressedCb);
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
    module.exports = ParticleManager;
}
