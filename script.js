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

    // Location defaults for the 12 games above: 'home' | 'away' | 'neutral'
    // (per your “at” list: away = Notre Dame, Arkansas, LSU, Missouri, Texas; rest home)
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
    const defaultProbabilities = opponents.map((name, idx) => {
        if (idx < 3) return 1.0;
        if (idx < 12) return 0.5;
        return 0.0; // blanks
    });

    for (let i = 1; i <= numGames; i++) {
        const idx = i - 1;

        const opponentName = opponents[idx] ?? `Game ${i}`;
        const defaultProbability = (defaultProbabilities[idx] !== undefined) ? defaultProbabilities[idx] : 0.5;
        const defaultLocation = locations[idx] ?? "neutral";

        // radio group name so only one can be selected per game
        const radioName = `loc${i}`;

        gameInputs.innerHTML += `
            <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
                <label for="game${i}Name"><strong>Game ${i} Name:</strong></label>
                <input type="text" id="game${i}Name" value="${opponentName}" placeholder="Game ${i}" style="margin-right: 10px;">

                <label for="prob${i}">Probability:</label>
                <input type="number" id="prob${i}" min="0" max="1" step="0.01" value="${defaultProbability}" style="width: 80px;">

                <div style="margin-top: 6px;">
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
            </div>`;
    }
}
