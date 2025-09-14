let chartInstance = null;

// Build the inputs (includes Team Rating and Spread display)
function generateInputs() {
  const numGames = parseInt(document.getElementById('numGames').value, 10);
  const gameInputs = document.getElementById('gameInputs');
  gameInputs.innerHTML = '';

  // 12 opponents
  const opponents12 = [
    "UTSA","Utah State","Notre Dame","Auburn","Mississippi State","Florida",
    "Arkansas","LSU","Missouri","South Carolina","Samford","Texas"
  ];

  // Locations: away = ND, Arkansas, LSU, Missouri, Texas
  const locations12 = [
    "home","home","away","home","home","home","away","away","away","home","home","away"
  ];

  // Add 3 blank games
  const extraCount = 3;
  const opponents = opponents12.concat(Array(extraCount).fill(""));
  const locations = locations12.concat(Array(extraCount).fill("neutral"));

  // Prob defaults: first 3 = 1.0; rest of first 12 = 0.5; last 3 blanks = 0.0
  const defaultProbabilities = opponents.map((_, idx) => (idx < 3 ? 1.0 : (idx < 12 ? 0.5 : 0.0)));

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

          <span>Spread:</span>
          <span id="spread${i}" class="spread-chip"></span>
        </div>

        <div class="loc-group" style="margin-top:6px;">
          <span style="margin-right:8px;">Location:</span>
          <label style="margin-right:8px;">
            <input type="radio" name="${radioName}" id="loc${i}_home" value="home" ${defaultLocation === 'home' ? 'checked' : ''}>
            Home
          </label>
          <label style="margin-right:8px;">
            <input type="radio" name="${radioName}" id="loc${i}_away" value="away" ${defaultLocation === 'away' ? 'checked' : ''}>
            Away
          </label>
          <label>
            <input type="radio" name="${radioName}" id="loc${i}_neutral" value="neutral" ${defaultLocation === 'neutral' ? 'checked' : ''}>
            Neutral
          </label>
        </div>
      </div>`;
    gameInputs.insertAdjacentHTML('beforeend', rowHtml);
  }
}

// Compute and display point spreads
// Adjust HFA to home team, then Spread = OpponentAdjusted - YourAdjusted
function updatePointSpreads() {
  const numGames = parseInt(document.getElementById('numGames').value, 10);
  const your = parseFloat(document.getElementById('yourTeamRating').value);
  const hfa = parseFloat(document.getElementById('homeFieldAdv').value);

  if (isNaN(your) || isNaN(hfa)) {
    alert('Please enter BOTH "Your Team Rating" and "Home Field Advantage" first.');
    return;
  }

  for (let i = 1; i <= numGames; i++) {
    const opp = parseFloat(document.getElementById(`oppRating${i}`).value);
    const locEl = document.querySelector(`input[name="loc${i}"]:checked`);
    const loc = locEl ? locEl.value : 'neutral';
    const spreadEl = document.getElementById(`spread${i}`);

    if (isNaN(opp)) { spreadEl.textContent = ''; spreadEl.title = ''; continue; }

    let yourAdj = your, oppAdj = opp;
    if (loc === 'home') yourAdj += hfa;
    else if (loc === 'away') oppAdj += hfa;

    const spread = oppAdj - yourAdj; // + = opponent favored
    spreadEl.textContent = `${spread > 0 ? '+' : ''}${spread.toFixed(1)}`;
    spreadEl.title = (loc === 'home')
      ? `Your team HOME (+${hfa.toFixed(1)} HFA)`
      : (loc === 'away')
        ? `Opponent HOME (+${hfa.toFixed(1)} HFA)`
        : `Neutral (no HFA)`;
  }
}

// ==== Existing probability machinery ====
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
    data: { labels: winCounts.map((_, i) => i.toString()),
      datasets: [{ label: 'Probability of Wins', data: winCounts,
        backgroundColor:'rgba(75,192,192,0.2)', borderColor:'rgba(75,192,192,1)', borderWidth:1 }] },
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
  document.getElementById('yourTeamRating').value = '';
  document.getElementById('homeFieldAdv').value = '';
  generateInputs();
}

function clearProbabilities() {
  const numGames = parseInt(document.getElementById('numGames').value, 10);
  for (let i = 1; i <= numGames; i++) document.getElementById(`prob${i}`).value = 0.5;
  const canvas = document.getElementById('histogram');
  canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
}
