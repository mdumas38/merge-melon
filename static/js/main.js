// main.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, ALL_PIECE_TYPES, THROW_COOLDOWN, SPAWN_Y, POWER_SCALING_FACTOR, POWER_MULTIPLIER, MAX_VELOCITY, END_ROUND_COOLDOWN, BOUNCE_FACTOR, FRICTION, INITIAL_DECK_VALUES } from './config.js';
import { createPiece, shuffleArray } from './piece.js';
import { applyGravity, applyFriction, handleCollision, updateRotation } from './physics.js';
import { render, drawTrajectoryLines } from './render.js';
import { handleMouseMove, handleMouseUp } from './input.js';
import { openShop, closeShop } from './shop.js';
import { playSound, toggleBackgroundMusic } from './audio.js';

// Game variables
let canvas, ctx, pieces, currentPiece, score, round, gameOver, targetScore;
let lastTime, animationId;
let aimX, aimY;
let particles = [];
let lastThrowTime = 0;
let deck = [];
let purchasedBalls = [];
let gold = 0;

const backgroundMusic = document.getElementById('background-music');
const pauseMenu = document.getElementById('pause-menu');
const resumeButton = document.getElementById('resume-button');
const muteButton = document.getElementById('mute-button');
const quitButton = document.getElementById('quit-button');
const shop = document.getElementById('shop');
const shopItemsContainer = document.getElementById('shop-items');
const closeShopButton = document.getElementById('close-shop-button');
const restartButton = document.getElementById('restart-button');
const gameOverDiv = document.getElementById('game-over');

let isPaused = false;
let animationScale = 1;
let imageCache = {};

// Audio files
const mergeSound = new Audio('/static/audio/merge.mp3');
const launchSound = new Audio('/static/audio/drop.mp3');
const gameOverSound = new Audio('/static/audio/gameover.mp3');

// Preload images
function preloadImages(characters) {
    characters.forEach(character => {
        const faceImg = new Image();
        faceImg.src = character.faceImage;
        imageCache[`${character.name}_face`] = faceImg;

        const earsImg = new Image();
        earsImg.src = character.earsImage;
        imageCache[`${character.name}_ears`] = earsImg;
    });
}

// Initialize the deck


function initDeck() {
    console.log("Initializing deck...");
    console.log(`Current deck length before initialization: ${deck.length}`);
    console.log(`Current purchasedBalls: [${purchasedBalls.map(item => item.name).join(', ')}]`);

    // If the deck is empty, initialize it
    if (deck.length === 0) {
        // Add initial pieces based on INITIAL_DECK_VALUES
        for (let i = 0; i < INITIAL_DECK_VALUES.length; i++) {
            const randomIndex = Math.floor(Math.random() * ALL_PIECE_TYPES.length);
            const character = ALL_PIECE_TYPES[randomIndex];
            deck.push(createPiece(character));
            console.log(`Added ${character.name} to deck.`);
        }
    }

    // Add any newly purchased balls to the deck
    deck = [...deck, ...purchasedBalls];
    console.log(`Added ${purchasedBalls.length} purchased item(s) to deck.`);
    purchasedBalls = []; // Clear the purchased balls array

    // Shuffle the deck
    shuffleArray(deck);
    console.log(`Shuffled deck: [${deck.map(piece => piece.name).join(', ')}]`);

    console.log("Updated deck after initialization:", deck);

    // If the deck is still empty after initialization, add a default piece
    if (deck.length === 0) {
        console.warn("Deck is empty after initialization. Adding default piece.");
        const defaultPiece = ALL_PIECE_TYPES[0];
        deck.push(createPiece(defaultPiece));
        console.log(`Added default piece: ${defaultPiece.name} to deck.`);
    }

    console.log("Deck during initDeck:", deck);
    console.log("Purchased Balls during initDeck:", purchasedBalls);
    console.log("ALL_PIECE_TYPES:", ALL_PIECE_TYPES);
}

