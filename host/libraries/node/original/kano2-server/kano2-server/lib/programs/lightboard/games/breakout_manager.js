"use strict";

let Color = require('color'),
    Canvas = require('canvas'),
    gameLoop = require('node-gameloop'),
    GameUtilsAnimation = require('../animations/game-utils'),
    p5Kano = require('../utils/kano-p5'),
    ScoreManager = require('../utils/score');


class Brick {
    constructor(_x, _y, _hue) {
        this.x = _x;
        this.y = _y;
        this.hue = _hue;
        this.alpha = 100;
        this.timer = 0;
        this.width = 1;
        this.active = true;
        if (Math.round(p5Kano.random(0, 30)) === 1) {
            this.powerBrick = true;
        } else {
            this.powerBrick = false;
        }
    }

    draw(ctx) {
        ctx.fillStyle = (this.powerBrick) ?
            Color.hsv(0, 0, 100).hex() :
            Color.hsv(this.hue, 100, this.alpha).hex();
        ctx.fillRect(this.x, this.y, this.width, 2);
    }

    collisionCheck(_colX, _colY) {
        if (this.active) {
            if ((this.x <= _colX && this.x + 1 > _colX) && (this.y <= _colY && this.y + 2 > _colY)) {
                return true;
            }
            return false;
        }
    }

    update() {
        if (!this.active && this.alpha > 0) {
            this.x -= 2;
            this.width += 1;
            this.alpha -= 15;
        }
    }
}

class BreakoutManager {
    constructor(config, renderCallback) {
        this.config = config;
        this.renderCallback = renderCallback;
        this.scoreManager = new ScoreManager(this.config);
        this.gameName = 'breakout';
        this.pressedButtons = {};

        this.buttonDownCb = this.buttonDown.bind(this);
        this.buttonUpCb = this.buttonUp.bind(this);
    }

    resetGame() {
        let i;

        this.frameCount = 0;
        this.linearBoard = new Array(128);
        this.canvas = new Canvas(
            this.config.lightboard.x_count,
            this.config.lightboard.y_count
        );
        this.ctx = this.canvas.getContext('2d');
        this.player = {
            x: 0,
            y: 4,
            length: 3
        };
        this.balls = [
            {
                x: 5,
                y: 0,
                forceX: 0.5,
                forceY: 0.5,
                trail: {}
            }
        ];

        this.bricks = [];
        this.brickHue = 0;
        this.score = 0;
        this.batSat = 0;

        this.newRowTimer = 0;
        this.newRowLimit = 100;

        for (i = 0; i < 5; i++) {
            this.addRow();
        }
    }

    addRow() {
        this.bricks.forEach((brick) => {
            brick.x--;

            if (brick.active && brick.x < 1) {
                this.gameOver();
            }
        });

        this.bricks.push(new Brick(15, 0, this.brickHue + (this.bricks.length % 3 * 8), 0));
        this.bricks.push(new Brick(15, 2, this.brickHue + (this.bricks.length % 3 * 8), 0));
        this.bricks.push(new Brick(15, 4, this.brickHue + (this.bricks.length % 3 * 8), 0));
        this.bricks.push(new Brick(15, 6, this.brickHue + (this.bricks.length % 3 * 8), 0));

        this.brickHue = p5Kano.wrap(this.brickHue + 10, 360);
    }

    addBall() {
        this.balls.push({
            x: 2,
            y: this.player.y,
            forceX: 0.5,
            forceY: 0.5,
            trail: {}
        });
    }

    updateBalls() {
        let i, j, newX, newY;

        for (i = 0; i < this.balls.length; i++) {
            newX = this.balls[i].x + this.balls[i].forceX;
            newY = this.balls[i].y + this.balls[i].forceY;

            for (j = 0; j < this.bricks.length; j++) {
                if (this.bricks[j].collisionCheck(newX, newY)) {
                    if (this.bricks[j].powerBrick) {
                        this.addBall();
                    }
                    this.bricks[j].active = false;
                    this.balls[i].forceX *= -1;
                    this.score++;
                    break;
                }
            }
            if (Math.floor(newX) === this.player.x) {
                // Collision with bat
                if (newY > this.player.y - 0.5 && newY < this.player.y + this.player.length + 0.5) {
                    this.batSat = 100;
                    this.balls[i].forceX = Math.abs(this.balls[i].forceX);
                    this.balls[i].forceY += p5Kano.random(-0.1, 0.1);
                }
            }

            if (newY > 7)  {
                this.balls[i].forceY *= -1;
            } else if (newY < 0) {
                this.balls[i].forceY *= -1;
            }
            if (newX > 15.5) {
                this.balls[i].forceX *= -1;
                this.balls[i].x = 14;
            }
            this.balls[i].forceX = p5Kano.constrain(this.balls[i].forceX, -1, 1);
            this.balls[i].forceY = p5Kano.constrain(this.balls[i].forceY, -1, 1);

            this.balls[i].trail.x = this.balls[i].x;
            this.balls[i].trail.y = this.balls[i].y;
            this.balls[i].x = newX;
            this.balls[i].y = newY;
            if (this.balls[i].x < -2)  {
                this.balls.splice(i, 1);
            }
            if (this.balls.length <= 0) {
                this.gameOver();
            }
        }
    }

