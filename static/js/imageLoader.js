// static/js/imageLoader.js

export function preloadImages(characters, callback = () => {}) {
    const imageCache = {};
    let loadedImages = 0;
    const totalImages = characters.reduce((acc, char) => acc + char.features.length + 1, 0); // +1 for faceImage

    characters.forEach((char) => {
        // Load face image
        const faceImg = new Image();
        faceImg.src = char.faceImage;
        faceImg.onload = () => {
            imageCache[`${char.name}_face`] = faceImg;
            loadedImages++;
            if (loadedImages === totalImages) callback(imageCache);
        };
        faceImg.onerror = () => {
            console.error(`Failed to load image: ${char.faceImage}`);
            loadedImages++;
            if (loadedImages === totalImages) callback(imageCache);
        };

        // Load feature images
        char.features.forEach((feature) => {
            const featureImg = new Image();
            featureImg.src = feature.image;
            featureImg.onload = () => {
                imageCache[`${char.name}_${feature.type}`] = featureImg;
                loadedImages++;
                if (loadedImages === totalImages) callback(imageCache);
            };
            featureImg.onerror = () => {
                console.error(`Failed to load image: ${feature.image}`);
                loadedImages++;
                if (loadedImages === totalImages) callback(imageCache);
            };
        });
    });
}