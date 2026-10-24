"use strict";
const gameLoop = require('node-gameloop'),
    Color = require('color'),
    p5 = require('../utils/kano-p5'),
    permutation = [151,160,137,91,90,15,
        131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
        190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
        88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
        77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
        102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
        135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
        5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
        223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
        129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
        251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
        49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
        138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
    ];


class PerlinNoise {
    constructor () {
        let i;
        this.p = new Array(2 * permutation.length);

        // TODO (convolu): I'm sure there must be a better way of filling the
        // existing array with values from another Array
        for (i = 0; i < 256 ; i++) {
            this.p[256 + i] = this.p[i] = permutation[i];
        }
    }

    noise(x, y, z) {
        let X,
            Y,
            Z,
            u,
            v,
            w,
            A,
            AA,
            AB,
            B,
            BA,
            BB;

        X = Math.floor(x) & 255;
        Y = Math.floor(y) & 255;
        Z = Math.floor(z) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);

        u = PerlinNoise.fade(x);
        v = PerlinNoise.fade(y);
        w = PerlinNoise.fade(z);

        A = this.p[X] + Y;
        AA = this.p[A] + Z;
        AB = this.p[A + 1] + Z;
        B = this.p[X + 1] + Y;
        BA = this.p[B] + Z;
        BB = this.p[B + 1] + Z;

        return PerlinNoise.scale(
            PerlinNoise.lerp(
                w,
                PerlinNoise.lerp(
                    v,
                    PerlinNoise.lerp(
                        PerlinNoise.grad(this.p[AA], x, y, z),
                        PerlinNoise.grad(this.p[BA], x - 1, y, z),
                        u
                    ),
                    PerlinNoise.lerp(
                        PerlinNoise.grad(this.p[AB], x, y - 1, z),
                        PerlinNoise.grad(this.p[BB], x - 1, y - 1, z),
                        u
                    )
                ),
                PerlinNoise.lerp(
                    v,
                    PerlinNoise.lerp(
                        PerlinNoise.grad(this.p[AA + 1], x, y, z - 1),
                        PerlinNoise.grad(this.p[BA + 1], x - 1, y, z - 1),
                        u
                    ),
                    PerlinNoise.lerp(
                        PerlinNoise.grad(this.p[AB + 1], x, y - 1, z - 1),
                        PerlinNoise.grad(this.p[BB + 1], x - 1, y - 1, z - 1),
                        u
                    )
                )
            )
        );
    }

    static fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    static grad(hash, x, y, z) {
        let h = hash & 15,
            u = h < 8 ? x : y,
            v = h < 4 ? y : h == 12 || h == 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    static scale(n) {
        return (1 + n) / 2;
    }

    static lerp(t, a, b) {
        return a + t * (b - a);
    }
}

/**
 * Creates a player to manage the snake game
 * The constructor is invoked with number of rows, number of colums and a callback to render
 * on a linear LED board (real or virtual).
 */
class LightshowManager {
    constructor (config, renderCallback) {
        this.config = config;

        this.noiseGenerator = new PerlinNoise();

        this.CELLS_NUM = this.config.lightboard.x_count * this.config.lightboard.y_count;
        this.renderCallback = renderCallback;

        this._linearBoard = new Array(this.CELLS_NUM).fill(this.config.games.background_color);

        this.h1 = 70;
        this.s1 = 80;
        this.l1 = 91;
        this.h2 = 205;
        this.s2 = 72;
        this.l2 = 56;

        this.animating = false;
        this.timescale = 0.08;
        this.time = 0.0;
        this.noiseScale = 0.1;
        this.progress = 0.0;

        this.buttonPressedCb = this.buttonPressedCallback.bind(this);
    }

