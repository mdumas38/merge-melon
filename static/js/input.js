import { THROW_COOLDOWN, POWER_SCALING_FACTOR, POWER_MULTIPLIER, MAX_VELOCITY } from './config.js';
import { gameState, getActiveDeck } from './gameState.js';

export function handleMouseMove(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

export function handleMouseUp(e, currentPiece, canvas, pieces, spawnPiece, launchSound, lastThrowTime) {
    if (gameState.isRoundComplete || gameState.isPaused || !gameState.ballInHand) {
        console.log("No ball in hand", "ball in hand:",!gameState.ballInHand);
        return; // Ignore input if round is complete, game is paused, or no ball in hand
    }

    const currentTime = performance.now();
    if (currentTime - lastThrowTime >= THROW_COOLDOWN) {
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

        // Get the active deck length
        const activeDeckLength = getActiveDeck().length;

        // Check if this was the last piece (including the one in hand)
        if (activeDeckLength === 0) {
            gameState.ballInHand = false;
            // No need to spawn a new piece
        } else {
            spawnPiece();
        }

        // Update the lastThrowTime in gameState
        gameState.lastThrowTime = currentTime;
    }
}
