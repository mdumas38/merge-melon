import { getRandomShopItems } from './helper.js';
import { createPiece, shuffleArray } from './piece.js';
import { ALL_PIECE_TYPES, INITIAL_DECK_VALUES, SHOP_ITEMS, CANVAS_WIDTH, SPAWN_Y, CHARACTER_FAMILIES } from './config.js';
import { gameState, getActiveDeck, updateActiveDeck } from './gameState.js'; // Updated import
import { updateDeckCount, updateGold, updateRound, updateTargetScore, showRoundEndScreen, showRoundLostScreen, updateScore } from './ui.js';
import { openShop, renderDeck, closeShop } from './shop.js'; // Add this import
import { resetGame, gameLoop, checkRoundCompletion } from './game.js';

// Initialize the deck
export function initDeck() {
    // console.log(">>> Function: initDeck() - Initializing the deck.");
    // This function initializes the staticDeck
    if (gameState.staticDeck.length === 0) {
        // Choose a random family
        const families = Object.keys(CHARACTER_FAMILIES);
        const randomFamily = families[Math.floor(Math.random() * families.length)];
        // console.log(`Chosen family for this game: ${randomFamily}`);
        
        // Get the evolution chain for the chosen family
        const evolutionChain = CHARACTER_FAMILIES[randomFamily].evolutionChain;
        // console.log(`Evolution chain for ${randomFamily}:`, evolutionChain);
        
        // Use INITIAL_DECK_VALUES to populate the deck
        for (let i = 0; i < INITIAL_DECK_VALUES.length; i++) {
            const tierIndex = INITIAL_DECK_VALUES[i];
            // console.log(`Deck value at index ${i}: ${tierIndex}`);
            const characterName = evolutionChain[tierIndex];
            // console.log(`Character name from evolution chain: ${characterName.name}`);
            const characterType = ALL_PIECE_TYPES.find(type => type.name === characterName.name);
            // console.log(`Character type found: ${characterType ? characterType.name : 'Not found'}`);
            
            if (characterType) {
                const newPiece = createPiece(characterType);
                gameState.staticDeck.push(newPiece);
                // console.log(`Added ${characterName.name} to the deck.`);
            } else {
                // console.error(`Character type not found for ${characterName} in family ${randomFamily}`);
            }
        }
    } else {
        // console.log("Deck already initialized. Clearing existing deck...");
        gameState.staticDeck = []; // Clear the existing deck
        const deckContainer = document.getElementById('deck-items');
        // console.log("Deck container found:", deckContainer);
        
        if (deckContainer) {
            const slots = deckContainer.querySelectorAll('.deck-slot');
            // console.log(`Found ${slots.length} slots in the deck container.`);
            
            slots.forEach((slot, index) => {
                // console.log(`Checking slot ${index + 1}:`, slot);
                
                if (slot.dataset.pieceName) {
                    // console.log("slot.dataset.pieceName:", slot.dataset.pieceName);
                    const pieceType = ALL_PIECE_TYPES.find(pt => pt.name === slot.dataset.pieceName);
                    // console.log(`Found piece name in slot: ${slot.dataset.pieceName}`);
                    
                    if (pieceType) {
                        gameState.staticDeck.push(createPiece(pieceType));
                        // console.log(`Added piece to static deck:`, pieceType);
                    } else {
                        // console.log(`No piece type found for: ${slot.dataset.pieceName}`);
                    }
                } else {
                    // console.log(`Slot ${index + 1} is empty.`);
                }
            });
        } else {
            // console.log("Deck container not found.");
        }
    }    
    createActiveDeck();
    // console.log(`Active deck created with ${gameState.activeDeck.length} pieces.`);
}



function createActiveDeck() {
    gameState.activeDeck = [];
    
    gameState.staticDeck.forEach(piece => {
        // Add each piece from staticDeck to activeDeck only once
        const newPiece = createPiece(piece);
        gameState.activeDeck.push(newPiece);
    });
    // console.log("Active deck created:", gameState.activeDeck);
}

// **Snapshot the Static Deck**
export function snapshotStaticDeck() {
    gameState.staticDeckSnapshot = [...gameState.staticDeck];
    // console.log("Static deck snapshot taken:", gameState.staticDeckSnapshot);
    
    // After taking the snapshot, recreate the activeDeck
    createActiveDeck();
}

// **Initialize Active Deck at the start of the round**
export function initializeRound() {
    console.log("Initializing round...");
    gameState.isRoundComplete = false;
    gameState.activeDeck = [...gameState.staticDeck]; // Replenish the active deck
    createActiveDeck();
    shuffleArray(gameState.activeDeck);
    updateDeckCount();
    spawnPiece();
}

// **Monitor Active Deck and end round when empty**
export function checkActiveDeck() {
    if (gameState.activeDeck.length === 0 && !gameState.isRoundComplete) {
        console.log("Active deck is empty. Ending round...");
        checkRoundCompletion();
    } else if (gameState.isRoundComplete) {
        // console.log("Round is already complete. Skipping check.");
    }
}

