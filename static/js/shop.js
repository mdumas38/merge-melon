import { SHOP_SIZE, CHARACTER_FAMILIES } from './config.js';

export function openShop(shop, shopItemsContainer, SHOP_ITEMS, setIsPaused, cancelAnimation, imageCache) {
    shopItemsContainer.innerHTML = ''; // Clear previous items

    SHOP_ITEMS.forEach((item, index) => {
        if (item && item.name) {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('shop-item');

            // Create a canvas for each character
            const ballCanvas = document.createElement('canvas');
            ballCanvas.width = 60;
            ballCanvas.height = 60;
            const ballCtx = ballCanvas.getContext('2d');

            // Ensure images are loaded before drawing
            if (areImagesLoaded(item, imageCache)) {
                drawCharacterImage(ballCtx, item, 30, 30, SHOP_SIZE, imageCache);
            } else {
                // Optionally, display a loading indicator or placeholder
                displayLoadingPlaceholder(ballCtx, 30, 30, SHOP_SIZE, item.attributes.color);
            }

            // Display character details
            itemDiv.innerHTML = `
                <div class="item-name">${item.name}</div>
                <div class="item-ability">${item.ability || 'No special ability'}</div>
                <div class="item-details"></div>
                <div class="item-cost">Cost: ${item.attributes.cost} Gold</div>
                <button data-name="${item.name}" class="buy-button">Buy</button>
            `;

            // Insert the canvas into the item-details
            itemDiv.querySelector('.item-details').appendChild(ballCanvas);

            shopItemsContainer.appendChild(itemDiv);
        }
    });

    // Show the shop
    shop.classList.remove('hidden');
    setIsPaused(true);
    cancelAnimation();
}

export function closeShop(shop, setIsPaused, initDeck, spawnPiece, startGameLoop) {
    shop.classList.add('hidden');
    setIsPaused(false);

    initDeck();
    spawnPiece();
    startGameLoop();
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
    try {
        const faceImg = imageCache[`${character.name}_face`];
        
        if (faceImg && faceImg.complete) {
            ctx.drawImage(faceImg, x - SHOP_SIZE, y - SHOP_SIZE, SHOP_SIZE * 2, SHOP_SIZE * 2);
        } else {
            throw new Error(`Face image for ${character.name} is not loaded.`);
        }

        // Draw features
        if (character.features && Array.isArray(character.features)) {
            character.features.forEach((feature) => {
                const featureImg = imageCache[`${character.name}_${feature.type}`];
                if (featureImg && featureImg.complete) {
                    let posX = feature.position.x;
                    let posY = feature.position.y;
                    
                    // Calculate feature width and height using factors
                    const featureWidth = (feature.widthFactor ? feature.widthFactor * SHOP_SIZE * 2: SHOP_SIZE);
                    const featureHeight = (feature.heightFactor ? feature.heightFactor * SHOP_SIZE * 2: SHOP_SIZE);

                    // Maintain aspect ratio if width and height are not both defined
                    let finalWidth = featureWidth;
                    let finalHeight = featureHeight;
                    if (!feature.width || !feature.height) {
                        const aspectRatio = featureImg.naturalWidth / featureImg.naturalHeight;
                        if (aspectRatio > 1) {
                            finalHeight = featureWidth / aspectRatio;
                        } else if (aspectRatio < 1) {
                            finalWidth = featureHeight * aspectRatio;
                        }
                    }

                    // Adjust position based on size (optional: add scaling if positions are too large)
                    // For example, you can scale positions proportionally
                    const BASE_SIZE = character.attributes.radius;
                    const posScaleFactor = SHOP_SIZE / BASE_SIZE;
                    
                    posX *= posScaleFactor;
                    posY *= posScaleFactor;

                    ctx.drawImage(
                        featureImg,
                        x + posX - finalWidth / 2, 
                        y + posY - finalHeight / 2, 
                        finalWidth, 
                        finalHeight
                    );
                } else {
                    console.warn(`Feature image for ${feature.type} of ${character.name} is not loaded.`);
                    // Draw fallback for missing feature
                    ctx.beginPath();
                    const fallbackSize = feature.size || SHOP_SIZE / 2;
                    ctx.arc(x + feature.position.x, y + feature.position.y, fallbackSize, 0, Math.PI * 2);
                    ctx.fillStyle = "#FFFFFF"; // Default feature color
                    ctx.fill();
                }
            });
        }
    } catch (error) {
        console.error(error.message);
        // Fallback rendering
        ctx.beginPath();
        ctx.arc(x, y, SHOP_SIZE, 0, Math.PI * 2);
        ctx.fillStyle = character.attributes.color;
        ctx.fill();

        // Draw value number
        ctx.fillStyle = "#000000";
        ctx.font = `${SHOP_SIZE}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(character.attributes.value, x, y);
    }
}

