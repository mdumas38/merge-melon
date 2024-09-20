import { THROW_COOLDOWN, POWER_SCALING_FACTOR, POWER_MULTIPLIER, MAX_VELOCITY } from './config.js';

export function handleMouseMove(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

export function handleMouseUp(e, currentPiece, canvas, config, pieces, spawnPiece, launchSound, lastThrowTime, setLastThrowTime) {
    const currentTime = performance.now();
    if (currentTime - lastThrowTime >= THROW_COOLDOWN && currentPiece) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const dx = mouseX - currentPiece.x;
        const dy = mouseY - currentPiece.y;
        const distance = Math.hypot(dx, dy);

        if (distance === 0) return;

        const power = Math.min(distance / POWER_SCALING_FACTOR, 50);

        currentPiece.vx = (dx / distance) * power * 100 * POWER_MULTIPLIER;
        currentPiece.vy = (dy / distance) * power * 100 * POWER_MULTIPLIER;

        currentPiece.vx = Math.max(Math.min(currentPiece.vx, MAX_VELOCITY), -MAX_VELOCITY);
        currentPiece.vy = Math.max(Math.min(currentPiece.vy, MAX_VELOCITY), -MAX_VELOCITY);

        pieces.push(currentPiece);
        launchSound.play();
        spawnPiece();
        setLastThrowTime(currentTime);
    }
}