// physics.js
import { GRAVITY, FRICTION, BOUNCE_FACTOR, ROTATION_FRICTION, SPEED_THRESHOLD, ANGULAR_VELOCITY_THRESHOLD, VELOCITY_THRESHOLD, CANVAS_WIDTH, CANVAS_HEIGHT, TORQUE_FACTOR, ALL_PIECE_TYPES } from './config.js';
import { playSound, mergeSound } from './audio.js';
import { updateScore } from './ui.js';
import { gameState } from './gameState.js';
import { startMergeAnimation } from './abilities.js';
import { LEFT_WALL, RIGHT_WALL, CHARACTER_FAMILIES} from './config.js';

// Reset forces before applying new ones
function resetForces(piece) {
    piece.forces = [];
}

// Apply gravity and record the force
export function applyGravity(piece, deltaTime) {
    resetForces(piece);
    
    let gravityForce = GRAVITY * piece.attributes.mass;

    // Check for "Float" ability
    if (piece.abilities && piece.abilities.includes("Float")) {
        gravityForce *= 0.5; // Reduce gravity by 50%
    }

    piece.forces.push({ type: 'Gravity', x: 0, y: gravityForce });
    
    piece.vy += GRAVITY * deltaTime * (piece.abilities && piece.abilities.includes("Float") ? 0.5 : 1);
}

// Apply friction and record the force
export function applyFriction(piece) {
    if (typeof piece.vx !== 'number' || typeof piece.vy !== 'number') {
        console.error(`Invalid velocity values for piece ${piece.name}: vx=${piece.vx}, vy=${piece.vy}`);
        piece.vx = piece.vy = 0;
    }
    
    const frictionForceX = -FRICTION * piece.vx;
    const frictionForceY = -FRICTION * piece.vy;
    piece.forces.push({ type: 'Friction', x: frictionForceX, y: frictionForceY });
    
    piece.vx *= FRICTION;
    piece.vy *= FRICTION;
    console.log(`Applied friction to piece: ${piece.name}, new vx: ${piece.vx}, new vy: ${piece.vy}`);
}

