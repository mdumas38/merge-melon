// piece.js
import { ALL_PIECE_TYPES, CANVAS_WIDTH, SPAWN_Y, CHARACTER_FAMILIES } from './config.js';

export function createPiece(character) {
    if (!character.attributes) {
        console.error(`Character ${character.name} is missing attributes.`);
    }

    const newPiece = {
        ...character, // Spread all character properties
        physics: {
            x: CANVAS_WIDTH / 2,
            y: SPAWN_Y + character.attributes.radius,
            radius: character.attributes.radius,
            vx: 0,
            vy: 0,
            mass: character.attributes.mass,
            isAtRest: false,
            forces: [],
        },
        visual: {
            width: character.attributes.width || character.attributes.radius * 2,
            height: character.attributes.height || character.attributes.radius * 2,
            rotation: 0,
            angularVelocity: 0,
        },
        tier: character.tier,
        merging: false,
        absorbing: false,
        hasJumped: false,
        id: null,
        family: character.family
    };
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