import { toggleBackgroundMusic, startBackgroundMusic } from './audio.js';
import { handleMouseMove, handleMouseUp } from './input.js';
import { gameState } from './gameState.js';
import { ALL_PIECE_TYPES } from './config.js';
import { initDeck, spawnPiece } from './rounds.js';
import { updateGold } from './ui.js';
import { closeShop } from './shop.js'; // Add this import

export function attachEventListeners(callbacks) {
    const {
        backgroundMusic,
        shopItemsContainer,
        gameOverDiv,
    } = gameState;

    const { 
        resumeGame, 
        toggleMute, 
        quitGame, 
        restartGame, 
        startGame 
    } = callbacks;

    // Event listeners for pause menu buttons
    if (gameState.resumeButton) {
        gameState.resumeButton.addEventListener('click', () => {
            resumeGame();
            console.log("Resumed game from pause menu.");
        });
    } else {
        console.error("Resume button not found in the DOM");
    }

    if (gameState.muteButton) {
        gameState.muteButton.addEventListener('click', () => {
            toggleMute(backgroundMusic, gameState.muteButton);
        });
    } else {
        console.error("Mute button not found in the DOM");
    }

    if (gameState.quitButton) {
        gameState.quitButton.addEventListener('click', () => {
            quitGame();
            console.log("Quitting game. Reloading page.");
            location.reload();
        });
    } else {
        console.error("Quit button not found in the DOM");
    }

    if (gameState.restartButton) {
        gameState.restartButton.addEventListener('click', () => {
            restartGame();
            console.log("Restarting game...");
            gameOverDiv.classList.add('hidden');
            initGame();
        });
    } else {
        console.error("Restart button not found in the DOM");  
    }
    
    if (gameState.startButton) {
        gameState.startButton.addEventListener('click', () => {
            const startMenu = document.getElementById('start-menu');
            startMenu.classList.add('hidden'); // Hide the start menu
            gameState.isPaused = false; // Unpause the game
            gameState.lastTime = performance.now(); // Reset lastTime 
            startGame(); // Resume the game loop and other start actions
            startBackgroundMusic(gameState.backgroundMusic); // Play background music
        });
    } else {
        console.error("Start button not found in the DOM");
    }

    // Removed redundant canvas event listeners as they should be handled in game.js
    // If needed, pass them as callbacks as well

    if (gameState.closeShopButton) {
        gameState.closeShopButton.addEventListener('click', () => {
            closeShop(
                (value) => { gameState.isPaused = value; },
                initDeck,
                spawnPiece
            );
        });
    } else {
        console.error("Close shop button not found in the DOM");
    }

    // Attach keydown listener to the global window object for debug mode
    window.addEventListener('keydown', (e) => {
        if (e.key === 'd' || e.key === 'D') {
            gameState.debugMode = !gameState.debugMode;
            console.log(`Debug mode ${gameState.debugMode ? 'enabled' : 'disabled'}.`);
            if (gameState.debugMode) {
                // Select the current piece for monitoring
                gameState.selectedPiece = gameState.currentPiece;
                console.log(`Selected piece for force monitoring: ${gameState.selectedPiece ? gameState.selectedPiece.name : 'None'}`);
            } else {
                gameState.selectedPiece = null;
            }
        }
    });
}

