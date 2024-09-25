// main.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, ALL_PIECE_TYPES, THROW_COOLDOWN, SPAWN_Y, 
    POWER_SCALING_FACTOR, POWER_MULTIPLIER, MAX_VELOCITY, END_ROUND_COOLDOWN, 
    BOUNCE_FACTOR, FRICTION, INITIAL_DECK_VALUES, CHARACTER_FAMILIES, CONTAINER, 
    SHOP_ITEMS } from './config.js';
import { initGame } from './game.js';

// Audio files
// const launchSound = new Audio('/static/audio/drop.mp3');

// Add references to start menu elements
const startMenu = document.getElementById('start-menu');
const startButton = document.getElementById('start-button');

export const container = {
    x: CONTAINER.x, // Top-left x-coordinate
    y: CONTAINER.y, // Top-left y-coordinate
    width: CONTAINER.width,
    height: CONTAINER.height,
    vx: 0,
    vy: 0,
    isStatic: true, // Indicates that this object doesn't move
    attributes: {
        radius: 0, // Not used for rectangular container
        color: CONTAINER.color,
        value: 0,
        mass: Infinity, // Infinite mass to make it immovable
    },
    name: "Container"
};

let debugMode = false; // Add a debug mode flag
let selectedPiece = null; // Track the selected piece for force monitoring

// Track the number of balls remaining in the deck
let deckCount = 0;
// Ensure that the game loop starts only after images are loaded and the Start button is clicked.

// Initial setup function
initGame();