// render.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, FRICTION, BOUNCE_FACTOR } from './config.js';

export function drawPiece(ctx, piece, imageCache) {
    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.scale(piece.animationScale || 1, piece.animationScale || 1);

    // Clipping path for the piece
    ctx.beginPath();
    ctx.arc(0, 0, piece.attributes.radius, 0, Math.PI * 2);
    ctx.clip();

    // Draw face image
    const faceImg = imageCache[`${piece.name}_face`];
    if (faceImg && faceImg.complete) {
        ctx.drawImage(faceImg, -piece.attributes.radius, -piece.attributes.radius, piece.attributes.radius * 2, piece.attributes.radius * 2);
    } else {
        // Fallback: Draw colored circle
        ctx.beginPath();
        ctx.arc(0, 0, piece.attributes.radius, 0, Math.PI * 2);
        ctx.fillStyle = piece.attributes.color;
        ctx.fill();

        // Draw value number
        ctx.fillStyle = "#000000";
        ctx.font = `${piece.attributes.radius}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(piece.attributes.value, 0, 0);
    }

    ctx.restore();

    // Draw ears
    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.rotate(piece.rotation);

    const earsImg = imageCache[`${piece.name}_ears`];
    if (earsImg && earsImg.complete) {
        ctx.drawImage(earsImg, -piece.attributes.radius, -piece.attributes.radius - 11, piece.attributes.radius * 2, piece.attributes.radius);
    }

    ctx.restore();
}

export function drawTrajectoryLines(ctx, currentPiece, aimX, aimY, pieces, config) {
    if (currentPiece) {
        ctx.beginPath();
        ctx.moveTo(currentPiece.x, currentPiece.y);

        let simX = currentPiece.x;
        let simY = currentPiece.y;
        const dx = aimX - currentPiece.x;
        const dy = aimY - currentPiece.y;
        const distance = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        const power = Math.min(distance / config.POWER_SCALING_FACTOR, 50) * 100 * config.POWER_MULTIPLIER;

        let simVx = Math.cos(angle) * power;
        let simVy = Math.sin(angle) * power;

        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.setLineDash([10, 5]);

        let collision = false;
        for (let i = 0; i < 120 && !collision; i++) {
            const prevX = simX;
            const prevY = simY;

            simVy += config.GRAVITY * 0.016;
            simVx *= config.FRICTION;
            simVy *= config.FRICTION;
            simX += simVx * 0.016;
            simY += simVy * 0.016;

            if (simY + currentPiece.attributes.radius > config.CANVAS_HEIGHT ||
                simX - currentPiece.attributes.radius < 0 ||
                simX + currentPiece.attributes.radius > config.CANVAS_WIDTH) {
                collision = true;
                simX = Math.max(currentPiece.attributes.radius, Math.min(config.CANVAS_WIDTH - currentPiece.attributes.radius, simX));
                simY = Math.min(config.CANVAS_HEIGHT - currentPiece.attributes.radius, simY);
            }

            for (const piece of pieces) {
                const dx = simX - piece.x;
                const dy = simY - piece.y;
                const distance = Math.hypot(dx, dy);
                if (distance < currentPiece.attributes.radius + piece.attributes.radius) {
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
        ctx.setLineDash([]);
    }
}

export function render(ctx, pieces, currentPiece, particles, imageCache, config) {
    ctx.clearRect(0, 0, config.CANVAS_WIDTH, config.CANVAS_HEIGHT);

    // Draw trajectory lines
    drawTrajectoryLines(ctx, currentPiece, config.aimX, config.aimY, pieces, config);

    // Draw pieces
    for (const piece of pieces) {
        drawPiece(ctx, piece, imageCache);
    }

    // Draw current piece if it's not merging
    if (currentPiece && !currentPiece.merging) {
        drawPiece(ctx, currentPiece, imageCache);
    }

    // Draw particles
    for (const particle of particles) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color + Math.floor(particle.life * 255).toString(16).padStart(2, '0');
        ctx.fill();
    }

    // Draw spawn indicator
    drawSpawnIndicator(ctx, config);

    // Draw boundaries
    drawBoundaries(ctx, config);
}

function drawSpawnIndicator(ctx, config) {
    ctx.beginPath();
    ctx.moveTo(config.CANVAS_WIDTH / 2 - 15, config.SPAWN_Y - 15);
    ctx.lineTo(config.CANVAS_WIDTH / 2, config.SPAWN_Y);
    ctx.lineTo(config.CANVAS_WIDTH / 2 + 15, config.SPAWN_Y - 15);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
}

export function drawBoundaries(ctx, config) {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, config.CANVAS_WIDTH, config.CANVAS_HEIGHT);
}