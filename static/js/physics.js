// physics.js
import { GRAVITY, FRICTION, BOUNCE_FACTOR, ROTATION_FRICTION, SPEED_THRESHOLD, ANGULAR_VELOCITY_THRESHOLD, VELOCITY_THRESHOLD, CANVAS_WIDTH, CANVAS_HEIGHT, TORQUE_FACTOR, ALL_PIECE_TYPES, SPAWN_Y, GRAVITY_MULTIPLIER, LEFT_WALL, RIGHT_WALL, CHARACTER_FAMILIES } from './config.js';
import { playSound, mergeSound } from './audio.js';
import { updateScore } from './ui.js';
import { gameState } from './gameState.js';
import { startMergeAnimation } from './abilities.js';
import { createPiece } from './piece.js';
import { createScoreSprite } from './abilities.js';

// Add this constant at the top of the file
const GROUND_FRICTION = 0.98; // Adjust this value to control the strength of ground friction

// Reset forces before applying new ones
export function resetForces(piece) {
    piece.forces = [];
}

// Apply gravity and record the force
export function applyGravity(piece, deltaTime) {
    resetForces(piece);
    
    let gravityForce = GRAVITY * piece.attributes.mass;

    // Check for Saturn pieces in the game
    const saturnPresent = gameState.pieces.some(p => p.name === "Saturn");
    
    if (saturnPresent) {
        gravityForce *= GRAVITY_MULTIPLIER;
    }

    // Check for "Float" ability
    if (piece.abilities && piece.abilities.includes("Float")) {
        gravityForce *= 0.5; // Reduce gravity by 50%
    }

    piece.forces.push({ type: 'Gravity', x: 0, y: gravityForce });
}

// Apply friction and record the force
export function applyFriction(piece) {
    if (typeof piece.vx !== 'number' || typeof piece.vy !== 'number') {
        console.error(`Invalid velocity values for piece ${piece.name}: vx=${piece.vx}, vy=${piece.vy}`);
        piece.vx = piece.vy = 0;
    }
    
    // Apply air friction
    const airFrictionForceX = -FRICTION * piece.vx;
    const airFrictionForceY = -FRICTION * piece.vy;
    piece.forces.push({ type: 'Air Friction', x: airFrictionForceX, y: airFrictionForceY });
    
    // Apply ground friction if the piece is touching the bottom or walls
    if (isOnGround(piece) || isTouchingWalls(piece)) {
        piece.vx *= GROUND_FRICTION;
        piece.forces.push({ type: 'Ground Friction', x: piece.vx * (1 - GROUND_FRICTION), y: 0 });
    }
    
    console.log(`Applied friction to piece: ${piece.name}, new vx: ${piece.vx}, new vy: ${piece.vy}`);
}

// Add these helper functions
function isOnGround(piece) {
    return piece.y + piece.attributes.radius >= CANVAS_HEIGHT;
}

function isTouchingWalls(piece) {
    return (piece.x - piece.attributes.radius <= LEFT_WALL.x + LEFT_WALL.width) ||
           (piece.x + piece.attributes.radius >= RIGHT_WALL.x);
}

