"use strict";

let Color = require('color'),
    Canvas = require('canvas'),
    gameLoop = require('node-gameloop'),
    GameUtilsAnimation = require('../animations/game-utils'),
    p5Kano = require('../utils/kano-p5'),
    ScoreManager = require('../utils/score');

class Asteroid {
    constructor(_x, _y, _length) {
        this.x = _x;
        this.y = _y;
        this.length = _length;
    }

    update(speed) {
        this.x -= 0.1 * speed;
    }

    render(ctx, frameCount) {
        ctx.fillStyle = Color.rgb(255, 255, 255).hex();

        ctx.fillRect(this.x - 1, this.y - 1, 3, 3);
        if (this.x > 16 && this.x < 25) {
            ctx.fillStyle = Color.rgb(0, 0, (20 * (frameCount % 4))).hex();
            ctx.fillRect(15, this.y - 1, 1, 3);
        }
    }

    collisionCheck (_x,_y) {
        // if (!invincible) {
        if (_y === this.y) {
            if (this.x > _x - 1 && this.x < _x + 2) {
                return true;
            }
        } else {
            return false;
        }
    }
}

class RunnerManager {
    constructor(config, renderCallback) {
        this.config = config;
        this.renderCallback = renderCallback;
        this.scoreManager = new ScoreManager(this.config);
        this.gameName = 'runner';

        this.buttonPressedCb = this.buttonPressedCallback.bind(this);
    }

    resetGame() {
        let i;

        this.frameCount = 0;
        this.canvas = new Canvas(
            this.config.lightboard.x_count,
            this.config.lightboard.y_count
        );
        this.ctx = this.canvas.getContext('2d');
        this.lanes = [1, 3, 6];
        this.player = {
            x: 6,
            y: 3,
            lane: 1
        };
        this.rainbowX = new Array(20).fill(0);
        this.rainbowY = new Array(20).fill(0);
        this.linearBoard = new Array(128);
        this.speed = 1;
        this.pulse = 100;
        this.pulseWidth = 1;
        this.asteroids = [];
        this.score = 0;
        this.orb = {
            x: 14,
            y: 3
        };
        this.stars = [];
        for (i = 0; i < 7; i++) {
            this.stars.push({
                x: p5Kano.random(0, 35),
                y: Math.round(p5Kano.random(0, 8)),
                px: p5Kano.random(16, 35),
                py: Math.round(p5Kano.random(0, 8))
            });
        }
    }

    updatePlayer() {
        if (this.player.x > 5) {
            this.player.x -= 0.5;
        }
        if (this.player.movedLane) {
            this.player.y = this.lanes[this.player.lane];
            this.player.movedLane = false;
        }
    }

    renderPlayer() {
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillRect(this.player.x, this.player.y, 2, 1);
    }

    renderAsteroids() {
        this.asteroids.forEach((asteroid) => {
            asteroid.render(this.ctx, this.frameCount);
        });
    }

    updateAsteroids() {
        let i;

        for (i = 0; i < this.asteroids.length; i++) {
            this.asteroids[i].update(this.speed);

            if (this.asteroids[i].collisionCheck(this.player.x, this.player.y)) {
                this.gameOver();
            }
        }

        if (this.frameCount % 100 === 90) {
            if (p5Kano.random(0, 100) > 90) {
                this.asteroids.push(new Asteroid(20, this.lanes[p5Kano.random(0, 3)], 3));
                this.asteroids.push(new Asteroid(20, this.lanes[p5Kano.random(0, 3)], 3));
            } else {
                this.asteroids.push(new Asteroid(20, this.lanes[p5Kano.random(0, 3)], 3));
            }
        }
    }

    updateStars() {
        let i, color;

        for (i = 0; i < this.stars.length; i++) {

            color = Color({
                'h': 184,
                's': 100,
                'v': p5Kano.random(0, 50)
            }).hex();

            this.stars[i].x -= 0.1 * this.speed;

            p5Kano.line(this.ctx, color, this.stars[i].x, this.stars[i].y, this.stars[i].px, this.stars[i].py);

            if (this.stars[i].px < -10) {
                this.stars[i].x = p5Kano.random(17, 35);
                this.stars[i].y = Math.round(p5Kano.random(0, 8));
            }
            this.stars[i].px = this.stars[i].x;
            this.stars[i].py = this.stars[i].y;
        }
    }

    updateRainbow() {
        this.rainbowX.pop();
        this.rainbowX.unshift(this.player.x);
        this.rainbowY.pop();
        this.rainbowY.unshift(this.player.y);

        if (this.pulseWidth > 1) {
            this.pulseWidth -= 0.25;
        }

        if (this.pulse < 100) {
            this.pulse += 5;
        }
    }

