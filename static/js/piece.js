// piece.js
import { ALL_PIECE_TYPES, CANVAS_WIDTH, SPAWN_Y } from './config.js';

export function createPiece(character) {
    const newPiece = {
        ...character, // Spread all character properties
        x: CANVAS_WIDTH / 2,
        y: SPAWN_Y + character.attributes.radius,
        vx: 0,
        vy: 0,
        rotation: 0,
        angularVelocity: 0, // Initialize angular velocity to zero, removed randomization
        isAtRest: false,
        merging: false,
        absorbing: false,
    };
    console.log(`Created new piece: ${newPiece.name} at (${newPiece.x}, ${newPiece.y})`);
    return newPiece;
}

export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}