// Handle collision and record the collision force
function handleCollision(piece1, piece2) {
    const dx = piece2.x - piece1.x;
    const dy = piece2.y - piece1.y;
    const distance = Math.hypot(dx, dy);
    const error_margin = 0.1;

    const min_distance = piece1.attributes.radius + piece2.attributes.radius + error_margin;

    if (distance < min_distance) {
        // Collision detected
        // Normalize the collision vector
        const nx = dx / distance;
        const ny = dy / distance;

        // Tangential vector
        const tx = -ny;
        const ty = nx;

        // Dot product of velocity and normal/tangential vectors
        const v1n = piece1.vx * nx + piece1.vy * ny;
        const v1t = piece1.vx * tx + piece1.vy * ty;
        const v2n = piece2.vx * nx + piece2.vy * ny;
        const v2t = piece2.vx * tx + piece2.vy * ty;

        // Masses
        const m1 = piece1.attributes.mass;
        const m2 = piece2.attributes.mass;

        // Bounce factors
        const bounce1 = piece1.attributes.bounceFactor || BOUNCE_FACTOR;
        const bounce2 = piece2.attributes.bounceFactor || BOUNCE_FACTOR;

        // Calculate new normal velocities after collision (1D elastic collision equations)
        const v1nAfter = ((v1n * (m1 - m2) + 2 * m2 * v2n) / (m1 + m2)) * Math.sqrt(bounce1 * bounce2);
        const v2nAfter = ((v2n * (m2 - m1) + 2 * m1 * v1n) / (m1 + m2)) * Math.sqrt(bounce1 * bounce2);

        // The tangential velocities remain the same (no friction in tangential direction)
        const v1tAfter = v1t;
        const v2tAfter = v2t;

        // Convert scalar normal and tangential velocities into vectors
        piece1.vx = v1nAfter * nx + v1tAfter * tx;
        piece1.vy = v1nAfter * ny + v1tAfter * ty;
        piece2.vx = v2nAfter * nx + v2tAfter * tx;
        piece2.vy = v2nAfter * ny + v2tAfter * ty;

        // Move pieces apart to prevent sticking
        const overlap = min_distance - distance;
        const correctionX = (overlap / (m1 + m2)) * nx;
        const correctionY = (overlap / (m1 + m2)) * ny;

        piece1.x -= correctionX * m2;
        piece1.y -= correctionY * m2;
        piece2.x += correctionX * m1;
        piece2.y += correctionY * m1;

        // After resolving collision, check for merging
        checkMerge(gameState.pieces);
    }
}

export function handleAllCollisions() {
    const pieces = gameState.pieces;
    for (let i = 0; i < pieces.length; i++) {
        const piece1 = pieces[i];
        if (piece1.merging || piece1.isStatic) continue;

        for (let j = i + 1; j < pieces.length; j++) {
            const piece2 = pieces[j];
            if (!piece2 || piece2.merging || piece2.isStatic) continue;

            if (handleCollision(piece1, piece2)) {
                checkMerge(piece1, piece2);
            }
        }
    }
}

function calculateFinalVelocity(piece1, piece2, v1, v2) {
    return (v1 * (piece1.attributes.mass - piece2.attributes.mass) + 2 * piece2.attributes.mass * v2) / (piece1.attributes.mass + piece2.attributes.mass);
}

export function updateVelocity(piece, deltaTime) {
    const totalForceX = piece.forces.reduce((sum, force) => sum + force.x, 0);
    const totalForceY = piece.forces.reduce((sum, force) => sum + force.y, 0);

    piece.vx += (totalForceX / piece.attributes.mass) * deltaTime;
    piece.vy += (totalForceY / piece.attributes.mass) * deltaTime;
}

export function updatePosition(piece, deltaTime) {
    piece.x += piece.vx * deltaTime;
    piece.y += piece.vy * deltaTime;

    // Check if the piece is at rest
    const speedSquared = piece.vx * piece.vx + piece.vy * piece.vy;
    if (speedSquared < VELOCITY_THRESHOLD * VELOCITY_THRESHOLD) {
        piece.isAtRest = true;
    } else {
        piece.isAtRest = false;
    }
    // console.log(`Piece ${piece.name} is at rest: ${piece.isAtRest}`);

    // Apply ground friction if the piece is on the ground
    if (isOnGround(piece)) {
        piece.y = CANVAS_HEIGHT - piece.attributes.radius; // Ensure the piece doesn't sink into the ground
        piece.vy = 0; // Stop vertical movement
        piece.vx *= GROUND_FRICTION; // Apply ground friction to horizontal movement
    }

    // Apply wall friction if the piece is touching the walls
    if (isTouchingWalls(piece)) {
        if (piece.x - piece.attributes.radius <= LEFT_WALL.x + LEFT_WALL.width) {
            piece.x = LEFT_WALL.x + LEFT_WALL.width + piece.attributes.radius;
        } else if (piece.x + piece.attributes.radius >= RIGHT_WALL.x) {
            piece.x = RIGHT_WALL.x - piece.attributes.radius;
        }
        piece.vx *= GROUND_FRICTION; // Apply ground friction to horizontal movement
    }
}


