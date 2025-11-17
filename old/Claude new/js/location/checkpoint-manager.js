class CheckpointManager {
    constructor(eventBus, geolocationTracker) {
        this.eventBus = eventBus;
        this.geoTracker = geolocationTracker;
        this.checkpoints = null;
        this.currentCheckpoint = 'none';
        this.lastCheckedIndex = 0;
        this.previousCheckpoint = null;
        this.distancesToCheckpoints = [];
    }
    
    async init(deviceName) {
        this.deviceName = deviceName;
        this.checkpoints = await Utils.fetchJSON(CONFIG.FILES.checkpoints);
    }
    
    check() {
        if (!this.checkpoints) return;
        
        const checkpointsKey = this.deviceName === 'hachi_BT' 
            ? 'hachi_checkpoints' 
            : 'avatar_checkpoints';
        
        const checkpointSets = this.checkpoints[0][checkpointsKey];
        if (!checkpointSets) return;
        
        const keys = Object.keys(checkpointSets);
        if (this.lastCheckedIndex >= keys.length) return;
        
        const currentKey = keys[this.lastCheckedIndex];
        const checkpointSet = checkpointSets[currentKey];
        this.distancesToCheckpoints = [];
        
        const position = this.geoTracker.getPosition();
        const radius = CONFIG.LOCATION.checkpointRadius;
        
        for (const checkpoint of checkpointSet) {
            const distance = Utils.calculateDistance(
                position.latitude,
                position.longitude,
                checkpoint.latitude,
                checkpoint.longitude
            );
            
            this.distancesToCheckpoints.push(distance.toFixed(2));
            
            if (distance <= radius && checkpoint.text !== this.previousCheckpoint) {
                console.log('Checkpoint reached:', checkpoint.text);
                this.currentCheckpoint = checkpoint.text;
                this.lastCheckedIndex++;
                this.previousCheckpoint = checkpoint.text;
                
                this.eventBus.emit('checkpoint:reached', {
                    checkpoint: checkpoint.text,
                    index: this.lastCheckedIndex
                });
                
                return;
            }
        }
    }
    
    getCurrentCheckpoint() {
        return this.currentCheckpoint;
    }
    
    getDistances() {
        return this.distancesToCheckpoints;
    }
}