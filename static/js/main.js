// main.js
import { initGame } from './game.js';

// Audio files
// const launchSound = new Audio('/static/audio/drop.mp3');

// Add references to start menu elements
const startMenu = document.getElementById('start-menu');
const startButton = document.getElementById('start-button');

import { LEFT_WALL, RIGHT_WALL } from './config.js';

// Remove the container object
// export const container = { ... };

// Add wall objects
export const leftWall = {
    ...LEFT_WALL,
    isStatic: true,
    name: "LeftWall"
};

export const rightWall = {
    ...RIGHT_WALL,
    isStatic: true,
    name: "RightWall"
};

let debugMode = false; // Add a debug mode flag
let selectedPiece = null; // Track the selected piece for force monitoring

// Track the number of balls remaining in the deck
let deckCount = 0;
// Ensure that the game loop starts only after images are loaded and the Start button is clicked.

// Initial setup function
initGame();