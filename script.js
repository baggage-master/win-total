let chartInstance = null;

/** ==========================================
 *  Six-Model Data (RATING, PREDICTOR, GM, RECENT, STRONG RECENT, FPI)
 *  Values you provided for HFA, Texas A&M, and all 12 opponents.
 *  ========================================== */
const MODEL_SETS = {
  RATING: {
    hfa: 3.73,
    yourTeamRating: 92.80,
    teams: {
      "UTSA": 66.85, "Utah State": 63.66, "Notre Dame": 91.57, "Auburn": 80.03,
      "Mississippi State": 76.58, "Florida": 78.76, "Arkansas": 75.31, "LSU": 84.46,
      "Missouri": 82.03, "South Carolina": 78.79, "Samford": 35.89, "Texas": 87.76
    }
  },
  PREDICTOR: {
    hfa: 3.58,
    yourTeamRating: 89.79,
    teams: {
      "UTSA": 67.26, "Utah State": 64.42, "Notre Dame": 91.20, "Auburn": 81.23,
      "Mississippi State": 75.97, "Florida": 79.97, "Arkansas": 77.47, "LSU": 84.62,
      "Missouri": 82.03, "South Carolina": 79.69, "Samford": 36.40, "Texas": 87.18
    }
  },
  GOLDEN_MEAN: {
    hfa: 3.79,
    yourTeamRating: 94.97,
    teams: {
      "UTSA": 66.41, "Utah State": 62.64, "Notre Dame": 92.56, "Auburn": 78.50,
      "Mississippi State": 73.53, "Florida": 78.11, "Arkansas": 72.22, "LSU": 84.41,
      "Missouri": 81.84, "South Carolina": 77.16, "Samford": 35.08, "Texas": 89.47
    }
  },
  RECENT: {
    hfa: 3.80,
    yourTeamRating: 97.21,
    teams: {
      "UTSA": 65.41, "Utah State": 62.02, "Notre Dame": 93.11, "Auburn": 81.07,
      "Mississippi State": 76.38, "Florida": 78.49, "Arkansas": 76.76, "LSU": 85.45,
      "Missouri": 82.98, "South Carolina": 80.09, "Samford": 30.15, "Texas": 88.31
    }
  },
  STRONG_RECENT: {
    hfa: 3.80,
    yourTeamRating: 101.71,
    teams: {
      "UTSA": 63.69, "Utah State": 63.74, "Notre Dame": 95.12, "Auburn": 79.30,
      "Mississippi State": 77.17, "Florida": 74.82, "Arkansas": 74.77, "LSU": 83.31,
      "Missouri": 82.12, "South Carolina": 76.62, "Samford": 25.52, "Texas": 87.65
    }
  },
  FPI: {
    hfa: 3.00,
    yourTeamRating: 20.7,
    teams: {
      "UTSA": -3, "Utah State": -3.6, "Notre Dame": 22, "Auburn": 11.1,
      "Mississippi State": undefined, "Florida": 8.5, "Arkansas": 7.6, "LSU": 13,
      "Missouri": 13.4, "South Carolina": 8.1, "Samford": -30, "Texas": 19.9
    }
  }
};

// Opponent sequence (12 games) + locations
const OPPONENTS = [
  "UTSA","Utah State","Notre Dame","Auburn","Mississippi State","Florida",
  "Arkansas","LSU","Missouri","South Carolina","Samford","Texas"
];
const LOCATIONS = [
  "home","home","away","home","home","home","away","away","away","home","home","away"
];

// Initial presets:
// - Use RATING model on load
// - First 9 games (0..8) default to WON; last 3 (9..11) default to NOT PLAYED
// - Add 3 blank games at the end (neutral, not played, prob=0)
const DEFAULT_WON_INDICES = new Set([0,1,2,3,4,5,6,7,8]);