    renderRainbow() {
        let i;
        for (i = 1; i < this.rainbowX.length; i++) {
            let randomColor = Color.hsv(
                p5Kano.wrap((10 - i * 20) + (this.frameCount * (10 + this.speed)), 360),
                this.pulse,
                100
            ).hex();
            this.rainbowX[i] = this.rainbowX[i] - 1;

            this.ctx.lineWidth = 1;

            p5Kano.line(this.ctx, randomColor, this.rainbowX[i], this.rainbowY[i], this.rainbowX[i - 1], this.rainbowY[i - 1]);

            if (this.pulseWidth > 2) {
                p5Kano.line(this.ctx, randomColor, this.rainbowX[i], this.rainbowY[i] - 1, this.rainbowX[i - 1], this.rainbowY[i - 1] - 1);
                p5Kano.line(this.ctx, randomColor, this.rainbowX[i], this.rainbowY[i] + 1, this.rainbowX[i - 1], this.rainbowY[i - 1] + 1);
            }
            if (this.pulseWidth > 4) {
                p5Kano.line(this.ctx, randomColor, this.rainbowX[i] - 1, this.rainbowY[i] - 2, this.rainbowX[i - 1] - 1, this.rainbowY[i - 1] - 2);
                p5Kano.line(this.ctx, randomColor, this.rainbowX[i] - 1, this.rainbowY[i] + 2, this.rainbowX[i - 1] - 1, this.rainbowY[i - 1] + 2);
            }
        }
    }

    updateOrb() {
        this.orb.x  -= 0.1 * this.speed;
        if (this.orb.x < -4) {
            this.orb.x = p5Kano.random(20, 60);
            this.orb.y = this.lanes[Math.floor(p5Kano.random(0, 3))];
        }
        if (this.orb.y == this.player.y) {
            if (this.orb.x > this.player.x - 1 && this.orb.x < this.player.x + 1) {
                this.score++;
                this.speed = p5Kano.constrain(this.speed += 0.5, 1, 19);
                this.pulse = 0;
                this.pulseWidth = 6;
                this.player.x += 7;
                this.orb.x = p5Kano.random(20, 60);
                this.orb.y = this.lanes[Math.floor(p5Kano.random(0, 3))];
            }
        }
    }

    renderOrb() {
        this.ctx.fillStyle = Color({
            'r': this.frameCount * 6 % 360,
            'g': 100,
            'b': 100
        }).hex();

        this.ctx.fillRect(this.orb.x - 1, this.orb.y, 3, 1);
        this.ctx.fillRect(this.orb.x, this.orb.y - 1, 1, 3);
        if (this.orb.x > 16 && this.orb.x < 19) {
            this.ctx.fillStyle = Color({
                'r': this.frameCount * 6 % 360,
                'g': 100,
                'b': 100
            }).hex();
            this.ctx.fillRect(15, this.orb.y, 1, 1);
        }
    }

    tick() {
        this.updateStars();

        this.updateRainbow();
        this.renderRainbow();

        this.updateOrb();
        this.renderOrb();

        this.updateAsteroids();
        this.renderAsteroids();

        this.updatePlayer();
        this.renderPlayer();

        this.drawOnBoard();
    }

    drawOnBoard() {
        let pos, i, j, colorData;

        this.linearBoard.fill(this.config.games.background_color);

        for (i = 0; i < this.config.lightboard.y_count; i++) {
            for (j = 0; j < this.config.lightboard.x_count; j++) {
                colorData = this.ctx.getImageData(j, i, 1, 1).data;
                pos = i * this.config.lightboard.x_count + j;
                if (colorData[3]) {
                    this.linearBoard[pos] = (Color.rgb(colorData[0], colorData[1], colorData[2], colorData[3]).hex());
                }
            }
        }

        // Render
        this.renderCallback(this.linearBoard);

        // Reset the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    gameOver() {
        this.stop();

        this.scoreManager.updateHighestScore(this.gameName, this.score);

        setTimeout(() => {
            new GameUtilsAnimation(this.config, this.renderCallback)
                .startScoreAnimation(this.scoreManager.getHighestScore(this.gameName), this.score, this.config.games.game_over_score_color)
                .then(() => {
                    this.exitCallback();
                });
        }, 100);
    }

    buttonPressedCallback(data) {
        let moveMap = {
            'js-up': (-1),
            'js-down': 1
        },
        newPos;

        if (moveMap[data['button-id']]) {
            newPos = this.player.lane + moveMap[data['button-id']];
            if (newPos >= 0 && newPos < 3) {
                this.player.lane = newPos;
                this.player.movedLane = true;
            }
        } else if (data['button-id'] == 'btn-B') {
            this.stop();
            this.exitCallback();
        }
    }

    start(serialBridge, exitCallback) {
        if (!this.paused) {
            this.resetGame();
            this.serialBridge = serialBridge;
            this.exitCallback = exitCallback;
        }

        new GameUtilsAnimation(this.config, this.renderCallback)
            .startInitAnimation(this.config.games.startup_animation_colors)
            .then(() => {
                this.serialBridge.on('button-down', this.buttonPressedCb);

                this.gameId = gameLoop.setGameLoop(() => {
                    this.frameCount++;
                    this.tick();
                }, 1000 / this.config.games.frame_rate);
            });
        this.paused = false;
    }

    pause () {
        this.paused = true;
        this.serialBridge.removeListener('button-down', this.buttonPressedCb);
        gameLoop.clearGameLoop(this.gameId);
    }

    stop() {
        this.serialBridge.removeListener('button-down', this.buttonPressedCb);
        gameLoop.clearGameLoop(this.gameId);
    }
}


module.exports = RunnerManager;
