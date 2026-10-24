"use strict";
let Color = require('color'),
    Canvas = require('canvas'),
    gameLoop = require('node-gameloop');

class BaseMenuManager {
    constructor (config, renderCallback) {
        this.config = config;

        this.ROWS_NUM = this.config.lightboard.y_count;
        this.COLS_NUM = this.config.lightboard.x_count;
        this.DEFAULT_BACKGROUND_COLOR = this.config.games.background_color;
        this.linearBoard = new Array(this.ROWS_NUM * this.COLS_NUM);

        this.programsClasses = [];
        this.programCanvasIcons = [];
        this.currentProgramIndex = 0;
        this.programs = [];

        this.menuTransition = {
            frameCount: -1,
            oldIndex: null,
            newIndex: null
        }

        this.frameCount = 0;

        this.canvas = new Canvas(
            this.config.lightboard.x_count,
            this.config.lightboard.y_count
        );
        this.ctx = this.canvas.getContext('2d');

        this.border = {
            color: Color(this.config.games.menu_border_color),
            offset: 0,
            test: 0
        };

        this.renderCallback = renderCallback;

        this.buttonPressedCb = this.buttonPressed.bind(this);
    }

    loadIcon(pngPath, callback) {
        let image = new Canvas.Image();
        image.src = pngPath;
        this.programCanvasIcons.push(image);
    }

    start(serialBridge) {
        if (!this.paused) {
            this.serialBridge = serialBridge;
        }

        this.paused = false;
        this.serialBridge.on('button-down', this.buttonPressedCb);

        this.gameId = gameLoop.setGameLoop(() => {
            this.frameCount++;
            this.tick();
        }, 1000 / this.config.games.frame_rate);
    }

    updateBorder() {
        let i,
            borderOffset = this.border.offset;

        this.border.points = [];
        this.emptyPoints = 0;
        for (i = 0; i < this.COLS_NUM; i++) {
            if ((borderOffset++ % 4) < 2) {
                this.border.points.push({x: i, y: 0});
            }
        }
        for (i = 1; i < this.ROWS_NUM; i++) {
            if ((borderOffset++ % 4) < 2) {
                this.border.points.push({x: this.COLS_NUM - 1, y: i});
            }
        }
        for (i = this.COLS_NUM - 2; i >= 0 ; i--) {
            if ((borderOffset++ % 4) < 2) {
                this.border.points.push({x: i, y: this.ROWS_NUM - 1});
            }
        }
        for (i = this.ROWS_NUM - 2; i >= 1 ; i--) {
            if ((borderOffset++ % 4) < 2) {
                this.border.points.push({x: 0, y: i});
            }
        }
    }

    generateAnimationFrame() {
        if (this.menuTransition.oldIndex < this.menuTransition.newIndex) {
            this.ctx.drawImage(this.programCanvasIcons[this.menuTransition.oldIndex], this.menuTransition.frameCount * (-1), 0, 16, 8);
            this.ctx.drawImage(this.programCanvasIcons[this.menuTransition.newIndex], this.COLS_NUM - this.menuTransition.frameCount, 0, 16, 8);
        } else {
            this.ctx.drawImage(this.programCanvasIcons[this.menuTransition.oldIndex], this.menuTransition.frameCount, 0, 16, 8);
            this.ctx.drawImage(this.programCanvasIcons[this.menuTransition.newIndex], (-1) * this.COLS_NUM + this.menuTransition.frameCount, 0, 16, 8);
        }
        this.menuTransition.frameCount += 2;

        if (this.menuTransition.frameCount > 16) {
            this.menuTransition.frameCount = -1;
        }
    }

    tick() {
        if (this.frameCount % 3 === 1) {
            this.border.test = (this.border.test + 1) % 4;
            this.border.offset = this.border.test;
            this.updateBorder();

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (this.menuTransition.frameCount !== -1) {
                this.generateAnimationFrame();
            } else {
                let img = this.programCanvasIcons[this.currentProgramIndex];
                this.ctx.drawImage(img, 0, 0, img.width, img.height);
            }
            this.draw();
        } else if (this.menuTransition.frameCount !== -1) {
            this.generateAnimationFrame();
            this.draw();
        }
    }

    draw() {
        let i, j, pos, colorData;

        this.linearBoard.fill(this.config.lightboard.background_color);

        for (i = 0; i < this.config.lightboard.y_count; i++) {
            for (j = 0; j < this.config.lightboard.x_count; j++) {
                colorData = this.ctx.getImageData(j, i, 1, 1).data;
                pos = i * this.config.lightboard.x_count + j;
                if (colorData[3]) {
                    this.linearBoard[pos] = Color.rgb(colorData).hex();
                }
            }
        }

        this.border.points.forEach((point) => {
            pos = this.COLS_NUM * point.y + point.x;
            this.linearBoard[pos] = this.border.color.hex();
        });

        this.renderCallback(this.linearBoard);
    }

    stop() {
        gameLoop.clearGameLoop(this.gameId);
        if (this.currentProgram) {
            this.currentProgram.stop();
        }
        this.currentProgram = null;
        // Serial bridge might not be defined if the menu is not paused during startup
        if (this.serialBridge) {
            this.serialBridge.removeListener('button-down', this.buttonPressedCb);
        }
    }

    getRunningManager() {
        return this.currentProgram || this;
    }

    pause () {
        this.paused = true;
        if (this.serialBridge) {
            this.serialBridge.removeListener('button-down', this.buttonPressedCb);
        }
        gameLoop.clearGameLoop(this.gameId);
    }

    startProgram(index) {
        if (!this.programs[index]) {
            if (this.programsClasses[index]) {
                this.programs[index] = new this.programsClasses[index](this.config, this.renderCallback);
            }
        }

        if (this.programs[index]) {
            this.currentProgram = this.programs[index];
            this.currentProgram.start(this.serialBridge, function () {
                this.currentProgram = null;
                this.start(this.serialBridge);
            }.bind(this));
        }
    }

    buttonPressed(data) {
        data = data['button-id'];
        if (this.paused) {
            return;
        }

        let moveMap = {
            "js-right": 1,
            "js-left": -1
        },
        newIndex = Math.min(Math.max((this.currentProgramIndex + moveMap[data]), 0), 2);

        if (moveMap[data] && this.currentProgramIndex !== newIndex) {
            // Setting the frame to 0 will start the animation
            this.menuTransition = {
                frameCount: 0,
                oldIndex: this.currentProgramIndex,
                newIndex: newIndex
            }

            this.currentProgramIndex = newIndex;
        } else if (data === 'btn-A') {
            this.stop();
            this.startProgram(this.currentProgramIndex);
        }
    }
}


module.exports = BaseMenuManager;
