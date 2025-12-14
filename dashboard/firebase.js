(function () {
	"use strict";

	$(document).on(":liveupdate", function () {
		$(".macro-live").trigger(":liveupdateinternal");
	});

	Macro.add(['update', 'upd'], {
		handler: function handler() {
			$(document).trigger(":liveupdate");
		}
	});

	Macro.add(['live', 'l', 'lh'], {
		skipArgs: true,
		handler: function handler() {
			if (this.args.full.length === 0) {
				return this.error('no expression specified');
			}
			try {
				var statement = this.args.full;
				var result = toStringOrDefault(Scripting.evalJavaScript(statement), null);
				if (result !== null) {
					var lh = this.name === "lh";
					var $el = $("<span></span>").addClass("macro-live").wiki(lh ? Util.escape(result) : result).appendTo(this.output);
					$el.on(":liveupdateinternal", this.createShadowWrapper(function (ev) {
						var out = toStringOrDefault(Scripting.evalJavaScript(statement), null);
						$el.empty().wiki(lh ? Util.escape(out) : out);
					}));
				}
			} catch (ex) {
				return this.error("bad evaluation: " + (_typeof(ex) === 'object' ? ex.message : ex));
			}
		}
	});

	Macro.add(['liveblock', 'lb'], {
		tags: null,
		handler: function handler() {
			try {
				var content = this.payload[0].contents.trim();
				if (content) {
					var $el = $("<span></span>").addClass("macro-live macro-live-block").wiki(content).appendTo(this.output);
					$el.on(":liveupdateinternal", this.createShadowWrapper(function (ev) {
						$el.empty().wiki(content);
					}));
				}
			} catch (ex) {
				return this.error("bad evaluation: " + (_typeof(ex) === 'object' ? ex.message : ex));
			}
		}
	});
})();

setup.aScriptImport = importScripts([
  "https://www.gstatic.com/firebasejs/12.6.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth-compat.js",
  "https://www.gstatic.com/firebasejs/12.6.0/firebase-database-compat.js"
]);


setup.aScriptImport
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
  const app =firebase.initializeApp(firebaseConfig);  
  const auth = firebase.auth(app);
  const database = firebase.database(app);
  
  auth.onAuthStateChanged(function(user) {
    if (user) {
      window.firebaseUID = user.uid;
      console.log("Firebase signed in anonymously:", user.uid);
    } else {
      auth.signInAnonymously().catch(console.error);
    }
  });
  
  const avatarDatabase = 'avatar_data/';
  const hachiDatabase = 'hachi_data/';
  
  var avatarRef = firebase.database().ref(avatarDatabase);
  avatarRef.on('value', (snapshot) => {
    const avatarData = snapshot.val();
    for (let nodeName in avatarData) {
      if (avatarData.hasOwnProperty(nodeName)) {
        window[nodeName] = avatarData[nodeName];
      }
    } 
  });

  var hachiRef = firebase.database().ref(hachiDatabase);
  hachiRef.on('value', (snapshot) => {
    const hachiData = snapshot.val();
    for (let nodeName in hachiData) {
      if (hachiData.hasOwnProperty(nodeName)) {
        window[nodeName] = hachiData[nodeName];
      }
    }
  });

function stopAllAvatarListeners() {
  avatarRef.off();
  console.log("All listeners on avatarRef stopped.");
}
  
window.stopAllAvatarListeners = stopAllAvatarListeners;