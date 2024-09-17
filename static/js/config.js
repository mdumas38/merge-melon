// config.js

// Canvas dimensions
export const CANVAS_WIDTH = 600; // Adjust as needed
export const CANVAS_HEIGHT = 900; // Adjust as needed

// Game physics constants
export const GRAVITY = 980; // pixels per second squared
export const FRICTION = 0.99;
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
export const TORQUE_FACTOR = 0.001; // Adjust for more realistic rotation

export const INITIAL_DECK_VALUES = [1, 1, 1, 2, 2];

// Character families and pieces
export const CHARACTER_FAMILIES = {
    animals: {
        description: "Animal-based characters with unique abilities.",
        characters: [
            {
                name: "Ladybug",
                faceImage: "/static/images/characters/ladybug/ladybug_face.png",
                earsImage: null,
                ability: null,
                attributes: {
                    radius: 15,
                    color: "#FF0000",
                    value: 1,
                    mass: 1,
                    angularVelocity: 1,
                    cost: 5
                }
            },
            {
                name: "Mouse",
                faceImage: "/static/images/characters/mouse/mouse_face.png",
                earsImage: "/static/images/characters/mouse/mouse_ears.png",
                ability: "Bounce Boost",
                attributes: {
                    radius: 20,
                    color: "#808080",
                    value: 2,
                    mass: 2,
                    angularVelocity: 2,
                    cost: 10
                }
            },
            {
                name: "Bird",
                faceImage: "/static/images/characters/bird/bird_face.png",
                earsImage: null,
                ability: "Ladybug Eater",
                attributes: {
                    radius: 25,
                    color: "#ADD8E6",
                    value: 4,
                    mass: 3,
                    angularVelocity: 3,
                    cost: 15
                }
            },
            {
                name: "Rabbit",
                faceImage: "/static/images/characters/rabbit/rabbit_face.png",
                earsImage: "/static/images/characters/rabbit/rabbit_ears.png",
                ability: "Single Jump",
                attributes: {
                    radius: 30,
                    color: "#FFFFFF",
                    value: 8,
                    mass: 3,
                    angularVelocity: 3,
                    cost: 20
                }
            },
            {
                name: "Fox",
                faceImage: "/static/images/characters/fox/fox_face.png",
                earsImage: "/static/images/characters/fox/fox_ears.png",
                ability: "Unpredictable Bounce",
                attributes: {
                    radius: 35,
                    color: "#FFA500",
                    value: 16,
                    mass: 4,
                    angularVelocity: 4,
                    cost: 30
                }
            },
            {
                name: "Snake",
                faceImage: "/static/images/characters/snake/snake_face.png",
                earsImage: null,
                ability: "Slither Slide",
                attributes: {
                    radius: 40,
                    color: "#228B22",
                    value: 32,
                    mass: 5,
                    angularVelocity: 1,
                    cost: 40
                }
            },
            {
                name: "Eagle",
                faceImage: "/static/images/characters/eagle/eagle_face.png",
                earsImage: "/static/images/characters/eagle/eagle_ears.png",
                ability: "Swoop",
                attributes: {
                    radius: 45,
                    color: "#FFD700",
                    value: 64,
                    mass: 3,
                    angularVelocity: 5,
                    cost: 50
                }
            },
            {
                name: "Wolf",
                faceImage: "/static/images/characters/wolf/wolf_face.png",
                earsImage: null,
                ability: "Pack Strength",
                attributes: {
                    radius: 50,
                    color: "#A9A9A9",
                    value: 128,
                    mass: 6,
                    angularVelocity: 2,
                    cost: 60
                }
            },
            {
                name: "Lion",
                faceImage: "/static/images/characters/lion/lion_face.png",
                earsImage: "/static/images/characters/lion/lion_ears.png",
                ability: "Roar",
                attributes: {
                    radius: 55,
                    color: "#DAA520",
                    value: 256,
                    mass: 7,
                    angularVelocity: 3,
                    cost: 70
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