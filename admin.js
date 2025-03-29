const firebaseConfig = {
    apiKey: "AIzaSyBpB4-k-ysxmKnWelybm__ZnRIC-R9T_cw",
    authDomain: "ipl-fantasy-tracker-140d3.firebaseapp.com",
    projectId: "ipl-fantasy-tracker-140d3",
    storageBucket: "ipl-fantasy-tracker-140d3.appspot.com",
    messagingSenderId: "102052646197",
    appId: "1:102052646197:web:a0395d4d928e3590f7907c",
    measurementId: "G-K1FWR69ESX"
  };
  
  // Initialize Firebase
  const app = firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  
  // Debugging: Check Firebase initialization
  console.log("Firebase initialized:", app.name);
  
  // DOM elements
  const loginSection = document.getElementById('loginSection');
  const adminSection = document.getElementById('adminSection');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const scoreForm = document.getElementById('scoreForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginStatus = document.getElementById('loginStatus');
  
  // Enhanced Login Function
  async function handleLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
  
    // Basic validation
    if (!email || !password) {
      showLoginError("Please enter both email and password");
      return;
    }
  
    try {
      loginStatus.textContent = "Logging in...";
      loginStatus.style.color = "blue";
      loginBtn.disabled = true;
  
      console.log("Attempting login with:", email);
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      
      // Success
      console.log("Login success!", userCredential.user);
      loginSection.style.display = 'none';
      adminSection.style.display = 'block';
      loginStatus.textContent = "";
      
    } catch (error) {
      console.error("Login error:", error);
      handleLoginError(error);
    } finally {
      loginBtn.disabled = false;
    }
  }
  
  // Error handling
  function handleLoginError(error) {
    let errorMessage = "Login failed: ";
    
    switch(error.code) {
      case 'auth/invalid-email':
        errorMessage += "Invalid email format";
        break;
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        errorMessage += "Invalid email or password";
        break;
      case 'auth/too-many-requests':
        errorMessage += "Account temporarily locked. Try again later";
        break;
      default:
        errorMessage += error.message;
    }
    
    showLoginError(errorMessage);
  }
  
  function showLoginError(message) {
    loginStatus.textContent = message;
    loginStatus.style.color = "red";
    loginStatus.style.fontWeight = "bold";
  }
  
  // Logout function
  function handleLogout() {
    auth.signOut()
      .then(() => {
        console.log("User signed out");
        adminSection.style.display = 'none';
        loginSection.style.display = 'block';
        emailInput.value = '';
        passwordInput.value = '';
        loginStatus.textContent = "";
      })
      .catch((error) => {
        console.error("Logout error:", error);
      });
  }
  
  // Auth state listener
  auth.onAuthStateChanged((user) => {
    console.log("Auth state changed. User:", user);
    
    if (user) {
      console.log("User is logged in:", user.email);
      loginSection.style.display = 'none';
      adminSection.style.display = 'block';
    } else {
      console.log("No user logged in");
      loginSection.style.display = 'block';
      adminSection.style.display = 'none';
    }
  });
  
  // Event listeners
  document.addEventListener('DOMContentLoaded', () => {
    console.log("Admin page loaded");
    
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (scoreForm) scoreForm.addEventListener('submit', handleScoreSubmit);
    
    // Test Firebase connection
    testFirebaseConnection();
  });
  
  // Test Firebase connection
  async function testFirebaseConnection() {
    try {
      console.log("Testing Firebase connection...");
      const result = await db.collection("test").limit(1).get();
      console.log("Firebase connection successful");
    } catch (error) {
      console.error("Firebase connection failed:", error);
    }
  }
  
  async function handleScoreSubmit(e) {
    e.preventDefault();
    
    const matchDate = document.getElementById('matchDate').value;
    const name = document.getElementById('name').value;
    const points = parseInt(document.getElementById('points').value);
  
    try {
      // Add the new score
      await db.collection("scores").add({
        date: matchDate,
        name: name,
        points: points,
        winner: 0, // Initialize as not winner
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
  
      // Check if all players have submitted for this date
      const matchScores = await db.collection("scores")
        .where("date", "==", matchDate)
        .get();
  
      // Get list of all players
      const allPlayers = ["You", "Friend1", "Friend2", "Friend3", "Friend4"];
      
      // Check if we have all submissions for this date
      const submittedPlayers = matchScores.docs.map(doc => doc.data().name);
      const allSubmitted = allPlayers.every(player => 
        submittedPlayers.includes(player)
      );
  
      if (allSubmitted) {
        // Find the highest score
        let maxPoints = -1;
        let winnerId = null;
        
        matchScores.forEach(doc => {
          const data = doc.data();
          if (data.points > maxPoints) {
            maxPoints = data.points;
            winnerId = doc.id;
          }
        });
  
        // Update the winner's document
        if (winnerId) {
          await db.collection("scores").doc(winnerId).update({
            winner: 1
          });
          console.log(`Winner for ${matchDate} updated: ${winnerId}`);
        }
  
        // Reset winner flags if needed (in case of re-calculation)
        const updates = matchScores.docs
          .filter(doc => doc.id !== winnerId)
          .map(doc => doc.ref.update({ winner: 0 }));
        
        await Promise.all(updates);
      }
  
      alert("Score submitted successfully!");
      scoreForm.reset();
    } catch (error) {
      console.error("Error submitting score:", error);
      alert("Error: " + error.message);
    }
  }
  
  // Initialize auth state
  auth.onAuthStateChanged((user) => {
    if (user) {
      loginSection.style.display = 'none';
      adminSection.style.display = 'block';
    } else {
      loginSection.style.display = 'block';
      adminSection.style.display = 'none';
    }
  });
  
  // Event listeners
  loginBtn?.addEventListener('click', handleLogin);
  logoutBtn?.addEventListener('click', handleLogout);
  scoreForm?.addEventListener('submit', handleScoreSubmit);
  
  console.log("Admin page initialized");