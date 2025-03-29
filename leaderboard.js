// Firebase configuration
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
const db = firebase.firestore();

// Set current date
document.getElementById('currentDate').textContent = new Date().toLocaleDateString();

// Real-time data listener
function setupRealTimeListener() {
  db.collection("scores")
    .orderBy("date", "desc")
    .onSnapshot((snapshot) => {
      const scores = [];
      snapshot.forEach((doc) => {
        scores.push({
          id: doc.id,
          ...doc.data()
        });
      });
      updateLeaderboard(scores);
      updateScoreTable(scores);
    }, (error) => {
      console.error("Error getting scores:", error);
    });
}

function updateLeaderboard(scores) {
  const tbody = document.querySelector("#leaderboardTable tbody");
  tbody.innerHTML = "";
  
  // Calculate stats per player
  const playerStats = {};
  
  // First calculate daily winners
  const dailyWinners = {};
  scores.forEach(score => {
    if (!dailyWinners[score.date]) {
      dailyWinners[score.date] = {
        maxPoints: -1,
        winner: null
      };
    }
    if (score.points > dailyWinners[score.date].maxPoints) {
      dailyWinners[score.date].maxPoints = score.points;
      dailyWinners[score.date].winner = score.name;
    }
  });

  // Now calculate player stats
  scores.forEach(score => {
    if (!playerStats[score.name]) {
      playerStats[score.name] = {
        wins: 0,
        totalPoints: 0,
        daysWon: 0
      };
    }
    
    playerStats[score.name].totalPoints += score.points;
    
    // Check if this player won the day
    if (dailyWinners[score.date]?.winner === score.name) {
      playerStats[score.name].daysWon += 1;
    }
  });

  // Sort by days won, then total points
  const sortedPlayers = Object.entries(playerStats)
    .sort((a, b) => {
      // First by days won (descending)
      if (b[1].daysWon !== a[1].daysWon) {
        return b[1].daysWon - a[1].daysWon;
      }
      // Then by total points (descending)
      return b[1].totalPoints - a[1].totalPoints;
    });

  // Populate table
  sortedPlayers.forEach(([name, stats], index) => {
    const row = tbody.insertRow();
    row.insertCell().textContent = index + 1;
    row.insertCell().textContent = name;
    row.insertCell().textContent = stats.daysWon;
    row.insertCell().textContent = stats.totalPoints;
  });
}

function updateScoreTable(scores) {
  const tbody = document.querySelector("#scoreTable tbody");
  tbody.innerHTML = "";
  
  // Group by date
  const scoresByDate = {};
  scores.forEach(score => {
    if (!scoresByDate[score.date]) {
      scoresByDate[score.date] = [];
    }
    scoresByDate[score.date].push(score);
  });
  
  // Sort dates descending
  const sortedDates = Object.keys(scoresByDate).sort((a, b) => new Date(b) - new Date(a));
  
  // For each date, find the winner and display all scores
  sortedDates.forEach(date => {
    const dateScores = scoresByDate[date];
    const maxPoints = Math.max(...dateScores.map(s => s.points));
    
    dateScores.sort((a, b) => b.points - a.points).forEach(score => {
      const row = tbody.insertRow();
      row.insertCell().textContent = score.date;
      row.insertCell().textContent = score.name;
      row.insertCell().textContent = score.points;
      row.insertCell().textContent = score.points === maxPoints ? "🏆 Winner" : "";
    });
    
    // Add separator between dates
    const separator = tbody.insertRow();
    const cell = separator.insertCell();
    cell.colSpan = 4;
    cell.style.height = "10px";
  });
}
// Update score table
function updateScoreTable(scores) {
  const tbody = document.querySelector("#scoreTable tbody");
  tbody.innerHTML = "";
  
  scores.forEach(score => {
    const row = tbody.insertRow();
    row.insertCell().textContent = score.date;
    row.insertCell().textContent = score.name;
    row.insertCell().textContent = score.points;
    row.insertCell().textContent = score.winner ? "🏆 Winner" : "";
  });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  setupRealTimeListener();
});