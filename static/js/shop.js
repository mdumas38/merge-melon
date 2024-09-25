import { SHOP_SIZE, CHARACTER_FAMILIES, ALL_PIECE_TYPES } from './config.js';
import { gameState } from './gameState.js'; // Updated import
import { deductGold, updateDeckCount } from './ui.js';
import { setActiveDeckToStaticDeck } from './rounds.js';

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

function getPieceImageSrc(piece, imageCache) {
    const faceKey = `${piece.name}_face`;
    const faceImg = imageCache[faceKey];
    if (faceImg && faceImg.src) {
        return faceImg.src;
    } else {
        return '/static/images/default-placeholder.png'; // Path to a default placeholder image
    }
}

function populateItems(container, items, imageCache, type) {
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('item');

        const canvas = document.createElement('canvas');
        canvas.width = SHOP_SIZE * 2;
        canvas.height = SHOP_SIZE * 2;
        const ctx = canvas.getContext('2d');

        drawCharacterImage(ctx, item, SHOP_SIZE, SHOP_SIZE, SHOP_SIZE, imageCache);

        itemElement.appendChild(canvas);

        if (type === 'shop') {
            const buyButton = document.createElement('button');
            buyButton.textContent = `Buy`;
            buyButton.classList.add('buy-button');
            buyButton.setAttribute('data-name', item.name); // Ensure data-name is set for purchasing
            buyButton.onclick = () => buyItem(item, imageCache);
            itemElement.appendChild(buyButton);
        }

        container.appendChild(itemElement);
    });
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

    setActiveDeckToStaticDeck();

    // Re-initialize the deck based on the rendered order
    initDeck();
    // Re-initialize the active deck for the next round
    spawnPiece();
    

    console.log("Shop closed. Final deck state:", gameState.staticDeck);
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

    [deckContainer, inventoryContainer].forEach(container => {
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
    const dropzone = e.target.closest('.deck-slot, .inventory-slot');
    if (dropzone) {
        dropzone.classList.add('drag-over');
    }
}

/**
 * Handle drag leave event
 * @param {DragEvent} e 
 */
function dragLeave(e) {
    const dropzone = e.target.closest('.deck-slot, .inventory-slot');
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
    const source = e.dataTransfer.getData('source'); // {{ edit_6 }}
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
    
    // Determine the drop zone type
    const dropzone = e.target.closest('.deck-slot, .inventory-slot');
    if (!dropzone) {
        console.error("Dropzone not recognized.");
        return;
    }
    
    const target = dropzone.classList.contains('deck-slot') ? 'deck' : 'inventory'; // {{ edit_7 }}
    console.log(`Target dropzone: ${target}`);
    
    if (source === target) {
        console.log("Item dropped in the same container. No action taken.");
        return; // No movement needed
    }
    
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

// Initialize drag and drop functionality on window load
window.addEventListener('load', () => {
    enableDragAndDrop();
});

/**
 * Function to create a draggable item with a unique ID and source
 * @param {Object} piece - The game piece object containing necessary attributes
 * @param {string} source - The source container ('inventory' or 'deck')
 * @returns {HTMLElement} - The created draggable item element
 */
function createDraggableItem(piece, source) { // {{ edit_1 }} Add 'source' parameter
    const item = document.createElement('div'); // Using <div> for visual representation
    item.classList.add('draggable-item');
    item.setAttribute('draggable', 'true');
    
    // **Assign the unique ID to the piece object**
    piece.id = `piece-${piece.name}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`; // {{ edit_1 }}
    item.id = piece.id; // Link the item's ID to the piece's ID
    console.log(`Created draggable item with ID: ${item.id}`);
    
    // Set the source as a data attribute
    item.dataset.source = source; // {{ edit_2 }} Set data-source

    // Create the img element and append it to the div
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