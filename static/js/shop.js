import { ALL_PIECE_TYPES, SHOP_ITEMS } from './config.js';
import { gameState } from './gameState.js'; // Updated import
import { updateGold } from './ui.js';
import { initializeRound } from './rounds.js';
import { createPiece } from './piece.js'; // Import createPiece
import { getRandomShopItems } from './helper.js';

// Add these functions at the top of the file
function showSellOverlay() {
    const overlay = document.getElementById('sell-overlay');
    overlay.classList.add('active');
}

function hideSellOverlay() {
    const overlay = document.getElementById('sell-overlay');
    overlay.classList.remove('active');
}

export function openShop(shop, deckItems, inventoryItems, shopItems, setIsPaused, cancelAnimationFrame, imageCache) {
    gameState.isPaused = true;
    cancelAnimationFrame();
    shop.classList.remove('hidden');
    enableDragAndDrop();

    const deckContainer = document.getElementById('deck-items');
    const inventoryContainer = document.getElementById('inventory-items');
    const shopContainer = document.getElementById('shop-items');

    // Clear previous contents
    deckContainer.innerHTML = '';
    inventoryContainer.innerHTML = '';
    shopContainer.innerHTML = '';

    // Populate deck items with placeholders and associate data
    populateDeck(deckContainer, deckItems, gameState.imageCache, 8); // 4x2 grid has 8 slots

    // Populate inventory items with placeholders
    populateInventory(inventoryContainer, inventoryItems, gameState.imageCache, 20); // 5x4 grid has 20 slots

    // Populate shop items
    populateItems(shopContainer, shopItems, gameState.imageCache, 'shop');

    // Re-enable drag and drop after populating
    enableDragAndDrop();

    // Listen for sell events (optional if using alerts in events.js)
    // Alternatively, handle feedback within events.js

    const refreshButton = document.getElementById('refresh-shop-button');
    refreshButton.addEventListener('click', refreshShop);

    updateRefreshButtonState();
}

function refreshShop() {
    if (gameState.gold >= 1) {
        gameState.gold -= 1;
        updateGold();

        const newShopItems = getRandomShopItems(ALL_PIECE_TYPES, SHOP_ITEMS);
        const shopContainer = document.getElementById('shop-items');
        
        // Clear existing shop items
        shopContainer.innerHTML = '';
        
        // Populate with new items
        populateItems(shopContainer, newShopItems, gameState.imageCache, 'shop');

        console.log("Shop refreshed. New gold balance:", gameState.gold);

        updateRefreshButtonState();
    } else {
        console.log("Not enough gold to refresh the shop.");
        alert("Not enough gold to refresh the shop!");
    }
}

export function updateRefreshButtonState() {
    const refreshButton = document.getElementById('refresh-shop-button');
    refreshButton.disabled = gameState.gold < 1;
}

/**
 * Function to populate the deck with draggable items
 * @param {HTMLElement} container - The deck container element
 * @param {Array} items - Array of deck items
 * @param {Object} imageCache - Cache of loaded images
 * @param {number} totalSlots - Total number of slots in the deck
 */
function populateDeck(container, items, imageCache, totalSlots) {
    container.innerHTML = ''; // Clear existing deck items

    for (let i = 0; i < totalSlots; i++) {
        const slotElement = document.createElement('div');
        slotElement.classList.add('deck-slot');

        if (i < items.length) {
            const piece = items[i];
            
            // Create a draggable item using the updated function with source 'deck'
            const draggableItem = createDraggableItem(piece, 'deck'); // {{ edit_3 }}
            
            slotElement.appendChild(draggableItem);
            slotElement.dataset.pieceName = piece.name;
            slotElement.dataset.pieceIndex = draggableItem.id;
            // Add other dataset attributes if necessary
        } else {
            slotElement.classList.add('placeholder');
        }

        container.appendChild(slotElement);
    }
}