// Initialize the game
function init() {
    canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error("Game Canvas element not found!");
        return;
    }
    ctx = canvas.getContext('2d');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    console.log(`Initialized canvas with width ${CANVAS_WIDTH} and height ${CANVAS_HEIGHT}.`);

    pieces = [];
    score = 0;
    round = 1;
    gameOver = false;
    targetScore = 1;

    updateTargetScore();
    preloadImages(ALL_PIECE_TYPES);
    updateScore();
    updateRound();

    canvas.addEventListener('mousemove', (e) => {
        const pos = handleMouseMove(e, canvas);
        aimX = pos.x;
        aimY = pos.y;
    });

    canvas.addEventListener('mouseup', (e) => {
        handleMouseUp(e, currentPiece, canvas, {
            THROW_COOLDOWN,
            POWER_SCALING_FACTOR,
            POWER_MULTIPLIER,
            MAX_VELOCITY
        }, pieces, spawnPiece, launchSound, lastThrowTime, (time) => lastThrowTime = time);
    });

    initDeck();
    spawnPiece();

    lastTime = performance.now();
    console.log("Starting game loop...");
    gameLoop();
    startBackgroundMusic();

    isPaused = false;
    pauseMenu.style.display = 'none';
    shop.classList.add('hidden');

    document.addEventListener('keydown', (e) => {
        if (e.key === 'p' || e.key === 'P') {
            togglePause();
            console.log(`Game ${isPaused ? 'paused' : 'resumed'}.`);
        }
    });

    // Event listeners for pause menu buttons
    resumeButton.addEventListener('click', () => {
        resumeGame();
        console.log("Resumed game from pause menu.");
    });
    muteButton.addEventListener('click', () => toggleBackgroundMusic(backgroundMusic, muteButton));
    quitButton.addEventListener('click', () => {
        console.log("Quitting game. Reloading page.");
        location.reload();
    });

    // Event listener for closing the shop
    closeShopButton.addEventListener('click', () => {
        closeShop(shop, 
            (value) => { isPaused = value; },
            initDeck,
            spawnPiece,
            () => {
                lastTime = performance.now();
                gameLoop();
            }
        );
        console.log("Closed shop window.");
        nextRoundPhase2();
    });

    // Event listener for restarting the game
    restartButton.addEventListener('click', () => {
        console.log("Restarting game...");
        gameOverDiv.classList.add('hidden');
        init();
    });
}

// Start background music
function startBackgroundMusic() {
    backgroundMusic.play().catch(error => {
        console.log("Audio play failed:", error);
        document.addEventListener('click', () => {
            backgroundMusic.play().catch(e => console.log("Audio play failed again:", e));
        }, { once: true });
    });
}

// Pause the game
function pauseGame() {
    if (!isPaused) {
        isPaused = true;
        pauseMenu.style.display = 'block';
        cancelAnimationFrame(animationId);
        backgroundMusic.pause();

        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
    }
}

// Resume the game
function resumeGame() {
    if (isPaused) {
        isPaused = false;
        pauseMenu.style.display = 'none';
        lastTime = performance.now();
        gameLoop();
        backgroundMusic.play().catch(e => console.log("Audio resume failed:", e));

        canvas.addEventListener('mousemove', (e) => {
            const pos = handleMouseMove(e, canvas);
            aimX = pos.x;
            aimY = pos.y;
        });

        canvas.addEventListener('mouseup', (e) => {
            handleMouseUp(e, currentPiece, canvas, {
                THROW_COOLDOWN,
                POWER_SCALING_FACTOR,
                POWER_MULTIPLIER,
                MAX_VELOCITY
            }, pieces, spawnPiece, launchSound, lastThrowTime, (time) => lastThrowTime = time);
        });
    }
}

// Toggle pause state
function togglePause() {
    if (isPaused) {
        resumeGame();
    } else {
        pauseGame();
    }
}

// Spawn a new piece
function spawnPiece() {
    if (deck.length > 0) {
        const pieceFromDeck = deck.shift();
        console.log(`Spawning piece from deck: ${pieceFromDeck.name} (Value: ${pieceFromDeck.attributes.value})`);

        currentPiece = {
            ...pieceFromDeck,
            x: CANVAS_WIDTH / 2,
            y: SPAWN_Y + pieceFromDeck.attributes.radius,
            vx: 0,
            vy: 0,
            rotation: 0,
            isAtRest: false,
        };
    } else {
        currentPiece = null;
        console.log("No more pieces to spawn.");
    }
}

