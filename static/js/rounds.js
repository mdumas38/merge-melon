import { getRandomShopItems } from './helper.js';
import { createPiece, shuffleArray } from './piece.js';
import { ALL_PIECE_TYPES, INITIAL_DECK_VALUES, SHOP_ITEMS } from './config.js';
import { gameState, getActiveDeck, updateActiveDeck } from './gameState.js'; // Updated import
import { updateDeckCount, updateGold, updateRound, updateTargetScore } from './ui.js';
import { openShop, renderDeck, closeShop } from './shop.js'; // Add this import

// Initialize the deck
export function initDeck() {
    console.log("Initializing deck...");
    
    if (gameState.staticDeck.length === 0) {
        for (let i = 0; i < INITIAL_DECK_VALUES.length; i++) {
            const character = ALL_PIECE_TYPES[INITIAL_DECK_VALUES[i]];
            gameState.staticDeck.push(createPiece(character));
        }
    } else {
        console.log("Deck already initialized. Clearing existing deck...");
        gameState.staticDeck = []; // Clear the existing deck
        const deckContainer = document.getElementById('deck-items');
        console.log("Deck container found:", deckContainer);
        
        if (deckContainer) {
            const slots = deckContainer.querySelectorAll('.deck-slot');
            console.log(`Found ${slots.length} slots in the deck container.`);
            
            slots.forEach((slot, index) => {
                console.log(`Checking slot ${index + 1}:`, slot);
                
                if (slot.dataset.pieceName) {
                    console.log("slot.dataset.pieceName:", slot.dataset.pieceName);
                    const pieceType = ALL_PIECE_TYPES.find(pt => pt.name === slot.dataset.pieceName);
                    console.log(`Found piece name in slot: ${slot.dataset.pieceName}`);
                    
                    if (pieceType) {
                        gameState.staticDeck.push(createPiece(pieceType));
                        console.log(`Added piece to static deck:`, pieceType);
                    } else {
                        console.log(`No piece type found for: ${slot.dataset.pieceName}`);
                    }
                } else {
                    console.log(`Slot ${index + 1} is empty.`);
                }
            });
        } else {
            console.log("Deck container not found.");
        }

    console.log("Deck after initialization:", gameState.staticDeck);
}
}

// **Snapshot the Static Deck**
export function snapshotStaticDeck() {
    gameState.staticDeckSnapshot.length = 0; // Updated reference
    gameState.staticDeckSnapshot.push(...JSON.parse(JSON.stringify(gameState.staticDeck))); // Updated reference
    console.log("Snapshot of Static Deck taken:", gameState.staticDeckSnapshot);
}

// **Initialize Active Deck at the start of the round**
export function initializeRound() {
    console.log("Initializing round...");
    // Clone the static deck to create the active deck for this round
    const newActiveDeck = [...gameState.staticDeck]; // Updated reference
    console.log(`Static deck size before cloning: ${gameState.staticDeck.length}`); // Updated reference
    shuffleArray(newActiveDeck);
    console.log("New active deck shuffled");
    updateActiveDeck(newActiveDeck);
    console.log(`Active deck updated. New size: ${getActiveDeck().length}`);
    console.log("Deck count updated");
    console.log("New piece spawned");
    console.log(`Round initialized. Active deck count: ${getActiveDeck().length}`);
    console.log("Round initialization complete");
}

// **Monitor Active Deck and end round when empty**
export function checkActiveDeck() {
    if (getActiveDeck().length === 0) {
        console.log("Active Deck is empty. Ending round...");
        endRound();
    }
}

export function endRound() {
    // Implement the logic to end the round and return to the shop
    console.log("Round ended. Returning to shop...");
    snapshotStaticDeck(); // Snapshot the current static deck
    nextRoundPhase1();
}

// Spawn a new piece
export function spawnPiece() {
    const activeDeck = getActiveDeck();
    if (activeDeck.length > 0) {
        gameState.currentPiece = activeDeck.pop();
        updateActiveDeck(activeDeck); // Update the active deck after popping
        gameState.currentPiece.vx = 0;
        gameState.currentPiece.vy = 0;
        updateDeckCount();
        console.log(`Spawned piece: ${gameState.currentPiece.name}, Remaining deck count: ${activeDeck.length}`);
    } else {
        console.log("Active deck is empty. Unable to spawn new piece.");
        // Handle empty deck scenario (e.g., end the round, refill from static deck, etc.)
    }
}

export function setActiveDeckToStaticDeck() {
    gameState.activeDeck = [...gameState.staticDeck];
    console.log("Active deck set to static deck:", gameState.activeDeck);
    updateDeckCount();
}

// Handle round progression
export function nextRoundPhase1() {
    if (gameState.score >= gameState.targetScore) {
        console.log("Next round phase 1");
        gameState.gold += Math.min(3 + gameState.round, 10);
        updateGold();
        gameState.round++;
        updateRound();
        gameState.targetScore = gameState.targetScore * 2;
        updateTargetScore();

        const shopItems = getRandomShopItems(ALL_PIECE_TYPES, SHOP_ITEMS);

        openShop(
            shop,
            gameState.staticDeck,  // Pass the current deck
            gameState.purchasedBalls,  // Pass the inventory (purchased balls)
            shopItems,  // Pass the shop items
            (value) => { gameState.isPaused = value; },
            () => { cancelAnimationFrame(gameState.animationId); },
            gameState.imageCache
        )
        setActiveDeckToStaticDeck();
        initDeck();
        renderDeck(gameState.staticDeck, gameState.imageCache);
        nextRoundPhase2();
    } else {
        resetGame();
    }
}

export function nextRoundPhase2() {
    console.log("Starting next round phase 2");
    
    // Show the shop
    const shop = document.getElementById('shop');
    shop.classList.remove('hidden');
    
    // Set up the event listener for the close shop button
    const closeShopButton = document.getElementById('close-shop-button');
    closeShopButton.addEventListener('click', handleCloseShop);
}

function handleCloseShop() {
    console.log("Close shop button clicked");
    
    // Remove the event listener to prevent multiple calls
    const closeShopButton = document.getElementById('close-shop-button');
    closeShopButton.removeEventListener('click', handleCloseShop);
    
    // Call the closeShop function
    closeShop(
        (value) => { gameState.isPaused = value; },
        setActiveDeckToStaticDeck, 
        initDeck,
        spawnPiece
    );
    
    // Continue with any other logic needed after closing the shop
    console.log("Shop closed, continuing with the game");
}