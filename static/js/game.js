
// Get the computed style of the game container
const gameContainer = document.getElementById('game-container');
const computedStyle = window.getComputedStyle(gameContainer);

// Extract width and height from the computed style
const CANVAS_WIDTH = parseInt(computedStyle.width, 10);
const CANVAS_HEIGHT = parseInt(computedStyle.height, 10);

// Define character families
const CHARACTER_FAMILIES = {
    animals: {
        description: "Animal-based characters with unique abilities.",
        characters: [
            {
                name: "Mouse",
                faceImage: "/static/images/characters/mouse_face.png", // Path to the mouse image
                earsImage: "/static/images/characters/mouse_ears.png", // Path to the mouse ears image
                ability: "Bounce Boost", // Description of the ability
                attributes: {
                    radius: 20,
                    color: '#808080', // Gray color for the mouse
                    value: 1,
                    mass: 2,
                    angularVelocity: 2,
                    cost: 10
                },
            },
            // Future animal characters can be added here
        ]
    },
    // Additional families can be defined here
};

const ALL_PIECE_TYPES = [
    ...CHARACTER_FAMILIES.animals.characters,
    // Add other families' characters when available
];

const GRAVITY = 980;        // Reduced to simulate real-world gravity (pixels per second squared)
const FRICTION = 0.985;       // Increased for more stability
const BOUNCE_FACTOR = 0.1;   // Reduced for less bouncy collisions
const SPAWN_Y = 50;
const MAX_VELOCITY = 2000;   // Maximum velocity to prevent excessive speeds
const POWER_MULTIPLIER = 1; // Increased power for stronger launches
const POWER_SCALING_FACTOR = 20; // Scaling factor for power calculation
const ROTATION_FRICTION = 0.99; // Rotational friction constant
const SPEED_THRESHOLD = 1; // Threshold for considering the ball as moving
const ANGULAR_VELOCITY_THRESHOLD = 0.001; // Threshold for stopping rotation
const VELOCITY_THRESHOLD = 0.1; // Threshold below which velocity is considered negligible
const END_ROUND_COOLDOWN = 2000; // Cooldown after the last throw before ending the round

// Game variables
let canvas, ctx, pieces, currentPiece, score, round, gameOver, targetScore;
let lastTime, animationId;
let aimX, aimY;
let particles = [];
let lastThrowTime = 0;
let bucketCtx; // Added declaration for bucketCtx
let deck = [];
let purchasedBalls = [];
let gold = 0; // New variable to track gold
const THROW_COOLDOWN = 500; // 2 seconds in milliseconds

// Audio
const mergeSound = new Audio('/static/audio/merge.mp3');
const launchSound = new Audio('/static/audio/drop.mp3');
const gameOverSound = new Audio('/static/audio/gameover.mp3');

const backgroundMusic = document.getElementById('background-music');
const pauseMenu = document.getElementById('pause-menu');
const resumeButton = document.getElementById('resume-button');
const muteButton = document.getElementById('mute-button');
const quitButton = document.getElementById('quit-button');

let isPaused = false;

const imageCache = {};

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

// Call preloadImages with ALL_PIECE_TYPES
preloadImages(ALL_PIECE_TYPES);

// Function to start the background music
function startBackgroundMusic() {
    backgroundMusic.play().catch(error => {
        console.log("Audio play failed:", error);
        // Add a click event listener to start music on user interaction
        document.addEventListener('click', () => {
            backgroundMusic.play().catch(e => console.log("Audio play failed again:", e));
        }, { once: true });
    });
}

// Function to pause the game
function pauseGame() {
    if (!isPaused) {
        isPaused = true;
        pauseMenu.style.display = 'block';
        cancelAnimationFrame(animationId);
        backgroundMusic.pause();
        
        // Remove event listeners
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
    }
}

// Function to resume the game
function resumeGame() {
    if (isPaused) {
        isPaused = false;
        pauseMenu.style.display = 'none';
        lastTime = performance.now();
        gameLoop();
        backgroundMusic.play().catch(e => console.log("Audio resume failed:", e));
        
        // Re-attach event listeners
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
    }
}

