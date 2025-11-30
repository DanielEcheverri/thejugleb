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

async function sendData() {
    if (window.backText === lastBackText) {
        return;
    }
    
    if (isConnected && characteristic && window.backText != "") {
        const textToSend = window.backText; 
        const formattedMessage = "TXT:" + textToSend;
        const encoder = new TextEncoder();
        const dataToSend = encoder.encode(formattedMessage + '\n');
		console.log(dataToSend);

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