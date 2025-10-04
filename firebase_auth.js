import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup ,sendPasswordResetEmail ,signOut} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAZBpDk0m_QmzMgBefSemJLt6j3959uxK0",
  authDomain: "ai-tools-hub-2025.firebaseapp.com",
  projectId: "ai-tools-hub-2025",
  storageBucket: "ai-tools-hub-2025.appspot.com",
  messagingSenderId: "571951370917",
};

const app = initializeApp(firebaseConfig);
console.log("Firebase initialized successfully ");

const auth = getAuth(app);
const db = getFirestore(app);

function showMessage(message, divId) {
  var messageDiv = document.getElementById(divId);
  if (!messageDiv) {
    console.error(`Message div with ID '${divId}' not found.`);
    return;
  }
  messageDiv.textContent = message;
  messageDiv.style.display = "block";
  messageDiv.style.opacity = 1;
  setTimeout(function () {
    messageDiv.style.opacity = 0;
    setTimeout(() => { messageDiv.style.display = "none"; }, 500);
  }, 5000);
}

// Select the entire authentication form
const authForm = document.getElementById('auth-form');

if (authForm) {
  authForm.addEventListener('submit', (event) => {
    event.preventDefault();

    // Determine if the user is trying to Register or Login based on the button text
    const submitButton = event.submitter;
    const action = submitButton.textContent.trim();

    // Register
    if (action === 'Register') {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirm-password").value;
      const name = document.getElementById("name").value;

      if (password !== confirmPassword) {
        showMessage('Passwords do not match!', 'signUpMessage');
        return;
      }

      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          const userData = {
            email: email,
            name: name,
          };

          showMessage('Account created successfully', 'signUpMessage');

          const docRef = doc(db, "users", user.uid);
          setDoc(docRef, userData)
            .then(() => {
              window.location.href = "index.html"
            })
            .catch((error) => {
              console.error("error writing document ", error)
              showMessage('Account created, but database save failed: ' + error.code, 'signUpMessage');
            });
        })
        .catch((error) => {
          const errorCode = error.code;
          let errorMessage = `Error: ${error.message}`;

          if (errorCode === 'auth/email-already-in-use') {
            errorMessage = 'Email Address Already Exists!';
          } else if (errorCode === 'auth/weak-password') {
            errorMessage = 'Password should be at least 6 characters.';
          }

          showMessage(errorMessage, 'signUpMessage');
        });
    }

    // Login
    else if (action === 'Login') {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          showMessage('Login successful. Redirecting...', 'signUpMessage');
          window.location.href = "index.html"
        })
        .catch((error) => {
          const errorCode = error.code;
          let errorMessage = `Login failed: ${error.message}`;

          if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
            errorMessage = 'Invalid email or password.';
          }

          showMessage(errorMessage, 'signUpMessage');
          console.error("Login Error:", error);
        });
    }
  });
}

//  Google provider
const googleButton = document.getElementById('google-sign-in');

if (googleButton) {
    googleButton.addEventListener('click', handleGoogleSignIn);
}

function handleGoogleSignIn() {
    const provider = new GoogleAuthProvider();

    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            const docRef = doc(db, "users", user.uid);
            const userData = {
                email: user.email,
                name: user.displayName || 'Google User',
            };

            setDoc(docRef, userData, { merge: true })
                .then(() => {
                    showMessage('Signed in with Google. Redirecting...', 'signUpMessage');
                    window.location.href = "index.html";
                })
                .catch((error) => {
                    console.error("Error saving Google user data:", error);
                    showMessage('Google sign-in successful, but database save failed.', 'signUpMessage');
                });
        })
        .catch((error) => {
            const errorCode = error.code;
            let errorMessage = `Google Sign-in failed: ${error.message}`;
            if (errorCode === 'auth/popup-closed-by-user') {
                errorMessage = 'Google Sign-in was cancelled.';
            }

            showMessage(errorMessage, 'signUpMessage');
            console.error("Google Sign-in Error:", error);
        });
}

const forgetPasswordLink = document.getElementById('forgot-password-link');

if (forgetPasswordLink) {
    forgetPasswordLink.addEventListener('click', handlePasswordReset);
}

function handlePasswordReset(event) {
    event.preventDefault(); // Stop the link from navigating

    const emailInput = document.getElementById("email");
    const email = emailInput ? emailInput.value : '';

    if (!email) {
        showMessage('Please enter your email address in the email field above.', 'signUpMessage');
        return;
    }

    sendPasswordResetEmail(auth, email)
        .then(() => {
            // Password reset email sent!
            showMessage(`Password reset link sent to ${email}. Check your inbox.`, 'signUpMessage');
        })
        .catch((error) => {
            const errorCode = error.code;
            let errorMessage = `Could not send reset email: ${error.message}`;

            if (errorCode === 'auth/user-not-found') {
                errorMessage = 'If an account exists for that email, a password reset link has been sent.';
            }
            
            showMessage(errorMessage, 'signUpMessage');
            console.error("Password Reset Error:", error);
        });
}