    tick() {
        if (this.frameCount % 2 === 0) {
            return;
        }

        let i;

        this.updateBalls();

        this.newRowLimit = p5Kano.constrain(Math.floor(100 - (this.score * 0.1)), 40, 100);

        if (this.newRowTimer >= this.newRowLimit) {
            this.addRow();
            this.newRowTimer = 0;
        }

        for (i = 0; i < this.bricks.length; i++) {
            this.bricks[i].update();
            if (this.bricks[i].alpha <= 0) {
                this.bricks.splice(i, 1);
            }
        }

        this.bricks.forEach((brick) => {
            brick.draw(this.ctx);
        });

        this.balls.forEach((ball) => {
            this.ctx.fillStyle = Color.hsv(0, 0, 100).hex();
            this.ctx.fillRect(
                Math.floor(ball.x),
                Math.floor(ball.y),
                1,
                1
            );

            if (ball.trail.x) {
                this.ctx.fillStyle = Color.hsv(0, 0, 50).hex();
                this.ctx.fillRect(
                    Math.floor(ball.trail.x),
                    Math.floor(ball.trail.y),
                    1,
                    1
                );
            }
        });

        if (this.batSat > 0) {
            this.batSat -= 5;
        }

        this.ctx.fillStyle = Color({
            h: 0, s: 0, v: 100
        }).hex();

        this.ctx.fillRect(
            this.player.x,
            this.player.y,
            1,
            this.player.length
        );
        this.newRowTimer++;

        this.drawOnBoard();
    }

    drawOnBoard() {
        let pos, i, j, colorData;

        // Reset the linear board pixels
        this.linearBoard.fill(this.config.games.background_color);

        for (i = 0; i < this.config.lightboard.y_count; i++) {
            for (j = 0; j < this.config.lightboard.x_count; j++) {
                colorData = this.ctx.getImageData(j, i, 1, 1).data;
                pos = i * this.config.lightboard.x_count + j;
                if (colorData[3]) {
                    this.linearBoard[pos] = Color.rgb(colorData).hex();
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

    buttonDown(data) {
        let buttonId = data['button-id'],
            moveData = {
                'js-up': (-1),
                'js-down': 1
            }[buttonId];

        if (moveData) {
            this.player.y = Math.min(5, Math.max(0, this.player.y + moveData));

            if (this.pressedButtons[buttonId]) {
                this.pressedButtons[buttonId] = clearInterval(this.pressedButtons[buttonId]);
            }

            this.pressedButtons[buttonId] = setInterval((moveData => {
                this.player.y = Math.min(5, Math.max(0, this.player.y + moveData));
            }).bind(this, moveData), 100);
        } else if (buttonId == 'btn-B') {
            this.stop();
            this.exitCallback();
        }
    }

    buttonUp(data) {
        let buttonId = data['button-id'],
            moveData = {
                'js-up': (-1),
                'js-down': 1
            }[buttonId];

        if (moveData) {
            this.pressedButtons['js-up'] = clearInterval(this.pressedButtons['js-up']);
            this.pressedButtons['js-down'] = clearInterval(this.pressedButtons['js-down']);
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
                this.serialBridge.on('button-down', this.buttonDownCb)
                this.serialBridge.on('button-up', this.buttonUpCb);

                this.gameId = gameLoop.setGameLoop(() => {
                    this.frameCount++;
                    this.tick();
                }, 1000 / this.config.games.frame_rate);
            });
        this.paused = false;
    }

    pause () {
        this.paused = true;
        this.stop();
    }

    stop() {
        this.serialBridge.removeListener('button-down', this.buttonDownCb);
        this.serialBridge.removeListener('button-up', this.buttonUpCb);
        gameLoop.clearGameLoop(this.gameId);

        // Make sure that all the intervals are cleaned when you pause/stop the game
        this.pressedButtons['js-up'] = clearInterval(this.pressedButtons['js-up']);
        this.pressedButtons['js-down'] = clearInterval(this.pressedButtons['js-down']);
    }
}


module.exports = BreakoutManager;
