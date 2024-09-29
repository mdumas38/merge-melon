// static/js/imageLoader.js

import { gameState } from './gameState.js'; // Changed import

export async function preloadImages(characters) {
    const imagePromises = [];

    characters.forEach((char) => {
        // Validate character properties
        if (!char.name || !char.faceImage) {
            console.error(`Character is missing 'name' or 'faceImage':`, char);
            return;
        }

        // Load body image
        const bodyPromise = new Promise((resolve, reject) => {
            const bodyImg = new Image();
            bodyImg.src = char.bodyImage;
            bodyImg.onload = () => {
                gameState.imageCache[char.name] = bodyImg; // Use char.name as key
                resolve();
            };
            bodyImg.onerror = () => {
                console.error(`Failed to load body image: ${char.bodyImage}`);
                resolve(); // Resolve even on error to continue loading other images
            };
        });
        imagePromises.push(bodyPromise);

        // Load face image
        const facePromise = new Promise((resolve, reject) => {
            const faceImg = new Image();
            faceImg.src = char.faceImage;
            faceImg.onload = () => {
                gameState.imageCache[`${char.name}_face`] = faceImg; // Use gameState.imageCache
                resolve();
            };
            faceImg.onerror = () => {
                console.error(`Failed to load face image: ${char.faceImage}`);
                resolve(); // Resolve even on error to continue loading other images
            };
        });
        imagePromises.push(facePromise);

        // Load feature images
        if (char.features && Array.isArray(char.features)) {
            char.features.forEach((feature) => {
                if (!feature.type || !feature.image) {
                    console.error(`Feature is missing 'type' or 'image':`, feature, `for character ${char.name}`);
                    return;
                }

                const featurePromise = new Promise((resolve, reject) => {
                    const featureImg = new Image();
                    featureImg.src = feature.image;
                    featureImg.onload = () => {
                        gameState.imageCache[`${char.name}_${feature.type}`] = featureImg; // Use gameState.imageCache
                        resolve();
                    };
                    featureImg.onerror = () => {
                        console.error(`Failed to load feature image: ${feature.image} for character ${char.name}`);
                        resolve(); // Resolve even on error
                    };
                });
                imagePromises.push(featurePromise);
            });
        }
    });

    return Promise.all(imagePromises).then(() => gameState.imageCache);
}