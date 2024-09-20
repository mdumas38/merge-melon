// main.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, ALL_PIECE_TYPES, THROW_COOLDOWN, SPAWN_Y, 
    POWER_SCALING_FACTOR, POWER_MULTIPLIER, MAX_VELOCITY, END_ROUND_COOLDOWN, 
    BOUNCE_FACTOR, FRICTION, INITIAL_DECK_VALUES, CHARACTER_FAMILIES, CONTAINER } from './config.js';
import { createPiece, shuffleArray } from './piece.js';
import { applyGravity, applyFriction, handleCollision, updateRotation } from './physics.js';
import { render, drawTrajectoryLines } from './render.js';
import { handleMouseMove, handleMouseUp } from './input.js';
import { openShop, closeShop } from './shop.js';
import { playSound, toggleBackgroundMusic } from './audio.js';
import { preloadImages } from './imageLoader.js';
import { getRandomShopItems } from './helper.js';
// Game variables
let canvas, ctx, pieces, currentPiece, score, round, gameOver, targetScore;
let lastTime, animationId;
let aimX, aimY;
let particles = [];
let lastThrowTime = 0;
let deck = [];
let initialDeck = [];
let purchasedBalls = [];
let gold = 0;
let lives = 3; // Initialize with 3 lives

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
const characters = CHARACTER_FAMILIES.animals.characters;

let isPaused = false;
let animationScale = 1;
let imageCache = {};

// Audio files
const mergeSound = new Audio('/static/audio/merge.mp3');
const launchSound = new Audio('/static/audio/drop.mp3');
const gameOverSound = new Audio('/static/audio/gameover.mp3');

// Add references to start menu elements
const startMenu = document.getElementById('start-menu');
const startButton = document.getElementById('start-button');

let container = {
    x: CONTAINER.x, // Top-left x-coordinate
    y: CONTAINER.y, // Top-left y-coordinate
    width: CONTAINER.width,
    height: CONTAINER.height,
    vx: 0,
    vy: 0,
    isStatic: true, // Indicates that this object doesn't move
    attributes: {
        radius: 0, // Not used for rectangular container
        color: CONTAINER.color,
        value: 0,
        mass: Infinity, // Infinite mass to make it immovable
    },
    name: "Container"
};


// Initialize the deck
function initDeck() {
    console.log("Initializing deck...");
    console.log(`Current deck length before initialization: ${deck.length}`);
    console.log(`Current purchasedBalls: [${purchasedBalls.map(item => item.name).join(', ')}]`);

    // If the initialDeck is empty, populate it with INITIAL_DECK_VALUES
    if (initialDeck.length === 0) {
        console.log("Populating initialDeck with INITIAL_DECK_VALUES...");
        for (let i = 0; i < INITIAL_DECK_VALUES.length; i++) {
            const character = ALL_PIECE_TYPES[INITIAL_DECK_VALUES[i]];
            initialDeck.push(createPiece(character));
            console.log(`Added ${character.name} to initialDeck.`);
        }
    }

    // Refill the main deck with the initialDeck
    deck = [...initialDeck];
    console.log(`Refilled deck with initialDeck: [${deck.map(piece => piece.name).join(', ')}]`);

    // Add any purchased balls to the deck
    if (purchasedBalls.length > 0) {
        deck = [...deck, ...purchasedBalls];
        console.log(`Added ${purchasedBalls.length} purchased item(s) to deck.`);
    }

    // Shuffle the deck
    shuffleArray(deck);
    console.log(`Shuffled deck: [${deck.map(piece => piece.name).join(', ')}]`);

    // If the deck is still empty after initialization, add a default piece
    if (deck.length === 0) {
        console.warn("Deck is empty after initialization. Adding default piece.");
        const defaultPiece = ALL_PIECE_TYPES[0];
        deck.push(createPiece(defaultPiece));
        console.log(`Added default piece: ${defaultPiece.name} to deck.`);
    }

    console.log("Deck after initDeck:", deck);
    console.log("Purchased Balls after initDeck:", purchasedBalls);
    console.log("ALL_PIECE_TYPES:", ALL_PIECE_TYPES);
}

