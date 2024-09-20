// static/js/imageLoader.js

export async function preloadImages(characters) {
    const imageCache = {};
    const imagePromises = [];

    characters.forEach((char) => {
        // Validate character properties
        if (!char.name || !char.faceImage) {
            console.error(`Character is missing 'name' or 'faceImage':`, char);
            return;
        }

        // Load face image
        const facePromise = new Promise((resolve, reject) => {
            const faceImg = new Image();
            faceImg.src = char.faceImage;
            faceImg.onload = () => {
                imageCache[`${char.name}_face`] = faceImg;
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
                        imageCache[`${char.name}_${feature.type}`] = featureImg;
                        resolve();
                    };
                    featureImg.onerror = () => {
                        console.error(`Failed to load feature image: ${feature.image} for character ${char.name}`);
                        resolve(); // Resolve even on error
                    };
                });
                imagePromises.push(featurePromise);
            });
        } else {
            console.warn(`Character ${char.name} has no features.`);
        }
    });

    return Promise.all(imagePromises).then(() => imageCache);
}