/**
 * Function to populate the inventory with draggable items
 * @param {HTMLElement} container - The inventory container element
 * @param {Array} items - Array of inventory items
 * @param {Object} imageCache - Cache of loaded images
 * @param {number} totalSlots - Total number of slots in the inventory
 */
function populateInventory(container, items, imageCache, totalSlots) {
    container.innerHTML = ''; // Clear existing inventory items

    for (let i = 0; i < totalSlots; i++) {
        const slotElement = document.createElement('div');
        slotElement.classList.add('inventory-slot');

        if (i < items.length) {
            const piece = items[i];
            
            // Create a draggable item using the updated function with source 'inventory'
            const draggableItem = createDraggableItem(piece, 'inventory'); // {{ edit_4 }}
            
            slotElement.appendChild(draggableItem);

            slotElement.dataset.pieceName = piece.name;
            slotElement.dataset.pieceIndex = draggableItem.id;
            slotElement.dataset.pieceTier = piece.tier;
            slotElement.dataset.pieceCost = piece.attributes.cost;
            // Add other dataset attributes as needed
        } else {
            slotElement.classList.add('placeholder');
        }

        container.appendChild(slotElement);
    }
}

function populateItems(container, items, imageCache, type) {
    container.innerHTML = ''; // Clear existing items

    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('item-slot');

        // **Create draggable item with updated function**
        const draggableItem = createDraggableItem(item, type === 'shop' ? 'shop' : 'inventory'); // {{ existing edit }}
        
        itemElement.appendChild(draggableItem);

        container.appendChild(itemElement);
    });
}


function getPieceImageSrc(piece, imageCache) {
    const bodyKey = `${piece.name}`;
    const bodyImg = imageCache[bodyKey];
    if (bodyImg && bodyImg.src) {
        return bodyImg.src;
    } else {
        return '/static/images/default-placeholder.png'; // Path to a default placeholder image
    }
}


function getGold() {
    return gold;
}

export function buyItem(item, imageCache) {
    console.log(`Attempting to buy ${item.name} for ${item.attributes.cost} gold`);

    if (gameState.gold >= item.attributes.cost) { // Check for sufficient gold
        gameState.gold -= item.attributes.cost; // Deduct gold
        gameState.purchasedBalls.push(item); // Add item to purchased balls
        console.log(`Successfully purchased ${item.name}. New gold balance: ${gameState.gold}`);

        const inventoryContainer = document.getElementById('inventory-items');
        const emptySlot = inventoryContainer.querySelector('.inventory-slot.placeholder');
        if (emptySlot) {
            console.log(`Found empty inventory slot. Adding ${item.name} to inventory.`);
            
            // Create a draggable item using the updated function with source 'inventory'
            const draggableItem = createDraggableItem(item, 'inventory'); // {{ edit_8 }}
            
            // Remove the placeholder class and append the draggable item
            emptySlot.classList.remove('placeholder');
            emptySlot.appendChild(draggableItem);
            
            console.log(`${item.name} added to inventory successfully.`);
        } else {
            console.warn('No empty inventory slots available. Unable to add item to inventory.');
        }

        console.log(`Bought ${item.name} for ${item.attributes.cost} gold. Total purchased balls: ${gameState.purchasedBalls.length}`);
        
    } else {
        console.log(`Insufficient gold to purchase ${item.name}. Current gold: ${gameState.gold}, Required: ${item.attributes.cost}`);
        alert('Insufficient gold to purchase this item.');
    }
}

export function closeShop(setIsPaused, initDeck, spawnPiece) {
    console.log("Closing shop. Initial deck:", gameState.staticDeck);

    const shop = document.getElementById('shop');
    if (shop) {
        shop.classList.add('hidden');
    } else {
        console.error("Shop element not found");
    }

    setIsPaused(false);
    console.log("setIsPaused(false):", setIsPaused);

    initializeRound();

    console.log("Shop closed. Final deck state:", gameState.staticDeck);

    const refreshButton = document.getElementById('refresh-shop-button');
    refreshButton.removeEventListener('click', refreshShop);
}

