import { shuffleArray } from './piece.js';
import { EXCLUDED_PIECES } from './config.js';


// Helper function to get four random unique items from an array
export function getRandomShopItems(allItems, numberOfItems = 3, excludedItems = EXCLUDED_PIECES) {
    const availableItems = allItems.filter(item => !excludedItems.includes(item.name));
    const shuffled = shuffleArray([...availableItems]);
    return shuffled.slice(0, numberOfItems);
}