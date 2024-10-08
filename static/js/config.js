// config.js

// Canvas dimensions
export const CANVAS_WIDTH = 1440; // Increased from 900
export const CANVAS_HEIGHT = 900; // Kept the same
export const GAME_AREA_WIDTH = 900; // New constant for the actual game area

// Game physics constants
export const GRAVITY = 980; // pixels per second squared
export const FRICTION = 0.985;
export const BOUNCE_FACTOR = 0.2;
export const SPAWN_Y = 150;
export const MAX_VELOCITY = 2000;
export const POWER_MULTIPLIER = 1;
export const POWER_SCALING_FACTOR = 30;
export const ROTATION_FRICTION = 0.995;
export const SPEED_THRESHOLD = 10;
export const ANGULAR_VELOCITY_THRESHOLD = 0.01;
export const VELOCITY_THRESHOLD = 50;
export const END_ROUND_COOLDOWN = 3000;
export const THROW_COOLDOWN = 500;
export const TORQUE_FACTOR = 0.0015; // Adjust for more realistic rotation
export const CONTAINER_WIDTH = 600;
export const CONTAINER_HEIGHT = 700; // Stretch to the bottom
export const SHOP_SIZE = 40; // Adjust based on how large you want characters in the shop
export const SHOP_ITEMS = 4;
export const GRAVITY_MULTIPLIER = 1.5; // Gravity multiplier when Saturn is present
export const EXCLUDED_PIECES = ["Asteroid", "Pineapple", "Jupiter", "Elephant"];


export const INITIAL_DECK_VALUES = [0, 0, 1, 1, 2, 2];

