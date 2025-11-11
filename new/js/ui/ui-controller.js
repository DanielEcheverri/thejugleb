class UIController {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.elements = {};
        this.messageTimeoutID = null;
    }
    
    init() {
        this.elements = {
            loading: document.getElementById('loading-screen'),
            loadingText: document.getElementById('loading-text'),
            listenButton: document.getElementById('listenButton'),
            interactButton: document.getElementById('interactButton'),
            connectButton: document.getElementById('connectButton'),
            toggleContainer: document.getElementById('toggleContainer'),
            toggleSwitch: document.getElementById('toggleSwitch'),
            messageDisplay: document.getElementById('messageDisplayDiv'),
            currentLocation: document.getElementById('currentLocation'),
            topSection: document.querySelector('.top-section'),
            hachiCheckbox: document.getElementById('hachiCheckboxContainer')
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen button
        if (this.elements.listenButton) {
            this.elements.listenButton.addEventListener('click', () => {
                this.eventBus.emit('ui:listen-clicked');
            });
        }
        
        // Interact button
        if (this.elements.interactButton) {
            this.elements.interactButton.addEventListener('click', () => {
                this.eventBus.emit('ui:interact-clicked');
            });
        }
        
        // Connect button
        if (this.elements.connectButton) {
            this.elements.connectButton.addEventListener('click', () => {
                this.eventBus.emit('ui:connect-clicked');
            });
        }
        
        // Toggle switch
        if (this.elements.toggleSwitch) {
            this.elements.toggleSwitch.addEventListener('change', (e) => {
                const deviceName = e.target.checked ? 'hachi_BT' : 'avatar_BT';
                this.eventBus.emit('ui:device-toggled', { deviceName });
            });
        }
    }
    
    hideLoadingScreen() {
        if (this.elements.loading) {
            this.elements.loading.classList.add('hidden');
        }
    }
    
    updateLoadingProgress(percentage) {
        if (this.elements.loadingText) {
            this.elements.loadingText.textContent = 
                `Loading resources... ${percentage}%`;
        }
    }
    
    showListenMode() {
        if (this.elements.listenButton) {
            this.elements.listenButton.style.display = 'none';
        }
        if (this.elements.interactButton) {
            this.elements.interactButton.style.display = 'none';
        }
        if (this.elements.toggleContainer) {
            this.elements.toggleContainer.style.display = 'flex';
        }
    }
    
    showInteractMode() {
        if (this.elements.listenButton) {
            this.elements.listenButton.style.display = 'none';
        }
        if (this.elements.interactButton) {
            this.elements.interactButton.style.display = 'none';
        }
        if (this.elements.connectButton) {
            this.elements.connectButton.style.display = 'inline-block';
        }
    }
    
    updateConnectionStatus(isConnected) {
        if (!this.elements.connectButton) return;
        
        if (isConnected) {
            this.elements.connectButton.innerHTML = 
                '<span class="material-icons" style="vertical-align: middle;">bluetooth_connected</span> Disconnect Avatar';
        } else {
            this.elements.connectButton.innerHTML = 
                '<span class="material-icons" style="vertical-align: middle;">bluetooth_searching</span> Connect to Avatar';
        }
    }
    
    displayMessage(message) {
        const delimiterIndex = message.indexOf('/');
        
        if (delimiterIndex === -1) {
            this.showMessage(message);
            return;
        }
        
        const parts = message.split('/');
        const messageID = parts[0];
        const text = parts[1] || '';
        const audioSoundscape = parts[2] || '';
        const functionToEval = parts[3] || '';
        
        console.log('--Passage:', messageID);
        
        clearTimeout(this.messageTimeoutID);
        
        this.eventBus.emit('message:display', {
            messageID,
            text,
            audioSoundscape,
            functionToEval
        });
        
        this.showMessage(text);
        
        if (audioSoundscape) {
            this.eventBus.emit('sound:play', { soundName: audioSoundscape });
        }
        
        if (functionToEval) {
            try {
                eval(functionToEval);
            } catch (error) {
                console.error('Error executing function:', error);
            }
        }
    }
    
    showMessage(text) {
        if (!this.elements.messageDisplay || !text.trim()) return;
        
        clearTimeout(this.messageTimeoutID);
        
        this.elements.messageDisplay.textContent = text;
        this.elements.messageDisplay.classList.add('visible');
        
        this.adjustFontSizeToFit(this.elements.messageDisplay, 100);
        
        // Poll for when speaking is done
        const pollForSpeaking = () => {
            this.eventBus.emit('tts:check-speaking', {
                callback: (isSpeaking) => {
                    if (!isSpeaking) {
                        this.elements.messageDisplay.classList.remove('visible');
                        this.elements.messageDisplay.textContent = '';
                    } else {
                        this.messageTimeoutID = setTimeout(pollForSpeaking, 500);
                    }
                }
            });
        };
        
        this.messageTimeoutID = setTimeout(pollForSpeaking, 8000);
    }
    
    adjustFontSizeToFit(div, maxHeightVh) {
        const viewportHeight = window.innerHeight;
        const maxHeight = (viewportHeight * maxHeightVh) / 100;
        
        div.style.maxHeight = maxHeight + 'px';
        
        let fontSize = parseInt(window.getComputedStyle(div).fontSize, 10);
        let currentHeight = div.scrollHeight;
        
        while (currentHeight > maxHeight && fontSize > 10) {
            fontSize -= 1;
            div.style.fontSize = fontSize + 'px';
            currentHeight = div.scrollHeight;
        }
    }
    
    updateLocationDisplay(data) {
        if (!this.elements.currentLocation) return;
        
        this.elements.currentLocation.innerHTML = `
            <strong><span class='material-icons' style='vertical-align: middle;'>bluetooth</span> Bluetooth:</strong> ${data.bluetoothStatus}<br>
            <strong><span class='material-icons' style='vertical-align: middle;'>place</span> Latitude:</strong> ${data.latitude}
            <strong> Longitude:</strong> ${data.longitude}<br>
            <strong><span class='material-icons' style='vertical-align: middle;'>location_city</span> Nearest street:</strong> ${data.streetName}
            <strong><span class='material-icons' style='vertical-align: middle;'>pets</span><span class='material-icons' style='vertical-align: middle;'>person</span> Separation:</strong> ${data.separation} m<br>
            <strong><span class='material-icons' style='vertical-align: middle;'>explore</span> Direction:</strong> ${data.direction}
            <strong><span class='material-icons' style='vertical-align: middle;'>speed</span> Speed:</strong> ${data.speed} m/s<br>
            <strong><span class='material-icons' style='vertical-align: middle;'>directions_walk</span> Distance Walked:</strong> ${data.totalDistance} m
            <strong>Avatar Actions:</strong> ${data.partMoving} ${data.directionMoving}
        `;
    }
}