// render.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, FRICTION, BOUNCE_FACTOR, CONTAINER, POWER_SCALING_FACTOR, POWER_MULTIPLIER, LEFT_WALL, RIGHT_WALL, CHARACTER_FAMILIES, SPAWN_Y, GAME_AREA_WIDTH, CONTAINER_WIDTH } from './config.js';
import { gameState } from './gameState.js';

let hoveredPiece = null;
let mouseX = 0;
let mouseY = 0;

// Existing drawPiece function with updates to handle features and added debug logs
export function drawPiece(ctx, piece, imageCache, posX = null, posY = null) {
    if (!piece || !piece.visual) {
        console.error('Invalid piece object:', piece);
        return;
    }

    ctx.save();

    // Use provided positions or default to piece.physics positions
    const x = posX !== null ? posX : piece.physics.x;
    const y = posY !== null ? posY : piece.physics.y;

    ctx.translate(x, y);
    ctx.rotate(piece.visual.rotation);

    // Draw the physics circle (for debugging)
    if (gameState.debugMode) {
        ctx.beginPath();
        ctx.arc(0, 0, piece.physics.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'red';
        ctx.stroke();
    }

    // Draw the visual representation
    const faceKey = `${piece.name}_face`;
    const faceImg = imageCache[faceKey];

    if (faceImg && faceImg.complete) {
        ctx.drawImage(
            faceImg,
            -piece.visual.width / 2,
            -piece.visual.height / 2,
            piece.visual.width,
            piece.visual.height
        );
    } else {
        // Fallback: Draw colored circle
        ctx.beginPath();
        ctx.arc(0, 0, piece.visual.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = piece.attributes.color;
        ctx.fill();

        // Draw value number
        ctx.fillStyle = "#000000";
        ctx.font = `${piece.visual.width / 2}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(piece.attributes.value, 0, 0);
    }

    // Draw features if any
    if (piece.features && Array.isArray(piece.features)) {
        piece.features.forEach((feature) => {
            const featureImg = imageCache[`${piece.name}_${feature.type}`];
            if (featureImg && featureImg.complete) {
                const posX = feature.position.x * (piece.visual.width / piece.physics.radius);
                const posY = feature.position.y * (piece.visual.height / piece.physics.radius);
                const featureWidth = feature.widthFactor * piece.visual.width;
                const featureHeight = feature.heightFactor * piece.visual.height;

                ctx.drawImage(
                    featureImg,
                    posX - featureWidth / 2,
                    posY - featureHeight / 2,
                    featureWidth,
                    featureHeight
                );
            }
        });
    }

    ctx.restore();
}

export function drawTrajectoryLines(ctx, currentPiece, aimX, aimY, pieces) {
    if (currentPiece) {
        ctx.beginPath();
        ctx.moveTo(currentPiece.physics.x, currentPiece.physics.y);

        let simX = currentPiece.physics.x;
        let simY = currentPiece.physics.y;
        const dx = aimX - currentPiece.physics.x;
        const dy = aimY - currentPiece.physics.y;
        const distance = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        const power = Math.min(distance / POWER_SCALING_FACTOR, 50) * 100 * POWER_MULTIPLIER;

        let simVx = Math.cos(angle) * power;
        let simVy = Math.sin(angle) * power;

        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.setLineDash([10, 5]);

        let collision = false;
        for (let i = 0; i < 120 && !collision; i++) {
            const prevX = simX;
            const prevY = simY;

            simVy += GRAVITY * 0.016;
            simVx *= FRICTION;
            simVy *= FRICTION;
            simX += simVx * 0.016;
            simY += simVy * 0.016;

            if (simY + currentPiece.physics.radius > CANVAS_HEIGHT ||
                simX - currentPiece.physics.radius < 0 ||
                simX + currentPiece.physics.radius > CANVAS_WIDTH) {
                collision = true;
                simX = Math.max(currentPiece.physics.radius, Math.min(CANVAS_WIDTH - currentPiece.physics.radius, simX));
                simY = Math.min(CANVAS_HEIGHT - currentPiece.physics.radius, simY);
            }

            for (const piece of pieces) {
                const dx = simX - piece.physics.x;
                const dy = simY - piece.physics.y;
                const distance = Math.hypot(dx, dy);
                if (distance < currentPiece.physics.radius + piece.physics.radius) {
                    collision = true;
                    break;
                }
            }

            if (!collision) {
                ctx.lineTo(simX, simY);
            } else {
                ctx.lineTo(prevX, prevY);
            }
        }

        ctx.stroke();
        ctx.setLineDash([]);
    }
}

// New function to draw the container
export function drawContainer(ctx, container) {
    ctx.save();
    ctx.strokeStyle = container.color;
    ctx.lineWidth = container.lineWidth;
    ctx.beginPath();
    ctx.rect(container.x, container.y, container.width, container.height);
    ctx.stroke();
    ctx.restore();
}

// Updated function to draw the deck count in a fixed position
function drawDeckCount(ctx, deckCount) {
    const padding = 10;
    const fontSize = 16;
    ctx.font = `${fontSize}px Inter`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const text = `Deck: ${gameState.activeDeck.length}`;
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;

    // Fixed position above the spawn point
    const textX = CANVAS_WIDTH / 2;
    const textY = SPAWN_Y - 75; // Adjust this value as needed

    // Draw semi-transparent rectangle as background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(textX - textWidth / 2 - 5, textY - textHeight / 2 - 5, textWidth + 10, textHeight + 10);

    // Draw the text
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, textX, textY);
}

// Ensure imageCache is received correctly.

export function render(ctx, pieces, currentPiece, particles, imageCache, config) {
    // Clear the canvas with transparency
    ctx.clearRect(0, 0, config.CANVAS_WIDTH, config.CANVAS_HEIGHT);

    // Draw the 3D container
    draw3DContainer(ctx, imageCache);

    // Draw existing pieces
    for (const piece of pieces) {
        if (piece && piece.physics) {
            drawPiece(ctx, piece, imageCache);
        } else {
            console.error('Invalid piece in pieces array:', piece);
        }
    }

    // Only draw current piece and trajectory if round is not complete
    if (!gameState.isRoundComplete) {
        // Draw trajectory lines
        if (currentPiece && currentPiece.physics) {
            drawTrajectoryLines(ctx, currentPiece, config.aimX, config.aimY, pieces, config);
        }

        // Draw current piece if it's not merging
        if (currentPiece && currentPiece.physics && !currentPiece.merging) {
            drawPiece(ctx, currentPiece, imageCache);
        }
    }

    // Draw particles
    for (const particle of particles) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color + Math.floor(particle.life * 255).toString(16).padStart(2, '0');
        ctx.fill();
    }

    // Draw spawn indicator
    drawSpawnIndicator(ctx, config);

    // Draw boundaries
    drawBoundaries(ctx, config);

    // Draw walls
    drawWalls(ctx, LEFT_WALL, RIGHT_WALL);

    // Draw tooltip if a piece is hovered
    if (gameState.hoveredPiece) {
        drawTooltip(ctx, gameState.hoveredPiece);
    }

    // Draw next piece
    if (gameState.nextPiece) {
        const nextPieceContainer = document.getElementById('next-piece-container');

        // Reuse the canvas if it already exists
        let canvas = nextPieceContainer.querySelector('canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.width = 80;
            canvas.height = 80;
            nextPieceContainer.appendChild(canvas);
        }
        const nextPieceCtx = canvas.getContext('2d');
        nextPieceCtx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous content

        // Adjust the visual size for the preview
        const previewPiece = { ...gameState.nextPiece };
        previewPiece.visual = { ...previewPiece.visual };
        previewPiece.visual.width = 60; // Adjust as needed
        previewPiece.visual.height = 60; // Adjust as needed
        previewPiece.visual.rotation = 0; // Optional: Reset rotation for preview

        // Draw the piece at the center of the canvas
        drawPiece(nextPieceCtx, previewPiece, imageCache, canvas.width / 2, canvas.height / 2);
    } else {
        // Clear the next piece container when there's no next piece
        const nextPieceContainer = document.getElementById('next-piece-container');
        const canvas = nextPieceContainer.querySelector('canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    // Draw deck count
    drawDeckCount(ctx, gameState.activeDeck.length);

    // Draw tooltip for current piece and next piece
    if (gameState.hoveredPiece === gameState.currentPiece || gameState.hoveredPiece === gameState.nextPiece) {
        drawTooltip(ctx, gameState.hoveredPiece, gameState.mouseX, gameState.mouseY);
    }
}

function drawSpawnIndicator(ctx, config) {
    ctx.beginPath();
    ctx.moveTo(config.CANVAS_WIDTH / 2 - 15, config.SPAWN_Y - 15);
    ctx.lineTo(config.CANVAS_WIDTH / 2, config.SPAWN_Y);
    ctx.lineTo(config.CANVAS_WIDTH / 2 + 15, config.SPAWN_Y - 15);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
}

export function drawBoundaries(ctx, config) {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, config.CANVAS_WIDTH, config.CANVAS_HEIGHT);
}

// New function to draw force vectors
function drawForces(ctx, piece) {
    ctx.save();
    ctx.strokeStyle = 'red';
    ctx.fillStyle = 'red';
    ctx.lineWidth = 2;
    
    // Starting point at the center of the piece
    const originX = piece.x;
    const originY = piece.y;
    
    piece.forces.forEach(force => {
        const forceScale = 0.05; // Adjust scale for visibility
        const endX = originX + force.x * forceScale;
        const endY = originY + force.y * forceScale;
        
        // Draw force vector line
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Draw arrowhead
        const angle = Math.atan2(endY - originY, endX - originX);
        const arrowLength = 10;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - arrowLength * Math.cos(angle - Math.PI / 6), endY - arrowLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(endX - arrowLength * Math.cos(angle + Math.PI / 6), endY - arrowLength * Math.sin(angle + Math.PI / 6));
        ctx.lineTo(endX, endY);
        ctx.fill();
    });

    ctx.restore();
}

// Update the drawContainer function to drawWalls
export function drawWalls(ctx, leftWall, rightWall) {
    ctx.save();
    ctx.fillStyle = CONTAINER.color;
    
    // // Draw left wall
    // ctx.fillRect(leftWall.x, leftWall.y, leftWall.width, leftWall.height);
    
    // // Draw right wall
    // ctx.fillRect(rightWall.x, rightWall.y, rightWall.width, rightWall.height);
    
    ctx.restore();
}

export function drawTooltip(ctx, piece) {
    if (!piece) return;

    ctx.save(); // Save the context state

    const tooltipWidth = 250;
    const tooltipHeight = 140;
    const tooltipPadding = 12;
    const lineHeight = 20;

    // Position the tooltip in the bottom-left corner
    const tooltipX = tooltipPadding;
    const tooltipY = CANVAS_HEIGHT - tooltipHeight - tooltipPadding;

    // Draw tooltip background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8);
    ctx.fill();
    ctx.stroke();

    // Draw title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(piece.name, tooltipX + tooltipPadding, tooltipY + tooltipPadding);

    // Draw separator line
    ctx.strokeStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(tooltipX + tooltipPadding, tooltipY + 40);
    ctx.lineTo(tooltipX + tooltipWidth - tooltipPadding, tooltipY + 40);
    ctx.stroke();

    // Draw tooltip content
    ctx.font = '14px Arial';
    let currentY = tooltipY + 50;

    // Draw Ability (allowing multiple lines)
    const abilityText = piece.abilities ? piece.abilities[0] : 'None';
    currentY = drawMultilineText(ctx, 'Ability:', abilityText, tooltipX + tooltipPadding, currentY, tooltipWidth - 2 * tooltipPadding, lineHeight);

    // Draw Value
    currentY = drawTooltipLine(ctx, 'Value:', piece.attributes.value.toString(), tooltipX + tooltipPadding, currentY + 5, tooltipWidth - 2 * tooltipPadding);

    // Draw Next Evolution
    const family = CHARACTER_FAMILIES[piece.family];
    if (family && family.evolutionChain) {
        const currentIndex = family.evolutionChain.findIndex(evolution => evolution.name === piece.name);
        let nextEvolution = 'Max Level';
        if (currentIndex !== -1 && currentIndex < family.evolutionChain.length - 1) {
            nextEvolution = family.evolutionChain[currentIndex + 1].name;
        }
        drawTooltipLine(ctx, 'Next Evolution:', nextEvolution, tooltipX + tooltipPadding, currentY + 5, tooltipWidth - 2 * tooltipPadding);
    }

    ctx.restore(); // Restore the context state
}

function drawTooltipLine(ctx, label, value, x, y, maxWidth) {
    ctx.fillStyle = '#FFD700';
    ctx.fillText(label, x, y);
    
    const labelWidth = ctx.measureText(label).width;
    const valueX = x + labelWidth + 5;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(value, valueX, y);
    
    return y + 20; // Return the Y position for the next line
}

function drawMultilineText(ctx, label, text, x, y, maxWidth, lineHeight) {
    ctx.fillStyle = '#FFD700';
    ctx.fillText(label, x, y);
    
    ctx.fillStyle = '#FFFFFF';
    const words = text.split(' ');
    let line = '';
    let currentY = y + lineHeight;

    for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && line !== '') {
            ctx.fillText(line, x, currentY);
            line = word + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, currentY);

    return currentY + lineHeight; // Return the Y position for the next section
}

function drawTooltips(ctx) {
    // Left tooltip area
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, (CANVAS_WIDTH - GAME_AREA_WIDTH) / 2, CANVAS_HEIGHT);

    // Right tooltip area
    ctx.fillRect(CANVAS_WIDTH - (CANVAS_WIDTH - GAME_AREA_WIDTH) / 2, 0, (CANVAS_WIDTH - GAME_AREA_WIDTH) / 2, CANVAS_HEIGHT);

    // TODO: Add actual tooltip content here
}

function draw3DContainer(ctx, imageCache) {
    const leftX = (CANVAS_WIDTH - CONTAINER_WIDTH) / 2;
    const rightX = (CANVAS_WIDTH + CONTAINER_WIDTH) / 2;
    const containerHeight = CANVAS_HEIGHT * 0.6;
    const containerWidth = CONTAINER_WIDTH;
    const topY = CANVAS_HEIGHT - containerHeight;
    const bottomY = CANVAS_HEIGHT;
    const boxAdjustmentX = 30;
    const boxAdjustmentY = 20;

    // Refined colors with more distinct gradients
    const frontFaceColor = 'rgba(255, 150, 150, 0.85)'; // Increased opacity
    const bottomGradient = ctx.createLinearGradient(leftX, bottomY, leftX, bottomY - boxAdjustmentY);
    bottomGradient.addColorStop(0, 'rgba(239, 107, 118, 1)');
    bottomGradient.addColorStop(1, 'rgba(199, 67, 78, 1)');

    const leftSideGradient = ctx.createLinearGradient(leftX, topY, leftX + boxAdjustmentX, topY - boxAdjustmentY);
    leftSideGradient.addColorStop(0, 'rgba(255, 195, 190, 0.5)');
    leftSideGradient.addColorStop(1, 'rgba(215, 85, 80, 0.5)');

    const rightSideGradient = ctx.createLinearGradient(rightX, topY, rightX - boxAdjustmentX, topY - boxAdjustmentY);
    rightSideGradient.addColorStop(0, 'rgba(255, 195, 190, 0.5)');
    rightSideGradient.addColorStop(1, 'rgba(215, 85, 80, 0.5)');

    // Draw back face (base) with less transparency
    ctx.save();
    ctx.fillStyle = frontFaceColor;
    ctx.fillRect(leftX + boxAdjustmentX, topY - boxAdjustmentY, containerWidth - (boxAdjustmentX * 2), containerHeight);
    ctx.restore();

    // Draw bottom face with gradient
    ctx.save();
    ctx.fillStyle = bottomGradient;
    ctx.fillRect(leftX + boxAdjustmentX, bottomY - boxAdjustmentY, containerWidth - (boxAdjustmentX * 2), boxAdjustmentY);
    ctx.restore();

    // Draw left side bottom triangle with distinct color
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(leftX, bottomY);
    ctx.lineTo(leftX + boxAdjustmentX, bottomY - boxAdjustmentY);
    ctx.lineTo(leftX + boxAdjustmentX, bottomY);
    ctx.closePath();
    ctx.fillStyle = bottomGradient;
    ctx.fill();

    // Draw right side bottom triangle with distinct color
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(rightX, bottomY);
    ctx.lineTo(rightX - boxAdjustmentX, bottomY - boxAdjustmentY);
    ctx.lineTo(rightX - boxAdjustmentX, bottomY);
    ctx.closePath();
    ctx.fillStyle = bottomGradient;
    ctx.fill();
    ctx.restore();

    // Draw left side with enhanced gradient
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(leftX, topY);
    ctx.lineTo(leftX + boxAdjustmentX, topY - boxAdjustmentY);
    ctx.lineTo(leftX + boxAdjustmentX, bottomY - boxAdjustmentY);
    ctx.lineTo(leftX, bottomY);
    ctx.closePath();
    ctx.fillStyle = leftSideGradient;
    ctx.fill();
    ctx.restore();

    // Draw right side wall with the same gradient for symmetry
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(rightX, topY);
    ctx.lineTo(rightX - boxAdjustmentX, topY - boxAdjustmentY);
    ctx.lineTo(rightX - boxAdjustmentX, bottomY - boxAdjustmentY);
    ctx.lineTo(rightX, bottomY);
    ctx.closePath();
    ctx.fillStyle = rightSideGradient;
    ctx.fill();
    ctx.restore();

    // Draw top-front edge with subtle highlights
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(leftX, topY);
    ctx.lineTo(rightX, topY); // Top-front edge
    ctx.stroke();
    ctx.restore();


    // Draw top-front and back edges with subtle highlights
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(leftX + boxAdjustmentX, topY - boxAdjustmentY);
    ctx.lineTo(rightX - boxAdjustmentX, topY - boxAdjustmentY); // Top-back edge
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(leftX, topY);
    ctx.lineTo(rightX, topY); // Top-front edge
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(leftX, topY);
    ctx.lineTo(leftX + boxAdjustmentX, topY - boxAdjustmentY); // Top-front edge
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rightX, topY);
    ctx.lineTo(rightX - boxAdjustmentX, topY - boxAdjustmentY); // Top-front edge
    ctx.stroke();
    ctx.restore();

    // Smooth the edges and add shadow for depth
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(leftX, bottomY);
    ctx.lineTo(rightX, bottomY); // Bottom-front edge
    ctx.stroke();
    ctx.restore();

    // Add inner shadows for a polished look around vertical edges
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(leftX, bottomY);
    ctx.lineTo(leftX, topY); // Left vertical edge
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rightX, bottomY);
    ctx.lineTo(rightX, topY); // Right vertical edge
    ctx.stroke();
    ctx.restore();
}

export function drawGameTip(ctx, tip) {
    ctx.save(); // Save the context state

    const tipX = CANVAS_WIDTH * 0.775;
    const tipY = CANVAS_HEIGHT * 0.45;
    const tipWidth = 300;
    const tipHeight = 130;

    // Draw tip background with gradient and shadow for a professional look
    const gradient = ctx.createLinearGradient(tipX, tipY, tipX + tipWidth, tipY + tipHeight);
    gradient.addColorStop(0, 'rgba(1, 1, 1, 0.9)');
    gradient.addColorStop(1, 'rgba(50, 50, 50, 0.9)');
    ctx.fillStyle = gradient;
    ctx.fillRect(tipX, tipY, tipWidth, tipHeight);

    // Add shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    // Draw border with a more vibrant color
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.strokeRect(tipX, tipY, tipWidth, tipHeight);

    // Draw tip title
    ctx.fillStyle = '#4CAF50';
    ctx.font = '16px "Press Start 2P", cursive';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('BOOP\'S GAME BITS', tipX + 20, tipY + 20);

    // Draw tip icon (light bulb Unicode character)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';
    ctx.fillText('💡', tipX + 20, tipY + 70);

    // Draw tip text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Word wrap the tip text
    const words = tip.split(' ');
    let lines = [];
    let line = '';
    for (let word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > tipWidth - 60) {
            lines.push(line);
            line = word + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    // Calculate the total height of the text
    const lineHeight = 24;
    const textHeight = lines.length * lineHeight;

    // Calculate the starting Y position to center the text vertically
    const textStartY = tipY + (tipHeight - textHeight) / 2 + 20;

    // Draw the text lines
    lines.forEach((line, index) => {
        ctx.fillText(line, tipX + 50, textStartY + index * lineHeight);
    });

    ctx.restore(); // Restore the context state
}