// Handle collision and record the collision force
export function handleCollision(piece1, piece2) {
    const dx = piece2.x - piece1.x;
    const dy = piece2.y - piece1.y;
    const distance = Math.hypot(dx, dy);
    const overlap = piece1.attributes.radius + piece2.attributes.radius - distance;

    if (overlap > 0) {
        const mtvX = (dx / distance) * overlap;
        const mtvY = (dy / distance) * overlap;

        const totalMass = piece1.attributes.mass + piece2.attributes.mass;
        piece1.x -= (mtvX * (piece2.attributes.mass / totalMass));
        piece1.y -= (mtvY * (piece2.attributes.mass / totalMass));
        piece2.x += (mtvX * (piece1.attributes.mass / totalMass));
        piece2.y += (mtvY * (piece1.attributes.mass / totalMass));

        const normalX = dx / distance;
        const normalY = dy / distance;
        const tangentX = -normalY;
        const tangentY = normalX;

        const dpNorm1 = piece1.vx * normalX + piece1.vy * normalY;
        const dpNorm2 = piece2.vx * normalX + piece2.vy * normalY;
        const dpTan1 = piece1.vx * tangentX + piece1.vy * tangentY;
        const dpTan2 = piece2.vx * tangentX + piece2.vy * tangentY;

        const m1 = (dpNorm1 * (piece1.attributes.mass - piece2.attributes.mass) + 2 * piece2.attributes.mass * dpNorm2) / (piece1.attributes.mass + piece2.attributes.mass);
        const m2 = (dpNorm2 * (piece2.attributes.mass - piece1.attributes.mass) + 2 * piece1.attributes.mass * dpNorm1) / (piece1.attributes.mass + piece2.attributes.mass);

        piece1.vx = (tangentX * dpTan1 + normalX * m1) * FRICTION;
        piece1.vy = (tangentY * dpTan1 + normalY * m1) * FRICTION;
        piece2.vx = (tangentX * dpTan2 + normalX * m2) * FRICTION;
        piece2.vy = (tangentY * dpTan2 + normalY * m2) * FRICTION;

        // Record collision forces
        const collisionForceX = (m1 - dpNorm1) * normalX;
        const collisionForceY = (m1 - dpNorm1) * normalY;
        piece1.forces.push({ type: 'Collision', x: collisionForceX, y: collisionForceY });
        piece2.forces.push({ type: 'Collision', x: -collisionForceX, y: -collisionForceY });

        console.log(`Collision forces recorded for ${piece1.name} and ${piece2.name}`);

        // Compute angular velocity changes based on tangential component
        piece1.angularVelocity += dpTan1 * TORQUE_FACTOR;
        piece2.angularVelocity += dpTan2 * TORQUE_FACTOR;

        // Apply rotation friction
        piece1.angularVelocity *= ROTATION_FRICTION;
        piece2.angularVelocity *= ROTATION_FRICTION;

        if (Math.abs(piece1.vx) > VELOCITY_THRESHOLD || Math.abs(piece1.vy) > VELOCITY_THRESHOLD) {
            piece1.isAtRest = false;
        }

        if (Math.abs(piece2.vx) > VELOCITY_THRESHOLD || Math.abs(piece2.vy) > VELOCITY_THRESHOLD) {
            piece2.isAtRest = false;
        }

        if (piece1.ability === "Bounce Boost" && !piece1.abilityActive) {
            piece1.vy *= 1.5;
            piece1.abilityActive = true;
            console.log(`${piece1.name}'s ability 'Bounce Boost' activated!`);
        }

        if (piece2.ability === "Bounce Boost" && !piece2.abilityActive) {
            piece2.vy *= 1.5;
            piece2.abilityActive = true;
            console.log(`${piece2.name}'s ability 'Bounce Boost' activated!`);
        }

        // After resolving collision, check for merging
        checkMerge(gameState.pieces);
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
export function handleWallCollisions(piece) {
    // Left wall collision
    if (piece.x - piece.attributes.radius < LEFT_WALL.x + LEFT_WALL.width) {
        piece.x = LEFT_WALL.x + LEFT_WALL.width + piece.attributes.radius;
        piece.vx = Math.abs(piece.vx) * BOUNCE_FACTOR;
    }
    
    // Right wall collision
    if (piece.x + piece.attributes.radius > RIGHT_WALL.x) {
        piece.x = RIGHT_WALL.x - piece.attributes.radius;
        piece.vx = -Math.abs(piece.vx) * BOUNCE_FACTOR;
    }
    
    // Bottom collision (optional, depending on your game design)
    if (piece.y + piece.attributes.radius > CANVAS_HEIGHT) {
        piece.y = CANVAS_HEIGHT - piece.attributes.radius;
        piece.vy = -Math.abs(piece.vy) * BOUNCE_FACTOR;
    }
}

// Check for merges
export function checkMerge(pieces) {
    console.log(`Checking for merges among pieces`);
    for (let i = 0; i < pieces.length; i++) {
        for (let j = i + 1; j < pieces.length; j++) {
            const piece1 = pieces[i];
            const piece2 = pieces[j];

            if (piece1.merging || piece2.merging) {
                console.log(`Skipping merge check for ${piece1.name} and ${piece2.name} because one is already merging.`);
                continue;
            }

            const dx = piece1.x - piece2.x;
            const dy = piece1.y - piece2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            console.log(`Distance between ${piece1.name} and ${piece2.name}: ${distance}`);

            if (distance <= piece1.attributes.radius + piece2.attributes.radius) {
                console.log(`${piece1.name} and ${piece2.name} are close enough to merge.`);
                // Check if pieces are from the same family and have the same tier
                if (areMergeable(piece1, piece2)) {
                    const newPieceType = getNextEvolution(piece1);
                    if (newPieceType) {
                        console.log(`Next evolution for ${piece1.name} is ${newPieceType.name}`);
                        startMergeAnimation(piece1, piece2, newPieceType);
                        console.log(`Merging ${piece1.name} and ${piece2.name} into ${newPieceType.name}`);
                        return true;
                    } else {
                        console.log(`No further evolution available for ${piece1.name}`);
                    }
                } else {
                    console.log(`${piece1.name} and ${piece2.name} are not mergeable.`);
                }
            } else {
                console.log(`${piece1.name} and ${piece2.name} are too far apart to merge.`);
            }
        }
    }
    console.log(`No merges found.`);
    return false;
}


function areMergeable(piece1, piece2) {
    // Check if pieces are from the same family and have the same tier
    const mergeable = piece1.family === piece2.family && piece1.tier === piece2.tier;
    console.log(`Are ${piece1.name} and ${piece2.name} mergeable? ${mergeable}`);
    return mergeable;
}

function getNextEvolution(piece) {
    if (!piece.family) {
        console.error(`Family not found for piece: ${piece.name}`);
        return null;
    }

    const family = CHARACTER_FAMILIES[piece.family];
    console.log(`Family: ${piece.family}`);
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