"use strict";
let BaseMenuManager = require('./base-menu'),
    LightshowManager = require('../lightshows/perlin_manager'),
    ParticleManager = require('../lightshows/particle_manager'),
    SoundVisualiserManager = require('../lightshows/soundvisualiser_manager'),
    lightshowMenu;


class LightshowMenuManager extends BaseMenuManager {
    constructor (config, renderCallback) {
        super(config, renderCallback);

        [
            {
                name: "Perlin Noise",
                path: this.config.lightshow.perlin_icon,
                manager: LightshowManager
            },
            {
                name: "Sound Visualiser",
                path: this.config.lightshow.soundvis_icon,
                manager: SoundVisualiserManager
            },
            {
                name: "Particle Flow",
                path: this.config.lightshow.particles_icon,
                manager: ParticleManager
            }
        ].forEach((program) => {
            this.loadIcon(program.path)
            this.programsClasses.push(program.manager);
        });
    }
}

module.exports = function getOrCreateLightshowMenuManager(rows, cols, renderCallback) {
    if (!lightshowMenu) {
        lightshowMenu = new LightshowMenuManager(rows, cols, renderCallback);
    }
    return lightshowMenu;
};
