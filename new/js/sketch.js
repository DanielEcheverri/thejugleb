// js/sketch.js

const sketch = (p) => {
	let numPotentiometers = 11;
	let potValues = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	let lineColors;
	let backgroundColors;
	let isMovingUp = false;
	let isMovingDown = false;
	var previousPotValues = new Array(numPotentiometers);
	const cooldownDuration = 500;
	let detectMovement = true;

	let previousMovements = {};
	let keysToForget = new Set();
	let digitalReleaseTimers = new Map();
	const RELEASE_PERSISTENCE_MS = 100;
	let previousActiveMovements = [];

	p.setup = () => {
		var avatarBTCanvas = p.createCanvas(p.windowWidth, p.windowHeight * 0.35);
		avatarBTCanvas.parent("avatarCanvas");
		lineColors = new Array(numPotentiometers);
		backgroundColors = new Array(numPotentiometers);
		p.setupColors();
		p.setupBackgroundColors();
	};

	p.draw = () => {
		p.background(255);
		let lineHeight = p.height / numPotentiometers;
		let labelSize = p.min(p.width, p.height) * 0.03;
		for (let i = 0; i < numPotentiometers; i++) {
			let lineY = i * lineHeight + lineHeight / 2;
			p.noStroke();
			p.fill(backgroundColors[i]);
			p.rect(0, i * lineHeight, p.width, lineHeight);
			p.strokeWeight(30);
			p.stroke(lineColors[i]);
			p.line(0, lineY, p.map(potValues[i], 0, 1024, 0, p.width * 0.55), lineY);
			p.noStroke();
			p.fill(255);
			p.textFont("Roboto");
			p.textAlign(p.RIGHT, p.CENTER);
			p.textSize(labelSize);
			p.text(p.int(potValues[i]), p.map(potValues[i], 0, 1024, 0, p.width * 0.55) - 10, lineY);
		}
		p.textAlign(p.RIGHT, p.CENTER);
		let labelFontSize = p.min(p.width, p.height) * 0.04;
		p.textFont("Roboto");
		p.textSize(labelFontSize);
		p.fill("#594F4D");
		for (let i = 0; i < numPotentiometers; i++) {
			p.text(labels[i], p.width * 0.9, i * lineHeight + lineHeight / 2); // 'labels' is global
		}
		if (startDetectMovement) { // 'startDetectMovement' is global
			checkMovement();
		}
	};

	const alpha = 1;
	function lowPassFilter(currentValue, newValue) {
		return alpha * newValue + (1 - alpha) * currentValue;
	}

	// This function is exposed to the global window, called by bluetooth.js
	window.receiveDataFromSerial = (data) => {
		let cleanData = data.trim();
		let values = cleanData.split(",");
		if (values.length === numPotentiometers) {
			for (let i = 0; i < values.length; i++) {
				potValues[i] = parseFloat(lowPassFilter(potValues[i] || parseFloat(values[i]), parseFloat(values[i])).toFixed(1));
			}
		}
	};
	
	// This function is exposed to be called by bluetooth.js on disconnect
	window.resetPotValues = () => {
		potValues = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	};

	function objectsEqual(obj1, obj2) {
		const keys1 = Object.keys(obj1);
		const keys2 = Object.keys(obj2);
		if (keys1.length !== keys2.length) return false;
		for (let key of keys1) {
			if (obj1[key] !== obj2[key]) return false;
		}
		return true;
	}

	function handleMovement() {
		let movements = {};
        // Different sensitivites for different parts of the puppet
        const movementThresholds = {
            "LEFT ARM": 50,
            "RIGHT ARM": 50,
            "HEAD": 45,   
            "LEFT LEG": 30,    
            "RIGHT LEG": 30
        };
        const defaultMovementThreshold = 25;
		//const movementThreshold = 25;
		const digitalParts = ["LEFT FOOT", "RIGHT FOOT", "RIGHT HAND", "LEFT HAND", "EYES", "MOUTH"];
		const labelMovements = {
			"LEFT ARM": "leftArmMoving", "RIGHT ARM": "rightArmMoving",
			"HEAD": "headMoving", "LEFT LEG": "leftLegMoving",
			"RIGHT LEG": "rightLegMoving", "LEFT FOOT": "leftFootPressed",
			"RIGHT FOOT": "rightFootPressed", "RIGHT HAND": "rightHandTouched",
			"LEFT HAND": "leftHandTouched", "EYES": "eyesTouched",
			"MOUTH": "mouthTouched"
		};

		try {
			for (let i = 0; i < numPotentiometers; i++) {
				const label = labels[i]; // global
				const movement = labelMovements[label];
				if (movement === null || movement === undefined) continue;

				if (digitalParts.includes(label)) {
					const isCurrentlyActive = potValues[i] > 0;
					const wasPreviouslyActive = previousMovements[movement] === true;
					if (isCurrentlyActive && digitalReleaseTimers.has(movement)) {
						clearTimeout(digitalReleaseTimers.get(movement));
						digitalReleaseTimers.delete(movement);
					}
					if (isCurrentlyActive && !wasPreviouslyActive) {
						movements[movement] = true;
					} else if (!isCurrentlyActive && wasPreviouslyActive) {
						movements[movement] = false;
						if (!digitalReleaseTimers.has(movement)) {
							const timerId = setTimeout(() => {
								delete previousMovements[movement];
								digitalReleaseTimers.delete(movement);
							}, RELEASE_PERSISTENCE_MS);
							digitalReleaseTimers.set(movement, timerId);
						}
					}
				} else {
                // Get the threshold for this specific label, or use the default if it's not in our map.
                const threshold = movementThresholds[label] || defaultMovementThreshold;

                // Use the new 'threshold' variable instead of 'movementThreshold'
                if (potValues[i] < previousPotValues[i] - threshold) {
                    movements[movement] = false;
                } else if (potValues[i] > previousPotValues[i] + threshold) {
                    movements[movement] = true;
                } else {
                    movements[movement] = null;
                }
				}
			}

			previousPotValues = potValues.slice(0, numPotentiometers);
			const merged = { ...previousMovements };

			for (const key of Object.values(labelMovements)) {
				if (!Object.prototype.hasOwnProperty.call(movements, key)) continue;
				const val = movements[key];
				if (val === null || val === undefined) {
					if (merged.hasOwnProperty(key)) {
						delete merged[key];
					}
					continue;
				}
				const isDigitalKey = digitalParts.map(p => labelMovements[p]).includes(key);
				if (isDigitalKey && val === false) {
					merged[key] = false;
					if (!digitalReleaseTimers.has(key)) {
						const timerId = setTimeout(() => {
							try {
								if (previousMovements[key] === false) {
									delete previousMovements[key];
								}
							} finally {
								digitalReleaseTimers.delete(key);
							}
						}, RELEASE_PERSISTENCE_MS);
						digitalReleaseTimers.set(key, timerId);
					}
				} else {
					merged[key] = val;
				}
			}

			if (!objectsEqual(merged, previousMovements)) {
				for (const k of Object.keys(previousMovements)) {
					if (!merged.hasOwnProperty(k)) delete previousMovements[k];
				}
				for (const k of Object.keys(merged)) {
					previousMovements[k] = merged[k];
				}
				return { ...previousMovements };
			}
			return null;
		} catch (err) {
			console.error("handleMovement crashed:", err);
			return null;
		}
	}

	async function checkMovement() {
		let movements = handleMovement();
		if (!cachedMovementConditions) { // global
			try {
				cachedMovementConditions = await $.get(moveSource); // global
			} catch (error) {
				console.error('Error fetching movement conditions JSON:', error);
				return;
			}
		}
		processMovementConditions(movements || {});
	}

	function processMovementConditions(movements) {
		const currentActiveMovements = [];
		cachedMovementConditions.forEach(condition => {
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

		function canonicalize(arr) {
			const copy = arr.map(x => ({ part: x.part, direction: x.direction }));
			copy.sort((a, b) => ('' + a.part + a.direction).localeCompare('' + b.part + b.direction));
			return JSON.stringify(copy);
		}
		const currentMovementsString = canonicalize(currentActiveMovements);
		const previousMovementsString = canonicalize(previousActiveMovements || []);

		if (currentMovementsString !== previousMovementsString) {
			if (movementResetTimer && currentActiveMovements.length > 0) { // global
				clearTimeout(movementResetTimer);
				movementResetTimer = null;
			}
			if (currentActiveMovements.length === 0) {
				previousActiveMovements = [];
				if (!movementResetTimer) {
					movementResetTimer = setTimeout(() => {
						partMoving = "none"; // global
						directionMoving = "none"; // global
						movementResetTimer = null;
					}, 2000);
				}
				return;
			}
			if (!speaking) { // global
				const first = currentActiveMovements[0];
				if (first) {
					partMoving = first.part; // global
					directionMoving = first.direction; // global
				}
				const logMessage = currentActiveMovements.map(m => m.part + " " + m.direction).join(" & ");
				console.log("--Movement: " + logMessage);
				if (noNarrative) { // global
					// window.success_Sound.play();
				}
				previousActiveMovements = JSON.parse(JSON.stringify(currentActiveMovements));
				trackMovementSequences(currentActiveMovements);
			} else {
				previousActiveMovements = JSON.parse(JSON.stringify(currentActiveMovements));
			}
		}
	}

	async function trackMovementSequences(currentActiveMovements) {
		const PRUNE_TIME_MS = 1500;
		const now = Date.now();
		while (movementBuffer.length > 0 && (now - movementBuffer[0].timestamp > PRUNE_TIME_MS)) {
			movementBuffer.shift();
		}
		const normalizedSequence = currentActiveMovements
			.map(m => ({ part: m.part, direction: m.direction }))
			.sort((a, b) => (a.part + a.direction).localeCompare(b.part + b.direction));
		const currentSequenceString = JSON.stringify(normalizedSequence);
		const lastEntryStateString = movementBuffer.length > 0
			? JSON.stringify(movementBuffer[movementBuffer.length - 1].state)
			: null;
		if (lastEntryStateString === currentSequenceString) return;
		
		movementBuffer.push({ state: normalizedSequence, timestamp: now }); // global
		
		const patterns = await fetchJSONFile(movePatterns, cachedMovePatterns); // from main.js, globals
		const bufferStates = movementBuffer.map(entry => entry.state);
		
		let matchedPattern = null;
		let matchedStartIndex = -1;
		let maxPatternLength = 0;
		
		for (const pattern of patterns) {
			const result = checkPatternInBufferWithIndex(pattern.pattern, bufferStates);
			if (result.found && pattern.pattern.length > maxPatternLength) {
				matchedPattern = pattern;
				maxPatternLength = pattern.pattern.length;
				matchedStartIndex = result.startIndex;
			}
		}
		
		if (matchedPattern) {
			window.complete_Sound.play();
			console.log(`--Pattern matched: ${matchedPattern.patternName}`);
			patternMovement = matchedPattern.patternName; // global
			if (matchedStartIndex >= 0) {
				movementBuffer.splice(matchedStartIndex, maxPatternLength);
			}
			setTimeout(resetVariables, 4000);
		}
	}

	function resetVariables(resetAll = true) {
		previousActiveMovements = [];
		if (resetAll) patternMovement = "none"; // global
	}

	function checkPatternInBufferWithIndex(pattern, buffer) {
		if (buffer.length === 0) return { found: false, startIndex: -1 };
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
				return { found: true, startIndex: start };
			}
		}
		return { found: false, startIndex: -1 };
	}

	async function fetchMovementPatterns() {
		try {
			if (cachedMovePatterns) { // global
				return cachedMovePatterns;
			} else {
				const patterns = await $.get(movePatterns); // global
				cachedMovePatterns = patterns;
				return patterns;
			}
		} catch (error) {
			console.error(error);
			return [];
		}
	}
	
	// --- p5.js Color Helpers ---
	p.setupColors = () => {
		lineColors[0] = p.color("#208C3B");
		lineColors[1] = p.color("#208C3B");
		lineColors[2] = p.color("#164010");
		lineColors[3] = p.color("#208C3B");
		lineColors[4] = p.color("#208C3B");
		lineColors[5] = p.color("#BF4E24");
		lineColors[6] = p.color("#BF4E24");
		lineColors[7] = p.color("#164010");
		lineColors[8] = p.color("#164010");
		lineColors[9] = p.color("#208C3B");
		lineColors[10] = p.color("#208C3B");
	};

	p.setupBackgroundColors = () => {
		backgroundColors[0] = p.color("#F2E085");
		backgroundColors[1] = p.color("#F2E085");
		backgroundColors[2] = p.color("#F2E085");
		backgroundColors[3] = p.color("#F2E085");
		backgroundColors[4] = p.color("#F2E085");
		backgroundColors[5] = p.color("#F2E085");
		backgroundColors[6] = p.color("#F2E085");
		backgroundColors[7] = p.color("#F2E085");
		backgroundColors[8] = p.color("#F2E085");
		backgroundColors[9] = p.color("#F2E085");
		backgroundColors[10] = p.color("#F2E085");
	};

};

// This line starts the p5.js sketch in instance mode
new p5(sketch);