export const CHARACTER_FAMILIES = {
    animals: {
        description: "Animal-based characters with unique abilities. Low points. Each animal tends to eat a certain fruit for points.",
        evolutionChain: [
            { name: "Ladybug", value: 1 },
            { name: "Mouse", value: 3 },
            { name: "Cat", value: 6 },
            { name: "Doggo", value: 12 },
            { name: "Bear", value: 25 },
            { name: "Elephant", value: 50 }
        ],
        characters: [
            {
                name: "Ladybug",
                faceImage: "/static/images/characters/family/animals/ladybug/ladybug_face.png",
                bodyImage: "/static/images/characters/family/animals/ladybug/ladybug.png",
                tier: 1,
                abilities: ["Combine into a Mouse (1 point)", "Disappear into apples (1 point)"],
                attributes: {
                    radius: 22.5, // Decreased by 25%
                    color: "#FF0000",
                    value: 1,
                    mass: 2,
                    angularVelocity: 1,
                    cost: 1
                },
                family: "animals"
            },
            {
                name: "Mouse",
                faceImage: "/static/images/characters/family/animals/mouse/mouse_face.png",
                bodyImage: "/static/images/characters/family/animals/mouse/mouse.png",
                tier: 2,
                abilities: ["Combine into a Cat (3 points)", "Eat Cherry (1 point)", "Eat Fruit"],
                attributes: {
                    radius: 30, // Decreased by 25%
                    color: "#808080",
                    value: 3,
                    mass: 3,
                    angularVelocity: 1,
                    cost: 1
                },
                family: "animals"
            },
            {
                name: "Cat",
                faceImage: "/static/images/characters/family/animals/cat/cat_face.png",
                bodyImage: "/static/images/characters/family/animals/cat/cat.png",
                tier: 3,
                abilities: ["Combine into a Dog (6 points)", "Eat Strawberry (3 points)", "Eat Fruit"],
                attributes: {
                    radius: 37.5, // Decreased by 25%
                    color: "#FFA500",
                    value: 6,
                    mass: 4,
                    angularVelocity: 1,
                    cost: 2
                },
                family: "animals"
            },
            {
                name: "Doggo",
                faceImage: "/static/images/characters/family/animals/doggo/doggo_face.png",
                bodyImage: "/static/images/characters/family/animals/doggo/doggo.png",
                tier: 4,
                abilities: ["Combine into a Bear (12 points)", "Eat apple (20 points)", "Eat Fruit"],
                attributes: {
                    radius: 45, // Decreased by 25%
                    color: "#8B4513",
                    value: 12,
                    mass: 5,
                    angularVelocity: 1,
                    cost: 2
                },
                family: "animals"
            },
            {
                name: "Bear",
                faceImage: "/static/images/characters/family/animals/bear/bear_face.png",
                bodyImage: "/static/images/characters/family/animals/bear/bear.png",
                tier: 5,
                abilities: ["Combine into an Elephant (25 points)", "Eat Pineapple (50 points)", "Eat Fruit"],
                attributes: {
                    radius: 52.5, // Decreased by 25%
                    color: "#8B4513",
                    value: 25,
                    mass: 7,
                    angularVelocity: 1,
                    cost: 5
                },
                family: "animals"
            },
            {
                name: "Elephant",
                faceImage: "/static/images/characters/family/animals/elephant/elephant_face.png",
                bodyImage: "/static/images/characters/family/animals/elephant/elephant.png",
                tier: 6,
                abilities: ["Combine into a Whale (50 points)", "Eat watermelon (150 points)", "Eat Fruit"],
                attributes: {
                    radius: 60, // Decreased by 25%
                    color: "#808080",
                    value: 50,
                    mass: 10,
                    angularVelocity: 1,
                    cost: 10
                },
                family: "animals"
            }
        ]
    },
    // tech_storage: {
    //     description: "Storage-based items with high points. Cannot combine, instead needs a certain amount to generate better storage.",
    //     evolutionChain: [
    //         { name: "Floppy Disk", value: 1 },
    //         { name: "Tape", value: 6 },
    //         { name: "VHS", value: 11 },
    //         { name: "Vinyl", value: 27 },
    //         { name: "DVD", value: 59 }
    //     ],
    //     characters: [
    //         {
    //             name: "Floppy Disk",
    //             faceImage: "/static/images/characters/family/tech_storage/floppy/floppy_face.png",
    //             bodyImage: "/static/images/characters/family/tech_storage/floppy/floppy.png",
    //             tier: 1,
    //             abilities: ["Cannot Combine", "Need 4 to generate a Tape (6 points)"],
    //             attributes: {
    //                 radius: 15,
    //                 color: "#000000",
    //                 value: 1,
    //                 mass: 1,
    //                 angularVelocity: 1,
    //                 cost: 1
    //             },
    //             family: "tech_storage"
    //         },
    //         {
    //             name: "Tape",
    //             faceImage: "/static/images/characters/family/tech_storage/tape/tape_face.png",
    //             bodyImage: "/static/images/characters/family/tech_storage/tape/tape.png",
    //             tier: 2,
    //             abilities: ["Cannot Combine", "Need 3 to generate a VHS (11 points)"],
    //             attributes: {
    //                 radius: 20,
    //                 color: "#8B4513",
    //                 value: 6,
    //                 mass: 2,
    //                 angularVelocity: 1,
    //                 cost: 2
    //             },
    //             family: "tech_storage"
    //         },
    //         {
    //             name: "VHS",
    //             faceImage: "/static/images/characters/family/tech_storage/vhs/vhs_face.png",
    //             bodyImage: "/static/images/characters/family/tech_storage/vhs/vhs.png",
    //             tier: 3,
    //             abilities: ["Cannot Combine", "Need 3 to generate a Vinyl (27 points)"],
    //             attributes: {
    //                 radius: 25,
    //                 color: "#000000",
    //                 value: 11,
    //                 mass: 3,
    //                 angularVelocity: 1,
    //                 cost: 5
    //             },
    //             family: "tech_storage"
    //         },
    //         {
    //             name: "Vinyl",
    //             faceImage: "/static/images/characters/family/tech_storage/vinyl/vinyl_face.png",
    //             bodyImage: "/static/images/characters/family/tech_storage/vinyl/vinyl.png",
    //             tier: 4,
    //             abilities: ["Cannot Combine", "Need 3 to generate a DVD (59 points)"],
    //             attributes: {
    //                 radius: 30,
    //                 color: "#000000",
    //                 value: 27,
    //                 mass: 4,
    //                 angularVelocity: 1,
    //                 cost: 7
    //             },
    //             family: "tech_storage"
    //         },
    //         {
    //             name: "DVD",
    //             faceImage: "/static/images/characters/family/tech_storage/dvd/dvd_face.png",
    //             bodyImage: "/static/images/characters/family/tech_storage/dvd/dvd.png",
    //             tier: 5,
    //             abilities: ["Cannot Combine", "Need 3 to generate a USB (111 points)"],
    //             attributes: {
    //                 radius: 35,
    //                 color: "#C0C0C0",
    //                 value: 59,
    //                 mass: 5,
    //                 angularVelocity: 1,
    //                 cost: 10
    //             },
    //             family: "tech_storage"
    //         }
    //     ]
    // },
    fruits: {
        description: "Fruit-based items with medium points. High level fruits give deleters.",
        evolutionChain: [
            { name: "Cherry", value: 1 },
            { name: "Strawberry", value: 2 },
            { name: "Grape", value: 5 },
            { name: "Apple", value: 10 },
            { name: "Pineapple", value: 20 }
        ],
        characters: [
            {
                name: "Cherry",
                faceImage: "/static/images/characters/family/fruits/cherry/cherry_face.png",
                bodyImage: "/static/images/characters/family/fruits/cherry/cherry.png",
                tier: 1,
                abilities: ["Combine into a Strawberry (2 points)"],
                attributes: {
                    radius: 15,
                    color: "#FF0000",
                    value: 1,
                    mass: 1,
                    angularVelocity: 1,
                    cost: 1
                },
                family: "fruits"
            },
            {
                name: "Strawberry",
                faceImage: "/static/images/characters/family/fruits/strawberry/strawberry_face.png",
                bodyImage: "/static/images/characters/family/fruits/strawberry/strawberry.png",
                tier: 2,
                abilities: ["Combine into a Raisin (5 points)"],
                attributes: {
                    radius: 25,
                    color: "#FF69B4",
                    value: 2,
                    mass: 2,
                    angularVelocity: 1,
                    cost: 2
                },
                family: "fruits"
            },
            {
                name: "Grape",
                faceImage: "/static/images/characters/family/fruits/grape/grape_face.png",
                bodyImage: "/static/images/characters/family/fruits/grape/grape.png",
                tier: 3,
                abilities: ["Combine into an Apple (10 points)"],
                attributes: {
                    radius: 35,
                    color: "#800080",
                    value: 5,
                    mass: 3,
                    angularVelocity: 1,
                    cost: 4
                },
                family: "fruits"
            },
            {
                name: "Apple",
                faceImage: "/static/images/characters/family/fruits/apple/apple_face.png",
                bodyImage: "/static/images/characters/family/fruits/apple/apple.png",
                tier: 4,
                abilities: ["Combine into a Pineapple (20 points)"],
                attributes: {
                    radius: 50,
                    color: "#FF0000",
                    value: 10,
                    mass: 4,
                    angularVelocity: 1,
                    cost: 7
                },
                family: "fruits"
            },
            {
                name: "Pineapple",
                faceImage: "/static/images/characters/family/fruits/pineapple/pineapple_face.png",
                bodyImage: "/static/images/characters/family/fruits/pineapple/pineapple.png",
                tier: 5,
                abilities: ["Combine into a Melon (35 points)", "Gain 1 X when created"],
                attributes: {
                    radius: 70,
                    color: "#FFD700",
                    value: 20,
                    mass: 5,
                    angularVelocity: 1,
                    cost: 11
                },
                family: "fruits"
            }
        ]
    },
    celestials: {
        description: "Celestial-based items with high points. May have undesired side effects.",
        evolutionChain: [
            { name: "Pluto", value: 1 },
            { name: "Moon", value: 3 },
            { name: "Earth", value: 7 },
            { name: "Saturn", value: 15 },
            { name: "Jupiter", value: 30 }
        ],
        characters: [
            {
                name: "Pluto",
                faceImage: "/static/images/characters/family/celestials/pluto/pluto_face.png",
                bodyImage: "/static/images/characters/family/celestials/pluto/pluto.png",
                tier: 1,
                abilities: ["Combine into a Moon (3 points)", "Not a planet"],
                attributes: {
                    radius: 22.5, // Decreased by 25%
                    color: "#A9A9A9",
                    value: 1,
                    mass: 4, // Multiplied by 2
                    angularVelocity: 1,
                    cost: 1
                },
                family: "celestials"
            },
            {
                name: "Moon",
                faceImage: "/static/images/characters/family/celestials/moon/moon_face.png",
                bodyImage: "/static/images/characters/family/celestials/moon/moon.png",
                tier: 2,
                abilities: ["Combine into Earth (7 points)", "When created generate 1-5 asteroids"],
                attributes: {
                    radius: 30, // Decreased by 25%
                    color: "#F0F0F0",
                    value: 3,
                    mass: 6, // Multiplied by 2
                    angularVelocity: 1,
                    cost: 2
                },
                family: "celestials"
            },
            {
                name: "Earth",
                faceImage: "/static/images/characters/family/celestials/earth/earth_face.png",
                bodyImage: "/static/images/characters/family/celestials/earth/earth.png",
                tier: 3,
                abilities: ["Combine into Saturn (15 points)", "When created destroy all asteroids"],
                attributes: {
                    radius: 37.5, // Decreased by 25%
                    color: "#0000FF",
                    value: 7,
                    mass: 10, // Multiplied by 2
                    angularVelocity: 1,
                    cost: 5
                },
                family: "celestials"
            },
            {
                name: "Saturn",
                faceImage: "/static/images/characters/family/celestials/saturn/saturn_face.png",
                bodyImage: "/static/images/characters/family/celestials/saturn/saturn.png",
                tier: 4,
                abilities: ["Combine into Jupiter (30 points)", "While a Saturn is in place, gravity becomes heavier"],
                attributes: {
                    radius: 52.5, // Decreased by 25%
                    color: "#FFA500",
                    value: 15,
                    mass: 16, // Multiplied by 2
                    angularVelocity: 1,
                    cost: 7
                },
                family: "celestials"
            },
            {
                name: "Jupiter",
                faceImage: "/static/images/characters/family/celestials/jupiter/jupiter_face.png",
                bodyImage: "/static/images/characters/family/celestials/jupiter/jupiter.png",
                tier: 5,
                abilities: ["Combine into a Sun (70 points)", "Extra Bouncy"],
                attributes: {
                    radius: 67.5, // Decreased by 25%
                    color: "#FFA07A",
                    value: 30,
                    mass: 24, // Multiplied by 2
                    angularVelocity: 1,
                    cost: 10,
                    bounceFactor: 0.5
                },
                family: "celestials"
            },
            {
                name: "Asteroid",
                faceImage: "/static/images/characters/family/celestials/asteroid/asteroid_face.png",
                bodyImage: "/static/images/characters/family/celestials/asteroid/asteroid.png",
                tier: 0,
                abilities: ["Cannot be combined", "No effect"],
                attributes: {
                    radius: 20, // Decreased by 25%
                    color: "#808080",
                    value: 10,
                    mass: 2, // Multiplied by 2
                    angularVelocity: 1, 
                    cost: 0
                },
                family: "celestials"
            }
        ]
    }
};

