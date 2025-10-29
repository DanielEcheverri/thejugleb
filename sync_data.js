<script defer src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.9.0/firebase-database-compat.js"></script>
<script>
// Your Firebase configuration
const firebaseConfig = {
	apiKey: "AIzaSyDWeHUOXcHSp01pLYXY8HQm-l8e7ldqeRA",
	authDomain: "searchingforus.firebaseapp.com",
	databaseURL: "https://searchingforus-default-rtdb.europe-west1.firebasedatabase.app",
	projectId: "searchingforus",
	storageBucket: "searchingforus.appspot.com",
	messagingSenderId: "1074186074798",
	appId: "1:1074186074798:web:316b5662099ab3b0e48b3f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Reference to your Firebase Realtime Database
const database = getDatabase(app);

// Function to write data to the database
function writeToDatabase() {
	// Check if variables are not null or empty
	if (latitude && longitude && currentCheckpoint) {
		// Determine the database name based on the deviceName
		const databaseName = deviceName === "hachi_BT" ? "avatar_data" : "hachi_data";

		// Determine the variable names based on the deviceName
		const latitudeVar = deviceName === "hachi_BT" ? "avatar_latitude" : "hachi_latitude";
		const longitudeVar = deviceName === "hachi_BT" ? "avatar_longitude" : "hachi_longitude";
		const checkpointVar = deviceName === "hachi_BT" ? "avatar_checkpoint" : "hachi_checkpoint";

		// Write variables to the database
		set(ref(database, databaseName), {
			[latitudeVar]: latitude,
			[longitudeVar]: longitude,
			[checkpointVar]: currentCheckpoint,
		})
			.then(() => {
				console.log("Variables written to the database successfully!");
			})
			.catch((error) => {
				console.error("Error writing variables to the database:", error);
			});
	} else {
		console.log("One or more variables are null or empty. Data not written to the database.");
	}
}

// Function to read data from the database
function readFromDatabase(deviceName) {
	// Read from the other database based on deviceName
	const otherDatabaseName = deviceName === "hachi_BT" ? "hachi_data" : "avatar_data";
	const otherLatitudeVar = deviceName === "hachi_BT" ? "hachi_latitude" : "avatar_latitude";
	const otherLongitudeVar = deviceName === "hachi_BT" ? "hachi_longitude" : "avatar_longitude";
	const otherCheckpointVar = deviceName === "hachi_BT" ? "hachi_checkpoint" : "avatar_checkpoint";

	// Get variables from the other database
	get(ref(database, otherDatabaseName))
		.then((snapshot) => {
			const otherData = snapshot.val();
			if (otherData) {
				other_latitude = otherData[otherLatitudeVar];
				other_longitude = otherData[otherLongitudeVar];
				other_checkpoint = otherData[otherCheckpointVar];
				console.log("Variables read from the other database successfully!");
				console.log("other_latitude:", other_latitude);
				console.log("other_longitude:", other_longitude);
				console.log("other_checkpoint:", other_checkpoint);
			} else {
				console.log("No data found in the other database.");
			}
		})
		.catch((error) => {
			console.error("Error reading variables from the other database:", error);
		});
}

// Call the function to write variables to the database every 2 seconds
setInterval(writeToDatabase, 2000);
setInterval(readFromDatabase, 2000);
</script>