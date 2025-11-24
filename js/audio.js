// js/audio.js

// --- Sound Definitions ---
connecting_Sound = new Howl({
	src: ['audio/ui_loading.mp3'],
	onloaderror: function (error) { console.error('Error loading audio:', error); },
});
bgm_Sound = new Howl({
	src: ['audio/bgm.mp3'],
	loop: true,
	volume: 0.2
});

// --- Sound Initialization ---
async function initializeSounds() {
	try {
		const sounds = await fetchJSONFile('data/sounds.json', window.sounds); // Assumes fetchJSONFile is global (it is, from main.js)
		if (sounds) {
			const totalSounds = Object.keys(sounds).length;
			let loadedSounds = 0;

			function soundLoaded() {
				loadedSounds++;
				const percentage = Math.round((loadedSounds / totalSounds) * 100);
				document.getElementById('loading-text').textContent = `Loading resources... ${percentage}%`;
				if (loadedSounds === totalSounds) {
					console.log('All resources loaded');
					hideLoadingScreen();
				}
			}

			for (const key in sounds) {
				if (sounds.hasOwnProperty(key)) {
					window[key] = new Howl({
						src: [sounds[key].src],
						volume: 0.4,
						onload: soundLoaded,
						onloaderror: function (error) {
							console.error('Error loading audio resources:', error);
						},
						onstop: function (id) {
							console.log(`Sound with key '${key}' and ID ${id} stopped.`);
							console.log('Playback position:', this.seek());
							console.trace();
						}
					});
				}
			}
		} else {
			console.error('Failed to load audio resources.');
			hideLoadingScreen();
		}
	} catch (error) {
		console.error('Error initializing resources:', error);
		hideLoadingScreen();
	}
}

function hideLoadingScreen() {
	var loadingScreen = document.getElementById('loading-screen');
	loadingScreen.classList.add('hidden');
}


// --- Text-to-Speech (TTS) ---

const transliterationMap = {
	'á': 'a', 'à': 'a', 'ä': 'a', 'ã': 'a', 'â': 'a', 'å': 'a', 'č': 'tch', 'æ': 'ae',
	'ç': 'c', 'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e', 'í': 'i', 'ì': 'i',
	'ï': 'i', 'î': 'i', 'ñ': 'ny', 'ó': 'o', 'ò': 'o', 'ö': 'o', 'õ': 'o', 'ø': 'oe',
	'ô': 'o', 'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u', 'ý': 'y', 'ÿ': 'y',
	'š': 'sh', 'ž': 'zh', 'ř': 'r', 'ů': 'u', 'ď': 'd', 'ť': 't', 'ň': 'n',
	'Á': 'A', 'À': 'A', 'Ä': 'A', 'Ã': 'A', 'Â': 'A', 'Å': 'A', 'Č': 'TCH', 'Æ': 'AE',
	'Ç': 'C', 'É': 'E', 'È': 'E', 'Ë': 'E', 'Ê': 'E', 'Í': 'I', 'Ì': 'I',
	'Ï': 'I', 'Î': 'I', 'Ñ': 'NY', 'Ó': 'O', 'Ò': 'O', 'Ö': 'O', 'Õ': 'O', 'Ø': 'OE',
	'Ô': 'O', 'Ú': 'U', 'Ù': 'U', 'Ü': 'U', 'Û': 'U', 'Ý': 'Y', 'Ÿ': 'Y',
	'Š': 'SH', 'Ž': 'ZH', 'Ř': 'R', 'Ů': 'U', 'Ď': 'D', 'Ť': 'T', 'Ň': 'NY'
};

function transliterate(text) {
	return text.split('').map(char => transliterationMap[char] || char).join('');
}

function speakMessage(fullMessage) {
	console.log("--Speaking: " + fullMessage);
	if (speakFancy) {
		speakMessage_azure(fullMessage);
	} else {
		speakMessage_coqui(fullMessage);
	}
}