export const ALL_PIECE_TYPES = [
    ...CHARACTER_FAMILIES.animals.characters,
    ...CHARACTER_FAMILIES.celestials.characters, // {{ edit_1 }} Include Celestials characters
    ...CHARACTER_FAMILIES.fruits.characters,     // {{ edit_2 }} Include Fruits characters
    // ... any additional families you may add in the future ...
];
// Container configurations
export const CONTAINER = {
    x: (CANVAS_WIDTH - CONTAINER_WIDTH) / 2,
    y: 0, // Start from the top of the screen
    width: CONTAINER_WIDTH,
    height: CANVAS_HEIGHT, // Stretch to the bottom of the screen
    color: '#8B4513', // Brown color for the walls
    lineWidth: 5 // Thickness of the walls
};

// Add configurations for left and right walls
export const LEFT_WALL = {
    x: (CANVAS_WIDTH - CONTAINER_WIDTH) / 2,
    y: 0,
    width: CONTAINER.lineWidth,
    height: CANVAS_HEIGHT
};

export const RIGHT_WALL = {
    x: (CANVAS_WIDTH + CONTAINER_WIDTH) / 2 - CONTAINER.lineWidth,
    y: 0,
    width: CONTAINER.lineWidth,
    height: CANVAS_HEIGHT
};

// Array of game tips
export const GAME_TIPS = [
    "Tip: Merge similar pieces to create more powerful characters!",
    "Tip: Keep an eye on your gold - use it wisely in the shop!",
    "Tip: Higher-level characters are worth more points!",
    // "Tip: Try to create combos by merging multiple pieces at once!",
    // "Tip: Don't forget to use your special abilities!",
    // "Tip: Planning your merges can lead to big point bonuses!",
    "Tip: Frozen shop items will be available in the next round!",
    "Tip: Rerolling the shop might give you better options!",
    "Tip: Some characters have unique synergies - experiment!",
    // "Tip: Balancing your deck is key to success!",
    "Tip: To sell a piece, click and drag it to the shop. All pieces can be sold for 1 gold.",
    "Tip: You can reroll the shop for 1 gold to see what's available.",
    "Tip: Buy a piece by dragging it into your deck.",
    "Tip: You can sell a piece by dragging it into the shop.",
    "Tip: If you don't like the shop, you can reroll it for 1 gold.",
    "Tip: If you don't reach the target score on any round, you lose.",
    "Tip: If a piece falls out of the container, you lose a life.",
    "Tip: You start with 3 lives. Lose them all and it's game over!",
];