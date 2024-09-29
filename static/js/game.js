import { render } from './render.js';
import { preloadImages } from './imageLoader.js';
import { 
    updateScore, 
    updateRound, 
    updateGold, 
    updateLivesDisplay, 
    updateTargetScore } from './ui.js';
import { handleMouseUp, handleMouseMove } from './input.js';
import { gameState, getActiveDeck } from './gameState.js';
import { attachEventListeners } from './events.js';
import { 
    ALL_PIECE_TYPES, 
    SHOP_ITEMS,
    CHARACTER_FAMILIES, 
    CANVAS_WIDTH, 
    CANVAS_HEIGHT,
    BOUNCE_FACTOR,
    END_ROUND_COOLDOWN,
    LEFT_WALL,
    RIGHT_WALL } from './config.js';  
import { 
    snapshotStaticDeck, 
    checkActiveDeck, 
    endRound, 
    nextRoundPhase1, 
    nextRoundPhase2, 
    initializeRound, 
    spawnPiece,
    initDeck
 } from './rounds.js';
import { startBackgroundMusic, launchSound, playSound, gameOver } from './audio.js'; // {{ edit_1 }} Import launchSound
import { applyGravity, updateRotation, handleWallCollisions, checkMerge, handleCollision } from './physics.js';
import { updateRefreshButtonState } from './shop.js';

// Define callback functions
function resumeGame() {
    if (isPaused) {
        isPaused = false;
        gameState.gameOverDiv.classList.add('hidden');
        initGame();
        gameState.lastTime = performance.now(); // Reset lastTime
        gameLoop(); // Resume the game loop
        startBackgroundMusic(gameState.backgroundMusic); // Play background music
        console.log("Game resumed.");
    }
}

function toggleMute(backgroundMusic, muteButton) {
    toggleBackgroundMusic(backgroundMusic, muteButton);
}

function quitGame() {
    console.log("Quitting game. Reloading page.");
    location.reload();
}

function restartGame() {
    console.log("Restarting game...");
    gameState.gameOverDiv.classList.add('hidden');
    initGame();
}

function startGame() {
    gameState.isPaused = false; // Unpause the game
    gameState.lastTime = performance.now(); // Reset lastTime 
    gameLoop(); // Resume the game loop
    startBackgroundMusic(gameState.backgroundMusic); // Play background music
}

// Initialize the game
export async function initGame() {
    console.log(">>> Function: initGame() - Initializing the game.");

    // Cancel any existing animation frames to prevent multiple game loops
    if (gameState.animationId) {
        cancelAnimationFrame(gameState.animationId);
        console.log("Previous game loop canceled.");
    }

    if (!gameState.canvas) {
        console.error("Game Canvas element not found!");
        return;
    }
    const ctx = gameState.canvas.getContext('2d');
    gameState.canvas.width = CANVAS_WIDTH;
    gameState.canvas.height = CANVAS_HEIGHT;
    console.log(`Initialized canvas with width ${CANVAS_WIDTH} and height ${CANVAS_HEIGHT}.`);

    // Reset all game data to original state
    gameState.pieces = [];
    gameState.staticDeck = [];
    gameState.currentPiece = null;
    gameState.lives = 3;
    gameState.score = 0;
    gameState.round = 1;
    gameState.gold = 0;
    gameState.gameOver = false;
    gameState.targetScore = 0;
    gameState.lastTime = performance.now();
    gameState.animationId = null;
    gameState.lastThrowTime = 0;

    updateTargetScore();
    updateScore();
    updateRound();
    updateGold();
    updateLivesDisplay();

    // Attach event listeners with callbacks to prevent circular dependency
    attachEventListeners({
        resumeGame,
        toggleMute,
        quitGame,
        restartGame,
        startGame
    });

    gameState.canvas.addEventListener('mouseup', (e) => {
        handleMouseUp(
            e,
            gameState.currentPiece,
            gameState.canvas,
            gameState.pieces,
            spawnPiece,
            launchSound, // {{ edit_2 }} Pass launchSound
            gameState.lastThrowTime // {{ edit_2 }} Pass lastThrowTime
        );
    });    

    gameState.canvas.addEventListener('mousemove', (e) => {
        const pos = handleMouseMove(e, gameState.canvas);
        gameState.aimX = pos.x;
        gameState.aimY = pos.y;
    });

    // Initialize deck before image loading
    console.log("Initializing deck...");
    initDeck();
    console.log("Taking a snapshot of the static deck...");
    snapshotStaticDeck(); // Take a snapshot after initial deck setup
    console.log("Initializing round...");
    initializeRound();

    // Add walls to the game state
    gameState.walls = [LEFT_WALL, RIGHT_WALL];

    // Preload all images and wait for them to load
    try {
        console.log("Preloading images...");
        const cache1 = await preloadImages(ALL_PIECE_TYPES);
        const cache2 = await preloadImages(CHARACTER_FAMILIES.animals.characters);
        const cache3 = await preloadImages(CHARACTER_FAMILIES.fruits.characters);
        const cache4 = await preloadImages(CHARACTER_FAMILIES.celestials.characters);
        
        // Merge caches
        gameState.imageCache = { ...cache1, ...cache2, ...cache3, ...cache4 };
        console.log("Images preloaded successfully.");

        // Start the game loop after images are loaded
        console.log("Starting game loop.");
        gameLoop();

        // Start background music
        startBackgroundMusic(gameState.backgroundMusic); // Pass the background music element
        console.log("Background music started.");

        const startMenu = document.getElementById('start-menu');
        startMenu.classList.remove('hidden');
        gameState.isPaused = true;
        console.log("Start menu displayed. Game is paused.");

    } catch (error) {
        console.error("Error preloading images:", error);
    }
}