// Helper function to check if all images for a character are loaded
function areImagesLoaded(character, imageCache) {
    const faceImg = imageCache[`${character.name}_face`];
    if (!faceImg || !faceImg.complete) return false;

    for (const feature of character.features) {
        const featureImg = imageCache[`${character.name}_${feature.type}`];
        if (featureImg && !featureImg.complete) return false;
    }

    return true;
}

// Helper function to display a loading placeholder
function displayLoadingPlaceholder(ctx, x, y, size, color) {
    // Draw colored circle as a placeholder
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Optionally, add a loading spinner or text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `${size / 2}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("...", x, y);
}

// Function to draw character images in the shop using preloaded images
export function drawCharacterImage(ctx, character, x, y, SHOP_SIZE, imageCache) {
    const faceImg = imageCache[`${character.name}_face`];
    
    if (faceImg && faceImg.complete) {
        ctx.drawImage(faceImg, x - SHOP_SIZE / 2, y - SHOP_SIZE / 2, SHOP_SIZE, SHOP_SIZE);
    } else {
        // Fallback: Draw colored circle
        ctx.beginPath();
        ctx.arc(x, y, SHOP_SIZE, 0, Math.PI * 2);
        ctx.fillStyle = character.attributes.color;
        ctx.fill();
    }

    // Draw features
    if (character.features && Array.isArray(character.features)) {
        character.features.forEach((feature) => {
            const featureImg = imageCache[`${character.name}_${feature.type}`];
            if (featureImg && featureImg.complete) {
                const posX = x + feature.position.x * (SHOP_SIZE / character.attributes.radius);
                const posY = y + feature.position.y * (SHOP_SIZE / character.attributes.radius);
                
                const featureWidth = feature.widthFactor * SHOP_SIZE;
                const featureHeight = feature.heightFactor * SHOP_SIZE;

                ctx.drawImage(
                    featureImg,
                    posX - featureWidth / 2, 
                    posY - featureHeight / 2, 
                    featureWidth, 
                    featureHeight
                );
            }
        });
    }

    // Optionally, draw value number
    // ctx.fillStyle = "#000000";
    // ctx.font = `${SHOP_SIZE}px Arial`;
    // ctx.textAlign = "center";
    // ctx.textBaseline = "middle";
    // ctx.fillText(character.attributes.value, x, y);
}

/**
 * Initialize drag and drop event listeners on deck and inventory containers
 */
function enableDragAndDrop() {
    const deckContainer = document.getElementById('deck-items');
    const inventoryContainer = document.getElementById('inventory-items');
    const shopContainer = document.getElementById('shop-items');

    [deckContainer, inventoryContainer, shopContainer].forEach(container => {
        container.addEventListener('dragover', dragOver);
        container.addEventListener('dragleave', dragLeave);
        container.addEventListener('drop', drop);
    });

    console.log("Drag and drop events added to containers");
}

/**
 * Handle drag start event
 * @param {DragEvent} e 
 */
function dragStart(e) {
    console.log("Drag start event triggered");
    console.log("Element being dragged:", e.currentTarget);
    
    // Set the dragged element's ID and its source in the DataTransfer object
    e.dataTransfer.setData('text/plain', e.currentTarget.id);
    e.dataTransfer.setData('source', e.currentTarget.dataset.source); // {{ edit_5 }}
    e.dataTransfer.effectAllowed = 'move';
    
    console.log(`Data set in dataTransfer: ${e.dataTransfer.getData('text/plain')}, Source: ${e.dataTransfer.getData('source')}`);
}

/**
 * Handle drag end event
 * @param {DragEvent} e 
 */
function dragEnd(e) {
    console.log(`Finished dragging item with ID: ${e.target.id}`);
}

/**
 * Handle drag over event
 * @param {DragEvent} e 
 */
function dragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const dropzone = e.target.closest('.deck-slot, .inventory-slot, #deck-items, #inventory-items, #shop-container');
    if (dropzone) {
        dropzone.classList.add('drag-over');
    }
}

/**
 * Handle drag leave event
 * @param {DragEvent} e 
 */
function dragLeave(e) {
    const dropzone = e.target.closest('.deck-slot, .inventory-slot, #deck-items, #inventory-items, #shop-container');
    if (dropzone) {
        dropzone.classList.remove('drag-over');
    }
}

/**
 * Handle drop event
 * @param {DragEvent} e 
 */
function drop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const source = e.dataTransfer.getData('source');
    console.log("Drop event triggered with ID:", id, "Source:", source);
    
    if (!id) {
        console.error("No ID found in DataTransfer object.");
        return;
    }
    
    const draggableElement = document.getElementById(id);
    console.log("Draggable Element Retrieved:", draggableElement);
    
    if (!draggableElement) {
        console.error(`Draggable element with ID '${id}' not found.`);
        return;
    }
    
    const dropzone = e.target.closest('.deck-slot, .inventory-slot, #deck-items, #inventory-items, #shop-container');
    if (!dropzone) {
        console.error("Dropzone not recognized.");
        return;
    }
    
    const target = dropzone.id === 'deck-items' ? 'deck' :
                   dropzone.id === 'inventory-items' ? 'inventory' :
                   dropzone.id === 'shop-container' ? 'shop' :
                   dropzone.classList.contains('deck-slot') ? 'deck' :
                   dropzone.classList.contains('inventory-slot') ? 'inventory' :
                   'shop';

    console.log(`Target dropzone: ${target}`);
    
    if (source === target) {
        console.log("Item dropped in the same container. No action taken.");
        return;
    }
    
    if (target === 'shop') {
        // Show the sell overlay
        showSellOverlay();
        
        // Set a timeout to hide the overlay after 2 seconds
        setTimeout(() => {
            hideSellOverlay();
            
            // Proceed with selling logic
            let piece;
            if (source === 'inventory') {
                piece = gameState.purchasedBalls.find(p => p.id === id);
                if (!piece) {
                    console.warn("Piece not found in purchasedBalls.");
                    return;
                }
                gameState.purchasedBalls = gameState.purchasedBalls.filter(p => p !== piece);
                console.log(`Removed piece from inventory: ${piece.name}`);
            } else if (source === 'deck') {
                piece = gameState.staticDeck.find(p => p.id === id);
                if (!piece) {
                    console.warn("Piece not found in staticDeck.");
                    return;
                }
                gameState.staticDeck = gameState.staticDeck.filter(p => p !== piece);
                console.log(`Removed piece from deck: ${piece.name}`);
            } else {
                console.error("Invalid source for selling.");
                return;
            }

            gameState.gold += 1;
            updateGold();

            if (source === 'inventory') {
                populateInventory(document.getElementById('inventory-items'), gameState.purchasedBalls, gameState.imageCache, 20);
            } else if (source === 'deck') {
                populateDeck(document.getElementById('deck-items'), gameState.staticDeck, gameState.imageCache, 8);
            }
        }, 1000); // 2 seconds delay
        
        return;
    }
    
    // Existing buy logic remains unchanged
    if (source === 'shop') {
        const pieceName = draggableElement.dataset.pieceName;
        console.log(`Dropping piece with name: ${pieceName}`);
    
        if (!pieceName) {
            console.error("Data attribute 'data-pieceName' is missing.");
            return;
        }
    
        const piece = ALL_PIECE_TYPES.find(p => p.name === pieceName);
        if (!piece) {
            console.error(`Piece not found in ALL_PIECE_TYPES for name '${pieceName}'.`);
            return;
        }
    
        // Check if player has enough gold
        if (gameState.gold < piece.attributes.cost) {
            console.log(`Insufficient gold to purchase ${piece.name}.`);
            alert('Insufficient gold to purchase this item.');
            return;
        }
    
        // Deduct gold
        gameState.gold -= piece.attributes.cost;
        updateGold();

        // Create a new instance of the piece
        const newPiece = createPiece(piece);
        if (!newPiece) {
            console.error(`Failed to create a new piece for '${piece.name}'.`);
            return;
        }
    
        // Add piece to target (deck or inventory)
        if (target === 'deck') {
            gameState.staticDeck.push(newPiece);
            populateDeck(document.getElementById('deck-items'), gameState.staticDeck, gameState.imageCache, 8);
            console.log(`${piece.name} added to deck.`);
        } else if (target === 'inventory') {
            gameState.purchasedBalls.push(newPiece);
            populateInventory(document.getElementById('inventory-items'), gameState.purchasedBalls, gameState.imageCache, 20);
            console.log(`${piece.name} added to inventory.`);
        }
    
        return;
    }
    
    // **Handle items dropped from 'inventory' or 'deck'**
    // **Find the piece using the assigned ID**
    let piece;
    if (source === 'inventory') {
        piece = gameState.purchasedBalls.find(p => p.id === id); // {{ edit_1 }} Use p.id === id
        if (!piece) {
            console.warn("Piece not found in purchasedBalls.");
            return;
        }
        // Remove from inventory
        gameState.purchasedBalls = gameState.purchasedBalls.filter(p => p !== piece);
        console.log(`Removed piece from inventory: ${piece.name}`);
    } else if (source === 'deck') {
        piece = gameState.staticDeck.find(p => p.id === id); // {{ edit_1 }} Use p.id === id
        if (!piece) {
            console.warn("Piece not found in staticDeck.");
            return;
        }
        // Remove from deck
        gameState.staticDeck = gameState.staticDeck.filter(p => p !== piece);
        console.log(`Removed piece from deck: ${piece.name}`);
    }
    
    // Add the piece to the target array
    if (target === 'inventory') {
        gameState.purchasedBalls.push(piece);
        console.log(`Added piece to inventory: ${piece.name}`);
    } else if (target === 'deck') {
        gameState.staticDeck.push(piece);
        console.log(`Added piece to deck: ${piece.name}`);
    }
    
    // Update the gameState arrays in local storage or any persistent storage if applicable
    
    // Re-render the inventories and decks
    populateDeck(document.getElementById('deck-items'), gameState.staticDeck, gameState.imageCache, 8);
    populateInventory(document.getElementById('inventory-items'), gameState.purchasedBalls, gameState.imageCache, 20);
    
    console.log("Updated Inventory and Deck after drop action.");
}

function showSellConfirmation(pieceName) { // {{ new function }}
    const confirmation = document.createElement('div');
    confirmation.id = 'sell-confirmation';
    confirmation.innerText = `Sold ${pieceName} for 1 gold!`;
    document.body.appendChild(confirmation);

    // Style the confirmation
    Object.assign(confirmation.style, {
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        padding: '10px 20px',
        backgroundColor: 'rgba(0, 128, 0, 0.8)',
        color: '#FFD700',
        borderRadius: '5px',
        fontSize: '1.2em',
        textAlign: 'center',
        zIndex: '1001',
        animation: 'fadeInOut 2s forwards'
    });

    // Remove the confirmation after animation
    confirmation.addEventListener('animationend', () => {
        confirmation.remove();
    });
}

// Initialize drag and drop functionality on window load
window.addEventListener('load', () => {
    enableDragAndDrop();
});

/**
 * Function to create a draggable item with a unique ID and source
 * @param {Object} piece - The game piece object containing necessary attributes
 * @param {string} source - The source container ('inventory', 'deck', or 'shop')
 * @returns {HTMLElement} - The created draggable item element
 */
function createDraggableItem(piece, source) { // {{ existing edit }}
    const item = document.createElement('div');
    item.classList.add('draggable-item');
    item.setAttribute('draggable', 'true');
    
    // Assign unique ID
    piece.id = `piece-${piece.name}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    item.id = piece.id;
    
    // Set the source and pieceName as data attributes
    item.dataset.source = source;
    item.dataset.pieceName = piece.name; // {{ existing edit }}
    
    // Create the img element
    const img = document.createElement('img');
    img.src = getPieceImageSrc(piece, gameState.imageCache);
    img.alt = piece.name;
    img.draggable = false;
    item.appendChild(img);
    
    // Attach drag event listeners
    item.addEventListener('dragstart', dragStart);
    item.addEventListener('dragend', dragEnd);
    
    return item;
}

