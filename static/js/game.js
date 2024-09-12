// Game constants
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const PIECE_TYPES = [
    { radius: 20, color: '#FF0000', value: 1, mass: 1 },
    { radius: 30, color: '#00FF00', value: 2, mass: 2 },
    { radius: 40, color: '#0000FF', value: 4, mass: 4 },
    { radius: 50, color: '#FFFF00', value: 8, mass: 8 },
    { radius: 60, color: '#FF00FF', value: 16, mass: 16 },
    { radius: 70, color: '#00FFFF', value: 32, mass: 32 },
];
const GRAVITY = 1200;
const BOUNCE_FACTOR = 0.2;
const FRICTION = 0.98;
const SPAWN_Y = 50;

// Game variables
let canvas, ctx, pieces, currentPiece, score, round, gameOver, targetScore;
let lastTime, animationId;
let aimX, aimY;

// Audio
const mergeSound = new Audio('/static/audio/merge.mp3');
const launchSound = new Audio('/static/audio/drop.mp3');
const gameOverSound = new Audio('/static/audio/gameover.mp3');

// Particle class
class Particle {
    constructor(x, y, color, velocity, lifespan) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = velocity;
        this.lifespan = lifespan;
        this.radius = 2;
    }

    update(deltaTime) {
        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;
        this.lifespan -= deltaTime;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

// ParticleSystem class
class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    addParticle(x, y, color, velocity, lifespan) {
        this.particles.push(new Particle(x, y, color, velocity, lifespan));
    }

    update(deltaTime) {
        this.particles = this.particles.filter(particle => particle.lifespan > 0);
        this.particles.forEach(particle => particle.update(deltaTime));
    }

    draw(ctx) {
        this.particles.forEach(particle => particle.draw(ctx));
    }

    createExplosion(x, y, color, particleCount) {
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 100 + 50;
            const velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };
            this.addParticle(x, y, color, velocity, Math.random() * 0.5 + 0.5);
        }
    }
}

// Add ParticleSystem to game variables
let particleSystem;

// Initialize the game
function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    pieces = [];
    score = 0;
    round = 1;
    gameOver = false;
    targetScore = 100;

    updateScore();
    updateRound();

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    particleSystem = new ParticleSystem();
    spawnPiece();
    lastTime = performance.now();
    gameLoop();
}

// Main game loop
function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    update(deltaTime);
    render();

    if (!gameOver) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

// Update game state
function update(deltaTime) {
    for (let i = 0; i < pieces.length; i++) {
        const piece = pieces[i];
        const force = GRAVITY * piece.mass;
        piece.vy += (force / piece.mass) * deltaTime;
        piece.vx *= FRICTION;
        piece.vy *= FRICTION;

        // Apply minimum velocity threshold based on mass
        const minVelocity = 5 / piece.mass;
        if (Math.abs(piece.vx) < minVelocity) piece.vx = 0;
        if (Math.abs(piece.vy) < minVelocity) piece.vy = 0;

        piece.x += piece.vx * deltaTime;
        piece.y += piece.vy * deltaTime;

        // Bounce off walls
        if (piece.x - piece.radius < 0 || piece.x + piece.radius > CANVAS_WIDTH) {
            piece.vx *= -BOUNCE_FACTOR;
            piece.x = Math.max(piece.radius, Math.min(CANVAS_WIDTH - piece.radius, piece.x));
        }

        // Bounce off floor
        if (piece.y + piece.radius > CANVAS_HEIGHT) {
            piece.vy *= -BOUNCE_FACTOR;
            piece.y = CANVAS_HEIGHT - piece.radius;
        }

        // Check collision with other pieces
        for (let j = i + 1; j < pieces.length; j++) {
            const otherPiece = pieces[j];
            if (isColliding(piece, otherPiece)) {
                resolveCollision(piece, otherPiece);
                checkMerge(piece, otherPiece);
            }
        }
    }

    // Remove merged pieces
    pieces = pieces.filter(piece => !piece.merged);

    // Check for game over condition
    if (pieces.some(piece => piece.y + piece.radius <= 0)) {
        endGame();
    }

    // Check for round completion
    if (score >= targetScore) {
        nextRound();
    }

    particleSystem.update(deltaTime);
}

// Render the game
function render() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw trajectory lines
    drawTrajectoryLines();

    // Draw pieces
    for (const piece of pieces) {
        drawPiece(piece);
    }

    // Draw current piece
    if (currentPiece) {
        drawPiece(currentPiece);
    }

    // Draw spawn indicator
    drawSpawnIndicator();

    // Draw particles
    particleSystem.draw(ctx);
}