// Function to toggle pause
function togglePause() {
    if (isPaused) {
        resumeGame();
    } else {
        pauseGame();
    }
}

// Function to toggle mute
function toggleMute() {
    backgroundMusic.muted = !backgroundMusic.muted;
    muteButton.textContent = backgroundMusic.muted ? 'Unmute Music' : 'Mute Music';
}

// Event listeners for pause menu buttons
resumeButton.addEventListener('click', resumeGame);
muteButton.addEventListener('click', toggleMute);
quitButton.addEventListener('click', () => {
    location.reload();
});

// Initialize the deck at the start or between rounds
const INITIAL_DECK_VALUES = [1, 1];

function initDeck() {
    deck = [];

    // Add initial pieces based on spawnablePieceTypes
    for (let i = 0; i < INITIAL_DECK_VALUES.length; i++) {
        const randomIndex = Math.floor(Math.random() * spawnablePieceTypes.length);
        const character = spawnablePieceTypes[randomIndex];
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

// Utility function to shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
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

    // Initialize pieces with isAtRest property
    pieces = []; 
    score = 0;
    round = 1;
    gameOver = false;
    targetScore = 0; // Set initial target score
    console.log("Setting target score to:", targetScore);

    updateTargetScore(); // Update the target score display

    preloadImages(ALL_PIECE_TYPES); // Preload images
    updateScore();
    updateRound();

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    initDeck();
    spawnPiece();

    lastTime = performance.now();


    gameLoop();
    startBackgroundMusic();

    isPaused = false;
    pauseMenu.style.display = 'none';
    shop.classList.add('hidden'); // Ensure the shop is hidden at start

    // Add event listener for the 'P' key to toggle pause
    document.addEventListener('keydown', (e) => {
        if (e.key === 'p' || e.key === 'P') {
            togglePause();
        }
    });

    // Initialize bucket canvas
    const bucketCanvas = document.getElementById('bucket-canvas');
    if (!bucketCanvas) {
        console.error("Bucket Canvas element not found!");
        return;
    }
    bucketCtx = bucketCanvas.getContext('2d');

    // Reset purchased balls
    purchasedBalls = [];
}

// Call init() when the window loads
window.addEventListener('DOMContentLoaded', init);

// Main game loop
function gameLoop(currentTime) {
    if (gameOver) return;

    if (isPaused) {
        lastTime = currentTime;
    } else {
        const deltaTime = (currentTime - lastTime + .0000000000000001) / 1000;
        lastTime = currentTime;

        update(deltaTime);
        render();
    }

    animationId = requestAnimationFrame(gameLoop);
}

// Update game state
function update(deltaTime) {
    if (isNaN(deltaTime) || deltaTime <= 0) {
        console.error('Invalid deltaTime:', deltaTime);
        return;
    }

    for (let i = 0; i < pieces.length; i++) {
        const piece = pieces[i];

        if (piece.merging || piece.isAtRest) continue; // Skip if merging or at rest

        // Apply gravity
        piece.vy += GRAVITY * deltaTime;

        // Apply velocity
        piece.x += piece.vx * deltaTime;
        piece.y += piece.vy * deltaTime;

        // Handle floor collision
        if (piece.y + piece.radius > CANVAS_HEIGHT) {
            piece.y = CANVAS_HEIGHT - piece.radius;
            
            // Apply Bounce Boost ability
            if (piece.ability === "Bounce Boost") {
                piece.vy *= -BOUNCE_FACTOR * 1.5; // Increase bounce factor
                displayAbilityEffect(piece); // Function to visually indicate ability
            } else {
                piece.vy *= -BOUNCE_FACTOR;
            }

            piece.vx *= FRICTION; // Apply friction on bounce
        }

        // Handle wall collisions
        if (piece.x - piece.radius < 0) {
            piece.x = piece.radius;
            piece.vx *= -BOUNCE_FACTOR;
            piece.vy *= FRICTION;
        } else if (piece.x + piece.radius > CANVAS_WIDTH) {
            piece.x = CANVAS_WIDTH - piece.radius;
            piece.vx *= -BOUNCE_FACTOR;
            piece.vy *= FRICTION;
        }

        // Apply air resistance
        piece.vx *= FRICTION;
        piece.vy *= FRICTION;

        // Update rotation
        piece.rotation += piece.angularVelocity * deltaTime;
        piece.rotation %= Math.PI * 2; // Keep rotation within 0 to 2π radians

        // Calculate ball speed
        const speed = Math.hypot(piece.vx, piece.vy);

        // Apply Rotational Friction Only If the Ball Is Moving
        if (speed > SPEED_THRESHOLD) { // Threshold to consider the ball as moving
            piece.angularVelocity *= ROTATION_FRICTION;

            // If angular velocity is very low, stop rotating
            if (Math.abs(piece.angularVelocity) < ANGULAR_VELOCITY_THRESHOLD) {
                piece.angularVelocity = 0;
            }
        } else {
            // If the ball is not moving, slow down rotation
            piece.angularVelocity *= ROTATION_FRICTION;
            if (Math.abs(piece.angularVelocity) < ANGULAR_VELOCITY_THRESHOLD) {
                piece.angularVelocity = 0;
            }
        }

        // Check if velocity is below thresholds to mark as at rest
        if (speed < VELOCITY_THRESHOLD && Math.abs(piece.angularVelocity) < ANGULAR_VELOCITY_THRESHOLD) {
            piece.vx = 0;
            piece.vy = 0;
            piece.angularVelocity = 0;
            piece.isAtRest = true;
        }

        // Handle collision with other pieces
        for (let j = i + 1; j < pieces.length; j++) {
            const otherPiece = pieces[j];
            if (isColliding(piece, otherPiece)) {
                resolveCollision(piece, otherPiece);
                // After resolving collision, check for merges
                checkMerge(piece, otherPiece);
            }
        }
    }

    // Remove merged pieces
    pieces = pieces.filter(piece => !piece.merged);

    // Update game over condition to check if any ball has completely left the top
    if (pieces.some(piece => piece.y - piece.radius <= 0)) {
        endGame();
    }

    // Check for round completion
    if (deck.length === 0 && performance.now() - lastThrowTime >= END_ROUND_COOLDOWN && !currentPiece) {
        console.log("All pieces are at rest and deck is empty. Opening shop...");
        nextRoundPhase1();
    }
}

// Render the game
function render() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw trajectory lines
    drawTrajectoryLines();

    // Draw pieces
    for (const piece of pieces) {
        drawPiece(piece);
    }

    // Draw current piece (if it's still active and not merging)
    if (currentPiece && !currentPiece.merging) {
        drawPiece(currentPiece);
    }

    // Draw particles
    for (const particle of particles) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color + Math.floor(particle.life * 255).toString(16).padStart(2, '0');
        ctx.fill();
    }

    // Draw spawn indicator
    drawSpawnIndicator();

    // Draw the bucket
   function drawBucket(context) {
       // Example drawing code for the bucket
       context.save();
       context.fillStyle = '#654321'; // Bucket color
       const bucketWidth = 100;
       const bucketHeight = 50;
       const bucketX = (CANVAS_WIDTH - bucketWidth) / 2;
       const bucketY = CANVAS_HEIGHT - bucketHeight;
       context.fillRect(bucketX, bucketY, bucketWidth, bucketHeight);
       context.restore();
   }

    // Draw boundaries
    drawBoundaries();
}