export function renderDeck(staticDeck, imageCache) {
    console.log("Starting to render deck...");
    const deckContainer = document.getElementById('deck-items');
    if (!deckContainer) {
        console.error("Deck container not found!");
        return;
    }
    deckContainer.innerHTML = ''; // Clear existing deck items
    console.log("Cleared existing deck items.");

    // Create 8 slots (4x2 grid)
    for (let i = 0; i < 8; i++) {
        console.log(`Creating slot ${i + 1} of 8.`);
        const slot = document.createElement('div');
        slot.classList.add('deck-slot'); // Ensure the deck-slot class is applied

        if (i < staticDeck.length) {
            const piece = staticDeck[i];
            console.log(`Adding piece to slot ${i + 1}:`, piece);
            
            // Create a draggable item using the same pattern
            const draggableItem = createDraggableItem(piece, 'deck');

            slot.appendChild(draggableItem);
            console.log(`Deck item added to slot ${i + 1}.`);

            // Add data attributes to store piece information
            slot.dataset.pieceName = piece.name;
            slot.dataset.pieceIndex = draggableItem.id;
            console.log(`Piece ${piece.name} added to slot ${i + 1}.`);
            console.log(`Slot ${i + 1} data attributes:`, slot.dataset);
        } else {
            // Empty slot
            slot.classList.add('placeholder');
            console.log(`Slot ${i + 1} is empty.`);
        }

        deckContainer.appendChild(slot);
        console.log(`Slot ${i + 1} appended to deck container.`);
    }

    console.log("Deck rendered in the shop.");
}

