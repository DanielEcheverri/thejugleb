class FirebaseManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.app = null;
        this.database = null;
        this.deviceName = null;
    }
    
    async init() {
        try {
            // Import Firebase modules dynamically
            const { initializeApp } = await import(
                'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js'
            );
            const { getDatabase, ref, update, onValue, off } = await import(
                'https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js'
            );
            
            this.app = initializeApp(CONFIG.FIREBASE);
            this.database = getDatabase(this.app);
            this.ref = ref;
            this.update = update;
            this.onValue = onValue;
            this.off = off;
            
            console.log('Firebase initialized');
            
        } catch (error) {
            console.error('Firebase initialization error:', error);
        }
    }
    
    setDeviceName(deviceName) {
        this.deviceName = deviceName;
    }
    
    async writeData(data) {
        if (!this.deviceName) return;
        
        const databaseName = this.deviceName === 'hachi_BT' 
            ? 'hachi_data' 
            : 'avatar_data';
        
        const prefix = this.deviceName === 'hachi_BT' ? 'hachi' : 'avatar';
        
        const updateData = {
            [`${prefix}_latitude`]: data.latitude,
            [`${prefix}_longitude`]: data.longitude,
            [`${prefix}_heading`]: data.direction,
            [`${prefix}_checkpoint`]: data.checkpoint,
            [`${prefix}_checkpoint_dist`]: data.checkpointDist,
            [`${prefix}_movement`]: data.pattern,
            [`${prefix}_part_mov`]: data.partMoving,
            [`${prefix}_part_dir`]: data.directionMoving,
            [`${prefix}_tag`]: data.tagID,
            [`${prefix}_status`]: data.status,
            [`${prefix}_speed`]: data.speed,
            [`${prefix}_narrating`]: data.messageID + data.speaking,
            [`${prefix}_current_passage`]: data.messageID,
            'story_name': data.characterName
        };
        
        try {
            await this.update(this.ref(this.database, databaseName), updateData);
        } catch (error) {
            console.error('Firebase write error:', error);
        }
    }
    
    subscribeToOtherDevice(callback) {
        if (!this.deviceName) return;
        
        const otherDatabase = this.deviceName === 'hachi_BT' 
            ? 'avatar_data' 
            : 'hachi_data';
        
        this.onValue(this.ref(this.database, otherDatabase), (snapshot) => {
            const data = snapshot.val();
            if (data) {
                callback(data);
            }
        });
    }
    
    subscribeToOwnDevice(callback) {
        if (!this.deviceName) return;
        
        const ownDatabase = this.deviceName === 'hachi_BT' 
            ? 'hachi_data' 
            : 'avatar_data';
        
        this.onValue(this.ref(this.database, ownDatabase), (snapshot) => {
            const data = snapshot.val();
            if (data) {
                callback(data);
            }
        });
    }
    
    unsubscribe(databaseName) {
        if (this.database) {
            this.off(this.ref(this.database, databaseName));
        }
    }
}