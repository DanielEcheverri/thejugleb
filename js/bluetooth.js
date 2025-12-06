// js/bluetooth.js

async function connectToDevice() {
	try {
		if (!isConnected) {
			device = await navigator.bluetooth.requestDevice({
				filters: [{ services: ["4fafc201-1fb5-459e-8fcc-c5c9c331914b"] }],
			});
			const server = await device.gatt.connect();
			const service = await server.getPrimaryService("4fafc201-1fb5-459e-8fcc-c5c9c331914b");
			characteristic = await service.getCharacteristic("beb5483e-36e1-4688-b7f5-ea07361b26a8");
			await characteristic.startNotifications();
			
			deviceName = device.name; // Get name from device
			
			if (deviceName === "hachi_BT") {
				console.log("Loading settings for Hachi_BT");
				interactionMode = "_int";
				labels = ["EMPTY", "EMPTY", "EMPTY", "EMPTY", "HEAD", "FRONT LEG", "TAIL", "BACK LEG", "EMPTY", "EMPTY"];
				moveSource = 'data/hachi_moves.json';
				movePatterns = 'data/hachi_patterns.json';
				sentenceSource = 'data/hachi_sentences.json';
				tagSource = 'data/tags.json';
				initializeSounds(); // from audio.js
				document.getElementById("hachiCheckbox").click();
				characterName = "Bageera";
				window[characterName + "_Sound"].play();
				notification_Sound.play();
			} else {
				console.log("Loading settings for Avatar_BT");
				interactionMode = "_int";
				labels = ["LEFT ARM", "RIGHT ARM", "HEAD", "LEFT LEG", "RIGHT LEG", "LEFT FOOT", "RIGHT FOOT", "RIGHT HAND", "LEFT HAND", "EYES", "MOUTH"];
				moveSource = 'data/avatar_moves.json';
				movePatterns = 'data/avatar_patterns.json';
				sentenceSource = 'data/avatar_sentences.json';
				tagSource = 'data/tags.json';
				initializeSounds(); // from audio.js
				characterName = "Baloo";
				window[characterName + "_Sound"].play();
				notification_Sound.play();
			}
			
			characteristic.addEventListener("characteristicvaluechanged", handleCharacteristicValueChanged);
			
			document.getElementById("connectButton").innerHTML = '<span class="material-icons" style="vertical-align: middle;">bluetooth_connected</span> Disconnect Avatar';
			isConnected = true;
			startDetectMovement = true;
			blueToothStatus = "Online";
		} else {
			await characteristic.stopNotifications();
			await device.gatt.disconnect();
			isConnected = false;
			document.getElementById("connectButton").innerHTML = '<span class="material-icons" style="vertical-align: middle;">bluetooth_searching </span> Connect to Avatar';
			
			setTimeout(function () {
				startDetectMovement = false;
				if (window.resetPotValues) {
					window.resetPotValues();
				}
				blueToothStatus = "Offline";
				bgm_Sound.stop();
			}, 4000);
		}
	} catch (error) {
		console.error("Error connecting/disconnecting to device: " + error);
	}
}

function handleCharacteristicValueChanged(event) {
	const value = event.target.value;
	const textDecoder = new TextDecoder();
	const decodedValue = textDecoder.decode(value);
	receiveData(decodedValue);
}

// Function to pass data to the p5 sketch
function receiveData(data) {
	if (window.receiveDataFromSerial) {
		window.receiveDataFromSerial(data);
	} else {
		console.error("Processing sketch not initialized.");
	}
}

function wordWrapAndFormat(text) {
    const MAX_CHARS_PER_LINE = 18;
    let result = [];
    let currentText = text.trim(); // Start by removing whitespace

    while (currentText.length > 0) {
        // 1. Check if the remaining text fits on one line
        if (currentText.length <= MAX_CHARS_PER_LINE) {
            result.push(currentText);
            break; // Done processing
        }

        // 2. Find the best place to wrap (the last space before the limit)
        let slice = currentText.substring(0, MAX_CHARS_PER_LINE + 1); // Get up to 1 extra char
        let lastSpaceIndex = slice.lastIndexOf(' ');

        if (lastSpaceIndex > 0) {
            // Case A: Found a space before the limit (ideal wrap)

            let line = currentText.substring(0, lastSpaceIndex);
            result.push(line);
            
            // Move the starting point past the space for the next iteration
            currentText = currentText.substring(lastSpaceIndex).trim();

        } else {
            // Case B: No space found, or only a space at the beginning.
            
            // Take the line exactly at the character limit
            let line = currentText.substring(0, MAX_CHARS_PER_LINE);
            result.push(line);
            
            // Start the next line from the character limit
            currentText = currentText.substring(MAX_CHARS_PER_LINE).trim();
        }
    }

    // 3. Join the lines with the delimiter '|'
    return result.join('|');
}

async function sendData() {
    if (window.backText === lastBackText) {
        return;
    }
    
    if (isConnected && characteristic && window.backText != "") {
        const textToSend = window.backText; 
        const formattedMessage = "TXT:" + textToSend;
        const encoder = new TextEncoder();
        const dataToSend = encoder.encode(formattedMessage + '\n');

        try {
            await characteristic.writeValue(dataToSend);
            console.log("--Backpack message: ", formattedMessage);
            lastBackText = textToSend; 
        } catch (error) {
            console.error("Error writing characteristic for TXT command:", error);
        }
    } else {
    }
}