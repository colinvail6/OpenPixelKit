"use strict";
const pull = require('pull-stream'),
    AudioReadStream = require('read-audio'),
    KanoAudio = require('../../utils/audio');

let microphone;

class Microphone {
    constructor(config) {
        this.config = config;
        this.audio = null;
        this.volume = 0;
        this.pitch = 0;
        this.volumeChangesCallbacks = [];
    }

    startRecording () {
        let self = this;
        this.audio = AudioReadStream({
            buffer: this.config.microphone.streamBufferSize,
            arecordPath: '/usr/bin/arecord'
        });

        pull(
            this.audio,
            pull.drain(audio => {
                this.volume = KanoAudio.getRMS(audio.data) * this.config.microphone.rawVolumeMultiplier;
                if (this.volumeChangesCallbacks && this.volumeChangesCallbacks.length) {
                    this.volumeChangesCallbacks.forEach((obj) => {
                        if (this.volume >= obj.threshold) {
                            obj.callback(this.volume);
                        }
                    });
                }
            })
        );
    }

    stopRecording () {
        if (this.audio) {
            this.audio.ps.kill('SIGINT');
            this.audio = null;
        }
        this.volumeChangesCallbacks = [];
    }

    onVolumeThreshold (threshold, callback) {
        this.volumeChangesCallbacks.push({
            threshold: threshold,
            callback: callback
        });
        this.startRecording();
    }

    removeOnVolumeThreshold (callback) {
        let callbackIndex = this.volumeChangesCallbacks.indexOf(callback);
        if (callbackIndex !== -1) {
            this.volumeChangesCallbacks.splice(callbackIndex, 1);
        }
    }

    getVolume () {
        if (!this.audio) {
            this.startRecording();
        }
        return this.volume;
    }

    getPitch () {
        if (!this.audio) {
            this.startRecording();
        }
        return this.pitch;
    }
}

module.exports = function getOrCreateMicrophone(config) {
    if (!microphone) {
        microphone = new Microphone(config);
    }
    return microphone;
}