async function speakMessage_azure(fullMessage) {
	const transliteratedMessage = transliterate(fullMessage);
	console.log("Transliterated:"+transliteratedMessage);
	if (transliteratedMessage === lastSpokenMessage) {
		console.log("Message already spoken.");
		return;
	}
	if (transliteratedMessage === "") {
		console.log("Empty text, message ignored.");
		return;
	}

	const endpoint = "https://germanywestcentral.tts.speech.microsoft.com/cognitiveservices/v1";
	const subscriptionKey = "9PhQZhVP3ZRybebW3qaOiHU0EZc6eKmZGbP74vpuM2wqradXDdc2JQQJ99BDACPV0roXJ3w3AAAYACOGCcy5";
	//const voiceName = "en-GB-SoniaNeural";
	const voiceName = "en-IN-KunalNeural";
	//const outputFormat = "audio-24khz-160kbitrate-mono-mp3";
	const outputFormat = "audio-16khz-128kbitrate-mono-mp3";

	// Define the two voices for alternating speech
    const voiceSonia = "en-GB-SoniaNeural"; // Voice 1 (Starts at index 0)
    const voiceKunal = "en-IN-KunalNeural"; // Voice 2
    
    // Split the message into all segments based on the separator
    const messageParts = transliteratedMessage.split('|VOICESWITCH|');
    
    let ssmlContent = "";
    
    // 💡 Dynamic SSML Construction Loop
    for (let i = 0; i < messageParts.length; i++) {
        const text = messageParts[i].trim();
        if (text === "") continue; 

        // Determine the voice for the current segment:
        // Index 0, 2, 4... (even) uses Sonia (Voice 1)
        // Index 1, 3, 5... (odd) uses Kunal (Voice 2)
        const voiceName = (i % 2 === 0) ? voiceSonia : voiceKunal;
        
        // Add the segment to the SSML content
        ssmlContent += `
            <voice name='${voiceName}'>
                <prosody volume="x-loud">
                    ${text}
                </prosody>
            </voice>
            <break time="500ms"/>
        `;
    }

// Final SSML structure wrapped around the dynamic content
    const ssml = `
        <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-GB'>
            ${ssmlContent}
        </speak>
    `;

	try {
		const headers = {
			"Ocp-Apim-Subscription-Key": subscriptionKey,
			"Content-Type": "application/ssml+xml",
			"X-Microsoft-OutputFormat": outputFormat,
			"User-Agent": "Azure-TTS-JS",
		};

		async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
			for (let attempt = 1; attempt <= retries; attempt++) {
				try {
					const response = await fetch(url, options);
					if (response.ok) return response;
					console.log(`Attempt ${attempt} failed. Retrying in ${delay / 1000} seconds...`);
				} catch (error) {
					console.log(`Attempt ${attempt} encountered an error: ${error.message}`);
				}
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
			throw new Error(`Failed to fetch after ${retries} attempts`);
		}

		const response = await fetchWithRetry(endpoint, { method: "POST", headers: headers, body: ssml });
		const audioBlob = await response.blob();
		const audioUrl = URL.createObjectURL(audioBlob);

		if (currentSound) {
			console.log("Stopping current text");
			currentSound.stop();
			currentSound.unload();
		}

		const sound = new Howl({
			src: [audioUrl],
			format: ["mp3"],
			html5: true,
			onplay: () => {
				console.log(deviceName + " currently speaking");
				speaking = true;
				messageID = messageID_tmp;
				oldMessageID = messageID;
				lastSpokenMessage = transliteratedMessage;
				playAction = true;
			},
			onend: () => {
				if (playAction) {
					setTimeout(() => {
						window.notification_Sound.play();
						console.log(deviceName + " end speaking");
						speaking = false;
						sound.unload();
						playAction = false;
					}, 500);
				}
				currentSound = null;
			},
			onloaderror: (id, err) => {
				console.error("Audio playback error:", err);
				speaking = false;
				sound.unload();
				currentSound = null;
			},
		});

		currentSound = sound;
		sound.play();
		if (Howler.ctx.state === "suspended") {
			Howler.ctx.resume();
		}
	} catch (error) {
		speaking = false;
		console.error("Error with TTS API:", error);
	}
}

async function speakMessage_coqui(fullMessage) {
	const transliteratedMessage = transliterate(fullMessage);
	if (transliteratedMessage === lastSpokenMessage) {
		console.log("Message already spoken.");
		return;
	}
	if (transliteratedMessage === "") {
		console.log("Empty text, message ignored.");
		return;
	}

	const encodedMessage = encodeURIComponent(transliteratedMessage);
	const url = `https://s4us-tts.fi.muni.cz:5002/api/tts?text=${encodedMessage}&speaker_id=&style_wav=&language=en`;

	async function fetchWithRetry(url, retries = 3, delay = 1000) {
		for (let attempt = 1; attempt <= retries; attempt++) {
			try {
				const response = await fetch(url);
				if (response.ok) return response;
				console.log(`Attempt ${attempt} failed. Retrying in ${delay / 1000} seconds...`);
			} catch (error) {
				console.log(`Attempt ${attempt} encountered an error: ${error.message}`);
			}
			await new Promise(resolve => setTimeout(resolve, delay));
		}
		throw new Error(`Failed to fetch after ${retries} attempts`);
	}

	try {
		const response = await fetchWithRetry(url);
		const audioBlob = await response.blob();
		const audioUrl = URL.createObjectURL(audioBlob);

		if (currentSound) {
			console.log("Stopping current text");
			currentSound.stop();
			currentSound.unload();
		}

		const sound = new Howl({
			src: [audioUrl],
			format: ['wav'],
			html5: true,
			onplay: () => {
				console.log(deviceName + " currently speaking");
				speaking = true;
				messageID = messageID_tmp;
				oldMessageID = messageID;
				lastSpokenMessage = transliteratedMessage;
				playAction = true;
			},
			onend: () => {
				if (playAction) {
					setTimeout(function () {
						window.notification_Sound.play();
						console.log(deviceName + " end speaking");
						speaking = false;
						sound.unload();
						playAction = false;
					}, 500);
				}
				currentSound = null;
			},
			onloaderror: (id, err) => {
				console.error("Audio playback error:", err);
				speaking = false;
				sound.unload();
				currentSound = null;
			},
		});

		currentSound = sound;
		sound.play();
		if (Howler.ctx.state === "suspended") {
			Howler.ctx.resume();
		}
	} catch (error) {
		speaking = false;
		console.error("Error with TTS API:", error);
	}
}