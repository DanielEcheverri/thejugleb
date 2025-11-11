class JungleApp {
    constructor() {
        this.eventBus = new EventBus();
        this.logger = new Logger();
        this.soundManager = new SoundManager(this.eventBus);
        this.ttsService = new TTSService(this.eventBus, this.soundManager);
        this.geoTracker = new GeolocationTracker(this.eventBus);
        this.checkpointManager = new CheckpointManager(this.eventBus, this.geoTracker);
        this.bluetoothManager = new BluetoothManager(this.eventBus);
        this.movementDetector = new MovementDetector(this.eventBus);
        this.firebaseManager = new FirebaseManager(this.eventBus);
        this.uiController = new UIController(this.eventBus);
        this.canvasVisualizer = new CanvasVisualizer(this.eventBus);
        
        this.sessionId = Utils.generateSessionId();
        this.userIP = null;
        this.deviceName = 'avatar_BT';
        this.characterName = 'Buro';
        this.interactionMode = '_load';
        this.listenClient = null;
        this.streetName = 'Unknown';
        this.distanceToOther = 0;
        this.tagID = 0;
        this.messageID = '';
    }
    
    async init() {
        console.log('Initializing Jungle App');
        console.log('Session ID:', this.sessionId);
        
        // Initialize logger
        this.logger.init();
        
        // Get user IP
        this.userIP = await Utils.getUserIP();
        console.log('User IP:', this.userIP);
        
        // Initialize UI
        this.uiController.init();
        
        // Initialize sound system
        await this.soundManager.init();
        
        // Initialize geolocation
        this.geoTracker.init();
        
        // Initialize Firebase
        await this.firebaseManager.init();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('App initialized');
    }
    
    setupEventListeners() {
        // Sound loading progress
        this.eventBus.on('sounds:loading', (data) => {
            this.uiController.updateLoadingProgress(data.percentage);
        });
        
        this.eventBus.on('sounds:loaded', () => {
            this.uiController.hideLoadingScreen();
        });
        
        // UI interactions
        this.eventBus.on('ui:listen-clicked', () => {
            this.handleListenMode();
        });
        
        this.eventBus.on('ui:interact-clicked', () => {
            this.handleInteractMode();
        });
        
        this.eventBus.on('ui:connect-clicked', async () => {
            await this.bluetoothManager.connect();
        });
        
        this.eventBus.on('ui:device-toggled', (data) => {
            this.switchDevice(data.deviceName);
        });
        
        // Bluetooth events
        this.eventBus.on('bluetooth:connected', async (data) => {
            await this.handleBluetoothConnected(data.deviceName);
        });
        
        this.eventBus.on('bluetooth:disconnected', () => {
            this.handleBluetoothDisconnected();
        });
        
        // Location events
        this.eventBus.on('location:updated', (data) => {
            this.checkpointManager.check();
            this.updateLocationDisplay();
        });
        
        // Movement events
        this.eventBus.on('movement:detected', (data) => {
            console.log('Movement:', data);
        });
        
        this.eventBus.on('movement:pattern', (data) => {
            this.soundManager.play('complete');
            console.log('Pattern detected:', data.pattern);
        });
        
        // TTS events
        this.eventBus.on('message:display', (data) => {
            if (data.text) {
                this.ttsService.speak(data.text);
            }
        });
        
        this.eventBus.on('tts:check-speaking', (data) => {
            data.callback(this.ttsService.isSpeaking());
        });
        
        // Sound playback
        this.eventBus.on('sound:play', (data) => {
            this.soundManager.play(data.soundName);
        });
        
        // Checkpoint reached
        this.eventBus.on('checkpoint:reached', (data) => {
            this.soundManager.play('success');
        });
        
        // Firebase sync (every 200ms)
        setInterval(() => {
            if (this.listenClient === false) {
                this.syncToFirebase();
            }
        }, 200);
    }
    
    handleListenMode() {
        Utils.activateWakeLock();
        this.soundManager.play('forward');
        this.listenClient = true;
        this.uiController.showListenMode();
        
        // Auto-select device after 5 seconds
        setTimeout(() => {
            const deviceName = document.getElementById('toggleSwitch').checked 
                ? 'hachi_BT' 
                : 'avatar_BT';
            this.startListening(deviceName);
        }, 5000);
    }
    
    handleInteractMode() {
        Utils.activateWakeLock();
        this.soundManager.play('forward');
        this.listenClient = false;
        this.uiController.showInteractMode();
    }
    
    async handleBluetoothConnected(deviceName) {
        this.deviceName = deviceName;
        this.switchDevice(deviceName);
        
        await this.movementDetector.init(deviceName);
        await this.checkpointManager.init(deviceName);
        
        this.movementDetector.enable();
        this.interactionMode = '_int';
        
        this.uiController.updateConnectionStatus(true);
        this.soundManager.play(this.characterName);
        this.soundManager.play('notification');
        
        // Setup Firebase sync
        this.firebaseManager.setDeviceName(deviceName);
        this.firebaseManager.subscribeToOtherDevice((data) => {
            this.handleOtherDeviceData(data);
        });
        this.firebaseManager.subscribeToOwnDevice((data) => {
            this.handleOwnDeviceData(data);
        });
    }
    
    handleBluetoothDisconnected() {
        this.movementDetector.disable();
        this.uiController.updateConnectionStatus(false);
        
        setTimeout(() => {
            this.soundManager.stopBGM();
        }, 4000);
    }
    
    switchDevice(deviceName) {
        const config = CONFIG.DEVICES[deviceName];
        this.deviceName = deviceName;
        this.characterName = config.name;
        
        console.log('Switched to:', this.characterName);
        
        if (this.canvasVisualizer) {
            this.canvasVisualizer.init(config.labels);
        }
    }
    
    startListening(deviceName) {
        this.switchDevice(deviceName);
        this.interactionMode = '_lst';
        
        const topSection = document.querySelector('.top-section');
        if (topSection) topSection.style.display = 'none';
        
        const currentLocation = document.getElementById('currentLocation');
        if (currentLocation) currentLocation.style.display = 'none';
        
        const avatarCanvas = document.getElementById('avatarCanvas');
        if (avatarCanvas) {
            const isHachi = deviceName === 'hachi_BT';
            const color = isHachi ? '#4caf50' : '#0082fc';
            
            avatarCanvas.innerHTML = `
                <div class="center-wrapper">
                    <span class="material-symbols-outlined hearing-icon" style="color: ${color}">hearing</span>
                    <span id="loading-text">Listening ${this.characterName}'s Story</span>
                </div>
            `;
        }
        
        this.soundManager.play(this.characterName);
        this.soundManager.playBGM();
        
        // Setup Firebase listening
        this.firebaseManager.setDeviceName(deviceName);
        this.firebaseManager.subscribeToOwnDevice((data) => {
            this.handleOwnDeviceData(data);
        });
        
        console.log('Listening as:', this.characterName);
    }
    
    handleOtherDeviceData(data) {
        const prefix = this.deviceName === 'hachi_BT' ? 'avatar' : 'hachi';
        const otherLat = data[`${prefix}_latitude`];
        const otherLon = data[`${prefix}_longitude`];
        
        const position = this.geoTracker.getPosition();
        if (otherLat && otherLon && position.latitude && position.longitude) {
            this.distanceToOther = Utils.calculateDistance(
                position.latitude,
                position.longitude,
                otherLat,
                otherLon
            );
        }
    }
    
    handleOwnDeviceData(data) {
        const prefix = this.deviceName === 'hachi_BT' ? 'hachi' : 'avatar';
        const passage = data[`${prefix}_passage`];
        const street = data[`${prefix}_street`];
        
        if (passage && passage !== this.messageID) {
            this.uiController.displayMessage(passage);
        }
        
        if (street) {
            this.streetName = street;
        }
    }
    
    syncToFirebase() {
        const position = this.geoTracker.getPosition();
        const movementState = this.movementDetector.getMovementState();
        const checkpoint = this.checkpointManager.getCurrentCheckpoint();
        const checkpointDist = this.checkpointManager.getDistances();
        const bluetoothStatus = this.bluetoothManager.getStatus();
        
        this.firebaseManager.writeData({
            latitude: position.latitude,
            longitude: position.longitude,
            direction: position.direction,
            checkpoint: checkpoint,
            checkpointDist: checkpointDist,
            pattern: movementState.pattern,
            partMoving: movementState.part,
            directionMoving: movementState.direction,
            tagID: this.tagID,
            status: bluetoothStatus.isConnected ? 'Online' : 'Offline',
            speed: position.speed.toFixed(2),
            speaking: this.ttsService.isSpeaking(),
            messageID: this.messageID,
            characterName: this.characterName
        });
    }
    
    updateLocationDisplay() {
        const position = this.geoTracker.getPosition();
        const movementState = this.movementDetector.getMovementState();
        const bluetoothStatus = this.bluetoothManager.getStatus();
        
        this.uiController.updateLocationDisplay({
            latitude: position.latitude,
            longitude: position.longitude,
            direction: position.direction,
            speed: position.speed.toFixed(2),
            totalDistance: position.totalDistance.toFixed(2),
            streetName: this.streetName,
            separation: this.distanceToOther.toFixed(2),
            bluetoothStatus: bluetoothStatus.isConnected ? 'Online' : 'Offline',
            partMoving: movementState.part,
            directionMoving: movementState.direction
        });
    }
}