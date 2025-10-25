// TODO: Replace with your actual config object from Firebase console
// Correct initialization

const firebaseConfig = {
  apiKey: "AIzaSyCQj0p20mqV4jSsSzBpjIy0IrdU4s9sg7s",
  authDomain: "authentication-25cfa.firebaseapp.com",
  projectId: "authentication-25cfa",
  storageBucket: "authentication-25cfa.firebasestorage.app",
  messagingSenderId: "645752213769",
  appId: "1:645752213769:web:2bc01cace98e4b8c2e43d8",
  measurementId: "G-VKRYXEEQS7"
};


// Initialize Firebase (Ensure SDKs are loaded before this script runs)
let app, auth, db;
try {
  // Use firebase.initializeApp, etc. directly as SDKs are loaded globally
  app = firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore(); // Initialize Firestore
  console.log("Firebase initialized successfully.");
} catch (error) {
  console.error("Error initializing Firebase:", error);
  alert("Could not connect to Firebase. Please check the console.");
}


document.addEventListener('DOMContentLoaded', () => {

  // --- View Elements ---
  const loginView = document.getElementById('login-view');
  const signupView = document.getElementById('signup-view');

  // --- Toggle Links ---
  const showSignupLink = document.getElementById('show-signup-link');
  const showLoginLink = document.getElementById('show-login-link');

  // --- Login Form Elements ---
  const loginForm = document.getElementById('login-form');
  const loginEmailInput = document.getElementById('login-email-input');
  const loginPasswordInput = document.getElementById('login-password-input');

  // --- Signup Form Elements ---
  const signupForm = document.getElementById('signup-form');
  const signupNameInput = document.getElementById('signup-name-input');
  const signupEmailInput = document.getElementById('signup-email-input');
  const signupPasswordInput = document.getElementById('signup-password-input');
  const signupConfirmPasswordInput = document.getElementById('signup-confirm-password-input');

  // --- Functions to Toggle Views ---
  function showLogin() {
    loginView.style.display = 'block';
    signupView.style.display = 'none';
  }

  function showSignup() {
    loginView.style.display = 'none';
    signupView.style.display = 'block';
  }

  // --- Event Listeners for Toggling ---
  if (showSignupLink) { showSignupLink.addEventListener('click', (e) => { e.preventDefault(); showSignup(); }); }
  if (showLoginLink) { showLoginLink.addEventListener('click', (e) => { e.preventDefault(); showLogin(); }); }

  // --- Login Form Submission ---
  // Ensure Firebase Auth is initialized before adding listener
  if (loginForm && auth) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = loginEmailInput.value.trim();
      const password = loginPasswordInput.value; // Don't trim passwords

      if (email === '') { alert('⚠️ Please enter your email.'); loginEmailInput.focus(); return; }
      if (password === '') { alert('⚠️ Please enter your password.'); loginPasswordInput.focus(); return; }

      // --- Firebase Login ---
      auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          // Signed in
          const user = userCredential.user;
          console.log('Login successful:', user.uid, user.email);
          alert(` Login successful!\nWelcome back, ${user.email}`);
          // **TODO: Redirect to dashboard or main app page**
          // window.location.href = '/dashboard.html';
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.error("Login Error:", errorCode, errorMessage);
          alert(` Login Failed: ${errorMessage}`);
        });
    });
  } else { if (!loginForm) console.error("Login form element not found."); }

  // --- Signup Form Submission ---
  // Ensure Firebase Auth & Firestore are initialized
  if (signupForm && auth && db) {
      signupForm.addEventListener('submit', (event) => {
          event.preventDefault();
          const name = signupNameInput.value.trim();
          const email = signupEmailInput.value.trim();
          const password = signupPasswordInput.value;
          const confirmPassword = signupConfirmPasswordInput.value;

          // Basic Validation
          if (name === '') { alert('⚠️ Please enter your name.'); signupNameInput.focus(); return; }
          if (email === '') { alert('⚠️ Please enter your email.'); signupEmailInput.focus(); return; }
          if (password === '') { alert('⚠️ Please enter a password.'); signupPasswordInput.focus(); return; }
          if (confirmPassword === '') { alert('⚠️ Please confirm your password.'); signupConfirmPasswordInput.focus(); return; }
          if (password !== confirmPassword) { alert('⚠️ Passwords do not match.'); signupConfirmPasswordInput.focus(); return; }
          if (password.length < 6) { alert('⚠️ Password should be at least 6 characters.'); signupPasswordInput.focus(); return;}


          // --- Firebase Signup ---
          auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
              // Signed up
              const user = userCredential.user;
              console.log('Signup successful:', user.uid, user.email);

              // --- Store additional user data in Firestore ---
              // Use user.uid as the document ID
              return db.collection("users").doc(user.uid).set({
                  name: name,
                  email: email,
                  createdAt: firebase.firestore.FieldValue.serverTimestamp() // Optional: record creation time
              });
            })
            .then(() => {
                console.log("User data stored in Firestore successfully.");
                alert(`✅ Signup successful!\nWelcome, ${name}! Please Sign In.`);
                signupForm.reset();
                showLogin(); // Switch back to the login view
            })
            .catch((error) => {
              const errorCode = error.code;
              const errorMessage = error.message;
              console.error("Signup/Firestore Error:", errorCode, errorMessage);
              if (errorCode === 'auth/email-already-in-use') {
                  alert('❌ Signup Failed: This email address is already registered.');
              } else if (errorCode === 'auth/weak-password') {
                   alert('❌ Signup Failed: The password is too weak.');
              } else {
                  alert(`❌ Signup Failed: ${errorMessage}`);
              }
            });
      });
  } else { if (!signupForm) console.error("Signup form element not found."); }

  // --- Initial view checks ---
  if (!loginView || !signupView) { console.error("Login or Signup view container not found."); }
  if (!auth || !db) { console.error("Firebase Auth or Firestore failed to initialize."); }
});