/** ============= UI BUILDING ============= */
function generateInputs() {
  const numGames = parseInt(document.getElementById('numGames').value, 10);
  const gameInputs = document.getElementById('gameInputs');
  gameInputs.innerHTML = '';

  // Build rows
  const extraCount = Math.max(0, numGames - 12);
  const opponents = OPPONENTS.concat(Array(extraCount).fill(""));
  const locations = LOCATIONS.concat(Array(extraCount).fill("neutral"));

  for (let i = 1; i <= numGames; i++) {
    const idx = i - 1;
    const opponentName = opponents[idx] || `Game ${i}`;
    const defaultLocation = locations[idx] || "neutral";

    // Result preset
    let defaultResult = "np"; // not played
    let defaultProb = 0.0;
    if (idx < 12) {
      if (DEFAULT_WON_INDICES.has(idx)) { defaultResult = "won"; defaultProb = 1.0; }
      else { defaultResult = "np"; defaultProb = 0.5; }
    } else {
      defaultResult = "np"; defaultProb = 0.0;
    }

    const radioNameLoc = `loc${i}`;
    const radioNameRes = `res${i}`;
    const rowHtml = `
      <div id="row${i}">
        <div class="row-top">
          <label for="game${i}Name"><strong>Game ${i} Name:</strong></label>
          <input type="text" id="game${i}Name" value="${opponentName}" placeholder="Game ${i}">

          <label for="prob${i}">Probability:</label>
          <input type="number" id="prob${i}" min="0" max="1" step="0.01" value="${defaultProb.toFixed(2)}">

          <label for="oppRating${i}">Team Rating:</label>
          <input type="number" id="oppRating${i}" step="0.01" placeholder="e.g., 82.4">

          <label for="spread${i}">Spread:</label>
          <input type="number" id="spread${i}" step="0.1" placeholder="+/- pts">
        </div>

        <div class="loc-group" style="margin-top:6px;">
          <span style="margin-right:8px;">Location:</span>
          <label style="margin-right:8px;">
            <input type="radio" name="${radioNameLoc}" id="loc${i}_home" value="home" ${defaultLocation === 'home' ? 'checked' : ''}>Home
          </label>
          <label style="margin-right:8px;">
            <input type="radio" name="${radioNameLoc}" id="loc${i}_away" value="away" ${defaultLocation === 'away' ? 'checked' : ''}>Away
          </label>
          <label>
            <input type="radio" name="${radioNameLoc}" id="loc${i}_neutral" value="neutral" ${defaultLocation === 'neutral' ? 'checked' : ''}>Neutral
          </label>
        </div>

        <div class="result-group" style="margin-top:6px;">
          <span style="margin-right:8px;">Result:</span>
          <label style="margin-right:8px;">
            <input type="radio" name="${radioNameRes}" id="res${i}_won" value="won" ${defaultResult === 'won' ? 'checked' : ''} onchange="onResultChange(${i})">Won
          </label>
          <label style="margin-right:8px;">
            <input type="radio" name="${radioNameRes}" id="res${i}_lost" value="lost" ${defaultResult === 'lost' ? 'checked' : ''} onchange="onResultChange(${i})">Lost
          </label>
          <label>
            <input type="radio" name="${radioNameRes}" id="res${i}_np" value="np" ${defaultResult === 'np' ? 'checked' : ''} onchange="onResultChange(${i})">Not played
          </label>
        </div>
      </div>`;
    gameInputs.insertAdjacentHTML('beforeend', rowHtml);

    // Apply initial lock if won/lost
    applyResultLock(i);
  }

  // Apply the default model (RATING) and overwrite to seed ratings + HFA + A&M rating
  setGlobalFromModel("RATING");
  applyModelToInputs("RATING", true);
}

/** ============= MODEL SELECTOR ============= */
function applySelectedModel() {
  const sel = document.getElementById('ratingModel').value;
  const overwrite = document.getElementById('overwriteEdits').checked;
  setGlobalFromModel(sel);
  applyModelToInputs(sel, overwrite);
}

function setGlobalFromModel(modelKey) {
  const m = MODEL_SETS[modelKey];
  if (!m) return;
  const yourEl = document.getElementById('yourTeamRating');
  const hfaEl  = document.getElementById('homeFieldAdv');
  yourEl.value = (m.yourTeamRating != null) ? m.yourTeamRating : '';
  hfaEl.value  = (m.hfa != null) ? m.hfa : '';
}

function applyModelToInputs(modelKey, overwrite) {
  const m = MODEL_SETS[modelKey];
  if (!m) return;

  const numGames = parseInt(document.getElementById('numGames').value, 10);
  for (let i = 1; i <= numGames; i++) {
    const nameEl = document.getElementById(`game${i}Name`);
    const oppName = (nameEl && nameEl.value) ? nameEl.value : null;
    if (!oppName) continue;

    const oppVal = m.teams[oppName];
    const oppInput = document.getElementById(`oppRating${i}`);
    if (!oppInput) continue;

    // Fill if overwrite is on OR field is empty
    if (overwrite || oppInput.value === '') {
      if (oppVal != null && !Number.isNaN(oppVal)) {
        oppInput.value = Number(oppVal).toFixed(2);
      }
    }
  }
}

