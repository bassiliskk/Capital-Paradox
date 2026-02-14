// ==========================================
// FIREBASE CONFIGURATION
// ==========================================
// 
// INSTRUCTIONS:
// 1. Go to Firebase Console: https://console.firebase.google.com/
// 2. Click your project -> Settings (gear icon) -> Project settings
// 3. Scroll to "Your apps" -> Click Web icon (</>)
// 4. Copy the firebaseConfig object
// 5. Replace the values below with YOUR values
//
// ==========================================

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "capital-paradox.firebaseapp.com",
  databaseURL: "https://capital-paradox-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "capital-paradox",
  storageBucket: "capital-paradox.appspot.com",
  messagingSenderId: "YOUR_NUMBER",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
let database;
try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
} catch (error) {
    console.error("Firebase initialization failed:", error);
    database = null;
}

// ==========================================
// SESSION MANAGEMENT UTILITIES
// ==========================================

// Generate unique session ID
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Session heartbeat interval (30 seconds)
const HEARTBEAT_INTERVAL = 30000;
// Session timeout (2 minutes without heartbeat)
const SESSION_TIMEOUT = 120000;

let heartbeatTimer = null;

// Start session heartbeat
function startHeartbeat(teamCode, sessionId) {
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
    }
    
    heartbeatTimer = setInterval(() => {
        if (!database) return;
        
        database.ref(`activeSessions/${teamCode}`).update({
            lastHeartbeat: Date.now()
        }).catch(err => {
            console.error("Heartbeat failed:", err);
        });
    }, HEARTBEAT_INTERVAL);
}

// Stop session heartbeat
function stopHeartbeat() {
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
    }
}

// Create active session in Firebase
async function createActiveSession(teamCode, sessionId) {
    if (!database) return false;
    
    try {
        await database.ref(`activeSessions/${teamCode}`).set({
            sessionId: sessionId,
            timestamp: Date.now(),
            lastHeartbeat: Date.now()
        });
        return true;
    } catch (error) {
        console.error("Failed to create session:", error);
        return false;
    }
}

// Check if team already has an active session
async function checkActiveSession(teamCode) {
    if (!database) return null;
    
    try {
        const snapshot = await database.ref(`activeSessions/${teamCode}`).once('value');
        const session = snapshot.val();
        
        if (!session) return null;
        
        // Check if session has timed out
        const timeSinceHeartbeat = Date.now() - session.lastHeartbeat;
        if (timeSinceHeartbeat > SESSION_TIMEOUT) {
            // Session expired, remove it
            await database.ref(`activeSessions/${teamCode}`).remove();
            return null;
        }
        
        return session;
    } catch (error) {
        console.error("Failed to check active session:", error);
        return null;
    }
}

// Remove active session
async function removeActiveSession(teamCode) {
    if (!database) return;
    
    stopHeartbeat();
    
    try {
        await database.ref(`activeSessions/${teamCode}`).remove();
    } catch (error) {
        console.error("Failed to remove session:", error);
    }
}

// Validate that current session is still the active one
async function validateCurrentSession(teamCode, sessionId) {
    if (!database) return false;
    
    try {
        const snapshot = await database.ref(`activeSessions/${teamCode}`).once('value');
        const session = snapshot.val();
        
        if (!session) return false;
        
        return session.sessionId === sessionId;
    } catch (error) {
        console.error("Failed to validate session:", error);
        return false;
    }
}

// Check if team code exists in valid teams list
async function isValidTeamCode(teamCode) {
    if (!database) return true; // Fallback to allow login if Firebase is down
    
    try {
        const snapshot = await database.ref('validTeams').once('value');
        const validTeams = snapshot.val();
        
        if (!validTeams) return true; // If no list exists, allow any team
        
        // validTeams can be an array or object with team codes as keys
        if (Array.isArray(validTeams)) {
            return validTeams.includes(teamCode);
        } else {
            return validTeams[teamCode] === true;
        }
    } catch (error) {
        console.error("Failed to check valid teams:", error);
        return true; // Fallback to allow login if check fails
    }
}

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

// Admin password validation (SHA-256 hash)
const ADMIN_HASH = "ce3da03d8a1d8310d563ba5f6284f278a4b38d546911d94b0b72c53b3fcf9be3";

// Optional server verification endpoint
const ADMIN_VERIFY_URL = "";

// Simple hash function for client-side validation
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Validate admin access
async function validateAdminAccess(enteredPassword) {
    if (ADMIN_VERIFY_URL) {
        try {
            const response = await fetch(ADMIN_VERIFY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: enteredPassword })
            });
            if (response.ok) {
                const data = await response.json();
                return data && data.ok === true;
            }
        } catch (error) {
            console.error("Admin server verification failed:", error);
        }
        return false;
    }
    const hash = await hashPassword(enteredPassword);
    return hash === ADMIN_HASH;
}

// ==========================================
// INSTRUCTIONS TO SET YOUR ADMIN PASSWORD:
// ==========================================
// 1. Go to: https://emn178.github.io/online-tools/sha256.html
// 2. Enter your desired admin password
// 3. Copy the SHA-256 hash
// 4. Replace the ADMIN_HASH value above with your hash
// 5. Remember your password - you'll need it to access admin.html
// ==========================================

// ==========================================
// FIREBASE DATA STRUCTURE FOR SESSION LOCKING:
// ==========================================
// Add this to your Firebase Realtime Database:
//
// {
//   "activeSessions": {
//     "ALPHA": {
//       "sessionId": "session_1234567890_abc123",
//       "timestamp": 1234567890000,
//       "lastHeartbeat": 1234567890000
//     }
//   },
//   "validTeams": {
//     "ALPHA": true,
//     "BETA": true,
//     "GAMMA": true,
//     "DELTA": true
//   }
// }
//
// Or use array format for validTeams:
// "validTeams": ["ALPHA", "BETA", "GAMMA", "DELTA"]
// ==========================================
