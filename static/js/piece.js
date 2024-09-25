// piece.js
import { ALL_PIECE_TYPES, CANVAS_WIDTH, SPAWN_Y } from './config.js';

export function createPiece(character) {
    if (!character.attributes) {
        console.error(`Character ${character.name} is missing attributes.`);
    }

    const newPiece = {
        ...character, // Spread all character properties
        x: CANVAS_WIDTH / 2,
        y: SPAWN_Y + character.attributes.radius,
        tier: character.attributes.tier,
        vx: 0,
        vy: 0,
        rotation: 0,
        angularVelocity: 0,
        isAtRest: false,
        merging: false,
        absorbing: false,
        forces: [], // Initialize forces array
        hasJumped: false, // Initialize hasJumped flag for abilities
        id: null // Initialize id property
    };
    console.log(`Created new piece: ${newPiece.name} at (${newPiece.x}, ${newPiece.y})`);
    return newPiece;
}

// Fisher-Yates Shuffle Algorithm for unbiased shuffling
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); // Random index from 0 to i
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
}