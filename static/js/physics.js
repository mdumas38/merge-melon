// physics.js
import { GRAVITY, FRICTION, BOUNCE_FACTOR, ROTATION_FRICTION, SPEED_THRESHOLD, ANGULAR_VELOCITY_THRESHOLD, VELOCITY_THRESHOLD, CANVAS_WIDTH, CANVAS_HEIGHT, TORQUE_FACTOR, ALL_PIECE_TYPES } from './config.js';
import { playSound, mergeSound } from './audio.js';
import { updateScore } from './ui.js';
import { gameState } from './gameState.js';
import { startMergeAnimation } from './abilities.js';
import { LEFT_WALL, RIGHT_WALL } from './config.js';

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
        checkMerge(piece1, piece2);
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
export function checkMerge(existingPiece, releasedPiece) {
    const { score } = gameState;
    if (
        existingPiece.attributes.value === releasedPiece.attributes.value &&
        !existingPiece.merging &&
        !releasedPiece.merging
    ) {
        const newPieceType = ALL_PIECE_TYPES.find(
            (pt) => pt.attributes.value === existingPiece.attributes.value * 2
        );

        if (newPieceType) {
            startMergeAnimation(existingPiece, releasedPiece, newPieceType);
            gameState.score += newPieceType.attributes.value;
            updateScore();
            playSound(mergeSound); // Use the imported mergeSound
        } else {
            console.warn(`No piece found with value ${existingPiece.attributes.value * 2} to merge into.`);
        }
    } else {
        if (existingPiece.merging || releasedPiece.merging) {
            console.log(`Cannot merge: One or both pieces are already merging.`);
        }
    }
}