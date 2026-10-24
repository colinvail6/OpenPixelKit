"use strict";
var gameLoop = require('node-gameloop'),
    GameUtilsAnimation = require('../animations/game-utils'),
    Color = require('color'),
    ScoreManager = require('../utils/score');

/**
 * Creates a player to manage the snake game
 * The constructor is invoked with number of rows, number of colums and a callback to render
 * on a linear LED board (real or virtual).
 */
class SnakeManager {
    constructor (config, renderCallback) {
        this.config = config;

        this.CELLS_NUM = this.config.lightboard.x_count * this.config.lightboard.y_count;
        this.renderCallback = renderCallback;

        this.frameCount = 0;

        this.linearBoard = new Array(this.CELLS_NUM).fill(this.config.games.background_color);

        this.explosion = {frames: []};
        this.score = 0;

        this.scoreManager = new ScoreManager(this.config);
        this.gameName = 'snake';

        this.buttonPressedCb = this.buttonPressedCallback.bind(this);
    }

    /**
     * when a move is made this function is run
     * @param  {object} dir e.g. {x: -1, y: 0}
     */
    move(dir) {
        // Avoid going in the opposite direction
        if ((dir.x + this.movement.x) !== 0 || (dir.y + this.movement.y) !== 0) {
            this.movement = dir;
        }
    }

    /**
     * Test tail if game over
     */
    testTail(_x,_y) {
        for (let i = 0; i < this.snake.length; i++) {
            if (this.snake[i].x == _x && this.snake[i].y == _y) {
                return true;
            }
        }
        return false;
    }

    /**
     * Evolves the game at every tick
     */
    tick() {
        let i;

        if (this.frameCount % 8 == 1) {
            this.snakeHead = {
                x: this.snake[0].x + this.movement.x,
                y: this.snake[0].y + this.movement.y
            };

            if (this.snakeHead.x < 0) {
                this.snakeHead.x = 15;
            } else if (this.snakeHead.x > 15) {
                this.snakeHead.x = 0;
            }

            if (this.snakeHead.y < 0) {
                this.snakeHead.y = 7;
            } else if (this.snakeHead.y > 7) {
                this.snakeHead.y = 0;
            }

            if (this.testTail(this.snakeHead.x, this.snakeHead.y)) {
                this.gameOver();
            }

            this.snake.unshift(this.snakeHead);
            this.snake.pop();
            this.explosion = {frames: []};
            this.moved = false;

            this.foodColor = Color.hsv(Math.random() * 360, 100, 100);
            this.food.color = (this.food.color.hex() == '#FFFFFF') ? this.foodColor : Color.rgb(255, 255, 255);

            if (this.snakeHead.x == this.food.x && this.snakeHead.y == this.food.y) {
                this.score++;
                for (i = 0; i < 2; i++) {
                    this.snake.unshift({
                        x: this.snakeHead.x,
                        y: this.snakeHead.y
                    });
                    this.snakeColor.unshift(this.foodColor);
                }

                this.explosion.frame = 0;
                this.explosion.x = this.food.x;
                this.explosion.y = this.food.y;
                this.explosion.color = Color(this.foodColor);

                this.generateFoodPos();
            }
        }

        this.explode();
        this.drawOnBoard();
    }

    buttonPressedCallback (data) {
        if (this.paused) {
            return;
        }
        let moveMap = {
            'js-left': {x: -1, y: 0},
            'js-right': {x: 1, y: 0},
            'js-up': {x: 0, y: -1},
            'js-down': {x: 0, y: 1}
        };

        if (moveMap[data['button-id']]) {
            this.move(moveMap[data['button-id']]);
        } else if (data['button-id'] == 'btn-B') {
            this.stop();
            this.exitCallback();
        }
    }

