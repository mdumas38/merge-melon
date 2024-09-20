// main.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, ALL_PIECE_TYPES, THROW_COOLDOWN, SPAWN_Y, 
    POWER_SCALING_FACTOR, POWER_MULTIPLIER, MAX_VELOCITY, END_ROUND_COOLDOWN, 
    BOUNCE_FACTOR, FRICTION, INITIAL_DECK_VALUES, CHARACTER_FAMILIES, CONTAINER, 
    SHOP_ITEMS} from './config.js';
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

let debugMode = false; // Add a debug mode flag
let selectedPiece = null; // Track the selected piece for force monitoring

// **Move the 'keydown' event listener outside the init function**
window.addEventListener('keydown', (e) => {
    if (e.key === 'd' || e.key === 'D') {
        debugMode = !debugMode;
        console.log(`Debug mode ${debugMode ? 'enabled' : 'disabled'}.`);
        if (debugMode) {
            // Select the current piece for monitoring
            selectedPiece = currentPiece;
            console.log(`Selected piece for force monitoring: ${selectedPiece ? selectedPiece.name : 'None'}`);
        } else {
            selectedPiece = null;
        }
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
    // Cancel any existing animation frames to prevent multiple game loops
    if (animationId) {
        cancelAnimationFrame(animationId);
        console.log("Previous game loop canceled.");
    }

    canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error("Game Canvas element not found!");
        return;
    }
    ctx = canvas.getContext('2d');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    console.log(`Initialized canvas with width ${CANVAS_WIDTH} and height ${CANVAS_HEIGHT}.`);

    // Reset all game data to original state
    pieces = [];
    purchasedBalls = [];
    initialDeck = [];
    lives = 3;
    score = 0;
    round = 1;
    gold = 0;
    gameOver = false;
    targetScore = 10;
    lastTime = performance.now();
    animationId = null;
    lastThrowTime = 0;

    updateTargetScore();
    updateScore();
    updateRound();
    updateGold();
    updateLivesDisplay();

    canvas.addEventListener('mouseup', (e) => {
        handleMouseUp(e, currentPiece, canvas, {
            THROW_COOLDOWN,
            POWER_SCALING_FACTOR,
            POWER_MULTIPLIER,
            MAX_VELOCITY
        }, pieces, spawnPiece, launchSound, lastThrowTime, (time) => lastThrowTime = time);
    });
    
    canvas.addEventListener('mousemove', (e) => {
        const pos = handleMouseMove(e, canvas);
        aimX = pos.x;
        aimY = pos.y;
    });

    // Initialize deck before image loading
    initDeck();
    spawnPiece();

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

        // **Remove the 'keydown' event listener from here**
        // It has been moved outside to prevent multiple attachments

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
            debugMode, // Pass debugMode to render
            selectedPiece // Pass the selected piece for force monitoring
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

// Updated update function to separate physics and collision handling
function update(deltaTime) {
    if (isNaN(deltaTime) || deltaTime <= 0) return;

    // First pass: Apply physics to all pieces
    for (let i = 0; i < pieces.length; i++) {
        const piece = pieces[i];

        if (piece.merging || piece.isAtRest || piece.isStatic) continue;

        applyGravity(piece, deltaTime);
        piece.x += piece.vx * deltaTime;
        piece.y += piece.vy * deltaTime;
        updateRotation(piece, deltaTime);

        // Floor collision
        if (piece.y + piece.attributes.radius > CANVAS_HEIGHT) {
            piece.y = CANVAS_HEIGHT - piece.attributes.radius;
            piece.vy *= -BOUNCE_FACTOR;
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
        handleContainerCollision(piece, container);
    }

    // Second pass: Handle collisions
    for (let i = 0; i < pieces.length; i++) {
        const piece1 = pieces[i];

        if (!piece1 || piece1.merging || piece1.isAtRest || piece1.isStatic) continue;

        for (let j = i + 1; j < pieces.length; j++) {
            const piece2 = pieces[j];
            if (!piece2 || piece2.merging || piece2.isAtRest || piece2.isStatic) continue;

            if (handleCollision(piece1, piece2)) {
                checkMerge(piece1, piece2);
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

// Updated collision handling function
function handleContainerCollision(piece, container) {
    const left = container.x;
    const right = container.x + container.width;
    const bottom = container.y;
    const top = container.y + container.height;

    const isInside = piece.x > left && piece.x < right && piece.y < top && piece.y > bottom;

    if (isInside) {
        if (piece.x - piece.attributes.radius < left) {
            piece.x = left + piece.attributes.radius;
            piece.vx = Math.abs(piece.vx);
        }
        if (piece.x + piece.attributes.radius > right) {
            piece.x = right - piece.attributes.radius;
            piece.vx = -Math.abs(piece.vx);
        }
        if (piece.y + piece.attributes.radius > top) {
            piece.y = top - piece.attributes.radius;
            piece.vy = -Math.abs(piece.vy);
        }
    } else {
        if (piece.y + piece.attributes.radius > bottom) {
            if (piece.x + piece.attributes.radius < left) {
                piece.vx = -Math.abs(piece.vx);
            }
            if (piece.x - piece.attributes.radius > right) {
                piece.vx = Math.abs(piece.vx);
            }
            if (piece.y + piece.attributes.radius > top) {
                piece.vy = -Math.abs(piece.vy);
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

        // Get four random shop items
        const shopItems = getRandomShopItems(ALL_PIECE_TYPES, SHOP_ITEMS);

        openShop(
            shop,
            shopItemsContainer,
            shopItems, // Pass the four random items instead of ALL_PIECE_TYPES
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
        const shopItems = getRandomShopItems(ALL_PIECE_TYPES, SHOP_ITEMS);

        openShop(
            shop,
            shopItemsContainer,
            shopItems, // Pass the three random items instead of ALL_PIECE_TYPES
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
        const itemName = e.target.getAttribute('data-name');
        const item = ALL_PIECE_TYPES.find(piece => piece.name === itemName);

        if (!item) {
            console.error(`Item with name ${itemName} not found.`);
            return;
        }

        console.log(`Attempting to buy item: ${item.name}, Cost: ${item.attributes.cost}`);

        if (gold >= item.attributes.cost) {
            gold -= item.attributes.cost;
            updateGold();

            // Add the purchased item to purchasedBalls to replenish the deck in the next round
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

    // If the new piece has the "Eat" ability, consume a nearby Ladybug
    if (mergedPiece.abilities && mergedPiece.abilities.includes("Eat")) {
        const nearbyLadybug = pieces.find(piece => piece.name === "Ladybug" && isNear(mergedPiece, piece));
        if (nearbyLadybug) {
            // Remove the Ladybug from the game
            pieces = pieces.filter(piece => piece !== nearbyLadybug);
            // Add its value to the player's score
            score += nearbyLadybug.attributes.value;
            updateScore();
            console.log(`${mergedPiece.name} consumed a Ladybug! Score increased by ${nearbyLadybug.attributes.value}.`);
            playSound(mergeSound); // Play a sound effect for eating
        }
    }

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

// Helper function to determine if two pieces are near each other
function isNear(piece1, piece2, distanceThreshold = 700) { // Adjust threshold as needed
    const dx = piece1.x - piece2.x;
    const dy = piece1.y - piece2.y;
    const distance = Math.hypot(dx, dy);
    return distance <= distanceThreshold;
}

// Add click event listener to handle Rabbit's Single Jump ability
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Find a Rabbit under the click
    const clickedRabbit = pieces.find(piece => 
        piece.name === "Rabbit" && 
        Math.hypot(piece.x - mouseX, piece.y - mouseY) <= piece.attributes.radius
    );

    if (clickedRabbit && !clickedRabbit.hasJumped) {
        // Trigger the Jump
        triggerJump(clickedRabbit);
    }
});

// Function to handle the jump mechanics
function triggerJump(rabbit) {
    // Define the jump velocity (adjust as needed for desired jump strength)
    const jumpVelocityY = -600; // Negative value to move upwards

    // Apply the jump velocity
    rabbit.vy = jumpVelocityY;

    // Optionally, apply a slight horizontal repositioning
    const repositionOffset = 50; // Pixels to move horizontally
    const direction = Math.random() < 0.5 ? -1 : 1; // Random left or right
    rabbit.vx += direction * 200; // Adjust as needed

    // Mark the ability as used
    rabbit.hasJumped = true;
    console.log(`${rabbit.name} performed a single jump!`);

    // Play a jump sound (ensure you have a jump sound loaded)
    const jumpSound = new Audio('/static/audio/jump.mp3');
    playSound(jumpSound);
}

// Ensure that the game loop starts only after images are loaded and the Start button is clicked.

// Initial setup function
init();