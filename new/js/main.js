// js/main.js

// ### INITIALIZATION & EVENT LISTENERS ###

document.addEventListener('DOMContentLoaded', function () {
	console.log("Initializing resources.");
	initializeSounds(); // from audio.js
	checkVariables();
	storeUserIP().then(() => {
		if (user_ip) {
			console.log('User IP:', user_ip);
		}
	});
	generateSessionId();
	getCurrentLocation(); // from location.js
	redirectConsoleToDiv();

	// --- Attach Event Listeners ---
	document.getElementById('hachiCheckbox').addEventListener('click', toggleDeviceName);

	document.getElementById('listenButton').addEventListener('click', () => {
		forward_Sound.play();
		wakeLock();
		listenFunction();
	});

	document.getElementById('interactButton').addEventListener('click', () => {
		forward_Sound.play();
		wakeLock();
		interactFunction();
	});

	document.getElementById('toggleSwitch').addEventListener('change', () => {
		forward_Sound.play();
	});

	document.getElementById('connectButton').addEventListener('click', () => {
		connecting_Sound.play();
		// The original code had a strange displayText call. I'm calling connectToDevice directly.
		// displayText(String(document.getElementById("connectButton").lastChild.textContent.trim()));
		connectToDevice(); // from bluetooth.js
	});

	// Log window closure
	window.addEventListener('beforeunload', function (event) {
		console.log('End of session');
	});
});

// ### APP INITIALIZATION ###

function checkVariables() {
	if (latitude !== null && longitude !== null) {
		document.getElementById('connectButton').disabled = false;
	} else {
		setTimeout(checkVariables, 1000);
	}
}

function generateSessionId() {
	for (let i = 0; i < 6; i++) {
		sessionId += Math.random().toString(36).charAt(2);
	}
	console.log("Session id: " + sessionId);
	return sessionId;
}

async function getUserIP() {
	try {
		const response = await fetch('https://api.ipify.org?format=json');
		const data = await response.json();
		return data.ip;
	} catch (error) {
		console.error('Error fetching IP address:', error);
		return null;
	}
}

async function storeUserIP() {
	user_ip = await getUserIP();
	if (user_ip) {
		return user_ip;
	} else {
		return null;
	}
}

// ### UI & EVENT HANDLERS ###

function toggleDeviceName() {
	var checkbox = document.getElementById("hachiCheckbox");
	if (checkbox.checked) {
		deviceName = "hachi_BT";
		console.log("Loading settings for " + deviceName);
		interactionMode = "_int";
		moveSource = 'data/hachi_moves.json';
		movePatterns = 'data/hachi_patterns.json';
		sentenceSource = 'data/hachi_sentences.json';
		characterName = "Hachi";
		initializeSounds();
	} else {
		deviceName = "avatar_BT";
		console.log("Loading settings for " + deviceName);
		interactionMode = "_int";
		moveSource = 'data/avatar_moves.json';
		movePatterns = 'data/avatar_patterns.json';
		sentenceSource = 'data/avatar_sentences.json';
		characterName = "Buro";
		initializeSounds();
	}
}

function interactFunction() {
	listenClient = false;
	document.getElementById('listenButton').classList.add('hidden');
	document.getElementById('interactButton').classList.add('hidden');
	document.getElementById('connectButton').classList.remove('hidden');
}

function listenFunction() {
	listenClient = true;
	document.getElementById('interactButton').classList.add('hidden');
	document.getElementById('toggleContainer').style.display = 'flex'; // Uses flex, so classList is tricky
	document.getElementById("toggleSwitch").click();
}

function wakeLock() {
	if ('wakeLock' in navigator) {
		navigator.wakeLock.request('screen').then(() => {
			console.log('Screen wake lock activated');
		}).catch((err) => {
			console.error('Failed to activate wake lock:', err);
		});
	} else {
		console.error('Wake lock API not supported.');
	}
}

// ### CONSOLE & MESSAGING ###

function redirectConsoleToDiv() {
	const consoleOutputDiv = document.getElementById('consoleOutput');
	if (!consoleOutputDiv) {
		console.error("Div for console output not found.");
		return;
	}
	const originalConsoleLog = console.log;
	const originalConsoleError = console.error;
	const logMessages = [];

	function handleLog(type, originalFunction, ...args) {
		originalFunction(...args);
		const message = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ');
		logMessages.push(`<strong>CONSOLE ${type}:</strong> ${message}`);
		updateConsoleOutput();
		// sendToSheet(type, message); // Uncomment to re-enable
	}

	function sendToSheet(type, message) {
		const timestamp = new Date().toISOString();
		const scriptURL = `https://script.google.com/macros/s/AKfycbxV_7DD1zilVjmNXQP3zHgtqFMY6ekcsD8-ginnUcUFXq6x_j-vxW6sFftfDCbZCZTq5w/exec`;
		const params = new URLSearchParams({
			timestamp, user_ip, sessionId,
			agent: deviceName + interactionMode,
			movement: `${potValues}`, // potValues comes from sketch.js
			type,
			location: `${latitude},${longitude}`,
			message, messageID
		});
		fetch(`${scriptURL}?${params.toString()}`, { method: 'GET', mode: 'no-cors' })
			.catch(err => originalConsoleError('Failed to log to sheet:', err));
	}

	console.log = (...args) => handleLog("DEBUG", originalConsoleLog, ...args);
	console.error = (...args) => handleLog("ERROR", originalConsoleError, ...args);

	function updateConsoleOutput() {
		const lastTwoMessages = logMessages.slice(-2);
		consoleOutputDiv.innerHTML = lastTwoMessages
			.map(msg => `<div class="log">${msg}</div>`)
			.join('');
	}
}

