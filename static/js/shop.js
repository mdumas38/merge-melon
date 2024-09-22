import { SHOP_SIZE, CHARACTER_FAMILIES, ALL_PIECE_TYPES } from './config.js';
import { updateGold, updateDeckCount } from './main.js';

export function openShop(shop, deckItems, inventoryItems, shopItems, setIsPaused, cancelAnimationFrame, imageCache) {
    setIsPaused(true);
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

    // Populate deck items with placeholders
    populateDeck(deckContainer, deckItems, imageCache, 8); // 4x2 grid has 8 slots

    // Populate inventory items with placeholders
    populateInventory(inventoryContainer, inventoryItems, imageCache, 20); // 5x4 grid has 20 slots

    // Populate shop items
    populateItems(shopContainer, shopItems, imageCache, 'shop');
}

// Function to populate deck
function populateDeck(container, items, imageCache, totalSlots) {
    for (let i = 0; i < totalSlots; i++) {
        const slotElement = document.createElement('div');
        slotElement.classList.add('deck-slot');

        if (i < items.length) {
            const piece = items[i];
            const img = document.createElement('img');
            img.src = getPieceImageSrc(piece, imageCache);
            img.alt = piece.name;
            slotElement.appendChild(img);
        } else {
            slotElement.classList.add('placeholder');
        }

        container.appendChild(slotElement);
    }
}

// New function to populate inventory
function populateInventory(container, items, imageCache, totalSlots) {
    for (let i = 0; i < totalSlots; i++) {
        const slotElement = document.createElement('div');
        slotElement.classList.add('inventory-slot');

        if (i < items.length) {
            const piece = items[i];
            const img = document.createElement('img');
            img.src = getPieceImageSrc(piece, imageCache);
            img.alt = piece.name;
            slotElement.appendChild(img);
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
            buyButton.textContent = `Buy (${item.attributes.cost} gold)`;
            buyButton.classList.add('buy-button');
            buyButton.setAttribute('data-name', item.name); // Ensure data-name is set for purchasing
            buyButton.onclick = () => buyItem(item, imageCache);
            itemElement.appendChild(buyButton);
        }

        container.appendChild(itemElement);
    });
}

function buyItem(item, imageCache) {
    // Implementation remains the same
    // Ensure access to gold and purchasedBalls via imports or global variables
    if (gold >= item.attributes.cost) {
        gold -= item.attributes.cost;
        updateGold();
        purchasedBalls.push(item);

        // Refresh the inventory display
        const inventoryContainer = document.getElementById('inventory-items');
        inventoryContainer.innerHTML = ''; // Clear existing items
        populateInventory(inventoryContainer, purchasedBalls, imageCache, 20); // 5x4 grid

        console.log(`Bought ${item.name} for ${item.attributes.cost} gold`);
    } else {
        alert('Insufficient gold to purchase this item.');
    }
}

export function closeShop(shop, setIsPaused, initDeck, spawnPiece) {
    shop.classList.add('hidden');
    setIsPaused(false);

    initDeck();
    spawnPiece();

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
        ctx.drawImage(faceImg, x - SHOP_SIZE, y - SHOP_SIZE, SHOP_SIZE * 2, SHOP_SIZE * 2);
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
                
                const featureWidth = feature.widthFactor * SHOP_SIZE * 2;
                const featureHeight = feature.heightFactor * SHOP_SIZE * 2;

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

    // Draw value number
    ctx.fillStyle = "#000000";
    ctx.font = `${SHOP_SIZE}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(character.attributes.value, x, y);
}

function enableDragAndDrop() {
    const deckContainer = document.getElementById('deck-items');
    const inventoryContainer = document.getElementById('inventory-items');

    deckContainer.addEventListener('dragstart', dragStart);
    inventoryContainer.addEventListener('dragstart', dragStart);
    deckContainer.addEventListener('dragover', dragOver);
    inventoryContainer.addEventListener('dragover', dragOver);
    deckContainer.addEventListener('drop', drop);
    inventoryContainer.addEventListener('drop', drop);
}

function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.id);
}

function dragOver(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text');
    const draggableElement = document.getElementById(id);
    const dropzone = e.target.closest('.item-grid');
    dropzone.appendChild(draggableElement);

    // Update the deck and inventory arrays here
    updateArrays(id, dropzone.id);
}

function updateArrays(itemId, newContainerId) {
    const item = ALL_PIECE_TYPES.find(piece => piece.name === itemId);
    if (newContainerId === 'deck-items') {
        // Move from inventory to deck
        purchasedBalls = purchasedBalls.filter(ball => ball.name !== itemId);
        deck.push(item);
    } else if (newContainerId === 'inventory-items') {
        // Move from deck to inventory
        deck = deck.filter(ball => ball.name !== itemId);
        purchasedBalls.push(item);
    }
    updateDeckCount();
}