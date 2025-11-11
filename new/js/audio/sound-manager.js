class SoundManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.sounds = {};
        this.currentSound = null;
        this.bgm = null;
    }
    
    async init() {
        try {
            const soundsData = await Utils.fetchJSON(CONFIG.FILES.sounds, this.sounds);
            if (!soundsData) throw new Error('Failed to load sounds');
            
            const totalSounds = Object.keys(soundsData).length;
            let loadedSounds = 0;
            
            for (const [key, soundConfig] of Object.entries(soundsData)) {
                this.sounds[key] = new Howl({
                    src: [soundConfig.src],
                    volume: 0.4,
                    onload: () => {
                        loadedSounds++;
                        const percentage = Math.round((loadedSounds / totalSounds) * 100);
                        this.eventBus.emit('sounds:loading', { percentage });
                        
                        if (loadedSounds === totalSounds) {
                            this.eventBus.emit('sounds:loaded');
                        }
                    },
                    onloaderror: (error) => {
                        console.error(`Error loading sound ${key}:`, error);
                    }
                });
            }
            
            // Initialize BGM
            this.bgm = new Howl({
                src: ['audio/bgm.mp3'],
                loop: true,
                volume: 0.2
            });
            
        } catch (error) {
            console.error('Error initializing sounds:', error);
            this.eventBus.emit('sounds:error', error);
        }
    }
    
    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName].play();
        } else {
            console.warn(`Sound ${soundName} not found`);
        }
    }
    
    stop(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName].stop();
        }
    }
    
    playBGM() {
        if (this.bgm) {
            this.bgm.play();
        }
    }
    
    stopBGM() {
        if (this.bgm) {
            this.bgm.stop();
        }
    }
    
    stopCurrent() {
        if (this.currentSound) {
            this.currentSound.stop();
            this.currentSound.unload();
            this.currentSound = null;
        }
    }
    
    setCurrent(sound) {
        this.currentSound = sound;
    }
}