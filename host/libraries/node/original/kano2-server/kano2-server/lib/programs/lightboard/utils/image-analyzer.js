"use strict";
let Canvas = require('canvas'),
    fs = require('fs'),
    Color = require('color');

function getImage(path) {
    let promise = new Promise((resolve, reject) => {
        fs.readFile(path, (err, imagePath) => {
            if (err) {
                reject(err);
                throw err;
            }
            resolve(imagePath);
        });
    });

    return promise;

}

function getPixelColorsFromPNG(path) {
    let promise = new Promise((resolve, reject) => {

        fs.readFile(path, function (err, imageSrc) {
            if (err) {
                throw err;
            }

            let canvas,
                ctx,
                i, j, img,
                colors = [];

            img = new Canvas.Image();
            img.src = imageSrc;
            canvas = new Canvas(img.width, img.height);
            ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, img.width, img.height);

            for (i = 0; i < img.height; i++) {
                for (j = 0; j < img.width; j++) {
                    let colorData = ctx.getImageData(j, i, 1, 1).data;
                    if (colorData[3]) {
                        colors.push(Color.rgb(colorData[0], colorData[1], colorData[2], colorData[3]).hex());
                    } else {
                        colors.push(0);
                    }
                }
            }
            resolve(colors);
        });
    });

    return promise;
}

module.exports = {
    getPixelColorsFromPNG: getPixelColorsFromPNG,
    getImage: getImage
};