export function updateRotation(piece, deltaTime) {
    piece.rotation += piece.angularVelocity * deltaTime;
    piece.rotation %= Math.PI * 2;

    const speed = Math.hypot(piece.vx, piece.vy);
    if (speed > SPEED_THRESHOLD) {
        piece.angularVelocity *= ROTATION_FRICTION;
        if (Math.abs(piece.angularVelocity) < ANGULAR_VELOCITY_THRESHOLD) {
            piece.angularVelocity = 0;
        }
    } else {
        piece.angularVelocity *= ROTATION_FRICTION;
        if (Math.abs(piece.angularVelocity) < ANGULAR_VELOCITY_THRESHOLD) {
            piece.angularVelocity = 0;
        }
    }
}

// Updated collision handling function
export function handleWallCollisions(piece, LEFT_WALL, RIGHT_WALL) {
    const bounceFactor = piece.attributes.bounceFactor || BOUNCE_FACTOR;

    // Left wall collision
    if (piece.x - piece.attributes.radius < LEFT_WALL.x + LEFT_WALL.width) {
        piece.x = LEFT_WALL.x + LEFT_WALL.width + piece.attributes.radius;
        piece.vx = -piece.vx * bounceFactor;
    }

    // Right wall collision
    if (piece.x + piece.attributes.radius > RIGHT_WALL.x) {
        piece.x = RIGHT_WALL.x - piece.attributes.radius;
        piece.vx = -piece.vx * bounceFactor;
    }

    // Bottom collision (if needed)
    if (piece.y + piece.attributes.radius > CANVAS_HEIGHT) {
        piece.y = CANVAS_HEIGHT - piece.attributes.radius;
        piece.vy = -piece.vy * bounceFactor;
    }
}

