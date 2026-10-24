"use strict";

let perlin = null;

function random(a, b) {
    return a + Math.floor(Math.random() * b);
}

function constrain(n, low, high) {
    return Math.max(Math.min(n, high), low);
}

function wrap(i, i_max) {
    let x;

    if (i > -1) {
        return i % i_max;
    }
    x = i_max + i % i_max;
    if (x == i_max) {
        return 0;
    }
    return x;
}

function lerp(start, stop, amt) {
    return start + amt * (stop - start);
}

function map(n, start1, stop1, start2, stop2) {
    return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
}

function scaled_cosine(i) {
    return 0.5 * (1.0 - Math.cos(i * Math.PI));
}

function noise(x,y,z) {
    const PERLIN_YWRAPB = 4,
        PERLIN_YWRAP = 1 << PERLIN_YWRAPB,
        PERLIN_ZWRAPB = 8,
        PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB,
        PERLIN_SIZE = 4095,
        perlin_octaves = 4,
        perlin_amp_falloff = 0.5;

    let i,
        xi, yi, zi,
        xf, yf, zf,
        rxf, ryf,
        r,
        ampl,
        n1, n2, n3,
        of, o;

    y = y || 0;
    z = z || 0;

    if (perlin === null) {
        perlin = new Array(PERLIN_SIZE + 1);
        for (i = 0; i < PERLIN_SIZE + 1; i++) {
            perlin[i] = Math.random();
        }
    }

    if (x < 0) {
        x = -x;
    }
    if (y < 0) {
        y = -y;
    }
    if (z < 0) {
        z = -z;
    }

    xi = Math.floor(x);
    yi = Math.floor(y);
    zi = Math.floor(z);
    xf = x - xi;
    yf = y - yi;
    zf = z - zi;

    r = 0;
    ampl = 0.5;


    for (o = 0; o < perlin_octaves; o++) {
        of = xi + (yi << PERLIN_YWRAPB) + (zi << PERLIN_ZWRAPB);

        rxf = scaled_cosine(xf);
        ryf = scaled_cosine(yf);

        n1  = perlin[of & PERLIN_SIZE];
        n1 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n1);
        n2  = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
        n2 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n2);
        n1 += ryf * (n2 - n1);

        of += PERLIN_ZWRAP;
        n2  = perlin[of & PERLIN_SIZE];
        n2 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n2);
        n3  = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
        n3 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n3);
        n2 += ryf * (n3 - n2);

        n1 += scaled_cosine(zf) * (n2 - n1);

        r += n1 * ampl;
        ampl *= perlin_amp_falloff;
        xi <<= 1;
        xf *= 2;
        yi <<= 1;
        yf *= 2;
        zi <<= 1;
        zf *= 2;

        if (xf >= 1.0) {
            xi++;
            xf--;
        }
        if (yf >= 1.0) {
            yi++;
            yf--;
        }
        if (zf >= 1.0) {
            zi++;
            zf--;
        }
    }
    return r;
}

function line(ctx, hexColor, a, b, c, d) {
    // Canvas calculates from the half of a pixel
    a += 0.5;
    b += 0.5;
    c += 0.5;
    d += 0.5;

    ctx.beginPath();
    ctx.moveTo(a, b);
    ctx.lineTo(c, d);
    ctx.strokeStyle = hexColor;
    ctx.stroke();
}

function point(ctx, hexColor, x, y) {
    ctx.fillStyle = hexColor;
    ctx.fillRect(x, y, 1, 1);
}

module.exports = {
    random: random,
    constrain: constrain,
    wrap: wrap,
    lerp: lerp,
    map: map,
    noise: noise,
    line: line,
    point: point
};