// Main game loop
export function gameLoop(currentTime = performance.now()) {

    if (gameState.gameOver) {
        console.log(">>> Game Over detected. Exiting game loop.");
        return;
    }

    if (gameState.isPaused) {
        gameState.lastTime = currentTime;
    } else {
        const deltaTime = (currentTime - gameState.lastTime + 1e-16) / 1000; // Avoid division by zero
        gameState.lastTime = currentTime;

        update(deltaTime);

        const ctx = gameState.canvas.getContext('2d'); // Get the Canvas 2D Context
        const pieces = gameState.pieces;
        const currentPiece = gameState.currentPiece;
        const particles = gameState.particles; // Ensure particles are defined in gameState
        const imageCache = gameState.imageCache;
        const config = { 
            CANVAS_WIDTH, 
            CANVAS_HEIGHT, 
            aimX: gameState.aimX, 
            aimY: gameState.aimY,
            debugMode: gameState.debugMode,
            selectedPiece: gameState.selectedPiece,
            deckCount: gameState.deckCount,
            walls: gameState.walls
        };

        render(ctx, pieces, currentPiece, particles, imageCache, config);

        checkActiveDeck(); // **Check if Active Deck is empty**

        // Optionally, log the current score and round every second
        if (Math.floor(currentTime / 1000) !== Math.floor(gameState.lastTime / 1000)) {
            console.log(`Time: ${Math.floor(currentTime / 1000)}s | Score: ${gameState.score} | Round: ${gameState.round}`);
        }
    }

    gameState.animationId = requestAnimationFrame(gameLoop);
}

// Updated update function to separate physics and collision handling
export function update(deltaTime) {

    if (isNaN(deltaTime) || deltaTime <= 0) {
        console.warn("Invalid deltaTime detected. Skipping update.");
        return;
    }

    // First pass: Apply physics to all pieces
    for (let i = 0; i < gameState.pieces.length; i++) {
        const piece = gameState.pieces[i];

        if (piece.merging || piece.isAtRest || piece.isStatic) continue;

        applyGravity(piece, deltaTime);
        piece.x += piece.vx * deltaTime;
        piece.y += piece.vy * deltaTime;
        updateRotation(piece, deltaTime);

        // Floor collision
        if (piece.y + piece.attributes.radius > CANVAS_HEIGHT) {
            piece.y = CANVAS_HEIGHT - piece.attributes.radius;
            piece.vy *= -BOUNCE_FACTOR;

            // If the piece is Rabbit and has jumped, reset the hasJumped flag
            if (piece.name === "Rabbit" && piece.hasJumped) {
                piece.hasJumped = true; 
            }
        }

        // Wall collisions
        if (piece.x - piece.attributes.radius < 0) {
            piece.x = piece.attributes.radius;
            piece.vx *= -BOUNCE_FACTOR;
        } else if (piece.x + piece.attributes.radius > CANVAS_WIDTH) {
            piece.x = CANVAS_WIDTH - piece.attributes.radius;
            piece.vx *= -BOUNCE_FACTOR;
        }

        // Collision with container walls
        handleWallCollisions(piece);
    }

    // Second pass: Handle collisions
    for (let i = 0; i < gameState.pieces.length; i++) {
        const piece1 = gameState.pieces[i];

        if (!piece1 || piece1.merging || piece1.isAtRest || piece1.isStatic) continue;

        for (let j = i + 1; j < gameState.pieces.length; j++) {
            const piece2 = gameState.pieces[j];
            if (!piece2 || piece2.merging || piece2.isAtRest || piece2.isStatic) continue;

            if (handleCollision(piece1, piece2)) {
                checkMerge(piece1, piece2);
            }
        }
    }

    // Remove merged pieces
    gameState.pieces = gameState.pieces.filter(piece => !piece.merged);

    // Check game over condition
    if (gameState.pieces.some(piece => piece.y - piece.attributes.radius <= 0)) {
        endGame();
    }

    // Check for round completion
    if (getActiveDeck().length === 0 && performance.now() - gameState.lastThrowTime >= END_ROUND_COOLDOWN) {
        console.log("All pieces are at rest and deck is empty. Ending round.");
        endRound();
    }

}

export function resetGame() {
    if (lives > 1) {
        lives -= 1;
        updateLivesDisplay();
        gold += Math.min(3 + round, 10);
        updateGold();   

        // Get four random shop items
        const shopItems = getRandomShopItems(ALL_PIECE_TYPES, SHOP_ITEMS);

        openShop(
            shop,
            staticDeck,  // Pass the current deck
            purchasedBalls,  // Pass the inventory (purchased balls)
            shopItems,  // Pass the shop items
            (value) => { isPaused = value; },
            () => { cancelAnimationFrame(gameState.animationId); },
            imageCache
        );
    } else {
        endGame();
    }
    // After any code that might change the gold amount
    updateRefreshButtonState();
}

// Handle game over
export function endGame() {
    if (lives > 1) {
        resetGame(); // Function to reset the game state without ending it
    } else {
        gameState.gameOver = true;
        cancelAnimationFrame(gameState.animationId);
        playSound(gameOver); // Use the imported mergeSound
        document.getElementById('final-score').textContent = gameState.score;
        gameState.gameOverDiv.classList.remove('hidden');
        gameState.backgroundMusic.pause();
    }
}
