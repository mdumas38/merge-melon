import { gameState } from './gameState.js';
import { updateScore } from './ui.js';
import { playSound, mergeSound } from './audio.js';
import { createPiece } from './piece.js';
import { isFruit, canEatFruit, eatFruit } from './physics.js';

// Add this new function to create and animate the score sprite
export function createScoreSprite(x, y, value) {
    console.log(`Creating score sprite at (${x}, ${y}) with value: ${value}`);
    
    const gameContainer = document.getElementById('game-container');
    const containerRect = gameContainer.getBoundingClientRect();

    const sprite = document.createElement('div');
    sprite.className = 'score-sprite';
    sprite.textContent = `+${value}`;
    
    // Calculate position relative to the game container
    const relativeX = x - 50;
    const relativeY = y - 100;
    
    sprite.style.left = `${relativeX}px`;
    sprite.style.top = `${relativeY}px`;
    
    gameContainer.appendChild(sprite);
    console.log(`Score sprite appended to game container at relative position (${relativeX}, ${relativeY})`);

    // Animate the sprite
    let opacity = 1;
    let posY = relativeY;

    const animate = () => {
        opacity -= 0.02;
        posY -= 1;
        
        sprite.style.opacity = opacity;
        sprite.style.top = `${posY}px`;
        
        if (opacity > 0) {
            requestAnimationFrame(animate);
        } else {
            gameContainer.removeChild(sprite);
            console.log('Score sprite animation completed and removed from game container');
        }
    };
    
    requestAnimationFrame(animate);
    console.log('Score sprite animation started');
}

