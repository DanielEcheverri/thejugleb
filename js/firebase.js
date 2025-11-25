import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js'
import { getDatabase, ref, set, onValue, off, update } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js'
// Import the auth functions you need
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js'

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDuRvVnlDRGlQoDcWg6SlXR9lr4Xlz1PX4",
    authDomain: "thejungle-33676.firebaseapp.com",
    databaseURL: "https://thejungle-33676-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "thejungle-33676",
    storageBucket: "sthejungle-33676.firebasestorage.app",
    messagingSenderId: "1078745256439",
    appId: "1:1078745256439:web:6bb68e64e3a526fb061ef2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
// Initialize Firebase Auth
const auth = getAuth(app);

// --- Store previous values ---
let prevLatitude = null;
let prevLongitude = null;
let prevCurrentCheckpoint = null;
let prevMovement = null;
let prevTagInteraction = null;
let prevHeading = null;
let prevStatus = null;
let prevSpeed = null;
let prevSpeaking = null
let prevPartMoving = null;
let prevDirectionMoving = null;
let prevBlueToothStatus = null;

// --- Database Functions ---
function writeToDatabase() {
    if (latitude && longitude && currentCheckpoint) { // globals from state.js
        if (latitude !== prevLatitude ||
            longitude !== prevLongitude ||
            currentCheckpoint !== prevCurrentCheckpoint ||
            patternMovement !== prevMovement ||
            tagID !== prevTagInteraction ||
            blueToothStatus !== prevStatus ||
            speaking !== prevSpeaking ||
            directionMoving !== prevDirectionMoving ||
            partMoving !== prevPartMoving ||
            speed !== prevSpeed ||
            blueToothStatus !== prevBlueToothStatus ||
            directionText !== prevHeading) {

            prevPartMoving = partMoving;
            prevDirectionMoving = directionMoving;
            prevLatitude = latitude;
            prevLongitude = longitude;
            prevCurrentCheckpoint = currentCheckpoint;
            prevMovement = patternMovement;
            prevTagInteraction = tagID;
            prevHeading = directionText;
            prevStatus = blueToothStatus;
            prevSpeed = speed;
            prevSpeaking = speaking;
            
            const databaseName = (deviceName === 'hachi_BT') ? 'hachi_data' : 'avatar_data';
            const latitudeVar = (deviceName === 'hachi_BT') ? 'hachi_latitude' : 'avatar_latitude';
            const longitudeVar = (deviceName === 'hachi_BT') ? 'hachi_longitude' : 'avatar_longitude';
            const headingVar = (deviceName === 'hachi_BT') ? 'hachi_heading' : 'avatar_heading';
            const checkpointVar = (deviceName === 'hachi_BT') ? 'hachi_checkpoint' : 'avatar_checkpoint';
            const checkDistVar = (deviceName === 'hachi_BT') ? 'hachi_checkpoint_dist' : 'avatar_checkpoint_dist';
            const movementVar = (deviceName === 'hachi_BT') ? 'hachi_movement' : 'avatar_movement';
            const partMovementVar = (deviceName === 'hachi_BT') ? 'hachi_part_mov' : 'avatar_part_mov';
            const dirMovementVar = (deviceName === 'hachi_BT') ? 'hachi_part_dir' : 'avatar_part_dir';
            const tagInteractionVar = (deviceName === 'hachi_BT') ? 'hachi_tag' : 'avatar_tag';
            const statusVar = (deviceName === 'hachi_BT') ? 'hachi_status' : 'avatar_status';
            const speedVar = (deviceName === 'hachi_BT') ? 'hachi_speed' : 'avatar_speed';
            const speakingVar = (deviceName === 'hachi_BT') ? 'hachi_narrating' : 'avatar_narrating';
            const currentPsgVar = (deviceName === 'hachi_BT') ? 'hachi_current_passage' : 'avatar_current_passage';
            const nameVar = (deviceName === 'hachi_BT') ? 'story_name' : 'story_name';

            update(ref(database, databaseName), {
                [latitudeVar]: latitude,
                [longitudeVar]: longitude,
                [headingVar]: directionText,
                [checkpointVar]: currentCheckpoint,
                [checkDistVar]: chkPointDistance,
                [movementVar]: patternMovement,
                [nameVar]: characterName,
                [partMovementVar]: partMoving,
                [dirMovementVar]: directionMoving,
                [tagInteractionVar]: tagID,
                [statusVar]: blueToothStatus,
                [speedVar]: speed.toFixed(2),
                [speakingVar]: messageID + speaking,
                [currentPsgVar]: messageID
            }).catch((error) => {
                console.error("Error writing variables to the database:", error);
            });
        }
    }
}

var other_latitude = null;
var other_longitude = null;
let previousPassage = '';
let previousTagID_fb = ''; // Renamed to avoid conflict with global previousTagID

