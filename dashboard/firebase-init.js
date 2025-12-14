(function(global) {
    // --- Script Imports (These must run first) ---
    // Note: 'importScripts' is a Twine/SugarCube/Harlowe-specific function for script loading.
    // If you are using a standard Twine setup that supports 'importScripts' as a global 
    // function, this will work. Otherwise, you must use the document.createElement('script') 
    // method for all five files, ensuring proper sequential loading for dependencies.

    // ASSUMPTION: 'importScripts' is a function provided by your Twine format's environment.
    global.aScriptImport = importScripts([
        "https://www.gstatic.com/firebasejs/12.6.0/firebase-app-compat.js",
        "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth-compat.js",
        "https://www.gstatic.com/firebasejs/12.6.0/firebase-database-compat.js",
        "https://danielecheverri.github.io/thejugleb/dashboard/utils.js",
        "https://danielecheverri.github.io/thejugleb/dashboard/fetchServices.js"
    ]);

    // --- Initialization Logic ---
    global.aScriptImport
        .then(function () {
            console.log('Starting Firebase');
            const firebaseConfig = {
                apiKey: "AIzaSyDuRvVnlDRGlQoDcWg6SlXR9lr4Xlz1PX4",
                authDomain: "thejungle-33676.firebaseapp.com",
                databaseURL: "https://thejungle-33676-default-rtdb.europe-west1.firebasedatabase.app",
                projectId: "thejungle-33676",
                storageBucket: "thejungle-33676.firebasestorage.app",
                messagingSenderId: "1078745256439",
                appId: "1:1078745256439:web:6bb68e64e3a526fb061ef2"
            };

            // Initialize Firebase
            const app = firebase.initializeApp(firebaseConfig);
            const auth = firebase.auth(app);
            const database = firebase.database(app);

            // Database paths (made local to this function's scope)
            const avatarDatabase = 'avatar_data/';
            const hachiDatabase = 'hachi_data/';

            // --- Authentication Setup ---
            auth.onAuthStateChanged(function(user) {
                if (user) {
                    global.firebaseUID = user.uid; // Set UID on window
                    console.log("Firebase signed in anonymously:", user.uid);
                } else {
                    auth.signInAnonymously().catch(console.error);
                }
            });

            // --- Database Listeners ---
            const avatarRef = firebase.database().ref(avatarDatabase);
            avatarRef.on('value', (snapshot) => {
                const avatarData = snapshot.val();
                for (let nodeName in avatarData) {
                    if (avatarData.hasOwnProperty(nodeName)) {
                        global[nodeName] = avatarData[nodeName]; // Assign data nodes to window
                    }
                }
            });

            const hachiRef = firebase.database().ref(hachiDatabase);
            hachiRef.on('value', (snapshot) => {
                const hachiData = snapshot.val();
                for (let nodeName in hachiData) {
                    if (hachiData.hasOwnProperty(nodeName)) {
                        global[nodeName] = hachiData[nodeName]; // Assign data nodes to window
                    }
                }
            });

            // --- Helper Functions (Made local, then exposed) ---

            // 1. Function to stop all listeners
            function stopAllAvatarListeners() {
                avatarRef.off();
                console.log("All listeners on avatarRef stopped.");
            }
            global.stopAllAvatarListeners = stopAllAvatarListeners; // Expose to window

            // 2. Function to write data to avatar node
            global.writeToAvatar = function(databaseNode, avatarData) {
                const ref = firebase.database().ref(avatarDatabase + databaseNode);
                return ref.set(avatarData)
                    .then(() => {
                        console.log("Successfully updated " + avatarData + " in " + avatarDatabase + " node " + databaseNode);
                    })
                    .catch(error => {
                        console.error("Error updating data:", error);
                        throw error;
                    });
            }

            // 3. Function to write data to hachi node
            global.writeToHachi = function(databaseNode, hachiData) {
                const ref = firebase.database().ref(hachiDatabase + databaseNode);
                return ref.set(hachiData)
                    .then(() => {
                        console.log("Successfully updated " + hachiData + " in " + hachiDatabase + " node " + databaseNode);
                    })
                    .catch(error => {
                        console.error("Error updating data:", error);
                        throw error;
                    });
            }
        });
})(window);