function displayText(message) {
	var messageDisplayDiv = document.getElementById("messageDisplayDiv");
	var delimiterIndex = message.indexOf("/");

	if (delimiterIndex !== -1) {
		messageID_tmp = message.substring(0, delimiterIndex);
		console.log("--Passage: " + messageID_tmp);
		var secondDelimiterIndex = message.indexOf("/", delimiterIndex + 1);

		if (secondDelimiterIndex !== -1 && secondDelimiterIndex !== delimiterIndex) {
			var thirdDelimiterIndex = message.indexOf("/", secondDelimiterIndex + 1);

			if (thirdDelimiterIndex !== -1) {
				var fourthDelimiterIndex = message.indexOf("/", thirdDelimiterIndex + 1);
				var fullMessage = message.substring(delimiterIndex + 1, secondDelimiterIndex).trim();
				var audioSoundscape = message.substring(secondDelimiterIndex + 1, thirdDelimiterIndex).trim();

				clearTimeout(timeoutID);
				speakMessage(fullMessage); // from audio.js
				updateDisplay(fullMessage);

				if (audioSoundscape !== "") {
					window[audioSoundscape + "_Sound"].play();
				}
				if (fourthDelimiterIndex !== -1) {
					var functionToEval = message.substring(thirdDelimiterIndex + 1, fourthDelimiterIndex).trim();
					try {
						eval(functionToEval);
					} catch (error) {
						console.error("Error executing displayText function: " + error);
					}
				}
			} else {
				var fullMessage = message.substring(delimiterIndex + 1, secondDelimiterIndex).trim();
				var audioSoundscape = message.substring(secondDelimiterIndex + 1).trim();
				clearTimeout(timeoutID);
				speakMessage(fullMessage);
				updateDisplay(fullMessage);
				if (audioSoundscape !== "") {
					window[audioSoundscape + "_Sound"].play();
				}
			}
		} else {
			var fullMessage = message.substring(delimiterIndex + 1).trim();
			clearTimeout(timeoutID);
			speakMessage(fullMessage);
			updateDisplay(fullMessage);
		}
	} else {
		var fullMessage = message.trim();
		clearTimeout(timeoutID);
		speakMessage(fullMessage);
		updateDisplay(fullMessage);
	}
}

function updateDisplay(displayMessage) {
	try {
		const messageDisplayDiv = document.getElementById("messageDisplayDiv");
		if (!messageDisplayDiv) {
			console.error("messageDisplayDiv element not found");
			return;
		}
		if (timeoutID) {
			clearTimeout(timeoutID);
		}
		if (displayMessage.trim() !== "") {
			messageDisplayDiv.textContent = displayMessage;
			messageDisplayDiv.classList.add("visible");
		} else {
			messageDisplayDiv.classList.remove("visible");
		}

		adjustFontSizeToFit(messageDisplayDiv, 100);

		function pollForSpeaking() {
			if (!speaking) {
				messageDisplayDiv.classList.remove("visible");
				messageDisplayDiv.textContent = "";
			} else {
				timeoutID = setTimeout(pollForSpeaking, 500);
			}
		}
		timeoutID = setTimeout(pollForSpeaking, 8000);
	} catch (error) {
		console.error("An error occurred in updateDisplay:", error);
	}
}

function adjustFontSizeToFit(div, maxHeight) {
	const viewportHeight = window.innerHeight;
	const divHeight = (viewportHeight * maxHeight) / 100;
	div.style.maxHeight = divHeight + "px";
	let fontSize = parseInt(window.getComputedStyle(div).fontSize, 10);
	let currentHeight = div.scrollHeight;
	while (currentHeight > divHeight && fontSize > 10) {
		fontSize -= 1;
		div.style.fontSize = fontSize + "px";
		currentHeight = div.scrollHeight;
	}
}

// ### UTILITIES ###

async function fetchJSONFile(filename, cachedVariable) {
	try {
		if (!cachedVariable) {
			const response = await fetch(filename);
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
			const jsonData = await response.json();
			cachedVariable = jsonData;
			return jsonData;
		} else {
			return cachedVariable;
		}
	} catch (err) {
		console.error('Error fetching JSON file: ', err);
		return null;
	}
}