// Initialize the game
async function init() {
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
    purchasedBalls = [];
    initialDeck = [];
    lives = 3;
    score = 0;
    round = 1;
    gameOver = false;
    targetScore = 10;

    updateTargetScore();
    updateScore();
    updateRound();
    updateGold();
    updateLivesDisplay();

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

    // Initialize deck before image loading
    initDeck();
    spawnPiece();

    // Add the container to the pieces array
    pieces.push(container);

    // Preload all images and wait for them to load
    try {
        const cache1 = await preloadImages(ALL_PIECE_TYPES);
        console.log("Loaded ALL_PIECE_TYPES images:", Object.keys(cache1));

        const cache2 = await preloadImages(CHARACTER_FAMILIES.animals.characters);
        console.log("Loaded characters images:", Object.keys(cache2));

        // Merge caches
        imageCache = { ...cache1, ...cache2 };

        // Start the game loop after images are loaded
        gameLoop();

        // Start background music
        startBackgroundMusic();

        isPaused = false;
        pauseMenu.style.display = 'none';
        shop.classList.add('hidden');

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

        // Show the start menu and pause the game
        isPaused = true;
        startMenu.classList.remove('hidden');

        // Add event listener to Start button
        startButton.addEventListener('click', () => {
            startMenu.classList.add('hidden'); // Hide the start menu
            isPaused = false; // Unpause the game
            lastTime = performance.now(); // Reset lastTime
            gameLoop(); // Resume the game loop
            startBackgroundMusic(); // Play background music
        });

    } catch (error) {
        console.error("Error preloading images:", error);
    }
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
        console.log(`Deck length after releasing a ball: ${deck.length}`); // Added console log to show deck length

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
function gameLoop(currentTime = performance.now()) {
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
            piece.vy *= -BOUNCE_FACTOR; // Corrected from BOUT_CHANT_FACTOR
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
            if (!otherPiece.isStatic && handleCollision(piece, otherPiece)) {
                // After resolving collision, check for merges
                checkMerge(piece, otherPiece);
            }
        }

        // Collision with container walls
        handleContainerCollision(piece, container);
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

// Updated collision handling function
function handleContainerCollision(piece, container) {
    const left = container.x;
    const right = container.x + container.width;
    const bottom = container.y;
    const top = container.y - container.height;

    // Check if the piece is inside the container
    const isInside = piece.x > left && piece.x < right && piece.y > top;

    if (isInside) {
        // Prevent exiting through the sides
        if (piece.x - piece.attributes.radius < left) {
            piece.x = left + piece.attributes.radius;
            piece.vx = Math.abs(piece.vx) * BOUNCE_FACTOR;
        }
        if (piece.x + piece.attributes.radius > right) {
            piece.x = right - piece.attributes.radius;
            piece.vx = -Math.abs(piece.vx) * BOUNCE_FACTOR;
        }
        // Prevent exiting through the bottom
        if (piece.y + piece.attributes.radius > bottom) {
            piece.y = bottom - piece.attributes.radius;
            piece.vy = -Math.abs(piece.vy) * BOUNCE_FACTOR;
        }
    } else {
        // Prevent entering through the sides or bottom
        if (piece.y + piece.attributes.radius > top && piece.y - piece.attributes.radius < bottom) {
            // Left wall
            if (piece.x + piece.attributes.radius > left && piece.x - piece.attributes.radius < left) {
                piece.vx = -Math.abs(piece.vx) * BOUNCE_FACTOR;
            }
            // Right wall
            if (piece.x - piece.attributes.radius < right && piece.x + piece.attributes.radius > right) {
                piece.vx = Math.abs(piece.vx) * BOUNCE_FACTOR;
            }
            // Bottom wall
            if (piece.y + piece.attributes.radius > bottom) {
                piece.vy = -Math.abs(piece.vy) * BOUNCE_FACTOR;
            }
        }
    }

    // Allow entering only from the top
    if (piece.y < top && piece.vy > 0) {
        // No action needed; allow the piece to enter
    } else if (piece.y - piece.attributes.radius > top) {
        // Prevent entering from other directions
        if (piece.x - piece.attributes.radius < left || piece.x + piece.attributes.radius > right || piece.y + piece.attributes.radius > bottom) {
            // Handle collision as above
            // Left wall
            if (piece.x - piece.attributes.radius < left) {
                piece.vx = Math.abs(piece.vx) * BOUNCE_FACTOR;
            }
            // Right wall
            if (piece.x + piece.attributes.radius > right) {
                piece.vx = -Math.abs(piece.vx) * BOUNCE_FACTOR;
            }
            // Bottom wall
            if (piece.y + piece.attributes.radius > bottom) {
                piece.vy = -Math.abs(piece.vy) * BOUNCE_FACTOR;
            }
        }
    }

    // Apply friction after collision
    piece.vx *= FRICTION;
    piece.vy *= FRICTION;
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

function resetGame() {
    if (lives > 1) {
        lives -= 1;
        updateLivesDisplay();
        gold += 50;
        updateGold();
        openShop(shop, shopItemsContainer, ALL_PIECE_TYPES, 
            (value) => { isPaused = value; },
            () => { cancelAnimationFrame(animationId); },
            imageCache
        );
    } else {
        endGame();
    }
}

// Update the lives display
function updateLivesDisplay() {
    const livesContainer = document.getElementById('lives');
    livesContainer.innerHTML = ''; // Clear existing hearts

    for (let i = 0; i < lives; i++) {
        const heartImg = document.createElement('img');
        heartImg.src = '/static/images/heart/heart.png'; // Path to your heart image
        heartImg.alt = 'Heart';
        heartImg.classList.add('heart');
        livesContainer.appendChild(heartImg);
    }
}

// Handle game over
function endGame() {
    if (lives > 1) {
        resetGame(); // Function to reset the game state without ending it
    } else {
        gameOver = true;
        cancelAnimationFrame(animationId);
        gameOverSound.play();
        document.getElementById('final-score').textContent = score;
        gameOverDiv.classList.remove('hidden');
        backgroundMusic.pause();
    }
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

        // Get four random shop items
        const shopItems = getRandomShopItems(ALL_PIECE_TYPES, 4);

        openShop(
            shop,
            shopItemsContainer,
            shopItems, // Pass the four random items instead of ALL_PIECE_TYPES
            (value) => { isPaused = value; },
            () => { cancelAnimationFrame(animationId); },
            imageCache
        );
    } else {
        resetGame();
    }
}

function nextRoundPhase2() {
    console.log("Initializing deck for the next round...");
    initDeck();
    console.log("Deck at the start of the round:", deck); // Added console log to display the deck
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
    }, 50); // Adjust the delay as needed for animations
}

// Ensure that the game loop starts only after images are loaded and the Start button is clicked.

// Initial setup function
init();