// Add the startMergeAnimation function to handle merging of pieces
export function startMergeAnimation(existingPiece, releasedPiece, newPieceType) {
    // console.log(`Starting merge animation: ${existingPiece.name} + ${releasedPiece.name} -> ${newPieceType.name}`);

    // Mark both pieces as merging to prevent further interactions
    existingPiece.merging = true;
    releasedPiece.merging = true;

    // Create the new merged piece at the average position of the two
    const mergedPiece = createPiece(newPieceType);
    mergedPiece.x = (existingPiece.x + releasedPiece.x) / 2;
    mergedPiece.y = (existingPiece.y + releasedPiece.y) / 2;

    // Handle "Roar" ability for the Lion
    if (mergedPiece.abilities && mergedPiece.abilities.includes("Roar") && mergedPiece.name === "Lion") {
        const smallAnimals = ["Ladybug", "Mouse", "Bird", "Rabbit", "Fox"];
        let removedAnimals = gameState.pieces.filter(piece => smallAnimals.includes(piece.name));
        let totalValueRemoved = 0;

        removedAnimals.forEach(animal => {
            totalValueRemoved += animal.attributes.value;
            console.log(`Lion's roar removed a ${animal.name}! Value: ${animal.attributes.value}.`);
        });

        // Remove small animals from the game
        gameState.pieces = gameState.pieces.filter(piece => !smallAnimals.includes(piece.name));

        // Add the total value to the player's score
        gameState.score += totalValueRemoved;
        updateScore();

        console.log(`Lion's roar removed ${removedAnimals.length} small animals! Total score increase: ${totalValueRemoved}.`);
        playSound(mergeSound); // Play a sound effect for roaring (you might want to create a specific roar sound)
    }

    // // Handle "Eat Two Prey" ability for the Wolf
    // if (mergedPiece.abilities && mergedPiece.abilities.includes("Eat Two Prey") && mergedPiece.name === "Wolf") {
    //     const nearbyPrey = gameState.pieces.filter(piece => 
    //         (piece.name === "Rabbit" || piece.name === "Fox" || piece.name === "Mouse" || piece.name === "Bird") && 
    //         isNear(mergedPiece, piece, 1000) // Adjust distanceThreshold as needed
    //     );

    //     const preyToEat = nearbyPrey.slice(0, 2); // Select up to two prey

    //     let totalValueEaten = 0;
    //     preyToEat.forEach(prey => {
    //         // Remove the prey from the game
    //         gameState.pieces = gameState.pieces.filter(piece => piece !== prey);
            
    //         // Add its value to the total
    //         totalValueEaten += prey.attributes.value;
            
    //         console.log(`Wolf consumed a ${prey.name}! Value: ${prey.attributes.value}.`);
    //         playSound(mergeSound); // Play a sound effect for eating
    //     });

    //     // Add the total value to the player's score
    //     gameState.score += totalValueEaten;
    //     updateScore();
        
    //     console.log(`Wolf consumed ${preyToEat.length} prey! Total score increase: ${totalValueEaten}.`);
    // }

    // // Handle "Eat One Prey" ability for the Eagle
    // if (mergedPiece.abilities && mergedPiece.abilities.includes("Eat One Prey") && mergedPiece.name === "Eagle") {
    //     const nearbyPrey = gameState.pieces.filter(piece => 
    //         (piece.name === "Mouse" || piece.name === "Rabbit" || piece.name === "Snake") && 
    //         isNear(mergedPiece, piece, 1000) // Adjust distanceThreshold as needed
    //     );

    //     if (nearbyPrey.length > 0) {
    //         // Randomly select one prey
    //         const preyToEat = nearbyPrey[Math.floor(Math.random() * nearbyPrey.length)];
            
    //         // Remove the prey from the game
    //         gameState.pieces = gameState.pieces.filter(piece => piece !== preyToEat);
            
    //         // Add its value to the player's score
    //         gameState.score += preyToEat.attributes.value;
    //         updateScore();
            
    //         console.log(`Eagle consumed a ${preyToEat.name}! Score increased by ${preyToEat.attributes.value}.`);
    //         playSound(mergeSound); // Play a sound effect for eating
    //     } else {
    //         console.log(`Eagle couldn't find any prey nearby.`);
    //     }
    // }

    // // Handle "Eat_2" ability for the Snake
    // if (mergedPiece.abilities && mergedPiece.abilities.includes("Eat_2") && mergedPiece.name === "Snake") {
    //     const nearbyMice = gameState.pieces.filter(piece => 
    //         piece.name === "Mouse" && 
    //         isNear(mergedPiece, piece, 1000) // Adjust distanceThreshold as needed
    //     );

    //     const miceToEat = Math.min(nearbyMice.length, 2); // Eat up to 2 mice

    //     for (let i = 0; i < miceToEat; i++) {
    //         const mouse = nearbyMice[i];
    //         // Remove the Mouse from the game
    //         gameState.pieces = gameState.pieces.filter(piece => piece !== mouse);
    //         // Add its value to the player's score
    //         gameState.score += mouse.attributes.value;
    //         console.log(`Snake consumed a Mouse! Score increased by ${mouse.attributes.value}.`);
    //         playSound(mergeSound); // Play a sound effect for eating
    //     }

    //     updateScore();
    //     console.log(`Snake consumed ${miceToEat} Mouse/Mice!`);
    // }

    // // Existing handling for "Eat" ability (e.g., for Fox)
    // if (mergedPiece.abilities && mergedPiece.abilities.includes("Eat") && mergedPiece.name === "Fox") {
    //     const nearbyMouse = gameState.pieces.find(piece => 
    //         piece.name === "Mouse" && 
    //         isNear(mergedPiece, piece, 1000) // Adjust distanceThreshold as needed
    //     );
    //     if (nearbyMouse) {
    //         // Remove the Mouse from the game
    //         gameState.pieces = gameState.pieces.filter(piece => piece !== nearbyMouse);
    //         // Add its value to the player's score
    //         gameState.score += nearbyMouse.attributes.value;
    //         updateScore();
    //         console.log(`Fox consumed a Mouse! Score increased by ${nearbyMouse.attributes.value}.`);
    //         playSound(mergeSound); // Play a sound effect for eating
    //     }
    // }

    // // Existing handling for "Eat" ability (e.g., for Bird)
    // if (mergedPiece.abilities && mergedPiece.abilities.includes("Eat") && mergedPiece.name === "Bird") {
    //     const nearbyLadybug = gameState.pieces.find(piece => 
    //         piece.name === "Ladybug" && 
    //         isNear(mergedPiece, piece, 1000) // Adjust distanceThreshold as needed
    //     );
    //     if (nearbyLadybug) {
    //         // Remove the Ladybug from the game
    //         gameState.pieces = gameState.pieces.filter(piece => piece !== nearbyLadybug);
    //         // Add its value to the player's score
    //         gameState.score += nearbyLadybug.attributes.value;
    //         updateScore();
    //         console.log(`${mergedPiece.name} consumed a Ladybug! Score increased by ${nearbyLadybug.attributes.value}.`);
    //         playSound(mergeSound); // Play a sound effect for eating
    //     }
    // }

    // New ability: Earth destroys all asteroids
    if (mergedPiece.name === "Earth") {
        const asteroids = gameState.pieces.filter(piece => piece.name === "Asteroid");
        let totalValueDestroyed = 0;

        asteroids.forEach(asteroid => {
            totalValueDestroyed += asteroid.attributes.value;
            console.log(`Earth destroyed an Asteroid! Value: ${asteroid.attributes.value}.`);
        });

        // Remove asteroids from the game
        gameState.pieces = gameState.pieces.filter(piece => piece.name !== "Asteroid");

        // Add the total value to the player's score
        gameState.score += totalValueDestroyed;
        updateScore();

        console.log(`Earth destroyed ${asteroids.length} Asteroids! Total score increase: ${totalValueDestroyed}.`);
        playSound(mergeSound); // Play a sound effect for destroying asteroids
    }

    // Handle fruit eating abilities
    if (mergedPiece.abilities && mergedPiece.abilities.includes("Eat Fruit")) {
        const collidingFruits = gameState.pieces.filter(piece => 
            isFruit(piece) && 
            checkCollision(mergedPiece, piece)
        );

        collidingFruits.forEach(fruit => {
            if (canEatFruit(mergedPiece, fruit)) {
                eatFruit(mergedPiece, fruit);
                console.log(`${mergedPiece.name} ate a ${fruit.name}!`);
            }
        });
    }

    // Optionally, add visual effects or animations here

    // Add the merged piece after a short delay to allow animations
    setTimeout(() => {
        gameState.pieces.push(mergedPiece);
        
        // Remove the original pieces from the game
        gameState.pieces = gameState.pieces.filter(piece => piece !== existingPiece && piece !== releasedPiece);
        
        // Calculate score increase
        const scoreIncrease = mergedPiece.attributes.value;
        gameState.score += scoreIncrease;
        updateScore();

        // Create and animate the score sprite
        createScoreSprite(mergedPiece.x, mergedPiece.y, scoreIncrease);
        

    }, 0); // Adjust the delay as needed for animations

    playSound(mergeSound);
}

