class TTSService {
    constructor(eventBus, soundManager) {
        this.eventBus = eventBus;
        this.soundManager = soundManager;
        this.lastSpokenMessage = '';
        this.speaking = false;
        this.useFancyVoice = false;
    }
    
    async speak(message) {
        const transliterated = Utils.transliterate(message);
        
        if (transliterated === this.lastSpokenMessage) {
            console.log('Message already spoken');
            return;
        }
        
        if (!transliterated.trim()) {
            console.log('Empty message, ignoring');
            return;
        }
        
        console.log('--Speaking:', message);
        
        if (this.useFancyVoice) {
            await this.speakAzure(transliterated);
        } else {
            await this.speakCoqui(transliterated);
        }
    }
    
    async speakAzure(message) {
        const config = CONFIG.AZURE_TTS;
        const ssml = `
            <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-GB'>
                <voice name='${config.voiceName}'>
                    <prosody volume="x-loud">${message}</prosody>
                </voice>
            </speak>
        `;
        
        try {
            const response = await this.fetchWithRetry(config.endpoint, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': config.subscriptionKey,
                    'Content-Type': 'application/ssml+xml',
                    'X-Microsoft-OutputFormat': config.outputFormat,
                    'User-Agent': 'Azure-TTS-JS'
                },
                body: ssml
            });
            
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            this.playAudio(audioUrl, 'mp3', message);
            
        } catch (error) {
            console.error('Azure TTS error:', error);
            this.speaking = false;
        }
    }
    
    async speakCoqui(message) {
        const encodedMessage = encodeURIComponent(message);
        const url = `${CONFIG.COQUI_TTS.endpoint}?text=${encodedMessage}&speaker_id=&style_wav=&language=en`;
        
        try {
            const response = await this.fetchWithRetry(url);
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            this.playAudio(audioUrl, 'wav', message);
            
        } catch (error) {
            console.error('Coqui TTS error:', error);
            this.speaking = false;
        }
    }
    
    playAudio(audioUrl, format, originalMessage) {
        this.soundManager.stopCurrent();
        
        const sound = new Howl({
            src: [audioUrl],
            format: [format],
            html5: true,
            onplay: () => {
                console.log('TTS started speaking');
                this.speaking = true;
                this.lastSpokenMessage = originalMessage;
                this.eventBus.emit('tts:started', { message: originalMessage });
            },
            onend: () => {
                setTimeout(() => {
                    this.soundManager.play('notification');
                    console.log('TTS finished speaking');
                    this.speaking = false;
                    sound.unload();
                    this.eventBus.emit('tts:ended');
                }, 500);
            },
            onloaderror: (id, err) => {
                console.error('TTS playback error:', err);
                this.speaking = false;
                sound.unload();
            }
        });
        
        this.soundManager.setCurrent(sound);
        sound.play();
        
        if (Howler.ctx.state === 'suspended') {
            Howler.ctx.resume();
        }
    }
    
    async fetchWithRetry(url, options = {}, retries = 3, delay = 1000) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await fetch(url, options);
                if (response.ok) return response;
                console.log(`Attempt ${attempt} failed. Retrying...`);
            } catch (error) {
                console.log(`Attempt ${attempt} error:`, error.message);
            }
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        throw new Error(`Failed after ${retries} attempts`);
    }
    
    setVoiceMode(useFancy) {
        this.useFancyVoice = useFancy;
        console.log(`Voice mode set to: ${useFancy ? 'Azure' : 'Coqui'}`);
    }
    
    isSpeaking() {
        return this.speaking;
    }
}