import { THROW_COOLDOWN, POWER_SCALING_FACTOR, POWER_MULTIPLIER, MAX_VELOCITY } from './config.js';
import { gameState, getActiveDeck, getRemainingPieces } from './gameState.js';

export function handleMouseMove(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Find the hovered piece
    const hoveredPiece = gameState.pieces.find(piece => {
        if (!piece || !piece.physics || typeof piece.physics.x !== 'number' || typeof piece.physics.y !== 'number' || !piece.attributes || typeof piece.attributes.radius !== 'number') {
            return false;
        }
        const dx = piece.physics.x - mouseX;
        const dy = piece.physics.y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const isHovered = distance <= piece.attributes.radius;
        return isHovered;
    });

    // Update gameState
    gameState.hoveredPiece = hoveredPiece;
    gameState.mouseX = mouseX;
    gameState.mouseY = mouseY;

    // Check if mouse is hovering over the current piece
    if (gameState.currentPiece) {
        const dx = gameState.currentPiece.physics.x - mouseX;
        const dy = gameState.currentPiece.physics.y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= gameState.currentPiece.attributes.radius) {
            gameState.hoveredPiece = gameState.currentPiece;
        }
    }

    // Check if mouse is hovering over the next piece
    if (gameState.nextPiece) {
        // Assuming the next piece is displayed at a fixed position, adjust these values as needed
        const nextPieceX = -0.96 * canvas.width;
        const nextPieceY = -0.85 * canvas.height;
        
        const dx = nextPieceX - mouseX;
        const dy = nextPieceY - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= gameState.nextPiece.attributes.radius) {
            console.log('Hovering over next piece');
            gameState.hoveredPiece = gameState.nextPiece;
        }
    }

    return { x: mouseX, y: mouseY };
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

        const dx = mouseX - currentPiece.physics.x;
        const dy = mouseY - currentPiece.physics.y;
        const distance = Math.hypot(dx, dy);

        if (distance === 0) return;

        const power = Math.min(distance / POWER_SCALING_FACTOR, 50);

        currentPiece.physics.vx = (dx / distance) * power * 100 * POWER_MULTIPLIER;
        currentPiece.physics.vy = (dy / distance) * power * 100 * POWER_MULTIPLIER;

        currentPiece.physics.vx = Math.max(Math.min(currentPiece.physics.vx, MAX_VELOCITY), -MAX_VELOCITY);
        currentPiece.physics.vy = Math.max(Math.min(currentPiece.physics.vy, MAX_VELOCITY), -MAX_VELOCITY);

        pieces.push(currentPiece);
        launchSound.play();

        // Check if this was the last piece
        if (getRemainingPieces() === 1) {  // 1 because we haven't updated ballInHand yet
            gameState.ballInHand = false;
            // No need to spawn a new piece
        } else {
            spawnPiece();
        }

        // Update the lastThrowTime in gameState
        gameState.lastThrowTime = currentTime;
    }
}
