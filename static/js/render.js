// render.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, FRICTION, BOUNCE_FACTOR, CONTAINER, POWER_SCALING_FACTOR, POWER_MULTIPLIER } from './config.js';
// Existing drawPiece function with updates to handle features and added debug logs
export function drawPiece(ctx, piece, imageCache) {
    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.scale(piece.animationScale || 1, piece.animationScale || 1);
    ctx.rotate(piece.rotation);

    // Special handling for the container
    if (piece.name === "Container") {
        drawContainer(ctx, piece);
        ctx.restore();
        return;
    }

    // Iterate over each feature and draw it
    if (piece.features && Array.isArray(piece.features)) {
        piece.features.forEach((feature) => {
            const key = `${piece.name}_${feature.type}`;
            const featureImg = imageCache[key];

            if (featureImg) {
                if (featureImg.complete) {
                    const posX = feature.position.x;
                    const posY = feature.position.y;

                    // Use feature.size if defined, else calculate based on radius and aspect ratio
                    let drawWidth = feature.widthFactor * piece.attributes.radius * 2;
                    let drawHeight = feature.heightFactor * piece.attributes.radius * 2;

                    // Maintain aspect ratio if width and height are not both defined
                    if (!feature.width || !feature.height) {
                        const aspectRatio = featureImg.naturalWidth / featureImg.naturalHeight;
                        if (aspectRatio > 1) {
                            drawHeight = drawWidth / aspectRatio;
                        } else if (aspectRatio < 1) {
                            drawWidth = drawHeight * aspectRatio;
                        }
                    }

                    ctx.drawImage(
                        featureImg,
                        posX - drawWidth / 2, 
                        posY - drawHeight / 2, 
                        drawWidth, 
                        drawHeight
                    );
                } else {
                    console.warn(`Feature image for ${feature.type} of ${piece.name} is not loaded yet.`);
                }
            } else {
                console.warn(`Feature image not found in imageCache with key: ${key} for ${piece.name}`);
            }
        });
    } else {
        console.log(`No features to draw for ${piece.name}.`);
    }

    // Clipping path for the main body/head
    ctx.beginPath();
    ctx.arc(0, 0, piece.attributes.radius, 0, Math.PI * 2);
    ctx.clip();

    // Draw face image
    const faceKey = `${piece.name}_face`;
    const faceImg = imageCache[faceKey];

    if (faceImg) {
        if (faceImg.complete) {
            ctx.drawImage(
                faceImg, 
                -piece.attributes.radius, 
                -piece.attributes.radius, 
                piece.attributes.radius * 2, 
                piece.attributes.radius * 2
            );
        } else {
            console.warn(`Face image for ${piece.name} is not loaded yet.`);
            // Fallback: Draw colored circle
            ctx.beginPath();
            ctx.arc(0, 0, piece.attributes.radius, 0, Math.PI * 2);
            ctx.fillStyle = piece.attributes.color;
            ctx.fill();

            // Draw value number
            ctx.fillStyle = "#000000";
            ctx.font = `${piece.attributes.radius}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(piece.attributes.value, 0, 0);
        }
    } else {
        console.warn(`Face image not found in imageCache with key: ${faceKey} for ${piece.name}`);
        // Fallback: Draw colored circle
        ctx.beginPath();
        ctx.arc(0, 0, piece.attributes.radius, 0, Math.PI * 2);
        ctx.fillStyle = piece.attributes.color;
        ctx.fill();

        // Draw value number
        ctx.fillStyle = "#000000";
        ctx.font = `${piece.attributes.radius}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(piece.attributes.value, 0, 0);
    }

    ctx.restore();
}

export function drawTrajectoryLines(ctx, currentPiece, aimX, aimY, pieces) {
    if (currentPiece) {
        ctx.beginPath();
        ctx.moveTo(currentPiece.x, currentPiece.y);

        let simX = currentPiece.x;
        let simY = currentPiece.y;
        const dx = aimX - currentPiece.x;
        const dy = aimY - currentPiece.y;
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

            if (simY + currentPiece.attributes.radius > CANVAS_HEIGHT ||
                simX - currentPiece.attributes.radius < 0 ||
                simX + currentPiece.attributes.radius > CANVAS_WIDTH) {
                collision = true;
                simX = Math.max(currentPiece.attributes.radius, Math.min(CANVAS_WIDTH - currentPiece.attributes.radius, simX));
                simY = Math.min(CANVAS_HEIGHT - currentPiece.attributes.radius, simY);
            }

            for (const piece of pieces) {
                const dx = simX - piece.x;
                const dy = simY - piece.y;
                const distance = Math.hypot(dx, dy);
                if (distance < currentPiece.attributes.radius + piece.attributes.radius) {
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

// Ensure imageCache is received correctly.

export function render(ctx, pieces, currentPiece, particles, imageCache, config) {
    ctx.clearRect(0, 0, config.CANVAS_WIDTH, config.CANVAS_HEIGHT);

    // Draw trajectory lines
    drawTrajectoryLines(ctx, currentPiece, config.aimX, config.aimY, pieces, config);

    // Draw pieces
    for (const piece of pieces) {
        drawPiece(ctx, piece, imageCache);
        
        // Visualize forces if debug mode is enabled and this is the selected piece
        if (config.debugMode && piece === config.selectedPiece) {
            drawForces(ctx, piece);
        }
    }

    // Draw current piece if it's not merging
    if (currentPiece && !currentPiece.merging) {
        drawPiece(ctx, currentPiece, imageCache);
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

    // Draw container
    drawContainer(ctx, CONTAINER);
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