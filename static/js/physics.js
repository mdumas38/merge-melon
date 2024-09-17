// physics.js
import { GRAVITY, FRICTION, BOUNCE_FACTOR, ROTATION_FRICTION, SPEED_THRESHOLD, ANGULAR_VELOCITY_THRESHOLD, VELOCITY_THRESHOLD, CANVAS_WIDTH, CANVAS_HEIGHT } from './config.js';

export function applyGravity(piece, deltaTime) {
    piece.vy += GRAVITY * deltaTime;
}

export function applyFriction(piece) {
    piece.vx *= FRICTION;
    piece.vy *= FRICTION;
}

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

        if (Math.abs(piece1.vx) > VELOCITY_THRESHOLD || Math.abs(piece1.vy) > VELOCITY_THRESHOLD) {
            piece1.isAtRest = false;
        }

        if (Math.abs(piece2.vx) > VELOCITY_THRESHOLD || Math.abs(piece2.vy) > VELOCITY_THRESHOLD) {
            piece2.isAtRest = false;
        }

        if (piece1.ability === "Bounce Boost" && !piece1.abilityActive) {
            piece1.vy *= 1.5;
            piece1.abilityActive = true;
        }

        if (piece2.ability === "Bounce Boost" && !piece2.abilityActive) {
            piece2.vy *= 1.5;
            piece2.abilityActive = true;
        }
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