export function endRound() {
    if (gameState.isRoundComplete) {
        // console.log("Round is already complete. Skipping end round process.");
        return;
    }
    console.log("Ending round...");
    gameState.isRoundComplete = true;
    
    // Calculate rewards
    const baseReward = 3;
    const uniqueFamilies = countUniqueFamilies(gameState.staticDeck);
    const totalReward = baseReward + uniqueFamilies;

    // Check if the player has met the target score
    const isRoundWon = gameState.score >= gameState.targetScore;

    if (isRoundWon) {
        // Update gold for winning
        gameState.gold += totalReward;
        updateGold();
        console.log(`Round won! Gold updated. New Gold Balance: ${gameState.gold}`);

        // Show round end screen for winning
        showRoundEndScreen(baseReward, uniqueFamilies, totalReward, true);
    } else {
        // Show round lost screen
        showRoundEndScreen(baseReward, uniqueFamilies, totalReward, false);
    }
}

function countUniqueFamilies(deck) {
    const families = new Set();
    deck.forEach(piece => {
        if (piece.family) {
            families.add(piece.family);
        }
    });
    return families.size;
}

function showEndRoundNotification() {
    const notification = document.createElement('div');
    notification.id = 'end-round-notification';
    notification.innerText = "Round Completed!";
    document.body.appendChild(notification);

    // Style the notification
    Object.assign(notification.style, {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        padding: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: '#FFD700',
        borderRadius: '10px',
        fontSize: '2em',
        textAlign: 'center',
        zIndex: '1000',
        animation: 'fadeOut 3s forwards'
    });

    // Remove the notification after the animation
    notification.addEventListener('animationend', () => {
        notification.remove();
    });
}

// Spawn a new piece
export function spawnPiece() {
    if (gameState.activeDeck.length > 0) {
        const randomIndex = Math.floor(Math.random() * gameState.activeDeck.length);
        const piece = gameState.activeDeck.splice(randomIndex, 1)[0];
        gameState.currentPiece = piece;
        gameState.ballInHand = true; // Set ballInHand to true when spawning a new piece
        console.log("Spawning piece:", piece.name);
        console.log("ballInHand:", gameState.ballInHand);
        console.log("Active deck:", gameState.activeDeck);
        console.log("Active deck:", gameState.activeDeck.length);
        console.log("getActiveDeck():", getActiveDeck());


    } else {
        return;
        }
}

export function setActiveDeckToStaticDeck() {
    gameState.activeDeck = [...gameState.staticDeck];
    console.log("Active deck set to static deck:", gameState.activeDeck);
    updateDeckCount();
}

// Handle round progression
export function nextRoundPhase1() {
    gameState.isRoundComplete = false;
    console.log(">>> Function: nextRoundPhase1() - Moving to next round phase 1.");

    // This function will now be called after the player closes the round end screen
    if (gameState.score >= gameState.targetScore) {
        console.log("Score meets target. Proceeding to next round phase 1.");
        gameState.round++;
        updateRound();
        gameState.targetScore = gameState.targetScore * 1.8;
        updateTargetScore();

        const shopItems = getRandomShopItems(ALL_PIECE_TYPES, SHOP_ITEMS);

        openShop(
            shop,
            gameState.staticDeck,
            gameState.purchasedBalls,
            shopItems,
            (value) => { gameState.isPaused = value; },
            () => { cancelAnimationFrame(gameState.animationId); },
            gameState.imageCache
        )
        setActiveDeckToStaticDeck();
        initDeck();
        renderDeck(gameState.staticDeck, gameState.imageCache);
        nextRoundPhase2();
    } else {
        console.log("Score does not meet target. Resetting game.");
        resetGame();
    }
}

export function nextRoundPhase2() {
    console.log(">>> Function: nextRoundPhase2() - Starting next round phase 2.");
    console.log("Starting next round phase 2.");

    // Show the shop
    const shop = document.getElementById('shop');
    shop.classList.remove('hidden');
    console.log("Shop displayed.");

    // Set up the event listener for the close shop button
    const closeShopButton = document.getElementById('close-shop-button');
    closeShopButton.addEventListener('click', handleCloseShop);
    console.log("Event listener added for close shop button.");
}

function handleCloseShop() {
    console.log("Close shop button clicked.");
    
    // Remove the event listener to prevent multiple calls
    const closeShopButton = document.getElementById('close-shop-button');
    closeShopButton.removeEventListener('click', handleCloseShop);
    
    // Call the closeShop function with the correct number of parameters
    closeShop(
        (value) => { gameState.isPaused = value; },
        setActiveDeckToStaticDeck, 
        initDeck,
        restartGameLoop // Add this function to restart the game loop
    );
    
    // Continue with any other logic needed after closing the shop
    console.log("Shop closed, continuing with the game.");
}

// Add this function to restart the game loop
function restartGameLoop() {
    gameState.lastTime = performance.now();
    gameState.animationId = requestAnimationFrame(gameLoop);
}