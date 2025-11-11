const Utils = {
    // Calculate distance between two coordinates using Haversine formula
    calculateDistance(lat1, lon1, lat2, lon2) {
        const earthRadius = 6371e3;
        const phi1 = (lat1 * Math.PI) / 180;
        const phi2 = (lat2 * Math.PI) / 180;
        const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
        const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
        
        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                  Math.cos(phi1) * Math.cos(phi2) *
                  Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return earthRadius * c;
    },
    
    // Transliteration map for TTS
    transliterationMap: {
        'á': 'a', 'à': 'a', 'ä': 'a', 'ã': 'a', 'â': 'a', 'å': 'a', 'č': 'tch', 'æ': 'ae',
        'ç': 'c', 'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e', 'í': 'i', 'ì': 'i',
        'ï': 'i', 'î': 'i', 'ñ': 'ny', 'ó': 'o', 'ò': 'o', 'ö': 'o', 'õ': 'o', 'ø': 'oe',
        'ô': 'o', 'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u', 'ý': 'y', 'ÿ': 'y',
        'š': 'sh', 'ž': 'zh', 'ř': 'r', 'ů': 'u', 'ď': 'd', 'ť': 't', 'ň': 'n'
    },
    
    transliterate(text) {
        return text.split('').map(char => 
            this.transliterationMap[char] || char
        ).join('');
    },
    
    // Generate random session ID
    generateSessionId(length = 6) {
        let id = '';
        for (let i = 0; i < length; i++) {
            id += Math.random().toString(36).charAt(2);
        }
        return id;
    },
    
    // Fetch JSON with caching
    async fetchJSON(filename, cache = {}) {
        if (cache[filename]) {
            return cache[filename];
        }
        
        try {
            const response = await fetch(filename);
            if (!response.ok) throw new Error(`Failed to fetch ${filename}`);
            const data = await response.json();
            cache[filename] = data;
            return data;
        } catch (error) {
            console.error(`Error fetching ${filename}:`, error);
            return null;
        }
    },
    
    // Low-pass filter for sensor smoothing
    lowPassFilter(currentValue, newValue, alpha = 1) {
        return alpha * newValue + (1 - alpha) * currentValue;
    },
    
    // Deep object equality check
    objectsEqual(obj1, obj2) {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        
        if (keys1.length !== keys2.length) return false;
        
        for (let key of keys1) {
            if (obj1[key] !== obj2[key]) return false;
        }
        
        return true;
    },
    
    // Get user IP address
    async getUserIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error('Error fetching IP:', error);
            return null;
        }
    },
    
    // Wake lock to prevent screen sleep
    async activateWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                await navigator.wakeLock.request('screen');
                console.log('Screen wake lock activated');
            } catch (err) {
                console.error('Failed to activate wake lock:', err);
            }
        } else {
            console.error('Wake lock API not supported');
        }
    }
};