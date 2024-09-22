// config.js

// Canvas dimensions
export const CANVAS_WIDTH = 700; // Adjust as needed
export const CANVAS_HEIGHT = 900; // Adjust as needed

// Game physics constants
export const GRAVITY = 2000; // pixels per second squared
export const FRICTION = 0.99;
export const BOUNCE_FACTOR = 0.3;
export const SPAWN_Y = 100;
export const MAX_VELOCITY = 2000;
export const POWER_MULTIPLIER = 1;
export const POWER_SCALING_FACTOR = 30;
export const ROTATION_FRICTION = 0.99;
export const SPEED_THRESHOLD = 10;
export const ANGULAR_VELOCITY_THRESHOLD = 0.01;
export const VELOCITY_THRESHOLD = 100;
export const END_ROUND_COOLDOWN = 2000;
export const THROW_COOLDOWN = 500;
export const TORQUE_FACTOR = 0.0008; // Adjust for more realistic rotation
export const CONTAINER_WIDTH = 300;
export const CONTAINER_HEIGHT = 600;
export const SHOP_SIZE = 25; // Adjust based on how large you want characters in the shop
export const SHOP_ITEMS = 3;




export const INITIAL_DECK_VALUES = [0, 0, 1, 1, 2];

// Character families and pieces
export const CHARACTER_FAMILIES = {
    animals: {
        description: "Animal-based characters with unique abilities.",
        characters: [
            {
                name: "Ladybug",
                faceImage: "/static/images/characters/ladybug/ladybug_face.png",
                tier: 1,
                features: [],
                abilities: [],
                attributes: {
                    radius: 15,
                    color: "#FF0000",
                    value: 1,
                    mass: 1,
                    angularVelocity: 1,
                    cost: 3
                }
            },
            {
                name: "Mouse",
                faceImage: "/static/images/characters/mouse/mouse_face.png",
                tier: 2,
                features: [
                    {
                        type: "ears",
                        image: "/static/images/characters/mouse/mouse_ears.png",
                        position: { x: 0, y: -20 },
                        widthFactor: 1,
                        heightFactor: 1 
                    }
                ],
                abilities: ["Bounce Boost"],
                attributes: {
                    radius: 20,
                    color: "#808080",
                    value: 2,
                    mass: 2,
                    angularVelocity: 1,
                    cost: 3
                }
            },
            {
                name: "Bird",
                faceImage: "/static/images/characters/bird/bird_face.png",
                tier: 2,
                features: [],
                abilities: ["Float", "Eat"], // Updated abilities
                attributes: {
                    radius: 25,
                    color: "#ADD8E6",
                    value: 4,
                    mass: 3,
                    angularVelocity: 1,
                    cost: 3
                }
            },
            {
                name: "Rabbit",
                faceImage: "/static/images/characters/rabbit/rabbit_face.png",
                tier: 3,
                features: [
                    {
                        type: "ears",
                        image: "/static/images/characters/rabbit/rabbit_ears.png",
                        position: { x: 0, y: -37 }, // Positioned at the top of the Rabbit
                        widthFactor: 1,  // Adjusted for better scaling
                        heightFactor: 1
                    },
                    {
                        type: "feet",
                        image: "/static/images/characters/rabbit/rabbit_feet.png",
                        position: { x: 0, y: 27 }, // Positioned at the bottom of the Rabbit
                        widthFactor: .75,  
                        heightFactor: 1
                    }
                ],
                ability: "Single Jump",
                attributes: {
                    radius: 30,
                    color: "#FFFFFF",
                    value: 8,
                    mass: 3,
                    angularVelocity: 1,
                    cost: 3
                }
            },
            {
                name: "Fox",
                faceImage: "/static/images/characters/fox/fox_face.png",
                tier: 3,
                features: [
                    {
                        type: "ears",
                        image: "/static/images/characters/fox/fox_ears.png",
                        position: { x: 0, y: -32 },
                        widthFactor: 1,  // Proportional to the fox's radius (35)
                        heightFactor: 1
                    }
                ],
                abilities: ["Eat"], // Ensure "Eat" is included
                attributes: {
                    radius: 35,
                    color: "#FFA500",
                    value: 16,
                    mass: 4,
                    angularVelocity: 1,
                    cost: 3
                }
            },
            {
                name: "Snake",
                faceImage: "/static/images/characters/snake/snake_face.png",
                tier: 4,
                features: [],
                abilities: ["Eat_2"],
                attributes: {
                    radius: 40,
                    color: "#228B22",
                    value: 32,
                    mass: 5,
                    angularVelocity: 1,
                    cost: 3
                }
            },
            {
                name: "Eagle",
                faceImage: "/static/images/characters/eagle/eagle_face.png",
                tier: 4,
                features: [
                    {
                        type: "feet",
                        image: "/static/images/characters/eagle/eagle_feet.png",
                        position: { x: 0, y: 45 },
                        widthFactor: .5,
                        heightFactor: .5
                    },
                ],
                abilities: ["Eat One Prey"], // Updated ability
                attributes: {
                    radius: 45,
                    color: "#FFD700",
                    value: 64,
                    mass: 3,
                    angularVelocity: 1,
                    cost: 3
                }
            },
            {
                name: "Wolf",
                faceImage: "/static/images/characters/wolf/wolf_face.png",
                tier: 5,
                features: [
                    {
                        type: "ears",
                        image: "/static/images/characters/wolf/wolf_ears.png",
                        position: { x: 0, y: -45 },
                        widthFactor: .75,  // Proportional to the wolf's radius (50)
                        heightFactor: 1
                    }
                ],
                abilities: ["Eat Two Prey"], // Updated ability
                attributes: {
                    radius: 50,
                    color: "#A9A9A9",
                    value: 128,
                    mass: 6,
                    angularVelocity: 1,
                    cost: 3
                }
            },
            {
                name: "Lion",
                faceImage: "/static/images/characters/lion/lion_face.png",
                tier: 6,
                features: [
                    {
                        type: "mane",
                        image: "/static/images/characters/lion/lion_mane.png",
                        position: { x: 2, y: 0 }, // Centered around the face
                        widthFactor: 1.4,    // Increased width
                        heightFactor: 1.4,   // Increased height
                        zIndex: 2      // Higher z-index to appear on top
                    },
                ],
                abilities: ["Roar"],
                attributes: {
                    radius: 55,
                    color: "#DAA520",
                    value: 256,
                    mass: 7,
                    angularVelocity: 1,
                    cost: 3
                }
            }
        ]
    },
    // Additional families can be defined here
};

export const ALL_PIECE_TYPES = [
    ...CHARACTER_FAMILIES.animals.characters,
    // Add other families' characters when available
];
// Container configurations
export const CONTAINER = {
    x: CANVAS_WIDTH / 2 - CONTAINER_WIDTH / 2, // Centered horizontally with new width
    y: CANVAS_HEIGHT - CONTAINER_HEIGHT,    // Positioned higher to accommodate new height
    width: CONTAINER_WIDTH,                 // Updated width
    height: CONTAINER_HEIGHT,                // Updated height
    color: '#8B4513',           // Brown color for the container
    lineWidth: 5                // Thickness of the container borders
};
