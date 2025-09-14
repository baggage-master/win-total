let chartInstance = null; // Keep track of the Chart.js instance

function generateInputs() {
    const numGames = parseInt(document.getElementById('numGames').value, 10);
    const gameInputs = document.getElementById('gameInputs');
    gameInputs.innerHTML = '';  // Clear previous inputs

    // Base 12 opponents in order
    const opponents12 = [
        "UTSA",
        "Utah State",
        "Notre Dame",
        "Auburn",
        "Mississippi State",
        "Florida",
        "Arkansas",
        "LSU",
        "Missouri",
        "South Carolina",
        "Samford",
        "Texas"
    ];

    // Location defaults for the 12 games: 'home' | 'away' | 'neutral'
    // Away = Notre Dame, Arkansas, LSU, Missouri, Texas; rest home
    const locations12 = [
        "home",  // UTSA
        "home",  // Utah State
        "away",  // Notre Dame
        "home",  // Auburn
        "home",  // Mississippi State
        "home",  // Florida
        "away",  // Arkansas
        "away",  // LSU
        "away",  // Missouri
        "home",  // South Carolina
        "home",  // Samford
        "away"   // Texas
    ];

    // Add 3 blank games at the end
    const extraCount = 3;
    const opponents = opponents12.concat(Array(extraCount).fill(""));
    const locations = locations12.concat(Array(extraCount).fill("neutral")); // default neutral for blanks

    // Default probabilities:
    // - First 3 real games: 1.0
    // - Others among first 12: 0.5
    // - Last 3 blanks: 0.0
    const defaultProbabilities = opponents.map((_, idx) => {
        if (idx < 3) return 1.0;
        if (idx < 12) return 0.5;
        return 0.0; // blanks
    });

    for (let i = 1; i <= numGames; i++) {
        const idx = i - 1;

        const opponentName = opponents[idx] ?? `Game ${i}`;
        const defaultProbability = (defaultProbabilities[idx] !== undefined) ? defaultProbabilities[idx] : 0.5;
        const defaultLocation = locations[idx] ?? "neutral";

        const radioName = `loc${i}`;

        // Build one game row
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
                    <span id="spread${i}" class="spread-chip" title=""></span>
                </div>

                <div class="loc-group" style="margin-top: 6px;">
                    <span style="margin-right: 8px;">Location:</span>
                    <label style="margin-right: 8px;">
                        <input type="radio" name="${radioName}" id="loc${i}_home" value="home" ${defaultLocation === 'home' ? 'checked' : ''}>
                        Home
                    </label>
                    <label style="margin-right: 8px;">
                        <input type="radio" name="${radioName}" id="loc${i}_away" value="away" ${defaultLocation === 'away' ? 'checked' : ''}>
                        Away
                    </label>
                    <label>
                        <input type="radio" name="${radioName}" id="loc${i}_neutral" value="neutral" ${defaultLocation === 'neutral' ? 'checked' : ''}>
                        Neutral
                    </label>
                </div>
            </div>
        `;

        gameInputs.insertAdjacentHTML('beforeend', rowHtml);
    }
}

/**
 * Compute and display point spreads for every game.
 * Rules:
 * - Add Home Field Advantage (HFA) to the HOME team's rating only.
 * - Spread = OpponentAdjusted - YourAdjusted.
 *   Positive => Opponent favored; Negative => Your team favored.
 */
function updatePointSpreads() {
    const numGames = parseInt(document.getElementById('numGames').value, 10);
    const your = parseFloat(document.getElementById('yourTeamRating').value);
    const hfa = parseFloat(document.getElementById('homeFieldAdv').value);

    if (isNaN(your) || isNaN(hfa)) {
        alert('Please enter BOTH "Your Team Rating" and "Home Field Advantage" first.');
        return;
    }

    for (let i = 1; i <= numGames; i++) {
        const oppStr = document.getElementById(`oppRating${i}`).value;
        const opp = parseFloat(oppStr);
        const locInput = document.querySelector(`input[name="loc${i}"]:checked`);
        const loc = locInput ? locInput.value : 'neutral';

        const spreadEl = document.getElementById(`spread${i}`);

        if (isNaN(opp)) {
            // No opponent rating provided – clear spread display
            spreadEl.textContent = '';
            spreadEl.title = '';
            continue;
        }

        let yourAdj = your;
        let oppAdj = opp;

        if (loc === 'home') {
            yourAdj += hfa;
        } else if (loc === 'away') {
            oppAdj += hfa;
        }
        // neutral => no adjustment

        const spread = oppAdj - yourAdj;
        const sign = spread > 0 ? '+' : '';
        spreadEl.textContent = `${sign}${spread.toFixed(1)}`;
        spreadEl.title = loc === 'home'
            ? `Your team at HOME (+${hfa.toFixed(1)} HFA)`
            : (loc === 'away'
                ? `Opponent at HOME (+${hfa.toFixed(1)} HFA)`
                : 'Neutral site (no HFA)');
    }
}

function calculateProbabilities() {
    const numGames = parseInt(document.getElementById('numGames').value);
    const probabilities = [];
    for (let i = 1; i <= numGames; i++) {
        const prob = parseFloat(document.getElementById(`prob${i}`).value);
        probabilities.push(prob);
    }

    const winCounts = new Array(numGames + 1).fill(0);  // Array to hold win count probabilities

    // Loop over all possible combinations (2^numGames possibilities)
    for (let i = 0; i < (1 << numGames); i++) {
        let winCount = 0;
        let prob = 1;
        for (let j = 0; j < numGames; j++) {
            if (i & (1 << j)) {  // If jth bit is set, this game is a win
                winCount++;
                prob *= probabilities[j];
            } else {
                prob *= (1 - probabilities[j]);
            }
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
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: { y: { beginAtZero: true } }
        }
    });
}

function generateReport(winCounts, numGames) {
    let report = 'Number of Wins - Exactly - At Least\n\n';
    let cumulativeProbability = 0;
    for (let i = numGames; i >= 0; i--) {
        cumulativeProbability += winCounts[i];
        report += `${i} Wins: ${(winCounts[i] * 100).toFixed(2)}% - ${(cumulativeProbability * 100).toFixed(2)}%\n`;
    }
    document.getElementById('reportOutput').textContent = report;
}

function copyToClipboard() {
    const reportText = document.getElementById('reportOutput').textContent;
    navigator.clipboard.writeText(reportText).then(() => {
        alert("Report copied to clipboard!");
    });
}

function startOver() {
    document.getElementById('numGames').value = '15';
    document.getElementById('gameInputs').innerHTML = '';

    const canvas = document.getElementById('histogram');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }

    // Clear global ratings
    const yourEl = document.getElementById('yourTeamRating');
    const hfaEl = document.getElementById('homeFieldAdv');
    if (yourEl) yourEl.value = '';
    if (hfaEl) hfaEl.value = '';

    generateInputs();
}

function clearProbabilities() {
    const numGames = document.getElementById('numGames').value;

    for (let i = 1; i <= numGames; i++) {
        document.getElementById(`prob${i}`).value = 0.5;
    }

    const canvas = document.getElementById('histogram');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
}