// Main game loop
function gameLoop(currentTime) {
    if (gameOver) {
        console.log("Game Over!");
        return;
    }

    if (isPaused) {
        lastTime = currentTime;
    } else {
        const deltaTime = (currentTime - lastTime + 1e-16) / 1000; // Avoid division by zero
        lastTime = currentTime;

        update(deltaTime);
        render(ctx, pieces, currentPiece, particles, imageCache, {
            CANVAS_WIDTH,
            CANVAS_HEIGHT,
            aimX,
            aimY,
            drawTrajectoryLines,
        });

        // Optionally, log the current score and round every second
        if (Math.floor(currentTime / 1000) !== Math.floor(lastTime / 1000)) {
            console.log(`Time: ${Math.floor(currentTime / 1000)}s | Score: ${score} | Round: ${round}`);
        }
    }

    animationId = requestAnimationFrame(gameLoop);
}

// Check for merges
export function checkMerge(existingPiece, releasedPiece) {
    console.log(`Attempting to merge: ${existingPiece.name} (Value: ${existingPiece.attributes.value}) & ${releasedPiece.name} (Value: ${releasedPiece.attributes.value})`);

    if (
        existingPiece.attributes.value === releasedPiece.attributes.value &&
        !existingPiece.merging &&
        !releasedPiece.merging
    ) {
        const newPieceType = ALL_PIECE_TYPES.find(
            (pt) => pt.attributes.value === existingPiece.attributes.value * 2
        );

        if (newPieceType) {
            console.log(`Found new piece type for merging: ${newPieceType.name} (Value: ${newPieceType.attributes.value})`);
            startMergeAnimation(existingPiece, releasedPiece, newPieceType);
            score += newPieceType.attributes.value;
            updateScore();
            playSound(mergeSound); // Use the playSound function from audio.js
        } else {
            console.warn(`No piece found with value ${existingPiece.attributes.value * 2} to merge into.`);
        }
    } else {
        if (existingPiece.attributes.value !== releasedPiece.attributes.value) {
            console.log(`Cannot merge: Different values (${existingPiece.attributes.value} vs ${releasedPiece.attributes.value}).`);
        }
        if (existingPiece.merging || releasedPiece.merging) {
            console.log(`Cannot merge: One or both pieces are already merging.`);
        }
    }
}

// Update game state
function update(deltaTime) {
    if (isNaN(deltaTime) || deltaTime <= 0) {
        return;
    }

    for (let i = 0; i < pieces.length; i++) {
        const piece = pieces[i];

        if (piece.merging || piece.isAtRest) continue;

        applyGravity(piece, deltaTime);
        piece.x += piece.vx * deltaTime;
        piece.y += piece.vy * deltaTime;
        applyFriction(piece);
        updateRotation(piece, deltaTime);

        // Floor collision
        if (piece.y + piece.attributes.radius > CANVAS_HEIGHT) {
            piece.y = CANVAS_HEIGHT - piece.attributes.radius;
            if (piece.ability === "Bounce Boost") {
                piece.vy *= -BOUNCE_FACTOR * 1.5; // Corrected from BOUT_CHANT_FACTOR
                displayAbilityEffect(piece);
            } else {
                piece.vy *= -BOUNCE_FACTOR; // Corrected from BOUT_CHANT_FACTOR
            }
            piece.vx *= FRICTION;
        }

        // Wall collisions
        if (piece.x - piece.attributes.radius < 0) {
            piece.x = piece.attributes.radius;
            piece.vx *= -BOUNCE_FACTOR;
            piece.vy *= FRICTION;
        } else if (piece.x + piece.attributes.radius > CANVAS_WIDTH) {
            piece.x = CANVAS_WIDTH - piece.attributes.radius;
            piece.vx *= -BOUNCE_FACTOR;
            piece.vy *= FRICTION;
        }

        // Check collisions with other pieces
        for (let j = i + 1; j < pieces.length; j++) {
            const otherPiece = pieces[j];
            if (handleCollision(piece, otherPiece)) {
                // After resolving collision, check for merges
                checkMerge(piece, otherPiece);
            }
        }
    }

    // Remove merged pieces
    pieces = pieces.filter(piece => !piece.merged);

    // Check game over condition
    if (pieces.some(piece => piece.y - piece.attributes.radius <= 0)) {
        endGame();
    }

    // Check for round completion
    if (deck.length === 0 && performance.now() - lastThrowTime >= END_ROUND_COOLDOWN && !currentPiece) {
        console.log("All pieces are at rest and deck is empty. Opening shop...");
        nextRoundPhase1();
    }
}