/** ============= RESULT STATE HANDLING ============= */
function onResultChange(i) {
  applyResultLock(i);
}
function getResultValue(i) {
  const won = document.getElementById(`res${i}_won`);
  const lost = document.getElementById(`res${i}_lost`);
  if (won && won.checked) return 'won';
  if (lost && lost.checked) return 'lost';
  return 'np';
}
function applyResultLock(i) {
  const status = getResultValue(i);
  const probEl = document.getElementById(`prob${i}`);
  const spreadEl = document.getElementById(`spread${i}`);
  const row = document.getElementById(`row${i}`);

  if (!probEl || !spreadEl || !row) return;

  if (status === 'won') {
    probEl.value = 1.0;
    probEl.disabled = true;
    spreadEl.disabled = true;
    row.classList.add('dimmed');
  } else if (status === 'lost') {
    probEl.value = 0.0;
    probEl.disabled = true;
    spreadEl.disabled = true;
    row.classList.add('dimmed');
  } else {
    probEl.disabled = false;
    spreadEl.disabled = false;
    row.classList.remove('dimmed');
  }
}

/** ============= RATINGS → SPREAD ============= */
// HFA to HOME team only. Spread = OppAdj - A&M Adj (positive => opponent favored)
function updateSpreadsFromRatings() {
  const numGames = parseInt(document.getElementById('numGames').value, 10);
  const your = parseFloat(document.getElementById('yourTeamRating').value);
  const hfa  = parseFloat(document.getElementById('homeFieldAdv').value);

  if (isNaN(your) || isNaN(hfa)) {
    alert('Please enter BOTH "Texas A&M Rating" and "Home Field Advantage" first.');
    return;
  }

  for (let i = 1; i <= numGames; i++) {
    if (getResultValue(i) !== 'np') continue; // only not played

    const opp = parseFloat(document.getElementById(`oppRating${i}`).value);
    const locEl = document.querySelector(`input[name="loc${i}"]:checked`);
    const loc = locEl ? locEl.value : 'neutral';
    const spreadEl = document.getElementById(`spread${i}`);

    if (isNaN(opp) || !spreadEl) continue;

    let yourAdj = your, oppAdj = opp;
    if (loc === 'home') yourAdj += hfa;
    else if (loc === 'away') oppAdj += hfa;

    const spread = oppAdj - yourAdj;
    spreadEl.value = spread.toFixed(1);
  }
}

/** ============= SPREAD → PROBABILITY ============= */
// Normal:   Pwin = 1 - Phi(spread / sigma)
// Logistic: Pwin = 1 / (1 + exp(beta * spread))
function updateProbabilitiesFromSpreads() {
  const numGames = parseInt(document.getElementById('numGames').value, 10);
  const model = document.getElementById('modelType').value;
  const sigma = parseFloat(document.getElementById('sigma').value);
  const beta  = parseFloat(document.getElementById('beta').value);

  if (model === 'normal' && isNaN(sigma)) { alert('Enter σ for the Normal model.'); return; }
  if (model === 'logistic' && isNaN(beta)) { alert('Enter b for the Logistic model.'); return; }

  for (let i = 1; i <= numGames; i++) {
    if (getResultValue(i) !== 'np') continue; // only not played

    const spread = parseFloat(document.getElementById(`spread${i}`).value);
    if (isNaN(spread)) continue;

    let p;
    if (model === 'normal') {
      const z = spread / sigma;
      p = 1 - standardNormalCDF(z);
    } else {
      p = 1 / (1 + Math.exp(beta * spread));
    }
    p = Math.max(0, Math.min(1, p));
    document.getElementById(`prob${i}`).value = p.toFixed(4);
  }
}

/** ============= SIMULATION ENGINE ============= */
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

/** ============= RESET/UTILITY ============= */
function startOver() {
  // Reset global controls
  document.getElementById('ratingModel').value = 'RATING';
  document.getElementById('overwriteEdits').checked = true;
  document.getElementById('numGames').value = '15';

  // Clear canvas/chart
  const canvas = document.getElementById('histogram');
  canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  // Rebuild rows and apply default model/presets
  generateInputs();
}

function clearProbabilities() {
  const numGames = parseInt(document.getElementById('numGames').value, 10);
  for (let i = 1; i <= numGames; i++) {
    if (getResultValue(i) === 'np') {
      document.getElementById(`prob${i}`).value = 0.5;
    }
  }
  const canvas = document.getElementById('histogram');
  canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
}

/** ============= MATH HELPERS ============= */
function standardNormalCDF(z) {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}
function erf(x) {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1=0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429, p=0.3275911;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1) * t * Math.exp(-x*x);
  return sign * y;
}
