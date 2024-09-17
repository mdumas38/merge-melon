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
    deck = [];

    for (let i = 0; i < INITIAL_DECK_VALUES.length; i++) {
        const randomIndex = Math.floor(Math.random() * ALL_PIECE_TYPES.length);
        const character = ALL_PIECE_TYPES[randomIndex];
        deck.push(createPiece(character));
    }

    deck = shuffleArray([...deck, ...purchasedBalls]);

    console.log("Initialized deck:", deck);

    if (deck.length === 0) {
        console.warn("Deck is empty after initialization. Adding default piece.");
        const defaultPiece = ALL_PIECE_TYPES[0];
        deck.push(createPiece(defaultPiece));
    }
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

    pieces = [];
    score = 0;
    round = 1;
    gameOver = false;
    targetScore = 0;

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

    gameLoop();
    startBackgroundMusic();

    isPaused = false;
    pauseMenu.style.display = 'none';
    shop.classList.add('hidden');

    document.addEventListener('keydown', (e) => {
        if (e.key === 'p' || e.key === 'P') {
            togglePause();
        }
    });

    // Event listeners for pause menu buttons
    resumeButton.addEventListener('click', resumeGame);
    muteButton.addEventListener('click', () => toggleBackgroundMusic(backgroundMusic, muteButton));
    quitButton.addEventListener('click', () => {
        location.reload();
    });

    // Event listener for closing the shop
    closeShopButton.addEventListener('click', () => {
        closeShop(shop);
        nextRoundPhase2();
    });

    // Event listener for restarting the game
    restartButton.addEventListener('click', () => {
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
        console.log('Spawning piece:', pieceFromDeck);

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
    if (gameOver) return;

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
    }

    animationId = requestAnimationFrame(gameLoop);
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
        targetScore += 50;
        updateTargetScore();
        openShop(shop, shopItemsContainer, ALL_PIECE_TYPES);
    } else {
        endGame();
    }
}

function nextRoundPhase2() {
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

            // Add the purchased character to spawnablePieceTypes
            ALL_PIECE_TYPES.push(item);

            // Disable the button
            e.target.disabled = true;
            e.target.textContent = 'Purchased';
        } else {
            alert('Insufficient gold to purchase this item.');
        }
    }
});

// Initial setup function
init();