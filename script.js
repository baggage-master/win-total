let chartInstance = null; // Keep track of the Chart.js instance

function generateInputs() {
    const numGames = document.getElementById('numGames').value;
    const gameInputs = document.getElementById('gameInputs');
    gameInputs.innerHTML = '';  // Clear previous inputs

    // List of 2024 Texas A&M opponents in the correct order
    const opponents = [
        "Notre Dame",         // Game 1
        "McNeese",            // Game 2
        "Florida",            // Game 3
        "Bowling Green",      // Game 4
        "Arkansas",           // Game 5 (neutral site)
        "Missouri",           // Game 6
        "Mississippi State",  // Game 7
        "LSU",                // Game 8
        "South Carolina",     // Game 9
        "New Mexico State",   // Game 10
        "Auburn",             // Game 11
        "Texas"               // Game 12
    ];

    // Set default probabilities for specific games
    const defaultProbabilities = [0, 1, 1];  // Game 1: 0, Game 2: 1, Game 3: 1

    for (let i = 1; i <= numGames; i++) {
        const defaultOpponent = opponents[i - 1] || `Game ${i}`; // Use "Game X" if out of range
        const defaultProbability = defaultProbabilities[i - 1] !== undefined ? defaultProbabilities[i - 1] : 0.5;  // Use 0.5 if not specified
        gameInputs.innerHTML += `
            <label for="game${i}">Game ${i} Name:</label>
            <input type="text" id="game${i}Name" value="${defaultOpponent}" placeholder="Game ${i}">
            <label for="prob${i}">Probability:</label>
            <input type="number" id="prob${i}" min="0" max="1" step="0.01" value="${defaultProbability}">
            <br>`;
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
}

function generateHistogram(winCounts) {
    const ctx = document.getElementById('histogram').getContext('2d');
    
    // Destroy previous chart instance if it exists
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Create a new chart
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
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Function to reset all inputs and start over
function startOver() {
    // Reset the number of games dropdown to 12
    document.getElementById('numGames').value = '12';

    // Clear the dynamically generated inputs
    document.getElementById('gameInputs').innerHTML = '';

    // Clear the chart
    const canvas = document.getElementById('histogram');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Destroy the chart instance if it exists
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }

    // Re-trigger the input generation for 12 games (default)
    generateInputs();
}

// Function to clear probabilities and reset them to 0.5
function clearProbabilities() {
    const numGames = document.getElementById('numGames').value;

    // Reset all probabilities to 0.5
    for (let i = 1; i <= numGames; i++) {
        document.getElementById(`prob${i}`).value = 0.5;
    }

    // Clear the chart
    const canvas = document.getElementById('histogram');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Destroy the chart instance if it exists
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
}
