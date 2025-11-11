// js/state.js

// Bluetooth / Device State
let characteristic;
let isConnected = false;
let device;
let blueToothStatus = "Offline";
let deviceName = "Unknown";
let labels = ["EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY"];
let characterName = "";

// Movement State
let partMoving = "none";
let directionMoving = "none";
let patternMovement = "none";
let startDetectMovement = false;
let movementBuffer = [];
let cachedMovementConditions = null;
let cachedMovePatterns = null;
let movementResetTimer = null;

// Location State
var latitude;
var longitude;
let speed;
var distEachOther = 0;
let directionText = "Not moving";
var streetName = "Unknown";
let weatherDescription = null;
let cachedCheckpoints;
let lastCheckedIndex = 0;
let currentCheckpoint = "none";
let chkPointDistance = [0];
let previousCheckpointKey = null;
let previousChkPointDistance = null;
let previousCheckpoint = null;

// Audio State
var connecting_Sound;
var bgm_Sound;
let currentSound = null;
let speaking = false;

// Messaging State
var message;
let timeoutID;
var previousMessage = "";
var fullMessage;
var messageID = "";
var oldMessageID = "";
var messageID_tmp = "";
var playAction = false;
let lastSpokenMessage = '';

// Session / User State
let sessionId = '';
let user_ip;
let listenClient = null;

// Config State
let moveSource = null;
let movePatterns = null;
let sentenceSource = null;
let tagSource = 'data/tags.json';
let checkpointsSource = 'data/points.json';
let interactionMode = "_load";
var noNarrative = true;
var speakFancy = false;

// Tag State
let tagID = 0;
var previousTagID = 0;
let cachedTagInfo;

// Sentence State
let cachedSentences;