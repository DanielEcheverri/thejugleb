async function readTag() {
	try {
		if (tagID === previousTagID || tagID === 0 || speaking) {
			return;
		} else {
			const tagInfo = await fetchJSONFile(tagSource, cachedTagInfo); // from main.js

			if (tagInfo && tagInfo.tags.hasOwnProperty(tagID)) {
				previousTagID = tagID;
				window.success_Sound.play();
				console.log("--Tag read: " +tagID);

				const tagData = tagInfo.tags[tagID];

				if (tagInfo.tags[tagID].function) {
					eval(tagInfo.tags[tagID].function);
				}
				if (tagData.variable && typeof tagData.boolean === 'boolean') {
					window[tagData.variable] = tagData.boolean;
				}
				displayText(tagData.displayText); // from main.js

			} else {
				window.alert_Sound.play();
				console.error('Tag ' + tagID + ' information not found.');
				return;
			}
		}
	} catch (err) {
		//console.error('Error reading tag', err);
	}
}