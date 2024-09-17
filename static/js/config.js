// config.js

// Canvas dimensions
export const CANVAS_WIDTH = 600; // Adjust as needed
export const CANVAS_HEIGHT = 900; // Adjust as needed

// Game physics constants
export const GRAVITY = 980; // pixels per second squared
export const FRICTION = 0.985;
export const BOUNCE_FACTOR = 0.1;
export const SPAWN_Y = 50;
export const MAX_VELOCITY = 2000;
export const POWER_MULTIPLIER = 1;
export const POWER_SCALING_FACTOR = 20;
export const ROTATION_FRICTION = 0.99;
export const SPEED_THRESHOLD = 1;
export const ANGULAR_VELOCITY_THRESHOLD = 0.001;
export const VELOCITY_THRESHOLD = 0.1;
export const END_ROUND_COOLDOWN = 2000;
export const THROW_COOLDOWN = 500;

export const INITIAL_DECK_VALUES = [1, 1];

// Character families and pieces
export const CHARACTER_FAMILIES = {
    animals: {
        description: "Animal-based characters with unique abilities.",
        characters: [
            {
                name: "Mouse",
                faceImage: "/static/images/characters/mouse_face.png",
                earsImage: "/static/images/characters/mouse_ears.png",
                ability: "Bounce Boost",
                attributes: {
                    radius: 20,
                    color: '#808080',
                    value: 1,
                    mass: 2,
                    angularVelocity: 2,
                    cost: 10
                },
            },
            // Future animal characters can be added here
        ]
    },
    // Additional families can be defined here
};

export const ALL_PIECE_TYPES = [
    ...CHARACTER_FAMILIES.animals.characters,
    // Add other families' characters when available
];