// Draw trajectory lines
function drawTrajectoryLines() {
    if (currentPiece) {
        ctx.beginPath();
        ctx.moveTo(currentPiece.x, currentPiece.y);
        let simX = currentPiece.x;
        let simY = currentPiece.y;
        const dx = aimX - currentPiece.x;
        const dy = aimY - currentPiece.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const power = 5;
        let simVx = (dx / distance) * power * 100;
        let simVy = (dy / distance) * power * 100;
        ctx.setLineDash([8, 4]);
        for (let i = 0; i < 200; i++) {
            simVy += GRAVITY * 0.016;
            simVx *= FRICTION;
            simX += simVx * 0.016;
            simY += simVy * 0.016;
            if (simY > CANVAS_HEIGHT - currentPiece.radius) {
                simY = CANVAS_HEIGHT - currentPiece.radius;
                simVy *= -BOUNCE_FACTOR;
            }
            if (simX < currentPiece.radius || simX > CANVAS_WIDTH - currentPiece.radius) {
                simX = Math.max(currentPiece.radius, Math.min(CANVAS_WIDTH - currentPiece.radius, simX));
                simVx *= -BOUNCE_FACTOR;
            }
            ctx.lineTo(simX, simY);
            if (simY >= CANVAS_HEIGHT - currentPiece.radius && Math.abs(simVy) < 1) break;
        }
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

// Draw a single piece
function drawPiece(piece) {
    ctx.beginPath();
    ctx.arc(piece.x, piece.y, piece.radius, 0, Math.PI * 2);
    ctx.fillStyle = piece.color;
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(piece.value, piece.x, piece.y);
}

// Draw spawn indicator
function drawSpawnIndicator() {
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2 - 15, SPAWN_Y - 15);
    ctx.lineTo(CANVAS_WIDTH / 2, SPAWN_Y);
    ctx.lineTo(CANVAS_WIDTH / 2 + 15, SPAWN_Y - 15);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Spawn a new piece
function spawnPiece() {
    const pieceType = PIECE_TYPES[Math.floor(Math.random() * 3)];
    currentPiece = {
        x: CANVAS_WIDTH / 2,
        y: SPAWN_Y + pieceType.radius,
        vx: 0,
        vy: 0,
        ...pieceType
    };
}

// Check for merges
function checkMerge(piece1, piece2) {
    if (piece1.value === piece2.value) {
        const newPieceType = PIECE_TYPES[PIECE_TYPES.indexOf(PIECE_TYPES.find(t => t.value === piece1.value)) + 1];
        if (newPieceType) {
            const newPiece = {
                x: (piece1.x + piece2.x) / 2,
                y: (piece1.y + piece2.y) / 2,
                vx: (piece1.vx + piece2.vx) / 2,
                vy: (piece1.vy + piece2.vy) / 2,
                ...newPieceType
            };
            pieces.push(newPiece);
            piece1.merged = true;
            piece2.merged = true;
            score += newPieceType.value;
            updateScore();
            mergeSound.play();

            // Add merge particle effect
            particleSystem.createExplosion(newPiece.x, newPiece.y, piece1.color, 20);
            particleSystem.createExplosion(newPiece.x, newPiece.y, piece2.color, 20);
        }
    }
}

// Check collision between two pieces
function isColliding(piece1, piece2) {
    const dx = piece1.x - piece2.x;
    const dy = piece1.y - piece2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < piece1.radius + piece2.radius;
}

// Resolve collision between two pieces
function resolveCollision(piece1, piece2) {
    const dx = piece2.x - piece1.x;
    const dy = piece2.y - piece1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const overlap = (piece1.radius + piece2.radius) - distance;

    if (overlap > 0) {
        const angle = Math.atan2(dy, dx);
        const moveX = overlap * Math.cos(angle) / 2;
        const moveY = overlap * Math.sin(angle) / 2;

        const massRatio1 = piece1.mass / (piece1.mass + piece2.mass);
        const massRatio2 = piece2.mass / (piece1.mass + piece2.mass);

        // Adjust separation based on mass
        const separationFactor = 1.01 * (piece2.mass / piece1.mass);
        piece1.x -= moveX * separationFactor * massRatio2;
        piece1.y -= moveY * separationFactor * massRatio2;
        piece2.x += moveX * separationFactor * massRatio1;
        piece2.y += moveY * separationFactor * massRatio1;

        const normalX = dx / distance;
        const normalY = dy / distance;
        const tangentX = -normalY;
        const tangentY = normalX;

        const dot1 = piece1.vx * normalX + piece1.vy * normalY;
        const dot2 = piece2.vx * normalX + piece2.vy * normalY;

        const v1n = dot1;
        const v2n = dot2;
        const v1t = piece1.vx * tangentX + piece1.vy * tangentY;
        const v2t = piece2.vx * tangentX + piece2.vy * tangentY;

        const v1nAfter = (v1n * (piece1.mass - piece2.mass) + 2 * piece2.mass * v2n) / (piece1.mass + piece2.mass);
        const v2nAfter = (v2n * (piece2.mass - piece1.mass) + 2 * piece1.mass * v1n) / (piece1.mass + piece2.mass);

        piece1.vx = (tangentX * v1t + normalX * v1nAfter) * 0.8;
        piece1.vy = (tangentY * v1t + normalY * v1nAfter) * 0.8;
        piece2.vx = (tangentX * v2t + normalX * v2nAfter) * 0.8;
        piece2.vy = (tangentY * v2t + normalY * v2nAfter) * 0.8;
    }
}

// Handle mouse move
function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    aimX = e.clientX - rect.left;
    aimY = e.clientY - rect.top;
}

// Handle mouse up
function handleMouseUp(e) {
    if (currentPiece) {
        const dx = aimX - currentPiece.x;
        const dy = aimY - currentPiece.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const power = 5;
        currentPiece.vx = (dx / distance) * power * 100;
        currentPiece.vy = (dy / distance) * power * 100;
        
        pieces.push(currentPiece);
        launchSound.play();
        spawnPiece();
    }
}

// Update the score display
function updateScore() {
    document.getElementById('score').textContent = score;
}

// Update the round display
function updateRound() {
    document.getElementById('round').textContent = round;
}

// Move to the next round
function nextRound() {
    round++;
    updateRound();
    targetScore *= 2;
    pieces = [];
    spawnPiece();
}

// End the game
function endGame() {
    gameOver = true;
    cancelAnimationFrame(animationId);
    gameOverSound.play();
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over').classList.remove('hidden');

    // Add game over explosion effect
    pieces.forEach(piece => {
        particleSystem.createExplosion(piece.x, piece.y, piece.color, 50);
    });
}

// Restart the game
document.getElementById('restart-button').addEventListener('click', () => {
    document.getElementById('game-over').classList.add('hidden');
    init();
});

// Start the game
init();