// Add a new toggleFreezeShop function
function toggleFreezeShop() {
    const shopItemsContainer = document.getElementById('shop-items');
    const freezeButton = document.getElementById('freeze-shop-button');

    if (gameState.isShopFrozen) {
        // Unfreeze the shop
        gameState.isShopFrozen = false;
        shopItemsContainer.classList.remove('shop-frozen'); // Remove blue tint
        enableShopInteractions();
        freezeButton.textContent = 'Freeze Shop';
        console.log("Shop has been unfrozen.");
    } else {
        // Freeze the shop
        gameState.isShopFrozen = true;
        shopItemsContainer.classList.add('shop-frozen'); // Apply blue tint
        disableShopInteractions();
        freezeButton.textContent = 'Unfreeze Shop';
        console.log("Shop has been frozen until the next round.");
    }
}

// Add new event listener for toggleFreezeShop
document.getElementById('freeze-shop-button').addEventListener('click', toggleFreezeShop);

// Function to disable shop interactions when frozen
export function disableShopInteractions() {
    const shopItems = document.querySelectorAll('#shop-items .draggable-item, #shop-items .buy-button');
    shopItems.forEach(item => {
        item.style.pointerEvents = 'none';
    });
}

// Function to enable shop interactions when unfrozen
export function enableShopInteractions() {
    const shopItems = document.querySelectorAll('#shop-items .draggable-item, #shop-items .buy-button');
    shopItems.forEach(item => {
        item.style.pointerEvents = 'auto';
    });
}

// Add event listener for the Freeze Shop button
document.getElementById('freeze-shop-button').addEventListener('click', toggleFreezeShop);
