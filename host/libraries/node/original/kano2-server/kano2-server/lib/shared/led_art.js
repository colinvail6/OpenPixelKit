"use strict";
/**
 * Implements some basic draw functionalities for the lightboard (real or virtual)
 */
class LEDArt {
    constructor (rows, cols, renderCallback) {
        this.renderCallback = renderCallback;
        this.led_grid = [];
        this.cX = 0; //current X
        this.cY = 0; //current Y

        this.ROWS_NUM = rows;
        this.COLS_NUM = cols;
        this.CELLS_NUM  = cols * rows;
        this.OFF_COLOUR = "#000000";
        this.CURRENT_COLOR =  "#ffffff";


        this.reset();

    }

    /**
     * Clears the screen
     */
    reset() {
        let i, j;
        for (i = 0; i < this.ROWS_NUM ; i++) {
            this.led_grid[i] = [];
            for (j = 0; j < this.COLS_NUM ; j++) {
                this.led_grid[i][j] = this.OFF_COLOUR;
            }
        }
    }

    /**
     * Draws a circle centered in the current position
     * @param  {number} radius The circle's radius
     * @param  {string} color  An RGB colour string (optional)
     */
    circle(radius, color) {
        let x = 0,
            y = radius,
            dp = 1 - radius,
            x0 = this.cX,
            y0 = this.cY;

        do {
            if (dp < 0) {
                dp = dp + 2 * (++x) + 3;
            } else {
                dp = dp + 2 * (++x) - 2 * (--y) + 5;
            }

            this.point(x0 + x, y0 + y, color);     //For the 8 octants
            this.point(x0 - x, y0 + y, color);
            this.point(x0 + x, y0 - y, color);
            this.point(x0 - x, y0 - y, color);
            this.point(x0 + y, y0 + x, color);
            this.point(x0 - y, y0 + x, color);
            this.point(x0 + y, y0 - x, color);
            this.point(x0 - y, y0 - x, color);

        } while (x < y);
    }


    /**
     * Draws a point in position x,y
     * @param  {number} x     x-axis position
     * @param  {number} y     y-axis position
     * @param  {string} color Optional HEX rgb color
     */
    point(x, y, color) {
        if (x > 15 || y > 7) {
            return;
        }
        color = color || this.CURRENT_COLOR;
        this.led_grid[y][x] = color;
    }

    /**
     * Moves the current point in a relative way
     * @param  {number} x     x-axis position
     * @param  {number} y     y-axis position
     */
    move(x, y) {
        this.cX += x;
        this.cY += y;
    }


    /**
     * Moves the current point in an absolute way
     * @param  {number} x     x-axis position
     * @param  {number} y     y-axis position
     */
    moveTo(x, y) {
        this.cX = x;
        this.cY = y;
    }

    /**
     * Draws a point in the current position
     * @param  {string} color Optional HEX rgb color
     */
    pixel(color) {
        this.point(this.cX, this.cY, color);
    }

    /**
     * Draws a line from the current position to x2, y2
     * @param  {number} x2    x-axis position (to)
     * @param  {number} y2    y-axis position )to
     * @param  {string} color Optional HEX rgb color
     */
    lineTo(x2, y2, color) {
        let x = this.cX,
            y = this.cY,
            i,
            yLonger = false,
            incrementVal,
            shortLen,
            divDiff,
            longLen;

        shortLen = y2 - y;
        longLen = x2 - x;

        if (Math.abs(shortLen) > Math.abs(longLen)) {
            let swap = shortLen;
            shortLen = longLen;
            longLen = swap;
            yLonger = true;
        }

        incrementVal = (longLen < 0) ? -1 : 1;
        divDiff = (shortLen === 0) ? longLen : longLen / shortLen;


        if (yLonger) {
            for (i = 0; i !== longLen; i += incrementVal) {
                this.point(x + Math.floor(i / divDiff), y + i, color);
            }
        } else {
            for (i = 0; i != longLen; i += incrementVal) {
                this.point(x + i, y + Math.floor(i / divDiff), color);
            }
        }
    }

    /**
     * Draws a rectangle starting from the current point (top left corner)
     * with the specified width and height
     * @param  {number} width  [description]
     * @param  {number} height [description]
     * @param  {string} color Optional HEX rgb color
     */
    rectangle(width, height, color) {
        let x0 = this.cX,
            y0 = this.cY,
            x1 = x0 + width - 1,
            y1 = y0 + height - 1;

        this.lineTo(x1, y0, color);
        this.moveTo(x1, y0);
        this.lineTo(x1, y1, color);
        this.moveTo(x1, y1);
        this.lineTo(x0, y1, color);
        this.moveTo(x0, y1);
        this.lineTo(x0, y0, color);
        this.moveTo(x0, y0);

    }

    /**
     * Clears the screen
     */
    clear () {
        this.reset();
    }


    /**
     * Renders everything on the lightboard
     */
    paint () {
        let i,
            linearBoard = [],
            grid = this.led_grid;
        for (i = 0; i < this.ROWS_NUM ; i++) {
            linearBoard = linearBoard.concat(grid[i]);
        }

        this.renderCallback(linearBoard);
    }
}

if (typeof module !== "undefined") {
    module.exports = LEDArt;
}
