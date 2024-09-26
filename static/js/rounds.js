import { getRandomShopItems } from './helper.js';
import { createPiece, shuffleArray } from './piece.js';
import { ALL_PIECE_TYPES, INITIAL_DECK_VALUES, SHOP_ITEMS, CANVAS_WIDTH, SPAWN_Y } from './config.js';
import { gameState, getActiveDeck, updateActiveDeck } from './gameState.js'; // Updated import
import { updateDeckCount, updateGold, updateRound, updateTargetScore } from './ui.js';
import { openShop, renderDeck, closeShop } from './shop.js'; // Add this import

// Initialize the deck
export function initDeck() {
    // This function initializes the staticDeck
    if (gameState.staticDeck.length === 0) {
    // Fill the staticDeck with starting deck cards
        for (let i = 0; i < INITIAL_DECK_VALUES.length; i++) {
            const startingPieceType = ALL_PIECE_TYPES[INITIAL_DECK_VALUES[i]];
            const newPiece = createPiece(startingPieceType);
            gameState.staticDeck.push(newPiece);
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

    createActiveDeck();
    }
}


function createActiveDeck() {
    gameState.activeDeck = [];
    
    gameState.staticDeck.forEach(piece => {
        // Add each piece from staticDeck to activeDeck three times
        for (let i = 0; i < 3; i++) {
            const newPiece = createPiece(piece);
            gameState.activeDeck.push(newPiece);
        }
    });

    console.log("Active deck created:", gameState.activeDeck);
}

// **Snapshot the Static Deck**
export function snapshotStaticDeck() {
    gameState.staticDeckSnapshot = [...gameState.staticDeck];
    console.log("Static deck snapshot taken:", gameState.staticDeckSnapshot);
    
    // After taking the snapshot, recreate the activeDeck
    createActiveDeck();
}

// **Initialize Active Deck at the start of the round**
export function initializeRound() {
    console.log("Initializing round...");
    createActiveDeck();
    console.log(`Static deck size before cloning: ${gameState.staticDeck.length}`); // Updated reference
    shuffleArray(gameState.activeDeck);
    console.log("New active deck shuffled");
    console.log(`Active deck updated. New size: ${gameState.activeDeck.length}`);
    updateDeckCount();
    console.log("Deck count updated");

    spawnPiece();
    console.log(`Round initialized. Active deck count: ${getActiveDeck().length}`);
    console.log("Round initialization complete");
}

// **Monitor Active Deck and end round when empty**
export function checkActiveDeck() {
    if (getActiveDeck().length === 0 && performance.now() - gameState.lastThrowTime > 5000) {
        console.log("Active Deck is empty. Ending round...");
        endRound();
    }
}

export function endRound() {
    console.log("Round ended. Returning to shop...");
    snapshotStaticDeck(); // Snapshot the current static deck
    showEndRoundNotification(); // New: Notify the player
    nextRoundPhase1();
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
        console.log("Spawned piece:", piece);
    } else {
        console.log("No more pieces in the active deck. Ending round...");
        checkActiveDeck();
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