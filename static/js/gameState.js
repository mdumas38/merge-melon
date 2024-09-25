// gameState.js
export const gameState = {
    canvas: document.getElementById('game-canvas'),
    backgroundMusic: document.getElementById('background-music'), // Updated ID to match HTML
    pauseButton: document.getElementById('pause-button'),
    muteButton: document.getElementById('mute-button'),
    quitButton: document.getElementById('quit-button'),
    startButton: document.getElementById('start-button'),
    shopItemsContainer: document.getElementById('shopItemsContainer'),
    closeShopButton: document.getElementById('close-shop-button'),
    restartButton: document.getElementById('restart-button'),
    resumeButton: document.getElementById('resume-button'),
    gameOverDiv: document.getElementById('game-over'),
    staticDeck: [], // Represents the Deck
    purchasedBalls: [], // Represents the Inventory
    activeDeck: [],
    staticDeckSnapshot: [],
    pieces: [],
    currentPiece: null,
    particles: [], // Added particles
    score: 0,
    round: 1,
    gold: 0,
    lives: 3,
    gameOver: false,    
    lastTime: performance.now(),
    animationId: null,
    lastThrowTime: 0,
    isPaused: false,
    debugMode: false,
    selectedPiece: null,
    aimX: 0,
    aimY: 0,
    imageCache: {},
};

// Getter and setter for activeDeck
export const getActiveDeck = () => gameState.activeDeck;
export const updateActiveDeck = (newDeck) => {
    gameState.activeDeck = newDeck;
};