// Helper function to determine if two pieces are near each other
export function isNear(piece1, piece2, distanceThreshold = 700) { // Adjust threshold as needed
    const dx = piece1.x - piece2.x;
    const dy = piece1.y - piece2.y;
    const distance = Math.hypot(dx, dy);
    return distance <= distanceThreshold;
}

// Function to handle the jump mechanics
export function triggerJump(rabbit) {
    // Define the jump velocity (adjust as needed for desired jump strength)
    const jumpVelocityY = -1000; // Negative value to move upwards

    // Apply the jump velocity
    rabbit.vy = jumpVelocityY;

    // Optionally, apply a slight horizontal repositioning
    const repositionOffset = 50; // Pixels to move horizontally
    const direction = Math.random() < 0.5 ? -1 : 1; // Random left or right
    rabbit.vx += direction * 200; // Adjust as needed

    // Mark the ability as used
    rabbit.hasJumped = true;
    console.log(`${rabbit.name} performed a single jump!`);

    // Play a jump sound (ensure you have a jump sound loaded)
    const jumpSound = new Audio('/static/audio/jump.mp3');
    playSound(jumpSound);
}

// Add this function to your abilities.js file
function checkCollision(piece1, piece2) {
    // Calculate the edges of each piece
    const left1 = piece1.x - piece1.width / 2;
    const right1 = piece1.x + piece1.width / 2;
    const top1 = piece1.y - piece1.height / 2;
    const bottom1 = piece1.y + piece1.height / 2;

    const left2 = piece2.x - piece2.width / 2;
    const right2 = piece2.x + piece2.width / 2;
    const top2 = piece2.y - piece2.height / 2;
    const bottom2 = piece2.y + piece2.height / 2;

    // Check for overlap
    return !(left1 > right2 || right1 < left2 || top1 > bottom2 || bottom1 < top2);
}