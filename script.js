let chartInstance = null;

/** ===============================
 *  Weekly Prepopulation Block
 *  (Update these numbers as needed)
 *  =============================== */
const PREPOP = {
  homeFieldAdv: 4.16,
  yourTeamRating: 87.24,  // updated A&M rating
  teamRatings: {
    "UTSA": 67.02,
    "Utah State": 63.17,
    "Notre Dame": 91.64,
    "Auburn": 81.66,
    "Mississippi State": 74.73,
    "Florida": 82.17,
    "Arkansas": 78.55,
    "LSU": 85.86,
    "Missouri": 83.55,
    "South Carolina": 79.18,
    "Samford": 39.99,
    "Texas": 87.21
  }
};

// Played wins in our 12-game schedule (0-based):
// 0: UTSA, 1: Utah State, 2: Notre Dame, 3: Auburn, 4: Mississippi State,
// 5: Florida, 6: Arkansas
const PLAYED_INDICES = new Set([0, 1, 2, 3, 4, 5, 6]);

// -------- Build Inputs (with Team Rating + Spread input) --------
function generateInputs() {
  const numGames = parseInt(document.getElementById('numGames').value, 10);
  const gameInputs = document.getElementById('gameInputs');
  gameInputs.innerHTML = '';

  const yourEl = document.getElementById('yourTeamRating');
  const hfaEl  = document.getElementById('homeFieldAdv');
  if (!yourEl.value && PREPOP.yourTeamRating != null) yourEl.value = PREPOP.yourTeamRating;
  if (!hfaEl.value  && PREPOP.homeFieldAdv    != null) hfaEl.value  = PREPOP.homeFieldAdv;

  const opponents12 = [
    "UTSA","Utah State","Notre Dame","Auburn","Mississippi State","Florida",
    "Arkansas","LSU","Missouri","South Carolina","Samford","Texas"
  ];
  const locations12 = [
    "home","home","away","home","home","home","away","away","away","home","home","away"
  ];

  const extraCount = 3;
  const opponents = opponents12.concat(Array(extraCount).fill(""));
  const locations = locations12.concat(Array(extraCount).fill("neutral"));

  const defaultProbabilities = opponents.map((_, idx) => {
    if (PLAYED_INDICES.has(idx)) return 1.0;   // A&M wins preset to 1
    if (idx < 12) return 0.5;
    return 0.0;
  });

  for (let i = 1; i <= numGames; i++) {
    const idx = i - 1;
    const opponentName = opponents[idx] ?? `Game ${i}`;
    const defaultProbability = defaultProbabilities[idx] ?? 0.5;
    const defaultLocation = locations[idx] ?? "neutral";
    const radioName = `loc${i}`;

    const rowHtml = `
      <div>
        <div class="row-top">
          <label for="game${i}Name"><strong>Game ${i} Name:</strong></label>
          <input type="text" id="game${i}Name" value="${opponentName}" placeholder="Game ${i}">

          <label for="prob${i}">Probability:</label>
          <input type="number" id="prob${i}" min="0" max="1" step="0.01" value="${defaultProbability}">

          <label for="oppRating${i}">Team Rating:</label>
          <input type="number" id="oppRating${i}" step="0.1" placeholder="e.g., 82.4">

          <label for="spread${i}">Spread:</label>
          <input type="number" id="spread${i}" step="0.1" placeholder="+/- pts">
        </div>

        <div class="loc-group" style="margin-top:6px;">
          <span style="margin-right:8px;">Location:</span>
          <label style="margin-right:8px;">
            <input type="radio" name="${radioName}" id="loc${i}_home" value="home" ${defaultLocation === 'home' ? 'checked' : ''}>Home
          </label>
          <label style="margin-right:8px;">
            <input type="radio" name="${radioName}" id="loc${i}_away" value="away" ${defaultLocation === 'away' ? 'checked' : ''}>Away
          </label>
          <label>
            <input type="radio" name="${radioName}" id="loc${i}_neutral" value="neutral" ${defaultLocation === 'neutral' ? 'checked' : ''}>Neutral
          </label>
        </div>
      </div>`;
    gameInputs.insertAdjacentHTML('beforeend', rowHtml);

    if (opponentName && PREPOP.teamRatings[opponentName] != null) {
      const oppInput = document.getElementById(`oppRating${i}`);
      if (oppInput && !oppInput.value) oppInput.value = PREPOP.teamRatings[opponentName].toFixed(2);
    }
  }
}

// --- Remaining helper functions (same as before) ---
/* Ratings → Spread, Spread → Probability, calculateProbabilities,
   generateHistogram, generateReport, copyToClipboard,
   startOver, clearProbabilities, standardNormalCDF, erf — unchanged */
