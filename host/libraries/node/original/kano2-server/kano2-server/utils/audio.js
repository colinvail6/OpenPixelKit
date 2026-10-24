"use strict";

function correlatePitch (buf, sampleRate) {

    let MIN_SAMPLES = 0,  // will be initialized when AudioContext is created.
        GOOD_ENOUGH_CORRELATION = 0.9, // this is the "bar" for how close a correlation needs to be
        SIZE = buf.length,
        MAX_SAMPLES = Math.floor(SIZE / 2),
        best_offset = -1,
        best_correlation = 0,
        rms = 0,
        foundGoodCorrelation = false,
        correlations = new Array(MAX_SAMPLES);

    for (let i = 0; i < SIZE; i++) {
        let val = buf[i];
        rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) { // not enough signal
        return -1;
    }

    let lastCorrelation = 1;
    for (let offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
        let correlation = 0;

        for (let i = 0; i < MAX_SAMPLES; i++) {
            correlation += Math.abs((buf[i]) - (buf[i + offset]));
        }
        correlation = 1 - (correlation / MAX_SAMPLES);
        correlations[offset] = correlation; // store it, for the tweaking we need to do below.
        if ((correlation > GOOD_ENOUGH_CORRELATION) && (correlation > lastCorrelation)) {
            foundGoodCorrelation = true;
            if (correlation > best_correlation) {
                best_correlation = correlation;
                best_offset = offset;
            }
        } else if (foundGoodCorrelation) {
            // short-circuit - we found a good correlation, then a bad one, so we'd just be seeing copies from here.
            // Now we need to tweak the offset - by interpolating between the values to the left and right of the
            // best offset, and shifting it a bit.  This is complex, and HACKY in this code (happy to take PRs!) -
            // we need to do a curve fit on correlations[] around best_offset in order to better determine precise
            // (anti-aliased) offset.

            // we know best_offset >=1,
            // since foundGoodCorrelation cannot go to true until the second pass (offset=1), and
            // we can't drop into this clause until the following pass (else if).
            let shift = (correlations[best_offset + 1] - correlations[best_offset - 1]) / correlations[best_offset];
            return sampleRate / (best_offset + (8 * shift));
        }
        lastCorrelation = correlation;
    }
    if (best_correlation > 0.01) {
        return sampleRate / best_offset;
    }
    return -1;
}

function pitch (audio, sampleRate) {
    var timetamp = Math.floor(new Date() / 1000),
        prevTimestamp, pitch;

    if (!prevPitchTimestamp) {
        prevTimestamp = timestamp;
    }

    pitch = correlatePitch(audio, sampleRate);

    if (pitch !== -1 && pitch < 2000) {
        if (!prevPitchTimestamp || timestamp - prevPitchTimestamp > 100) {
            prevPitchTimestamp = timestamp;
            pitch = Math.min(100, Math.max(0, (Math.log(pitch) - 5.4) * (100 / 3)));
        }
    }

    return pitch;
}

function getRMS(audio) {
    return Math.sqrt(audio.map(elem => {
        return Math.pow(elem, 2);
    }).reduce((a, b) => {
        return a + b;
    }, 0) / audio.length);
}

module.exports = {
    getRMS: getRMS,
    getPitch: (audio) => {
        return pitch(audio);
    }
}