function readFromDatabase(deviceName) {
    const otherDatabaseName = (deviceName === 'hachi_BT') ? 'avatar_data' : 'hachi_data';
    const otherLatitudeVar = (deviceName === 'hachi_BT') ? 'avatar_latitude' : 'hachi_latitude';
    const otherLongitudeVar = (deviceName === 'hachi_BT') ? 'avatar_longitude' : 'hachi_longitude';
    const databaseName = (deviceName === 'hachi_BT') ? 'hachi_data' : 'avatar_data';
    const myPassage = (deviceName === 'hachi_BT') ? 'hachi_passage' : 'avatar_passage';
    const myStreet = (deviceName === 'hachi_BT') ? 'hachi_street' : 'avatar_street';
    const myTag = (deviceName === 'hachi_BT') ? 'hachi_tag' : 'avatar_tag';
    const myAzure = (deviceName === 'hachi_BT') ? 'hachi_tts' : 'avatar_tts';

    //this looks at the data of opposite character to measure distance
    onValue(ref(database, otherDatabaseName), (snapshot) => { 
        const otherData = snapshot.val();
        if (otherData) {
            other_latitude = otherData[otherLatitudeVar];
            other_longitude = otherData[otherLongitudeVar];
            distEachOther = calculateDistance(latitude, longitude, other_latitude, other_longitude); // from location.js
        } else {
            console.log("No data found in the other database.");
        }
    });

    onValue(ref(database, databaseName), (snapshot) => {
        const myData = snapshot.val();
        if (myData) {
            const passage = myData[myPassage];
            if (passage !== previousPassage) {
                displayText(String(passage)); // from main.js
                previousPassage = passage;
            }
            streetName = myData[myStreet]; // global
            const tag = myData[myTag];
            if (listenClient) { // global
                if (tag !== previousTagID_fb) {
                    if (tag === 14) {
                        speakFancy = false; // global
                        displayText("Using Coqui's Voice.");
                        console.log("Coqui TTS in listening mode");
                    } else if (tag === 15) {
                        speakFancy = true; // global
                        displayText("Using Azure's Voice.");
                        console.log("Azure TTS in listening mode");
                    }
                    previousTagID_fb = tag;
                }
            }
            azureKey = myData[myAzure]; //global
        } else {
            console.log("No data found in the own database.");
        }
    });
}

// --- UI Functions ---
// function toggleDeviceName2() {
//     var checkbox = document.getElementById("hachiCheckbox");
//     const databaseName = (deviceName === 'hachi_BT') ? 'avatar_data' : 'hachi_data';
//     if (checkbox.checked) {
//         off(ref(database, databaseName));
//         readFromDatabase(deviceName);
//     } else {
//         off(ref(database, databaseName));
//         readFromDatabase(deviceName);
//     }
// }

let hideTimeout;

function toggleListening() {
    const toggleSwitch = document.getElementById('toggleSwitch');
    deviceName = toggleSwitch.checked ? "hachi_BT" : "avatar_BT"; // global
    const databaseName = deviceName === 'hachi_BT' ? 'avatar_data' : 'hachi_data';
    const deviceToCharacter = { 'hachi_BT': 'Bageera', 'avatar_BT': 'Baloo' };
    const charName = deviceToCharacter[deviceName] || 'Unknown'; // Use local var
    let toggleState = toggleSwitch.checked;
    
    toggleSwitch.addEventListener('change', () => {
        toggleState = toggleSwitch.checked;
    });

    if (hideTimeout) {
        clearTimeout(hideTimeout);
    }

    hideTimeout = setTimeout(() => {
        const topSection = document.querySelector('.top-section');
        if (topSection) {
            off(ref(database, databaseName));
            readFromDatabase(deviceName);
            interactionMode = "_lst"; // global
            topSection.style.display = 'none';
            document.getElementById('currentLocation').style.display = 'none';
            document.getElementById('hachiCheckboxContainer').style.display = 'none';

            const avatarCanvas = document.getElementById('avatarCanvas');
            if (avatarCanvas) {
                const avatarBTdiv = document.getElementById('avatarBTdiv');
                if (avatarBTdiv) {
                    avatarBTdiv.remove();
                }
                avatarCanvas.innerHTML = `
                    <div class="center-wrapper">
                        <span class="material-symbols-outlined hearing-icon">hearing</span>
                        <span id="loading-text"> Listening ${charName}'s Story</span>
                    </div>
                `;
                const hearingIcon = document.querySelector('.hearing-icon');
                if (hearingIcon) {
                    hearingIcon.style.color = toggleState ? '#ffffffff' : '#ffffffff';
                }
            }
            displayText("Listening as " + charName + "."); // from main.js
            console.log("Listening as: " + deviceName + ".");
            window[charName + "_Sound"].play();
            //bgm_Sound.play(); // from audio.js
        }
    }, 5000);
}


// --- Application Start ---

function startApp() {
    console.log("Firebase user signed in anonymously.");
    
    let hasRun = false;
    setInterval(() => {
        if (listenClient === false) { // global
            writeToDatabase();
        }
        if (isConnected === true && listenClient === false && !hasRun) { // global
            readFromDatabase(deviceName);
            hasRun = true;
        }
    }, 200);
    
    // var listenHachi = document.getElementById("hachiCheckbox");
    // if (listenHachi) {
    //     listenHachi.addEventListener('click', function () {
    //         toggleDeviceName2();
    //     });
    // } else {
    //     console.error("Could not find element 'hachiCheckbox'");
    // }

    var listenCheckbox = document.getElementById("toggleSwitch");
    if (listenCheckbox) {
        listenCheckbox.addEventListener('click', function () {
            toggleListening();
        });
    } else {
        console.error("Could not find element 'toggleSwitch'");
    }
}

// --- Authentication ---
// Call signInAnonymously and start the app logic only on success
signInAnonymously(auth)
    .then(() => {
        // User is signed in.
        startApp(); // Run the main part of your application
    })
    .catch((error) => {
        console.error("Anonymous sign-in failed:", error);
        // Handle the error (e.g., show a message to the user)
    });
