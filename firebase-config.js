// ==========================================
// FIREBASE CONFIGURATION
// ==========================================
// 
// INSTRUCTIONS:
// 1. Go to Firebase Console: https://console.firebase.google.com/
// 2. Click your project → Settings (gear icon) → Project settings
// 3. Scroll to "Your apps" → Click Web icon (</>)
// 4. Copy the firebaseConfig object
// 5. Replace the values below with YOUR values
//
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ1234567",
  authDomain: "capital-paradox-12345.firebaseapp.com",
  databaseURL: "https://capital-paradox-12345.firebaseio.com",
  projectId: "capital-paradox-12345",
  storageBucket: "capital-paradox-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456ghi789"
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

// Initialize Firebase (don't change this part)
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Admin code (encoded) - Don't change unless you want a different admin password
const _ADMIN_CODE = "TUhhUFNJT0hQW09MSUxaWw=="; // Decodes to: FAZILBHAITHEBEST

// Simple encoding functions
const _rot = (str, shift) => {
    return str.split('').map(char => {
        return String.fromCharCode(char.charCodeAt(0) + shift);
    }).join('');
};

const _decode = (str) => _rot(atob(str), -7);

// Helper to get admin code
function getAdminCode() {
    return _decode(_ADMIN_CODE);
}
