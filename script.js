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

// -------- Ratings → Spread (per game) --------
// HFA to HOME team only. Spread = OppAdj - A&M Adj (positive = opponent favored)
function updateSpreadsFromRatings() {
  const numGames = parseInt(document.getElementById('numGames').value, 10);
  const your = parseFloat(document.getElementById('yourTeamRating').value);
  const hfa  = parseFloat(document.getElementById('homeFieldAdv').value);

  if (isNaN(your) || isNaN(hfa)) {
    alert('Please enter BOTH "Texas A&M Rating" and "Home Field Advantage" first.');
    return;
  }

  for (let i = 1; i <= numGames; i++) {
    const opp = parseFloat(document.getElementById(`oppRating${i}`).value);
    const locEl = document.querySelector(`input[name="loc${i}"]:checked`);
    const loc = locEl ? locEl.value : 'neutral';
    const spreadEl = document.getElementById(`spread${i}`);

    if (isNaN(opp)) continue; // skip games without an opponent rating

    let yourAdj = your, oppAdj = opp;
    if (loc === 'home') yourAdj += hfa;
    else if (loc === 'away') oppAdj += hfa;

    const spread = oppAdj - yourAdj;
    spreadEl.value = spread.toFixed(1);
  }
}

// -------- Spread → Probability (per game) --------
// Normal:     Pwin = 1 - Phi(spread / sigma)
// Logistic:   Pwin = 1 / (1 + exp(beta * spread))
function updateProbabilitiesFromSpreads() {
  const numGames = parseInt(document.getElementById('numGames').value, 10);
  const model = document.getElementById('modelType').value;
  const sigma = parseFloat(document.getElementById('sigma').value);
  const beta  = parseFloat(document.getElementById('beta').value);

  if (model === 'normal' && isNaN(sigma)) { alert('Enter σ for the Normal model.'); return; }
  if (model === 'logistic' && isNaN(beta)) { alert('Enter b for the Logistic model.'); return; }

  for (let i = 1; i <= numGames; i++) {
    const spread = parseFloat(document.getElementById(`spread${i}`).value);
    if (isNaN(spread)) continue; // skip if no spread

    let p;
    if (model === 'normal') {
      const z = spread / sigma;
      p = 1 - standardNormalCDF(z); // A&M wins when margin < 0
    } else {
      p = 1 / (1 + Math.exp(beta * spread));
    }

    p = Math.max(0, Math.min(1, p)); // clamp
    document.getElementById(`prob${i}`).value = p.toFixed(4);
  }
}

// -------- Probability Engine --------
function calculateProbabilities() {
  const numGames = parseInt(document.getElementById('numGames').value, 10);
  const probabilities = [];
  for (let i = 1; i <= numGames; i++) {
    probabilities.push(parseFloat(document.getElementById(`prob${i}`).value));
  }

  const winCounts = new Array(numGames + 1).fill(0);
  for (let mask = 0; mask < (1 << numGames); mask++) {
    let winCount = 0, prob = 1;
    for (let j = 0; j < numGames; j++) {
      if (mask & (1 << j)) { winCount++; prob *= probabilities[j]; }
      else { prob *= (1 - probabilities[j]); }
    }
    winCounts[winCount] += prob;
  }
  generateHistogram(winCounts);
  generateReport(winCounts, numGames);
}

function generateHistogram(winCounts) {
  const ctx = document.getElementById('histogram').getContext('2d');
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: winCounts.map((_, i) => i.toString()),
      datasets: [{
        label: 'Probability of Wins',
        data: winCounts,
        backgroundColor:'rgba(75,192,192,0.2)',
        borderColor:'rgba(75,192,192,1)',
        borderWidth:1
      }]
    },
    options: { scales: { y: { beginAtZero: true } } }
  });
}

function generateReport(winCounts, numGames) {
  let report = 'Number of Wins - Exactly - At Least\n\n';
  let cum = 0;
  for (let i = numGames; i >= 0; i--) {
    cum += winCounts[i];
    report += `${i} Wins: ${(winCounts[i]*100).toFixed(2)}% - ${(cum*100).toFixed(2)}%\n`;
  }
  document.getElementById('reportOutput').textContent = report;
}

function copyToClipboard() {
  const reportText = document.getElementById('reportOutput').textContent;
  navigator.clipboard.writeText(reportText).then(() => alert("Report copied to clipboard!"));
}

function startOver() {
  document.getElementById('numGames').value = '15';
  document.getElementById('gameInputs').innerHTML = '';
  const canvas = document.getElementById('histogram');
  canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  // Reset globals/model to PREPOP defaults (weekly refresh)
  document.getElementById('yourTeamRating').value = PREPOP.yourTeamRating ?? '';
  document.getElementById('homeFieldAdv').value  = PREPOP.homeFieldAdv   ?? '';
  document.getElementById('modelType').value = 'normal';
  document.getElementById('sigma').value = '13.5';
  document.getElementById('beta').value  = '0.23';

  generateInputs();
}

function clearProbabilities() {
  const numGames = parseInt(document.getElementById('numGames').value, 10);
  for (let i = 1; i <= numGames; i++) {
    document.getElementById(`prob${i}`).value = 0.5;
  }
  const canvas = document.getElementById('histogram');
  canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
}

// -------- Math Helpers --------
function standardNormalCDF(z) {
  // Abramowitz & Stegun approximation via erf
  return 0.5 * (1 + erf(z / Math.SQRT2));
}
function erf(x) {
  // Numerical approximation of error function
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const a1=0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429, p=0.3275911;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1) * t * Math.exp(-x*x);
  return sign * y;
}