// Display ability effect (e.g., glow around the piece)
function displayAbilityEffect(piece) {
    // Example implementation
    // You can extend this with more visual effects
    console.log(`Ability ${piece.ability} activated for ${piece.name}`);
    // Add logic to visually show the ability effect
}

// Update score and round displays
function updateScore() {
    document.getElementById('score').textContent = score;
}

function updateRound() {
    document.getElementById('round').textContent = round;
}

function updateGold() {
    document.getElementById('gold').textContent = gold;
}

function updateTargetScore() {
    document.getElementById('target-score').textContent = targetScore;
}

// Handle game over
function endGame() {
    gameOver = true;
    cancelAnimationFrame(animationId);
    gameOverSound.play();
    document.getElementById('final-score').textContent = score;
    gameOverDiv.classList.remove('hidden');
    backgroundMusic.pause();
}

// Handle round progression
function nextRoundPhase1() {
    if (score >= targetScore) {
        gold += 50;
        updateGold();
        round++;
        updateRound();
        targetScore = targetScore * 2;
        updateTargetScore();
        openShop(shop, shopItemsContainer, ALL_PIECE_TYPES, 
            (value) => { isPaused = value; },
            () => { cancelAnimationFrame(animationId); }
        );
    } else {
        endGame();
    }
}

function nextRoundPhase2() {
    console.log("Initializing deck for the next round...");
    initDeck();
    spawnPiece();
}

// Event listener for purchasing items
shopItemsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('buy-button')) {
        const itemIndex = e.target.getAttribute('data-index');
        const item = ALL_PIECE_TYPES[itemIndex];

        console.log(`Attempting to buy item: ${item.name}, Cost: ${item.attributes.cost}`);

        if (gold >= item.attributes.cost) {
            gold -= item.attributes.cost;
            updateGold();

            // Add the purchased character to ALL_PIECE_TYPES
            ALL_PIECE_TYPES.push(item);

            // **Add the purchased item to purchasedBalls to replenish the deck in the next round**
            purchasedBalls.push(item);

            // Disable the button
            e.target.disabled = true;
            e.target.textContent = 'Purchased';
        } else {
            alert('Insufficient gold to purchase this item.');
        }
    }
});

// Add the startMergeAnimation function to handle merging of pieces
function startMergeAnimation(existingPiece, releasedPiece, newPieceType) {
    console.log(`Starting merge animation: ${existingPiece.name} + ${releasedPiece.name} -> ${newPieceType.name}`);

    // Mark both pieces as merging to prevent further interactions
    existingPiece.merging = true;
    releasedPiece.merging = true;

    // Create the new merged piece at the average position of the two
    const mergedPiece = createPiece(newPieceType);
    mergedPiece.x = (existingPiece.x + releasedPiece.x) / 2;
    mergedPiece.y = (existingPiece.y + releasedPiece.y) / 2;

    // Optionally, add visual effects or animations here

    // Add the merged piece after a short delay to allow animations
    setTimeout(() => {
        pieces.push(mergedPiece);
        console.log(`Merged into new piece: ${mergedPiece.name} at (${mergedPiece.x}, ${mergedPiece.y})`);

        // Remove the original pieces from the game
        pieces = pieces.filter(piece => piece !== existingPiece && piece !== releasedPiece);
        console.log(`Removed merged pieces: ${existingPiece.name} & ${releasedPiece.name}`);
    }, 500); // Adjust the delay as needed for animations
}

// Initial setup function
init();