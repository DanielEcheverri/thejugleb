class MovementDetector {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.potValues = new Array(CONFIG.BLUETOOTH.numPotentiometers).fill(0);
        this.previousPotValues = new Array(CONFIG.BLUETOOTH.numPotentiometers).fill(0);
        this.previousMovements = {};
        this.movementBuffer = [];
        this.digitalReleaseTimers = new Map();
        this.movementResetTimer = null;
        this.currentPart = 'none';
        this.currentDirection = 'none';
        this.currentPattern = 'none';
        this.labels = [];
        this.movementConditions = null;
        this.patterns = null;
        this.enabled = false;
    }
    
    async init(deviceName) {
        const config = CONFIG.DEVICES[deviceName];
        this.labels = config.labels;
        
        this.movementConditions = await Utils.fetchJSON(config.movesFile);
        this.patterns = await Utils.fetchJSON(config.patternsFile);
        
        this.eventBus.on('bluetooth:data', (data) => {
            this.updateSensorValues(data.data);
        });
    }
    
    updateSensorValues(data) {
        const cleanData = data.trim();
        const values = cleanData.split(',');
        
        if (values.length === CONFIG.BLUETOOTH.numPotentiometers) {
            for (let i = 0; i < values.length; i++) {
                const newValue = parseFloat(values[i]);
                this.potValues[i] = parseFloat(
                    Utils.lowPassFilter(this.potValues[i] || newValue, newValue).toFixed(1)
                );
            }
            
            this.eventBus.emit('movement:sensors', {
                values: this.potValues
            });
            
            if (this.enabled) {
                this.detectMovement();
            }
        }
    }
    
    detectMovement() {
        const movements = this.handleMovement();
        if (!movements) return;
        
        this.processMovementConditions(movements);
    }
    
    handleMovement() {
        const movements = {};
        const threshold = CONFIG.MOVEMENT.threshold;
        
        const digitalParts = [
            "LEFT FOOT", "RIGHT FOOT", "RIGHT HAND", 
            "LEFT HAND", "EYES", "MOUTH"
        ];
        
        const labelMovements = {
            "LEFT ARM": "leftArmMoving",
            "RIGHT ARM": "rightArmMoving",
            "HEAD": "headMoving",
            "LEFT LEG": "leftLegMoving",
            "RIGHT LEG": "rightLegMoving",
            "LEFT FOOT": "leftFootPressed",
            "RIGHT FOOT": "rightFootPressed",
            "RIGHT HAND": "rightHandTouched",
            "LEFT HAND": "leftHandTouched",
            "EYES": "eyesTouched",
            "MOUTH": "mouthTouched"
        };
        
        try {
            // Process all sensors
            for (let i = 0; i < CONFIG.BLUETOOTH.numPotentiometers; i++) {
                const label = this.labels[i];
                const movement = labelMovements[label];
                
                if (!movement) continue;
                
                if (digitalParts.includes(label)) {
                    const isActive = this.potValues[i] > 0;
                    const wasActive = this.previousMovements[movement] === true;
                    
                    if (isActive && this.digitalReleaseTimers.has(movement)) {
                        clearTimeout(this.digitalReleaseTimers.get(movement));
                        this.digitalReleaseTimers.delete(movement);
                    }
                    
                    if (isActive && !wasActive) {
                        movements[movement] = true;
                    } else if (!isActive && wasActive) {
                        movements[movement] = false;
                        
                        const timerId = setTimeout(() => {
                            delete this.previousMovements[movement];
                            this.digitalReleaseTimers.delete(movement);
                        }, CONFIG.MOVEMENT.releasePersistenceMs);
                        
                        this.digitalReleaseTimers.set(movement, timerId);
                    }
                } else {
                    // Analog movement
                    if (this.potValues[i] < this.previousPotValues[i] - threshold) {
                        movements[movement] = false;
                    } else if (this.potValues[i] > this.previousPotValues[i] + threshold) {
                        movements[movement] = true;
                    } else {
                        movements[movement] = null;
                    }
                }
            }
            
            this.previousPotValues = this.potValues.slice();
            
            // Merge movements
            const merged = { ...this.previousMovements };
            
            for (const [key, val] of Object.entries(movements)) {
                if (val === null || val === undefined) {
                    if (merged.hasOwnProperty(key)) {
                        delete merged[key];
                    }
                    continue;
                }
                
                merged[key] = val;
            }
            
            if (!Utils.objectsEqual(merged, this.previousMovements)) {
                for (const k of Object.keys(this.previousMovements)) {
                    if (!merged.hasOwnProperty(k)) {
                        delete this.previousMovements[k];
                    }
                }
                for (const k of Object.keys(merged)) {
                    this.previousMovements[k] = merged[k];
                }
                return { ...this.previousMovements };
            }
            
            return null;
            
        } catch (err) {
            console.error('Movement detection error:', err);
            return null;
        }
    }
    
    processMovementConditions(movements) {
        const currentActiveMovements = [];
        
        this.movementConditions.forEach(condition => {
            let match = true;
            for (let key in condition.condition) {
                if (movements[key] !== condition.condition[key]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                currentActiveMovements.push({
                    part: condition.partMoving,
                    direction: condition.directionMoving
                });
            }
        });
        
        // Check if movements changed
        const currentString = JSON.stringify(currentActiveMovements.sort());
        const previousString = JSON.stringify(
            (this.previousActiveMovements || []).sort()
        );
        
        if (currentString !== previousString) {
            if (this.movementResetTimer && currentActiveMovements.length > 0) {
                clearTimeout(this.movementResetTimer);
                this.movementResetTimer = null;
            }
            
            if (currentActiveMovements.length === 0) {
                this.previousActiveMovements = [];
                
                if (!this.movementResetTimer) {
                    this.movementResetTimer = setTimeout(() => {
                        this.currentPart = 'none';
                        this.currentDirection = 'none';
                        this.movementResetTimer = null;
                    }, CONFIG.MOVEMENT.resetDelayMs);
                }
                return;
            }
            
            const first = currentActiveMovements[0];
            if (first) {
                this.currentPart = first.part;
                this.currentDirection = first.direction;
            }
            
            const logMessage = currentActiveMovements
                .map(m => `${m.part} ${m.direction}`)
                .join(' & ');
            console.log('--Movement:', logMessage);
            
            this.eventBus.emit('movement:detected', {
                movements: currentActiveMovements,
                part: this.currentPart,
                direction: this.currentDirection
            });
            
            this.previousActiveMovements = JSON.parse(
                JSON.stringify(currentActiveMovements)
            );
            
            this.trackMovementSequence(currentActiveMovements);
        }
    }
    
    async trackMovementSequence(currentActiveMovements) {
        const now = Date.now();
        
        // Prune old movements
        while (this.movementBuffer.length > 0 && 
               (now - this.movementBuffer[0].timestamp > CONFIG.MOVEMENT.pruneTimeMs)) {
            this.movementBuffer.shift();
        }
        
        // Normalize sequence
        const normalizedSequence = currentActiveMovements
            .map(m => ({ part: m.part, direction: m.direction }))
            .sort((a, b) => (a.part + a.direction).localeCompare(b.part + b.direction));
        
        const currentSequenceString = JSON.stringify(normalizedSequence);
        
        // Avoid duplicates
        const lastEntryStateString = this.movementBuffer.length > 0
            ? JSON.stringify(this.movementBuffer[this.movementBuffer.length - 1].state)
            : null;
        
        if (lastEntryStateString === currentSequenceString) return;
        
        // Add to buffer
        this.movementBuffer.push({ state: normalizedSequence, timestamp: now });
        
        // Check for pattern matches
        const bufferStates = this.movementBuffer.map(entry => entry.state);
        
        let matchedPattern = null;
        let maxPatternLength = 0;
        
        for (const pattern of this.patterns) {
            const result = this.checkPatternInBuffer(pattern.pattern, bufferStates);
            if (result.found && pattern.pattern.length > maxPatternLength) {
                matchedPattern = pattern;
                maxPatternLength = pattern.pattern.length;
            }
        }
        
        if (matchedPattern) {
            console.log('--Pattern matched:', matchedPattern.patternName);
            this.currentPattern = matchedPattern.patternName;
            
            this.eventBus.emit('movement:pattern', {
                pattern: matchedPattern.patternName
            });
            
            // Clear buffer after match
            this.movementBuffer = [];
            
            setTimeout(() => {
                this.currentPattern = 'none';
            }, 4000);
        }
    }
    
    checkPatternInBuffer(pattern, buffer) {
        if (buffer.length === 0) return { found: false };
        
        for (let start = 0; start < buffer.length; start++) {
            let bufferIndex = start;
            let patternIndex = 0;
            
            while (bufferIndex < buffer.length && patternIndex < pattern.length) {
                const requiredMovement = pattern[patternIndex];
                const bufferState = buffer[bufferIndex];
                
                const found = bufferState.some(m =>
                    m.part === requiredMovement.partMoving &&
                    m.direction === requiredMovement.directionMoving
                );
                
                if (found) {
                    patternIndex++;
                }
                bufferIndex++;
            }
            
            if (patternIndex === pattern.length) {
                return { found: true };
            }
        }
        
        return { found: false };
    }
    
    enable() {
        this.enabled = true;
    }
    
    disable() {
        this.enabled = false;
    }
    
    getValues() {
        return this.potValues;
    }
    
    getMovementState() {
        return {
            part: this.currentPart,
            direction: this.currentDirection,
            pattern: this.currentPattern
        };
    }
}