// Draw trajectory lines
function drawTrajectoryLines() {
    if (currentPiece) {
        ctx.beginPath();
        ctx.moveTo(currentPiece.x, currentPiece.y);

        let simX = currentPiece.x;
        let simY = currentPiece.y;
        const dx = aimX - currentPiece.x;
        const dy = aimY - currentPiece.y;
        const distance = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        const power = Math.min(distance / POWER_SCALING_FACTOR, 50) * 100 * POWER_MULTIPLIER;

        let simVx = Math.cos(angle) * power;
        let simVy = Math.sin(angle) * power;

        ctx.lineWidth = 3; // Increased line width
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; // Slightly more visible
        ctx.setLineDash([10, 5]); // Set dashed line pattern

        let collision = false;
        for (let i = 0; i < 120 && !collision; i++) {
            const prevX = simX;
            const prevY = simY;

            simVy += GRAVITY * 0.016; // Simulate gravity
            simVx *= FRICTION;
            simVy *= FRICTION;
            simX += simVx * 0.016;
            simY += simVy * 0.016;

            // Check for collision with game container
            if (simY + currentPiece.radius > CANVAS_HEIGHT || 
                simX - currentPiece.radius < 0 || 
                simX + currentPiece.radius > CANVAS_WIDTH) {
                collision = true;
                simX = Math.max(currentPiece.radius, Math.min(CANVAS_WIDTH - currentPiece.radius, simX));
                simY = Math.min(CANVAS_HEIGHT - currentPiece.radius, simY);
            }

            // Check for collision with other pieces
            for (const piece of pieces) {
                const dx = simX - piece.x;
                const dy = simY - piece.y;
                const distance = Math.hypot(dx, dy);
                if (distance < currentPiece.radius + piece.radius) {
                    collision = true;
                    break;
                }
            }

            if (!collision) {
                ctx.lineTo(simX, simY);
            } else {
                ctx.lineTo(prevX, prevY);
            }
        }

        ctx.stroke();
        ctx.setLineDash([]); // Reset to solid line
    }
}

