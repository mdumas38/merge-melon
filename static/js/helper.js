import { shuffleArray } from './piece.js';

// Helper function to get four random unique items from an array
export function getRandomShopItems(allItems, numberOfItems = 4) {
    const shuffled = shuffleArray([...allItems]); // Shuffle a copy of the array
    return shuffled.slice(0, numberOfItems); // Select the first four items
}