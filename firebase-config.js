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
  apiKey: "AIzaSyA-jEcqHqL0NyYaRu1WwyBRmuxskj8IS-8",
  authDomain: "capital-paradox.firebaseapp.com",
  databaseURL: "https://capital-paradox-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "capital-paradox",
  storageBucket: "capital-paradox.firebasestorage.app",
  messagingSenderId: "1088881259421",
  appId: "1:1088881259421:web:75187fa72bbfcd7dc1f574",
  measurementId: "G-MNM9JZ1W14"
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
// EVENT DETAILS CONFIGURATION
// ==========================================

const EVENT_DETAILS = {
    // Event Date & Time
    date: "March 15, 2026",  // Change this to your actual event date
    time: "9:00 AM - 5:00 PM",  // Change this to your actual event time
    
    // Venue Information
    venue: {
        name: "Your College Name - Main Auditorium",  // Change this
        address: "Building Name, Street Address, City, State, PIN",  // Change this
        landmark: "Near Main Gate"  // Optional landmark
    },
    
    // Registration Details
    registration: {
        deadline: "March 10, 2026",  // Change this
        fee: "₹500 per team",  // Change this or set to "Free Entry"
        maxTeams: 50  // Maximum number of teams
    },
    
    // Prize Information
    prizes: {
        first: "₹10,000",  // Change this
        second: "₹5,000",  // Change this
        third: "₹2,500"  // Change this
    },
    
    // Contact Information
    contact: {
        email: "capitalparadox@yourcollege.edu",  // Change this
        phone: "+91 XXXXX XXXXX",  // Change this
        whatsapp: "https://chat.whatsapp.com/YOUR_GROUP_INVITE_LINK"  // Add your WhatsApp group link here
    },
    
    // Social Media (Optional)
    social: {
        instagram: "https://instagram.com/your_event_handle",  // Optional
        twitter: "https://twitter.com/your_event_handle",  // Optional
        linkedin: "https://linkedin.com/company/your_event"  // Optional
    }
};

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
        
        // Compatible with both rounds.html format (sessionId/lastHeartbeat) 
        // and auction.html format (clientId/lastSeen)
        const lastActivity = session.lastHeartbeat || session.lastSeen || 0;
        const timeSinceHeartbeat = Date.now() - lastActivity;
        
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
        // Prefer teamList as the single source of truth
        const teamListSnapshot = await database.ref('teamList').once('value');
        const teamList = teamListSnapshot.val();

        if (teamList) {
            if (Array.isArray(teamList)) {
                return teamList.includes(teamCode);
            }
            return teamList[teamCode] === true;
        }

        // Fallback to legacy validTeams if teamList is missing
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
// Default password: "admin123" (CHANGE THIS!)
// Current hash is for: "admin123"
const ADMIN_HASH = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9";

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
//
// SECURITY NOTE: The default password is "admin123"
// PLEASE CHANGE THIS IMMEDIATELY for production use!
// ==========================================

// ==========================================
// HELPER FUNCTIONS FOR EVENT DETAILS
// ==========================================

// Get WhatsApp group link
function getWhatsAppLink() {
    return EVENT_DETAILS.contact.whatsapp;
}

// Get formatted event date and time
function getEventDateTime() {
    return {
        date: EVENT_DETAILS.date,
        time: EVENT_DETAILS.time
    };
}

// Get venue information
function getVenueInfo() {
    return EVENT_DETAILS.venue;
}

// Get contact information
function getContactInfo() {
    return EVENT_DETAILS.contact;
}

// Get prize information
function getPrizeInfo() {
    return EVENT_DETAILS.prizes;
}

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
//   },
//   "teamStates": {
//     "round1": {
//       "ALPHA": "passed",
//       "BETA": "access"
//     },
//     "round2": {
//       "ALPHA": "passed",
//       "BETA": "revoked"
//     },
//     "round3": {
//       "ALPHA": "access",
//       "BETA": "revoked"
//     },
//     "round4": {
//       "ALPHA": "revoked",
//       "BETA": "revoked"
//     }
//   }
// }
//
// Or use array format for validTeams:
// "validTeams": ["ALPHA", "BETA", "GAMMA", "DELTA"]
//
// Team States can be:
// - "revoked": Team cannot access the round
// - "access": Team can access and view the round
// - "passed": Team has completed the round
// - "eliminated": Team has been eliminated from the competition
// ==========================================