    _changeColors() {
        this.progress = 0.0;
        this.h1Start = this.h1;
        this.s1Start = this.s1;
        this.l1Start = this.l1;
        this.h2Start = this.h2;
        this.s2Start = this.s2;
        this.l2Start = this.l2;
        this.animating = true;
        this.h1Target = p5.random(0, 360);
        this.s1Target = p5.random(0, 100);
        this.l1Target = p5.random(50, 100);
        this.h2Target = p5.wrap(this.h1Target + 180, 360);
        this.s2Target = p5.random(0, 100);
        this.l2Target = p5.random(0, 100);
    }

    _tweenColors () {
        if (this.animating) {
            this.progress += 0.05;
            this.h1 = p5.lerp(this.h1Start, this.h1Target, this.progress);
            this.s1 = p5.lerp(this.s1Start, this.s1Target, this.progress);
            this.l1 = p5.lerp(this.l1Start, this.l1Target, this.progress);
            this.h2 = p5.lerp(this.h2Start, this.h2Target, this.progress);
            this.s2 = p5.lerp(this.s2Start, this.s2Target, this.progress);
            this.l2 = p5.lerp(this.l2Start, this.l2Target, this.progress);
            if (this.progress >= 1.0) {
                this.animating = false;
            }
        }
    }

    /**
     * Evolves the game at every tick
     */
    tick() {
        this.drawOnBoard();
    }

    /**
     * Handler for serial events
     */
    buttonPressedCallback (data) {
        if (this.paused) {
            return;
        }
        let conf = this.config.lightshow,
            moveMap = {
                'js-left': () => {
                    if (this.noiseScale <= conf.perlin_noisescale_max) {
                        this.noiseScale += conf.perlin_noisescale_step;
                    }
                },
                'js-right': () => {
                    if (this.noiseScale >= conf.perlin_noisescale_min) {
                        this.noiseScale -= conf.perlin_noisescale_step;
                    }
                },
                'js-up': () => {
                    if (this.timescale <= conf.perlin_timescale_max) {
                        this.timescale += conf.perlin_timescale_step;
                    }
                },
                'js-down': () => {
                    if (this.timescale >= conf.perlin_timescale_min) {
                        this.timescale -= conf.perlin_timescale_step;
                    }
                },
                'btn-A': () => {
                    this._changeColors();
                },
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
     * Add serial events and starts the game loop
     */
    start (serialBridge, exitCallback) {
        if (!this.paused) {
            this.serialBridge = serialBridge;
            this.exitCallback = exitCallback;
        }

        this.serialBridge.on('button-down', this.buttonPressedCb);

        this.gameId = gameLoop.setGameLoop(() => {
            this.tick();
        }, 1000 / this.config.lightshow.frame_rate);
        this.paused = false;
    }

    stop () {
        this.serialBridge.removeListener('button-down', this.buttonPressedCb);
        gameLoop.clearGameLoop(this.gameId);
    }

    pause () {
        this.paused = true;
        this.serialBridge.removeListener('button-down', this.buttonPressedCb);
        gameLoop.clearGameLoop(this.gameId);
    }

    /**
     * Draws on the board using the renderCallback
     */
    drawOnBoard () {
        let it,
            pos,
            x,
            y;

        this._tweenColors();
        for (x = 0; x < this.config.lightboard.x_count; x++) {
            for (y = 0; y < this.config.lightboard.y_count; y++) {
                it = this.noiseGenerator.noise(
                    x * this.noiseScale,
                    y * this.noiseScale,
                    this.time
                );
                it = p5.constrain(p5.map(it, 0.3, 0.8, 0.0, 1.0), 0.0, 1.0);
                pos = y * this.config.lightboard.x_count + x;
                this._linearBoard[pos] = Color({
                    'h': p5.lerp(this.h1, this.h2, it),
                    's': p5.lerp(this.s1, this.s2, it),
                    'l': p5.lerp(this.l1, this.l2, it)
                })
                .hex();
            }
        }
        this.time += this.timescale;

        this.renderCallback(this._linearBoard);
    }
}

if (typeof module !== "undefined") {
    module.exports = LightshowManager;
}
