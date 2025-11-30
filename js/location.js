// js/location.js

function getCurrentLocation() {
	if (navigator.geolocation) {
		const options = { enableHighAccuracy: true };
		let previousPosition = null;
		let totalDistance = 0;
		navigator.geolocation.watchPosition(
			function (position) {
				latitude = position.coords.latitude.toFixed(6);
				longitude = position.coords.longitude.toFixed(6);
				const speedThreshold = 0.2;
				speed = position.coords.speed || 0;

				if (speed < speedThreshold) {
					totalDistance = 0;
				} else if (previousPosition) {
					const distance = calculateDistance(
						previousPosition.coords.latitude,
						previousPosition.coords.longitude,
						position.coords.latitude,
						position.coords.longitude
					);
					totalDistance += distance;
				}
				previousPosition = position;
				let heading = position.coords.heading || 0;

				if (speed >= speedThreshold) {
					if (heading >= 337.5 || heading < 22.5) { directionText = "north"; }
					else if (heading >= 22.5 && heading < 67.5) { directionText = "northeast"; }
					else if (heading >= 67.5 && heading < 112.5) { directionText = "east"; }
					else if (heading >= 112.5 && heading < 157.5) { directionText = "southeast"; }
					else if (heading >= 157.5 && heading < 202.5) { directionText = "south"; }
					else if (heading >= 202.5 && heading < 247.5) { directionText = "southwest"; }
					else if (heading >= 247.5 && heading < 292.5) { directionText = "west"; }
					else if (heading >= 292.5 && heading < 337.5) { directionText = "northwest"; }
				} else {
					directionText = "somewhere";
				}

				if (blueToothStatus == "Online") {
					checkCheckpoints();
				}

				// Update the HTML element
				document.getElementById("currentLocation").innerHTML =
					"<strong><span class='material-icons' style='vertical-align: middle;'>bluetooth</span> Bluetooth:</strong> " + blueToothStatus + "<br>" +
					" <strong><span class='material-icons' style='vertical-align: middle;'>place</span> Latitude:</strong> " + latitude +
					"<strong> Longitude:</strong> " + longitude + "<br>" +
					"<strong><span class='material-icons' style='vertical-align: middle;'>location_city</span> Nearest street:</strong> " + streetName +
					" <strong><span class='material-icons' style='vertical-align: middle;'>pets</span><span class='material-icons' style='vertical-align: middle;'>person</span> Separation :</strong> " + distEachOther.toFixed(2) + " m" + "<br>" +
					" <strong><span class='material-icons' style='vertical-align: middle;'>explore</span> Direction:</strong> " + directionText +
					" <strong><span class='material-icons' style='vertical-align: middle;'>speed</span> Speed:</strong> " + speed.toFixed(2) + "ms/s" + "<br>" +
					" <strong><span class='material-icons' style='vertical-align: middle;'>directions_walk</span> Distance Walked: </strong> " + totalDistance.toFixed(2) +
					" m <strong>Avatar Actions:</strong> " + partMoving + " " + directionMoving;
			},
			function (error) {
				console.error("Error getting current location: ", error);
			},
			options
		);
	} else {
		console.error("Geolocation is not supported by this browser.");
	}
}

function calculateDistance(lat1, lon1, lat2, lon2) {
	const earthRadius = 6371e3; // Earth radius in meters
	const phi1 = (lat1 * Math.PI) / 180;
	const phi2 = (lat2 * Math.PI) / 180;
	const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
	const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const distance = earthRadius * c;
	return distance;
}

// async function readTag() {
// 	try {
// 		if (tagID === previousTagID || tagID === 0 || speaking) {
// 			return;
// 		} else {
// 			const tagInfo = await fetchJSONFile(tagSource, cachedTagInfo); // from main.js

// 			if (tagInfo && tagInfo.tags.hasOwnProperty(tagID)) {
// 				previousTagID = tagID;
// 				window.success_Sound.play();
// 				console.log("--Tag read: " +tagID);

// 				const tagData = tagInfo.tags[tagID];

// 				if (tagInfo.tags[tagID].function) {
// 					eval(tagInfo.tags[tagID].function);
// 				}
// 				if (tagData.variable && typeof tagData.boolean === 'boolean') {
// 					window[tagData.variable] = tagData.boolean;
// 				}
// 				displayText(tagData.displayText); // from main.js

// 			} else {
// 				window.alert_Sound.play();
// 				console.error('Tag ' + tagID + ' information not found.');
// 				return;
// 			}
// 		}
// 	} catch (err) {
// 		console.error('Error reading tag', err);
// 	}
// }

async function checkCheckpoints() {
	const radius = 12; // 12 meters radius
	let checkpointsKey = deviceName === "hachi_BT" ? "hachi_checkpoints" : "avatar_checkpoints";

	const locations = await fetchJSONFile(checkpointsSource, cachedCheckpoints); // from main.js

	if (Array.isArray(locations) && locations.length > 0) {
		const checkpoints = locations[0][checkpointsKey];

		if (typeof checkpoints === 'object' && checkpoints !== null) {
			const checkpointKeys = Object.keys(checkpoints);

			if (lastCheckedIndex < checkpointKeys.length) {
				const currentCheckpointKey = checkpointKeys[lastCheckedIndex];
				const checkpointSet = checkpoints[currentCheckpointKey];
				chkPointDistance = [];

				for (const checkpoint of checkpointSet) {
					const distance = calculateDistance(latitude, longitude, checkpoint.latitude, checkpoint.longitude);
					chkPointDistance.push(distance.toFixed(2));

					if (distance <= radius && checkpoint.text !== previousCheckpoint) {
						console.log('Checkpoint reached:', checkpoint.text);
						currentCheckpoint = checkpoint.text;
						window.success_Sound.play();
						lastCheckedIndex++;
						previousCheckpoint = checkpoint.text;
						chkPointDistance = [];
						return;
					}
				}

				const isCheckpointKeyChanged = previousCheckpointKey !== currentCheckpointKey;
				const isChkPointDistanceChanged = JSON.stringify(previousChkPointDistance) !== JSON.stringify(chkPointDistance);

				if ((isCheckpointKeyChanged || isChkPointDistanceChanged) && !listenClient && interactionMode !== "_load") {
					previousCheckpointKey = currentCheckpointKey;
					previousChkPointDistance = JSON.parse(JSON.stringify(chkPointDistance));
				}
			}
		}
	}
}