// Check for merges
export function checkMerge(pieces) {
    for (let i = 0; i < pieces.length; i++) {
        for (let j = i + 1; j < pieces.length; j++) {
            const piece1 = pieces[i];
            const piece2 = pieces[j];

            if (piece1.merging || piece2.merging) {
                continue;
            }

            const dx = piece1.x - piece2.x;
            const dy = piece1.y - piece2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const error_margin = 1;
            if (distance <= piece1.attributes.radius + piece2.attributes.radius + error_margin) {
                if (areMergeable(piece1, piece2)) {
                    // Check for special abilities that don't result in evolution
                    if (hasSpecialMergeAbility(piece1, piece2)) {
                        console.log(`Special merge ability detected between ${piece1.name} and ${piece2.name}`);
                        handleSpecialMerge(piece1, piece2);
                        return true;
                    }

                    // Regular evolution merge
                    const newPieceType = getNextEvolution(piece1);
                    if (newPieceType) {
                        startMergeAnimation(piece1, piece2, newPieceType);
                        
                        // Check if the new piece is a Moon
                        if (newPieceType.name === "Moon") {
                            spawnAsteroids();
                        }
                        
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

// New helper function to check for special merge abilities
function hasSpecialMergeAbility(piece1, piece2) {
    const hasAbility1 = piece1.abilities && piece1.abilities.includes("Eat Fruit");
    const hasAbility2 = piece2.abilities && piece2.abilities.includes("Eat Fruit");
    const isFruit1 = isFruit(piece1);
    const isFruit2 = isFruit(piece2);

    if (hasAbility1 && isFruit2) {
        console.log(`${piece1.name} has the ability to eat fruit and ${piece2.name} is a fruit.`);
    } else if (hasAbility2 && isFruit1) {
        console.log(`${piece2.name} has the ability to eat fruit and ${piece1.name} is a fruit.`);
    }

    return (hasAbility1 && isFruit2) || (hasAbility2 && isFruit1);
    // Add more special abilities here as needed
}

// New helper function to handle special merges
function handleSpecialMerge(piece1, piece2) {
    if (piece1.abilities && piece1.abilities.includes("Eat Fruit") && isFruit(piece2)) {
        console.log(`${piece1.name} is eating ${piece2.name}`);
        eatFruit(piece1, piece2);
    } else if (piece2.abilities && piece2.abilities.includes("Eat Fruit") && isFruit(piece1)) {
        console.log(`${piece2.name} is eating ${piece1.name}`);
        eatFruit(piece2, piece1);
    }
    // Add more special merge handlers here as needed
}

// Add this new function to spawn asteroids
function spawnAsteroids() {
    const asteroidType = ALL_PIECE_TYPES.find(type => type.name === "Asteroid");
    if (!asteroidType) {
        console.error("Asteroid piece type not found");
        return;
    }

    const numAsteroids = Math.floor(Math.random() * 5) + 1; // Random number between 1 and 5
    const minX = LEFT_WALL.x + LEFT_WALL.width + asteroidType.attributes.radius;
    const maxX = RIGHT_WALL.x - asteroidType.attributes.radius;

    for (let i = 0; i < numAsteroids; i++) {
        const asteroid = createPiece(asteroidType);
        asteroid.x = Math.random() * (maxX - minX) + minX;
        asteroid.y = SPAWN_Y;
        gameState.pieces.push(asteroid);
    }

    console.log(`Spawned ${numAsteroids} asteroids`);
}

function areMergeable(piece1, piece2) {
    // Check if pieces are from the same family and have the same tier
    const mergeable = piece1.family === piece2.family && piece1.tier === piece2.tier;

    // Check if either of the pieces has the ability to eat fruit
    if (piece1.abilities && piece1.abilities.includes("Eat Fruit") && isFruit(piece2)) {
        return canEatFruit(piece1, piece2); // Check if piece1 can eat piece2 (fruit)
    }

    if (piece2.abilities && piece2.abilities.includes("Eat Fruit") && isFruit(piece1)) {
        return canEatFruit(piece2, piece1); // Check if piece2 can eat piece1 (fruit)
    }
    return mergeable;
}

export  function isFruit(piece) {
    return ['Cherry', 'Strawberry', 'Grape', 'Orange', 'Kiwi', 'Melon', 'Pineapple', 'Watermelon'].includes(piece.name);
}

// Updated function to handle fruit eating with optimized collision detection
export function eatFruit(animal, fruit) {
    const dx = animal.x - fruit.x;
    const dy = animal.y - fruit.y;
    const distanceSquared = dx * dx + dy * dy;
    console.log(`Distance squared: ${distanceSquared}`);
    const contactThreshold = (animal.attributes.radius + fruit.attributes.radius) ** 2;
    console.log(`Contact threshold: ${contactThreshold}`);

    if (distanceSquared <= contactThreshold) {
        console.log(`${animal.name} is eating a ${fruit.name}!`);
        gameState.pieces = gameState.pieces.filter(piece => piece !== fruit);
        const scoreIncrease = fruit.attributes.value;
        gameState.score += scoreIncrease;
        updateScore();
        playSound(mergeSound);
        
        // Create and animate the score sprite
        createScoreSprite(fruit.x, fruit.y, scoreIncrease);
    } else {
        console.log(`${animal.name} is not in contact with ${fruit.name}, cannot eat it.`);
    }
}

// Helper function to check if an animal can eat a specific fruit
export function canEatFruit(animal, fruit) {
    const fruitEaters = {
        'Ladybug': ['Grape'],
        'Mouse': ['Cherry'],
        'Cat': ['Strawberry'],
        'Doggo': ['Apple'],
        'Bear': ['Pineapple'],
        'Elephant': ['Watermelon'],
    };

    return fruitEaters[animal.name] && fruitEaters[animal.name].includes(fruit.name);
}

function getNextEvolution(piece) {
    if (!piece.family) {
        console.error(`Family not found for piece: ${piece.name}`);
        return null;
    }

    const family = CHARACTER_FAMILIES[piece.family];
    // console.log(`Family: ${piece.family}`);
    if (!family || !family.evolutionChain) {
        console.error(`Evolution chain not found for family: ${piece.family}`);
        return null;
    }

    const currentIndex = family.evolutionChain.findIndex(evolution => evolution.name === piece.name);
    if (currentIndex === -1 || currentIndex === family.evolutionChain.length - 1) {
        // Piece not found in evolution chain or is at max evolution
        return null;
    }

    const nextEvolutionName = family.evolutionChain[currentIndex + 1].name;
    console.log(`Next evolution for ${piece.name} is ${nextEvolutionName}`);
    return ALL_PIECE_TYPES.find(p => p.name === nextEvolutionName);
}