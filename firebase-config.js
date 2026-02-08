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

// ==========================================
// EXAMPLE (DO NOT USE - Replace with yours):
// ==========================================
// const firebaseConfig = {
//   apiKey: "AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ1234567",
//   authDomain: "capital-paradox-12345.firebaseapp.com",
//   databaseURL: "https://capital-paradox-12345.firebaseio.com",
//   projectId: "capital-paradox-12345",
//   storageBucket: "capital-paradox-12345.appspot.com",
//   messagingSenderId: "123456789012",
//   appId: "1:123456789012:web:abc123def456ghi789"
// };

// Initialize Firebase
let database;
try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
} catch (error) {
    console.error("Firebase initialization failed:", error);
    // Fallback for when Firebase is unavailable
    database = null;
}

// ==========================================
// IMPROVED ADMIN AUTHENTICATION
// For one-day event: Using better obfuscation + server validation
// ==========================================

// Admin password validation (server-side check recommended for production)
// For your one-day event, you can change this password before the event
const ADMIN_HASH = "ce3da03d8a1d8310d563ba5f6284f278a4b38d546911d94b0b72c53b3fcf9be3"; // SHA-256 hash of your password

// Optional server verification endpoint (recommended)
// Expected response: { ok: true } when password is valid
// Leave empty to use client-side hash only
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
// 2. Enter your desired admin password (e.g., "MySecretPass123")
// 3. Copy the SHA-256 hash
// 4. Replace the ADMIN_HASH value above with your hash
// 5. Remember your password - you'll need it to access admin.html
//
// Example: Password "FAZILBHAITHEBEST" -> Hash "e8d1f5a0c9b2d4f6a3e7b8c1d9f2e5a4"
// ==========================================