// Draw a single piece with enhanced visuals
function drawPiece(piece) {
    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.scale(piece.animationScale || 1, piece.animationScale || 1);

    // Create a clipping path based on the circle
    ctx.beginPath();
    ctx.arc(0, 0, piece.radius, 0, Math.PI * 2);
    ctx.clip();

    // Draw the face image within the clipping path
    const faceImg = imageCache[`${piece.name}_face`];
    if (faceImg && faceImg.complete) {
        ctx.drawImage(faceImg, -piece.radius, -piece.radius, piece.radius * 2, piece.radius * 2);
    } else {
        // Fallback: Draw a colored circle if face image isn't loaded
        ctx.beginPath();
        ctx.arc(0, 0, piece.radius, 0, Math.PI * 2);
        ctx.fillStyle = piece.color;
        ctx.fill();

        // Draw the number as a fallback
        ctx.fillStyle = "#000000";
        ctx.font = `${piece.radius}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(piece.value, 0, 0);
    }

    ctx.restore();

    // Draw the ears (decorative part)
    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.rotate(piece.rotation); // Ensure ears rotate synchronously with the face

    const earsImg = imageCache[`${piece.name}_ears`];
    if (earsImg && earsImg.complete) {
        // Adjust position and size as needed
        ctx.drawImage(earsImg, -piece.radius, -piece.radius - 10, piece.radius * 2, piece.radius * 2);
    }

    ctx.restore();
}

//     // Create radial gradient for the ball
//     const gradient = ctx.createRadialGradient(0, 0, piece.radius * 0.1, 0, 0, piece.radius);
//     gradient.addColorStop(0, lightenColor(piece.color, 20)); // Lighter center
//     gradient.addColorStop(1, piece.color); // Original color at edges

//     // Apply shadow
//     ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
//     ctx.shadowBlur = 10;
//     ctx.shadowOffsetX = 5;
//     ctx.shadowOffsetY = 5;

//     // Draw the ball with gradient
//     ctx.beginPath();
//     ctx.arc(0, 0, piece.radius, 0, Math.PI * 2);
//     ctx.fillStyle = gradient;
//     ctx.fill();
    
//     // Add white outline to make the ball pop
//     ctx.lineWidth = 2;
//     ctx.strokeStyle = '#FFFFFF'; // White outline
//     ctx.stroke();
//     ctx.closePath();

//     // Rotate context for the number
//     ctx.save();
//     ctx.rotate(piece.rotation); // Rotate the canvas context

//     // Conditionally draw the number with a slight shadow for readability
//     // if (!piece.absorbing) {
//     //     ctx.font = '16px "Press Start 2P"'; // Use the custom font
//     //     ctx.fillStyle = '#FFFFFF'; // White color for contrast

//     //     // Add text shadow
//     //     ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
//     //     ctx.shadowBlur = 3;

//     //     ctx.textAlign = 'center';
//     //     ctx.textBaseline = 'middle';
//     //     ctx.fillText(piece.value, 0, 0);
//     // }

//     ctx.restore(); // Restore after rotating
//     ctx.restore(); // Restore the main context
// }

// Utility function to lighten a hex color
function lightenColor(hex, percent) {
    const num = parseInt(hex.slice(1), 16);
    let r = (num >> 16) + percent;
    let g = ((num >> 8) & 0x00FF) + percent;
    let b = (num & 0x0000FF) + percent;

    r = r > 255 ? 255 : r;
    g = g > 255 ? 255 : g;
    b = b > 255 ? 255 : b;

    return `rgb(${r}, ${g}, ${b})`;
}

// Draw spawn indicator
function drawSpawnIndicator() {
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2 - 15, SPAWN_Y - 15);
    ctx.lineTo(CANVAS_WIDTH / 2, SPAWN_Y);
    ctx.lineTo(CANVAS_WIDTH / 2 + 15, SPAWN_Y - 15);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Initialize spawnablePieceTypes with only 1s, 2s, and 4s
let spawnablePieceTypes = [
    ALL_PIECE_TYPES.find(pt => pt.attributes.value === 1)
];

// Modify spawnPiece to assign random rotation direction
function spawnPiece() {
    if (deck.length > 0) {
        const pieceFromDeck = deck.shift(); // Get the next piece from the deck
        console.log('Spawning piece:', pieceFromDeck);

        currentPiece = {
            ...pieceFromDeck, // Use all properties from the piece
            x: CANVAS_WIDTH / 2,
            y: SPAWN_Y + pieceFromDeck.radius,
            vx: 0,
            vy: 0,
            rotation: 0,
            isAtRest: false,
        };
    } else {
        // No more pieces to spawn
        currentPiece = null;
        console.log("No more pieces to spawn.");
    }
}

// Check for merges
function checkMerge(existingPiece, releasedPiece) {
    if (existingPiece.value === releasedPiece.value && !existingPiece.merging && !releasedPiece.merging) {
        const newPieceType = ALL_PIECE_TYPES.find(pt => pt.attributes.value === existingPiece.value * 2);
        if (newPieceType) {
            startMergeAnimation(existingPiece, releasedPiece, newPieceType);
            score += newPieceType.attributes.value;
            updateScore();
            mergeSound.play();

            // Award gold for merging high-value pieces
            if (newPieceType.attributes.value >= 8) {
                gold += 20; // Award 20 gold for high-value merges
                updateGold();
            }
        }
    }
}

// Start merge animation
function startMergeAnimation(existingPiece, releasedPiece, newPieceType) {
    const animationDuration = 200; // Quick shrinking
    const startTime = performance.now();
    const startRadius = releasedPiece.radius;
    const targetRadius = 0; // Shrink to 0 for releasedPiece
    const existingStartRadius = existingPiece.radius;
    const existingTargetRadius = newPieceType.attributes.radius; // New size for existing piece

    // Set the absorbing flag to remove the number
    releasedPiece.absorbing = true;

    // Create particles for visual effect
    const mergeParticles = createParticles(existingPiece.x, existingPiece.y, newPieceType.attributes.color, 20);

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        const easeProgress = easeOutCubic(progress); // Apply easing

        // Interpolate radius for releasedPiece (shrinking)
        releasedPiece.radius = startRadius * (1 - easeProgress);

        // Interpolate radius for existingPiece (growing)
        existingPiece.radius = existingStartRadius + (existingTargetRadius - existingStartRadius) * easeProgress;

        // Update properties for existingPiece
        existingPiece.value = newPieceType.attributes.value;
        existingPiece.color = newPieceType.attributes.color;
        existingPiece.angularVelocity = newPieceType.attributes.angularVelocity; // Assign new angular velocity

        // Update particles
        mergeParticles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;
            if (particle.life <= 0) {
                mergeParticles.splice(index, 1);
            }
        });

        // Continue animation if not complete
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Merge complete
            existingPiece.merging = false;
            releasedPiece.merging = false;
            pieces = pieces.filter(p => p !== releasedPiece); // Remove only releasedPiece

            // Reset velocities for stability
            existingPiece.vx = 0;
            existingPiece.vy = 0;

            checkChainMerge(existingPiece);
        }

        // Render the updated game state
        render();
    }

    // Easing function for smooth animation
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    // Set merging flags
    existingPiece.merging = true;
    releasedPiece.merging = true;

    // Assign new angularVelocity with random direction
    const rotationDirection = Math.random() > 0.5 ? 1 : -1;
    existingPiece.angularVelocity = newPieceType.attributes.angularVelocity * rotationDirection;

    // Start the animation
    requestAnimationFrame(animate);
}

// Create particles for merge effect
function createParticles(x, y, color, count) {
    const particles = [];
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            radius: Math.random() * 3 + 1,
            color: color,
            life: 1
        });
    }
    return particles;
}

// Function to spawn a new merged piece with preserved rotation direction
function checkChainMerge(piece) {
    for (let i = 0; i < pieces.length; i++) {
        const otherPiece = pieces[i];
        if (piece !== otherPiece && isColliding(piece, otherPiece) && piece.value === otherPiece.value) {
            const newPieceType = ALL_PIECE_TYPES.find(pt => pt.attributes.value === piece.value * 2);
            if (newPieceType) {
                startMergeAnimation(piece, otherPiece, newPieceType);
                score += newPieceType.attributes.value;
                updateScore();
                mergeSound.play();
                break;
            }
        }
    }
}

// Check collision between two pieces
function isColliding(piece1, piece2) {
    const dx = piece1.x - piece2.x;
    const dy = piece1.y - piece2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < piece1.radius + piece2.radius;
}

// Function to resolve collision between two pieces with continuous collision detection
function resolveCollision(piece1, piece2) {
    const dx = piece2.x - piece1.x;
    const dy = piece2.y - piece1.y;
    const distance = Math.hypot(dx, dy);
    const overlap = piece1.radius + piece2.radius - distance;

    if (overlap > 0) {
        // Calculate the minimum translation distance
        const mtvX = (dx / distance) * overlap;
        const mtvY = (dy / distance) * overlap;

        // Push the pieces apart based on their mass
        const totalMass = piece1.mass + piece2.mass;
        piece1.x -= (mtvX * (piece2.mass / totalMass));
        piece1.y -= (mtvY * (piece2.mass / totalMass));
        piece2.x += (mtvX * (piece1.mass / totalMass));
        piece2.y += (mtvY * (piece1.mass / totalMass));

        // Calculate velocities along the normal and tangent
        const normalX = dx / distance;
        const normalY = dy / distance;
        const tangentX = -normalY;
        const tangentY = normalX;

        // Dot product of velocities with normal and tangent
        const dpNorm1 = piece1.vx * normalX + piece1.vy * normalY;
        const dpNorm2 = piece2.vx * normalX + piece2.vy * normalY;
        const dpTan1 = piece1.vx * tangentX + piece1.vy * tangentY;
        const dpTan2 = piece2.vx * tangentX + piece2.vy * tangentY;

        // Conserving momentum along normal direction
        const m1 = (dpNorm1 * (piece1.mass - piece2.mass) + 2 * piece2.mass * dpNorm2) / (piece1.mass + piece2.mass);
        const m2 = (dpNorm2 * (piece2.mass - piece1.mass) + 2 * piece1.mass * dpNorm1) / (piece1.mass + piece2.mass);

        // Update velocities with additional damping
        piece1.vx = (tangentX * dpTan1 + normalX * m1) * FRICTION;
        piece1.vy = (tangentY * dpTan1 + normalY * m1) * FRICTION;
        piece2.vx = (tangentX * dpTan2 + normalX * m2) * FRICTION;
        piece2.vy = (tangentY * dpTan2 + normalY * m2) * FRICTION;

        // After collision, mark pieces as moving if their velocities are significant
        if (Math.abs(piece1.vx) > VELOCITY_THRESHOLD || Math.abs(piece1.vy) > VELOCITY_THRESHOLD) {
            piece1.isAtRest = false;
        }

        if (Math.abs(piece2.vx) > VELOCITY_THRESHOLD || Math.abs(piece2.vy) > VELOCITY_THRESHOLD) {
            piece2.isAtRest = false;
        }

        // Check and apply abilities
        if (piece1.ability === "Bounce Boost" && !piece1.abilityActive) {
            piece1.vy *= 1.5; // Increase bounce velocity by 50%
            piece1.abilityActive = true; // Prevent repeated application
        }

        if (piece2.ability === "Bounce Boost" && !piece2.abilityActive) {
            piece2.vy *= 1.5; // Increase bounce velocity by 50%
            piece2.abilityActive = true;
        }
    }
}

// Handle mouse move
function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    aimX = e.clientX - rect.left;
    aimY = e.clientY - rect.top;
}

// Handle mouse up
function handleMouseUp(e) {
    if (!currentPiece) return; // No piece to throw
    const currentTime = performance.now();
    if (currentTime - lastThrowTime >= THROW_COOLDOWN) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const dx = mouseX - currentPiece.x;
        const dy = mouseY - currentPiece.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return; // Prevent division by zero

        const power = Math.min(distance / POWER_SCALING_FACTOR, 50); // Dynamic power based on drag distance, capped at 50

        currentPiece.vx = (dx / distance) * power * 100 * POWER_MULTIPLIER;
        currentPiece.vy = (dy / distance) * power * 100 * POWER_MULTIPLIER;

        // Cap the velocities to prevent excessive speeds
        currentPiece.vx = Math.max(Math.min(currentPiece.vx, MAX_VELOCITY), -MAX_VELOCITY);
        currentPiece.vy = Math.max(Math.min(currentPiece.vy, MAX_VELOCITY), -MAX_VELOCITY);

        pieces.push(currentPiece);
        launchSound.play();
        spawnPiece();
        lastThrowTime = currentTime;
    }
}

// Update the score display
function updateScore() {
    document.getElementById('score').textContent = score;
}

// Update the round display
function updateRound() {
    document.getElementById('round').textContent = round;
}

// Update the gold display
function updateGold() {
    document.getElementById('gold').textContent = gold;
    console.log("Gold updated to:", gold);
}

// Function to update the target score display
function updateTargetScore() {
    document.getElementById('target-score').textContent = targetScore;
    console.log("Target score updated to:", targetScore);
}


// Move to the next round
function nextRoundPhase1() {
    if (score >= targetScore) {
        gold += 50; // Award 50 gold for passing the round
        updateGold(); // Update the gold display
        round++;
        updateRound();
        targetScore += 50; // Increase the target score by 100 each round
        updateTargetScore(); // Update the target score display
        console.log("Before opening shop:", pieces);
        openShop(); // Open the shop between rounds
    } else {
        endGame(); // End the game if target score not achieved
    }
}

// Move to the next round
function nextRoundPhase2() {
    initDeck(); // Reinitialize the deck for the new round
    spawnPiece(); // Spawn the first piece of the new round
}

// End the game
function endGame() {
    gameOver = true;
    cancelAnimationFrame(animationId);
    gameOverSound.play();
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over').classList.remove('hidden');
    backgroundMusic.pause(); // Pause the music instead of stopping
}

// Restart the game
document.getElementById('restart-button').addEventListener('click', () => {
    document.getElementById('game-over').classList.add('hidden');
    init();
});

// Define shop items with their costs
const SHOP_ITEMS = [
    ...CHARACTER_FAMILIES.animals.characters,
    // Add other families' characters here
];

// Shop variables
const shop = document.getElementById('shop');
console.log('Shop Element:', shop); // Debugging line
const shopItemsContainer = document.getElementById('shop-items');
const closeShopButton = document.getElementById('close-shop-button');

// Function to open the shop
function openShop() {
    console.log('Opening shop...');
    shopItemsContainer.innerHTML = ''; // Clear previous items

    SHOP_ITEMS.forEach((item, index) => {
        if (item && item.name) {
            // Check if the piece type is already unlocked
            if (!spawnablePieceTypes.some(pt => pt.name === item.name)) {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('shop-item');

                // Create a canvas for each character
                const ballCanvas = document.createElement('canvas');
                ballCanvas.width = 60;
                ballCanvas.height = 60;
                const ballCtx = ballCanvas.getContext('2d');

                // Draw the character image
                drawCharacterImage(ballCtx, item, 30, 30, 25);

                // Display character details
                itemDiv.innerHTML = `
                    <div class="item-name">${item.name}</div>
                    <div class="item-ability">${item.ability || 'No special ability'}</div>
                    <div class="item-details"></div>
                    <div class="item-cost">Cost: ${item.attributes.cost} Gold</div>
                    <button data-index="${index}" class="buy-button">Buy</button>
                `;

                // Insert the canvas into the item-details
                itemDiv.querySelector('.item-details').appendChild(ballCanvas);

                shopItemsContainer.appendChild(itemDiv);
            }
        } else {
            console.warn(`Invalid shop item at index ${index}:`, item);
        }
    });

    // Show the shop
    shop.classList.remove('hidden');
    isPaused = true;
    lastTime = performance.now();
    cancelAnimationFrame(animationId);
}

// Function to close the shop
function closeShop() {
    console.log('Closing shop...');
    shop.classList.add('hidden');
    isPaused = false;
    
    // Initialize the new deck and spawn the next piece
    initDeck();
    spawnPiece();
    
    lastTime = performance.now();
    gameLoop();
}

// Event listener for closing the shop with debugging
closeShopButton.addEventListener('click', () => {
    console.log('Close Shop button clicked.');
    nextRoundPhase2();
    closeShop();
});

// Initialize the bucket
function initBucket() {
    // Get the bucket canvas element
    const bucketCanvas = document.getElementById('bucket-canvas');
    if (!bucketCanvas) {
        console.error("Bucket Canvas element not found!");
        return;
    }
    bucketCtx = bucketCanvas.getContext('2d');
    
    // Set canvas dimensions to match the main canvas
    bucketCanvas.width = CANVAS_WIDTH;
    bucketCanvas.height = CANVAS_HEIGHT;
    
    // Initialize bucket-related variables or settings here
    // For example, define the bucket's position and size
}

// Add the drawBoundaries function
function drawBoundaries() {
    ctx.strokeStyle = '#FFFFFF'; // Set boundary color to white
    ctx.lineWidth = 2;            // Set boundary line width
    ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); // Draw rectangle around the canvas
}

// Function to draw character images in the shop
function drawCharacterImage(ctx, character, x, y, size) {
    const img = new Image();
    img.src = character.image;

    img.onload = () => {
        ctx.drawImage(img, x - size, y - size, size * 2, size * 2);
        
        // Optionally, draw a border
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.strokeStyle = '#FFFFFF'; // White border
        ctx.lineWidth = 1;
        ctx.stroke();
    };
}

// Event listener for purchase buttons with debugging
shopItemsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('buy-button')) {
        const itemIndex = e.target.getAttribute('data-index');
        const item = SHOP_ITEMS[itemIndex];

        console.log(`Attempting to buy item: ${item.name}, Cost: ${item.attributes.cost}`);
        
        if (gold >= item.attributes.cost) {
            // Deduct the cost from the player's gold
            gold -= item.attributes.cost;
            updateGold();

            // Add the purchased character to spawnablePieceTypes
            spawnablePieceTypes.push(item);

            // Provide feedback to the player
            alert(`You have purchased ${item.name}!`);

            // Disable the button after purchase (important!)
            e.target.disabled = true;
            e.target.textContent = 'Purchased';
        } else {
            alert('Insufficient gold to purchase this item.');
        }
    }
});

// Extend the piece object to include ability effects
function createPiece(character) {
    return {
        x: CANVAS_WIDTH / 2,
        y: SPAWN_Y + character.attributes.radius,
        vx: 0,
        vy: 0,
        rotation: 0,
        angularVelocity: character.attributes.angularVelocity,
        radius: character.attributes.radius,
        color: character.attributes.color,
        value: character.attributes.value,
        mass: character.attributes.mass,
        name: character.name,
        faceImage: character.faceImage,
        earsImage: character.earsImage,
        ability: character.ability,
        abilityActive: false, // Flag to indicate if ability is active
    };
}

// Function to display ability effects visually
function displayAbilityEffect(piece) {
    // Example: Draw a glow around the piece when ability is active
    ctx.save();
    ctx.beginPath();
    ctx.arc(piece.x, piece.y, piece.radius + 5, 0, Math.PI * 2);
    ctx.strokeStyle = 'yellow'; // Color indicating the ability
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}
