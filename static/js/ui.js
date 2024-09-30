import { gameState } from './gameState.js';
import { nextRoundPhase1 } from './rounds.js';
import { restartGame } from './game.js';

// Update score and round displays
export function updateScore() {
    // Changed from 'score' to 'gameState.score'
    document.getElementById('score').textContent = gameState.score;
}

export function updateRound() {
    // Changed from 'round' to 'gameState.round'
    document.getElementById('round').textContent = gameState.round;
}

export function updateGold() {
    const goldElement = document.getElementById('gold');
    const shopGoldElement = document.getElementById('shop-gold-count');
    
    if (goldElement) {
        goldElement.textContent = gameState.gold;
    }
    
    if (shopGoldElement) {
        shopGoldElement.textContent = gameState.gold;
    }
}

export function deductGold(amount) {
    // Changed from 'gold' to 'gameState.gold'
    gameState.gold -= amount;
    updateGold();
}

export function updateTargetScore() {
    // Changed from using a standalone 'targetScore' to 'gameState.targetScore'
    document.getElementById('target-score').textContent = gameState.targetScore;
}

// Update the lives display
export function updateLivesDisplay() {
    const livesContainer = document.getElementById('lives');
    livesContainer.innerHTML = ''; // Clear existing hearts

    // Changed from 'lives' to 'gameState.lives'
    for (let i = 0; i < gameState.lives; i++) {
        const heartImg = document.createElement('img');
        heartImg.src = '/static/images/heart/heart.png'; // Path to your heart image
        heartImg.alt = 'Heart';
        heartImg.classList.add('heart');
        livesContainer.appendChild(heartImg);
    }
}

// Update deck count whenever the deck is modified
export function updateDeckCount() {
    const deckCount = gameState.activeDeck.length;
    // console.log(`Active deck count: ${deckCount}`);
    // Update the UI to display the new deck count
    const deckCountElement = document.getElementById('deck-count');
    if (deckCountElement) {
        deckCountElement.textContent = deckCount;
    }
    // console.log(`Updated deck count: ${deckCount}`);
}

export function showRoundEndScreen(baseReward, familyBonus, totalReward, isWin) {
    const roundEndScreen = document.createElement('div');
    roundEndScreen.id = 'round-end-screen';
    
    if (isWin) {
        roundEndScreen.innerHTML = `
            <h2>Round Complete!</h2>
            <p>Base Reward: ${baseReward} coins</p>
            <p>Family Bonus: ${familyBonus} coins</p>
            <p>Total Reward: ${totalReward} coins</p>
            <button id="continue-button">Continue to Shop</button>
        `;
    } else {
        roundEndScreen.innerHTML = `
            <h2>Round Lost</h2>
            <p>You didn't reach the target score.</p>
            <p>You scored ${gameState.score} points.</p>
            <p>The target score was ${gameState.targetScore} points.</p>
            <p>Try again!</p>
            <button id="retry-button">Retry</button>
        `;
    }
    
    document.body.appendChild(roundEndScreen);

    const actionButton = isWin ? document.getElementById('continue-button') : document.getElementById('retry-button');
    actionButton.addEventListener('click', () => {
        roundEndScreen.remove();
        if (isWin) {
            nextRoundPhase1();
        } else {
            retryRound();
        }
    });
}

// Add this new function for the Round Lost screen
export function showRoundLostScreen() {
    showRoundEndScreen(0, 0, 0, false);
}

// Add this new function to handle retrying the round
function retryRound() {
    restartGame();
}


// Add this function to the file
export function updateRedGlow(isActive) {
    const gameContainer = document.getElementById('game-container');
    if (isActive) {
        gameContainer.classList.add('red-glow');
    } else {
        gameContainer.classList.remove('red-glow');
    }
}