const CONFIG = {
    // API Keys (MOVE THESE TO ENVIRONMENT VARIABLES IN PRODUCTION!)
    AZURE_TTS: {
        endpoint: "https://germanywestcentral.tts.speech.microsoft.com/cognitiveservices/v1",
        subscriptionKey: "9PhQZhVP3ZRybebW3qaOiHU0EZc6eKmZGbP74vpuM2wqradXDdc2JQQJ99BDACPV0roXJ3w3AAAYACOGCcy5",
        voiceName: "en-GB-SoniaNeural",
        outputFormat: "audio-24khz-160kbitrate-mono-mp3"
    },
    
    COQUI_TTS: {
        endpoint: "https://s4us-tts.fi.muni.cz:5002/api/tts"
    },
    
    FIREBASE: {
        apiKey: "AIzaSyDuRvVnlDRGlQoDcWg6SlXR9lr4Xlz1PX4",
        authDomain: "thejungle-33676.firebaseapp.com",
        databaseURL: "https://thejungle-33676-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "thejungle-33676",
        storageBucket: "sthejungle-33676.firebasestorage.app",
        messagingSenderId: "1078745256439",
        appId: "1:1078745256439:web:6bb68e64e3a526fb061ef2"
    },
    
    GOOGLE_SHEETS: {
        scriptURL: "https://script.google.com/macros/s/AKfycbxV_7DD1zilVjmNXQP3zHgtqFMY6ekcsD8-ginnUcUFXq6x_j-vxW6sFftfDCbZCZTq5w/exec"
    },
    
    // Bluetooth Configuration
    BLUETOOTH: {
        serviceUUID: "4fafc201-1fb5-459e-8fcc-c5c9c331914b",
        characteristicUUID: "beb5483e-36e1-4688-b7f5-ea07361b26a8",
        numPotentiometers: 11
    },
    
    // Movement Detection
    MOVEMENT: {
        threshold: 25,
        cooldownMs: 500,
        releasePersistenceMs: 100,
        pruneTimeMs: 1500,
        resetDelayMs: 2000
    },
    
    // Location
    LOCATION: {
        checkpointRadius: 12, // meters
        speedThreshold: 0.2 // m/s
    },
    
    // Device Configurations
    DEVICES: {
        avatar_BT: {
            name: "Buro",
            labels: ["LEFT ARM", "RIGHT ARM", "HEAD", "LEFT LEG", "RIGHT LEG", 
                     "LEFT FOOT", "RIGHT FOOT", "RIGHT HAND", "LEFT HAND", "EYES", "MOUTH"],
            movesFile: 'avatar_moves.json',
            patternsFile: 'avatar_patterns.json',
            sentencesFile: 'avatar_sentences.json'
        },
        hachi_BT: {
            name: "Hachi",
            labels: ["EMPTY", "EMPTY", "EMPTY", "EMPTY", "HEAD", "FRONT LEG", 
                     "TAIL", "BACK LEG", "EMPTY", "EMPTY"],
            movesFile: 'hachi_moves.json',
            patternsFile: 'hachi_patterns.json',
            sentencesFile: 'hachi_sentences.json'
        }
    },
    
    // Files
    FILES: {
        sounds: 'sounds.json',
        tags: 'tags.json',
        checkpoints: 'points.json'
    },
    
    // Colors
    COLORS: {
        lines: ["#208C3B", "#208C3B", "#164010", "#208C3B", "#208C3B", 
                "#BF4E24", "#BF4E24", "#164010", "#164010", "#208C3B", "#208C3B"],
        backgrounds: Array(11).fill("#F2E085")
    }
};

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}