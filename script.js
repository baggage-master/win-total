let chartInstance = null; // Keep track of the Chart.js instance

function generateInputs() {
    const numGames = document.getElementById('numGames').value;
    const gameInputs = document.getElementById('gameInputs');
    gameInputs.innerHTML = '';  // Clear previous inputs

    // 2025 Opponents in order
    const opponents = [
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

    // Default probabilities: first 3 = 1.0, rest = 0.5
    const defaultProbabilities = opponents.map((_, i) => (i < 3 ? 1 : 0.5));

    for (let i = 1; i <= numGames; i++) {
        const defaultOpponent = opponents[i - 1] || `Game ${i}`;
        const defaultProbability = defaultProbabilities[i - 1];
        gameInputs.innerHTML += `
            <label for="game${i}">Game ${i} Name:</label>
            <input type="text" id="game${i}Name" value="${defaultOpponent}" placeholder="Game ${i}">
            <label for="prob${i}">Probability:</label>
            <input type="number" id="prob${i}" min="0" max="1" step="0.01" value="${defaultProbability}">
            <br>`;
    }
}

