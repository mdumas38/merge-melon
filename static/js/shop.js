export function openShop(shop, shopItemsContainer, SHOP_ITEMS, setIsPaused, cancelAnimation) {
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

            drawCharacterImage(ballCtx, item, 30, 30, 25);

            // Display character details
            itemDiv.innerHTML = `
                <div class="item-name">${item.name}</div>
                <div class="item-ability">${item.ability || 'No special ability'}</div>
                <div class="item-details"></div>
                <div class="item-cost">Cost: ${item.attributes.cost} Gold</div>
                <button data-index="${index}" class="buy-button">Buy</button>
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

// Function to draw character images in the shop
export function drawCharacterImage(ctx, character, x, y, size) {
    const img = new Image();
    img.src = character.faceImage;

    img.onload = () => {
        ctx.drawImage(img, x - size, y - size, size * 2, size * 2);

        // Optionally, draw a border
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.strokeStyle = '#FFFFFF'; // White border
        ctx.lineWidth = 1;
        ctx.stroke();
    };
}