    /**
     * Starts the game
     */
    start (serialBridge, exitCallback) {
        if (!this.paused) {
            let randomColor;

            this.serialBridge = serialBridge;
            this.exitCallback = exitCallback;
            this.score = 0;

            this.snake = [{x: 8, y: 4}, {x: 9, y: 4}];
            this.snakeHead = {x: this.snake[0].x, y: this.snake[0].y};

            this.moved = false;
            this.movement = {x: 0, y: -1};

            randomColor = Color.hsv(Math.random() * 360, 100, 100);
            this.snakeColor = [randomColor, randomColor];

            this.food = {};
            this.generateFoodPos();
            this.food.color = this.foodColor = Color.hsv(Math.random() * 360, 100, 100);
        }

        this.serialBridge.on('button-down', this.buttonPressedCb);

        new GameUtilsAnimation(this.config, this.renderCallback)
            .startInitAnimation(this.config.games.startup_animation_colors)
            .then(() => {
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

    stop () {
        this.serialBridge.removeListener('button-down', this.buttonPressedCb);
        gameLoop.clearGameLoop(this.gameId);
    }

    /**
     * Generates a new position for the apple
     */
    generateFoodPos () {
        do {
            this.food.x = Math.floor(Math.random() * this.config.lightboard.x_count);
            this.food.y = Math.floor(Math.random() * this.config.lightboard.y_count);
        } while (this.testTail(this.food.x, this.food.y));
    }

    /**
     * Explode
     */
    explode() {
        if (this.explosion.frame < 12) {
            let frame = this.explosion.frame,
                frames = this.explosion.frames,
                explosion_x = this.explosion.x,
                explosion_y = this.explosion.y;
            if (frame === 0) {
                frames.push(
                    {x: explosion_x - 1, y: explosion_y},
                    {x: explosion_x, y: explosion_y - 1},
                    {x: explosion_x + 1, y: explosion_y},
                    {x: explosion_x, y: explosion_y + 1}
                );
            } else if (Math.floor(frame) === 3) {
                frames.push(
                    {x: explosion_x - 2, y: explosion_y},
                    {x: explosion_x, y: explosion_y - 2},
                    {x: explosion_x - 1, y: explosion_y - 1}
                );
            } else if (Math.floor(frame) === 6) {
                this.explosion.color = this.explosion.color.darken(0.5);
                frames.push(
                    {x: explosion_x - 2, y: explosion_y},
                    {x: explosion_x, y: explosion_y - 2},
                    {x: explosion_x + 2, y: explosion_y},
                    {x: explosion_x, y: explosion_y + 2},
                    {x: explosion_x - 1, y: explosion_y - 1},
                    {x: explosion_x - 1, y: explosion_y + 1},
                    {x: explosion_x + 1, y: explosion_y + 1},
                    {x: explosion_x + 1, y: explosion_y - 1}
                );
            } else if (Math.floor(frame) === 9) {
                this.explosion.color = this.explosion.color.darken(0.5);
                frames.push(
                    {x: explosion_x - 2, y: explosion_y},
                    {x: explosion_x, y: explosion_y - 2},
                    {x: explosion_x + 2, y: explosion_y},
                    {x: explosion_x, y: explosion_y + 2}
                );
            }
            this.explosion.frame += 1.5;
        } else {
            this.explosion.frames = [];
        }
    }

    /**
     * Draws on the board using the rednderCallback
     */
    gameOver () {
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

    /**
     * Draws on the board using the renderCallback
     */
    drawOnBoard () {
        let pos;
        // Reset the board
        this.linearBoard.fill(this.config.games.background_color);

        this.snake.forEach((snakePart, index) => {
            pos = snakePart.y * this.config.lightboard.x_count + snakePart.x;
            this.linearBoard[pos] = this.snakeColor[index].hex();
        });

        pos = this.food.y * this.config.lightboard.x_count + this.food.x;
        this.linearBoard[pos] = this.food.color.hex();

        this.explosion.frames.forEach((frame) => {
            pos = frame.y * this.config.lightboard.x_count + frame.x;
            this.linearBoard[pos] = this.explosion.color.hex();
        });

        this.linearBoard[this.snakeHead.y * this.config.lightboard.x_count + this.snakeHead.x] = this.config.games.snake_head_color;

        this.renderCallback(this.linearBoard);
    }
}

if (typeof module !== "undefined") {
    module.exports = SnakeManager;
}
