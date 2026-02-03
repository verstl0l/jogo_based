// ==============================================
// JOGO PIXEL ART SIMPLIFICADO
// ==============================================

// Configurações
const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Constantes de física
const GRAVITY = 0.3;
const JUMP_FORCE = -9;
const MOVE_SPEED = 2.5;
const FRICTION = 0.85;
const PIXEL_SIZE = 4;

// Estado do jogo
let gameState = {
    players: [
        {
            x: 100,
            y: 300,
            width: 16,
            height: 24,
            velocityX: 0,
            velocityY: 0,
            health: 100,
            score: 0,
            color: '#ff0000',
            facing: 'right',
            isOnGround: false,
            jumpCount: 0,
            maxJumps: 2
        },
        {
            x: 500,
            y: 300,
            width: 16,
            height: 24,
            velocityX: 0,
            velocityY: 0,
            health: 100,
            score: 0,
            color: '#0000ff',
            facing: 'left',
            isOnGround: false,
            jumpCount: 0,
            maxJumps: 2
        }
    ],
    platforms: [
        { x: 0, y: 400, width: 300, height: 16 },
        { x: 340, y: 400, width: 300, height: 16 },
        { x: 100, y: 280, width: 80, height: 8 },
        { x: 460, y: 280, width: 80, height: 8 },
        { x: 280, y: 200, width: 80, height: 8 }
    ],
    // Desenhos com física!
    drawings: [],
    // Partículas
    particles: []
};

// Estado do jogador
let myPlayerId = 0;
let keysPressed = {};

// Sistema de desenho (APENAS DESENHO LIVRE)
let isDrawing = false;
let currentColor = '#ff0000';
let currentBrushSize = 4;
let drawingPoints = [];
let lastMouseX = 0;
let lastMouseY = 0;

// Inicialização
function init() {
    setupControls();
    setupCanvas();
    setupDrawing();
    gameLoop();
    
    console.log('🎮 Pixel Fighter Simplificado!');
    console.log('✅ Apenas desenho livre com física!');
}

// Configura controles
function setupControls() {
    // Teclado
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        keysPressed[key] = true;
        
        // Limpar
        if (key === 'c') {
            clearDrawings();
        }
        
        // Ativar desenho
        if (key === ' ') {
            activateDrawing();
        }
        
        // Prevenir scroll com espaço
        if (key === ' ') {
            e.preventDefault();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keysPressed[e.key.toLowerCase()] = false;
    });
    
    // Slider de tamanho
    const brushSlider = document.getElementById('brushSize');
    const brushValue = document.getElementById('brushSizeValue');
    
    brushSlider.addEventListener('input', (e) => {
        currentBrushSize = parseInt(e.target.value);
        brushValue.textContent = currentBrushSize;
    });
}

// Configura sistema de desenho
function setupDrawing() {
    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    
    // Touch events para mobile
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
}

function startDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if (e.type === 'touchstart') {
        const touch = e.touches[0];
        lastMouseX = (touch.clientX - rect.left) * scaleX;
        lastMouseY = (touch.clientY - rect.top) * scaleY;
    } else {
        lastMouseX = (e.clientX - rect.left) * scaleX;
        lastMouseY = (e.clientY - rect.top) * scaleY;
    }
    
    drawingPoints = [{ x: lastMouseX, y: lastMouseY }];
    
    // Desenha o primeiro ponto
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentBrushSize;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(lastMouseX, lastMouseY);
    ctx.lineTo(lastMouseX + 1, lastMouseY + 1);
    ctx.stroke();
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let mouseX, mouseY;
    
    if (e.type === 'touchmove') {
        const touch = e.touches[0];
        mouseX = (touch.clientX - rect.left) * scaleX;
        mouseY = (touch.clientY - rect.top) * scaleY;
    } else {
        mouseX = (e.clientX - rect.left) * scaleX;
        mouseY = (e.clientY - rect.top) * scaleY;
    }
    
    // Adiciona ponto à lista
    drawingPoints.push({ x: mouseX, y: mouseY });
    
    // Desenha preview
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentBrushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(lastMouseX, lastMouseY);
    ctx.lineTo(mouseX, mouseY);
    ctx.stroke();
    
    lastMouseX = mouseX;
    lastMouseY = mouseY;
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    
    // Finaliza o desenho se houver pontos suficientes
    if (drawingPoints.length > 5) {
        createPixelCloud(drawingPoints, currentColor, currentBrushSize);
    }
    
    drawingPoints = [];
}

// Touch handlers
function handleTouchStart(e) {
    e.preventDefault();
    startDrawing(e);
}

function handleTouchMove(e) {
    e.preventDefault();
    draw(e);
}

function handleTouchEnd(e) {
    e.preventDefault();
    stopDrawing();
}

// Cores
function setColor(color) {
    currentColor = color;
    
    // Atualiza cores ativas
    document.querySelectorAll('.pixel-color').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Cria nuvem de pixels (desenho livre)
function createPixelCloud(points, color, brushSize) {
    if (points.length < 5) return;
    
    // Calcula centro da nuvem
    let centerX = 0, centerY = 0;
    for (const point of points) {
        centerX += point.x;
        centerY += point.y;
    }
    centerX /= points.length;
    centerY /= points.length;
    
    const cloud = {
        type: 'cloud',
        x: centerX,
        y: centerY,
        color: color,
        velocityX: 0,
        velocityY: 0,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        pixels: [],
        mass: 0,
        elasticity: 0.4,
        friction: 0.9,
        health: 50 + brushSize * 5,
        isStatic: false
    };
    
    // Cria pixels ao longo dos pontos do desenho
    const pixelSpacing = Math.max(1, Math.floor(brushSize / 3));
    
    for (let i = 0; i < points.length; i += pixelSpacing) {
        const point = points[i];
        const offsetX = point.x - cloud.x;
        const offsetY = point.y - cloud.y;
        
        // Adiciona pixels em um padrão circular (pincel)
        const pixelsToAdd = Math.max(1, Math.floor(brushSize / 2));
        for (let j = 0; j < pixelsToAdd; j++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * brushSize;
            const px = Math.floor((offsetX + Math.cos(angle) * radius) / PIXEL_SIZE) * PIXEL_SIZE;
            const py = Math.floor((offsetY + Math.sin(angle) * radius) / PIXEL_SIZE) * PIXEL_SIZE;
            
            // Evita pixels duplicados muito próximos
            const isDuplicate = cloud.pixels.some(p => 
                Math.abs(p.x - px) < PIXEL_SIZE && Math.abs(p.y - py) < PIXEL_SIZE
            );
            
            if (!isDuplicate) {
                const alpha = 0.7 + Math.random() * 0.3;
                cloud.pixels.push({
                    x: px,
                    y: py,
                    color: color,
                    alpha: alpha
                });
                cloud.mass += 0.01 * alpha;
            }
        }
    }
    
    // Remove nuvens muito pequenas
    if (cloud.pixels.length < 5) {
        return null;
    }
    
    gameState.drawings.push(cloud);
    
    // Efeito visual
    createPixelEffect(cloud.x, cloud.y, color);
    
    return cloud;
}

// Ativa desenho como arma
function activateDrawing() {
    const player = gameState.players[myPlayerId];
    
    // Procura o desenho mais próximo do jogador
    let closestDrawing = null;
    let closestDistance = Infinity;
    
    gameState.drawings.forEach(drawing => {
        if (!drawing.isStatic) {
            const dx = drawing.x - (player.x + player.width / 2);
            const dy = drawing.y - (player.y + player.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100 && distance < closestDistance) {
                closestDistance = distance;
                closestDrawing = drawing;
            }
        }
    });
    
    if (closestDrawing) {
        // Aplica força ao desenho
        const force = 10;
        closestDrawing.velocityX = (player.facing === 'right' ? force : -force);
        closestDrawing.velocityY = -force * 0.3;
        closestDrawing.rotationSpeed = (player.facing === 'right' ? 0.1 : -0.1);
        
        // Efeito visual
        createPixelEffect(player.x + player.width / 2, player.y + player.height / 2, player.color);
    }
}

// Cria plataforma estática
function createPlatform() {
    const player = gameState.players[myPlayerId];
    
    const platform = {
        type: 'platform',
        x: player.x + (player.facing === 'right' ? 40 : -40),
        y: player.y - 20,
        width: 60,
        height: 12,
        color: '#888888',
        isStatic: true,
        health: 100,
        pixels: []
    };
    
    // Gera pixels da plataforma
    for (let px = -platform.width / 2; px < platform.width / 2; px += PIXEL_SIZE) {
        for (let py = -platform.height / 2; py < platform.height / 2; py += PIXEL_SIZE) {
            platform.pixels.push({
                x: Math.floor(px / PIXEL_SIZE) * PIXEL_SIZE,
                y: Math.floor(py / PIXEL_SIZE) * PIXEL_SIZE,
                color: platform.color,
                alpha: 1
            });
        }
    }
    
    gameState.drawings.push(platform);
    createPixelEffect(platform.x, platform.y, platform.color);
}

// Física dos desenhos
function updateDrawingsPhysics() {
    for (let i = gameState.drawings.length - 1; i >= 0; i--) {
        const drawing = gameState.drawings[i];
        if (drawing.isStatic) continue;
        
        // Aplica gravidade
        drawing.velocityY += GRAVITY * drawing.mass;
        
        // Aplica atrito
        drawing.velocityX *= drawing.friction;
        drawing.velocityY *= drawing.friction;
        
        // Atualiza posição
        drawing.x += drawing.velocityX;
        drawing.y += drawing.velocityY;
        
        // Rotação
        drawing.rotation += drawing.rotationSpeed || 0;
        
        // Colisão com plataformas
        let onGround = false;
        
        for (const platform of gameState.platforms) {
            // Para desenhos (aproximação por bounding box)
            const size = Math.max(20, drawing.pixels.length * 0.5);
            const left = drawing.x - size;
            const right = drawing.x + size;
            const top = drawing.y - size;
            const bottom = drawing.y + size;
            
            if (right > platform.x && left < platform.x + platform.width &&
                bottom > platform.y && top < platform.y + platform.height) {
                
                // Calcula overlap
                const overlapX = Math.min(right - platform.x, platform.x + platform.width - left);
                const overlapY = Math.min(bottom - platform.y, platform.y + platform.height - top);
                
                // Resolve pela menor overlap
                if (overlapX < overlapY) {
                    if (drawing.x < platform.x + platform.width / 2) {
                        drawing.x = platform.x - size;
                    } else {
                        drawing.x = platform.x + platform.width + size;
                    }
                    drawing.velocityX = -drawing.velocityX * drawing.elasticity;
                } else {
                    if (drawing.y < platform.y + platform.height / 2) {
                        drawing.y = platform.y - size;
                        drawing.velocityY = -drawing.velocityY * drawing.elasticity;
                        onGround = true;
                    } else {
                        drawing.y = platform.y + platform.height + size;
                        drawing.velocityY = -drawing.velocityY * drawing.elasticity;
                    }
                }
            }
        }
        
        // Colisão com bordas
        const drawingSize = Math.max(20, drawing.pixels.length * 0.5);
        if (drawing.x < drawingSize) {
            drawing.x = drawingSize;
            drawing.velocityX = -drawing.velocityX * drawing.elasticity;
        }
        if (drawing.x > canvas.width - drawingSize) {
            drawing.x = canvas.width - drawingSize;
            drawing.velocityX = -drawing.velocityX * drawing.elasticity;
        }
        if (drawing.y > canvas.height - drawingSize) {
            drawing.y = canvas.height - drawingSize;
            drawing.velocityY = -drawing.velocityY * drawing.elasticity;
            onGround = true;
        }
        if (drawing.y < drawingSize) {
            drawing.y = drawingSize;
            drawing.velocityY = -drawing.velocityY * drawing.elasticity;
        }
        
        // Colisão entre desenhos (simplificada)
        for (let j = i + 1; j < gameState.drawings.length; j++) {
            const other = gameState.drawings[j];
            if (other.isStatic) continue;
            
            const dx = other.x - drawing.x;
            const dy = other.y - drawing.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = 30; // Distância mínima para colisão
            
            if (distance < minDistance && distance > 0) {
                // Colisão detectada
                const normalX = dx / distance;
                const normalY = dy / distance;
                
                // Move para fora
                const overlap = (minDistance - distance) / 2;
                drawing.x -= normalX * overlap;
                drawing.y -= normalY * overlap;
                other.x += normalX * overlap;
                other.y += normalY * overlap;
                
                // Troca de velocidade (colisão elástica simplificada)
                const elasticity = Math.min(drawing.elasticity, other.elasticity);
                const tempVX = drawing.velocityX;
                const tempVY = drawing.velocityY;
                
                drawing.velocityX = other.velocityX * elasticity;
                drawing.velocityY = other.velocityY * elasticity;
                other.velocityX = tempVX * elasticity;
                other.velocityY = tempVY * elasticity;
                
                // Dano por colisão
                drawing.health -= 2;
                other.health -= 2;
                
                // Efeito de colisão
                if (drawing.health < 0 || other.health < 0) {
                    createExplosion((drawing.x + other.x) / 2, (drawing.y + other.y) / 2, drawing.color);
                }
            }
        }
        
        // Remove desenhos com pouca saúde ou fora da tela
        if (drawing.health <= 0 || drawing.y > canvas.height + 100) {
            createExplosion(drawing.x, drawing.y, drawing.color);
            gameState.drawings.splice(i, 1);
        }
    }
}

// Física do jogador
function updatePlayerPhysics() {
    const player = gameState.players[myPlayerId];
    
    // Controles
    player.velocityX *= FRICTION;
    
    if (keysPressed['a'] || keysPressed['arrowleft']) {
        player.velocityX = -MOVE_SPEED;
        player.facing = 'left';
    }
    if (keysPressed['d'] || keysPressed['arrowright']) {
        player.velocityX = MOVE_SPEED;
        player.facing = 'right';
    }
    
    // Correr
    if (keysPressed['shift']) {
        player.velocityX *= 1.5;
    }
    
    // Pulo
    if ((keysPressed['w'] || keysPressed['arrowup']) && player.jumpCount < player.maxJumps) {
        player.velocityY = JUMP_FORCE;
        player.isOnGround = false;
        player.jumpCount++;
        createPixelEffect(player.x + player.width/2, player.y + player.height, '#ffffff');
    }
    
    // Agachar
    if (keysPressed['s'] || keysPressed['arrowdown']) {
        player.height = 16;
    } else {
        player.height = 24;
    }
    
    // Gravidade
    player.velocityY += GRAVITY;
    
    // Movimento
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // Colisão com plataformas
    player.isOnGround = false;
    
    gameState.platforms.forEach(platform => {
        if (player.x + player.width > platform.x &&
            player.x < platform.x + platform.width &&
            player.y + player.height > platform.y &&
            player.y + player.height < platform.y + platform.height + player.velocityY) {
            
            player.y = platform.y - player.height;
            player.velocityY = 0;
            player.isOnGround = true;
            player.jumpCount = 0;
        }
    });
    
    // Colisão com desenhos
    for (let i = gameState.drawings.length - 1; i >= 0; i--) {
        const drawing = gameState.drawings[i];
        
        if (drawing.isStatic) {
            // Colisão com plataformas criadas
            const halfWidth = (drawing.width || 30) / 2;
            const halfHeight = (drawing.height || 30) / 2;
            
            if (player.x + player.width > drawing.x - halfWidth &&
                player.x < drawing.x + halfWidth &&
                player.y + player.height > drawing.y - halfHeight &&
                player.y + player.height < drawing.y + halfHeight + player.velocityY) {
                
                player.y = drawing.y - halfHeight - player.height;
                player.velocityY = 0;
                player.isOnGround = true;
                player.jumpCount = 0;
            }
        } else {
            // Colisão com desenhos físicos
            const dx = (player.x + player.width/2) - drawing.x;
            const dy = (player.y + player.height/2) - drawing.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = player.width/2 + 25; // Raio aproximado
            
            if (distance < minDistance) {
                // Empurra o jogador
                const force = 5;
                player.velocityX += (dx / distance) * force;
                player.velocityY += (dy / distance) * force;
                
                // Dano ao desenho
                drawing.health -= 10;
                
                // Efeito visual
                createHitEffect(player.x + player.width/2, player.y + player.height/2);
                
                // Remove desenho se destruído
                if (drawing.health <= 0) {
                    createExplosion(drawing.x, drawing.y, drawing.color);
                    gameState.drawings.splice(i, 1);
                    
                    // Pontuação
                    player.score += 10;
                }
            }
        }
    }
    
    // Limites da tela
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    if (player.y > canvas.height) {
        player.y = 300;
        player.velocityY = 0;
        player.health -= 10;
        if (player.health < 0) player.health = 0;
    }
    
    // Atualiza IA do segundo jogador
    updateAI();
}

// IA do segundo jogador
function updateAI() {
    const ai = gameState.players[1];
    const player = gameState.players[0];
    
    // Movimento aleatório
    if (Math.random() < 0.02) {
        ai.velocityX = (Math.random() - 0.5) * MOVE_SPEED * 2;
    }
    
    // Pulo aleatório
    if (Math.random() < 0.01 && ai.isOnGround) {
        ai.velocityY = JUMP_FORCE;
        ai.isOnGround = false;
    }
    
    // Seguir jogador
    const dx = player.x - ai.x;
    if (Math.abs(dx) > 50) {
        ai.velocityX = Math.sign(dx) * MOVE_SPEED;
        ai.facing = dx > 0 ? 'right' : 'left';
    }
    
    // Atacar com desenhos próximos
    if (Math.random() < 0.005) {
        activateDrawing();
    }
    
    // Aplica física básica
    ai.velocityY += GRAVITY;
    ai.x += ai.velocityX;
    ai.y += ai.velocityY;
    
    // Colisão simples
    gameState.platforms.forEach(platform => {
        if (ai.x + ai.width > platform.x &&
            ai.x < platform.x + platform.width &&
            ai.y + ai.height > platform.y &&
            ai.y + ai.height < platform.y + platform.height + ai.velocityY) {
            
            ai.y = platform.y - ai.height;
            ai.velocityY = 0;
            ai.isOnGround = true;
        }
    });
}

// Sistema de partículas
function createPixelEffect(x, y, color) {
    for (let i = 0; i < 8; i++) {
        gameState.particles.push({
            x: x,
            y: y,
            velocityX: (Math.random() - 0.5) * 4,
            velocityY: (Math.random() - 0.5) * 4,
            color: color,
            size: Math.random() * 2 + 1,
            life: 0.5
        });
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 20; i++) {
        gameState.particles.push({
            x: x,
            y: y,
            velocityX: (Math.random() - 0.5) * 8,
            velocityY: (Math.random() - 0.5) * 8,
            color: color,
            size: Math.random() * 3 + 1,
            life: 1
        });
    }
}

function createHitEffect(x, y) {
    for (let i = 0; i < 10; i++) {
        gameState.particles.push({
            x: x,
            y: y,
            velocityX: (Math.random() - 0.5) * 5,
            velocityY: (Math.random() - 0.5) * 5,
            color: '#ff0000',
            size: Math.random() * 2 + 1,
            life: 0.3
        });
    }
}

function updateParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        
        p.x += p.velocityX;
        p.y += p.velocityY;
        p.velocityY += GRAVITY * 0.1;
        p.life -= 1/60;
        
        if (p.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}

// Configura canvas pixelado
function setupCanvas() {
    // Força pixelação
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
    canvas.width = canvas.width;
    canvas.height = canvas.height;
}

// Renderização pixelada
function drawGame() {
    // Fundo
    ctx.fillStyle = '#162447';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grid de fundo sutil
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += PIXEL_SIZE * 4) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += PIXEL_SIZE * 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Desenha plataformas
    ctx.fillStyle = '#34495e';
    gameState.platforms.forEach(platform => {
        // Sombra
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(platform.x + 2, platform.y + 2, platform.width, platform.height);
        
        // Plataforma
        ctx.fillStyle = '#34495e';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Detalhes pixelados
        ctx.fillStyle = '#2c3e50';
        for (let i = 0; i < platform.width; i += PIXEL_SIZE * 2) {
            ctx.fillRect(platform.x + i, platform.y, PIXEL_SIZE, PIXEL_SIZE);
        }
    });
    
    // Desenha desenhos com física
    gameState.drawings.forEach(drawing => {
        ctx.save();
        ctx.translate(drawing.x, drawing.y);
        ctx.rotate(drawing.rotation || 0);
        
        // Desenha pixels
        drawing.pixels.forEach(pixel => {
            ctx.globalAlpha = pixel.alpha || 1;
            ctx.fillStyle = pixel.color;
            
            // Desenha pixel
            ctx.fillRect(pixel.x, pixel.y, PIXEL_SIZE, PIXEL_SIZE);
            
            // Borda escura para dar profundidade
            if (pixel.alpha > 0.8) {
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = '#000';
                ctx.fillRect(pixel.x, pixel.y, PIXEL_SIZE, 1);
                ctx.fillRect(pixel.x, pixel.y, 1, PIXEL_SIZE);
                ctx.globalAlpha = pixel.alpha;
            }
        });
        
        ctx.restore();
    });
    
    // Desenha partículas
    gameState.particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        
        // Partículas pixeladas
        const px = Math.floor(p.x / PIXEL_SIZE) * PIXEL_SIZE;
        const py = Math.floor(p.y / PIXEL_SIZE) * PIXEL_SIZE;
        
        ctx.fillRect(px, py, Math.max(1, Math.floor(p.size)), Math.max(1, Math.floor(p.size)));
        ctx.globalAlpha = 1;
    });
    
    // Desenha jogadores
    gameState.players.forEach((player, index) => {
        // Corpo pixelado
        ctx.fillStyle = player.color;
        
        // Desenha retângulo principal
        const x = Math.floor(player.x);
        const y = Math.floor(player.y);
        ctx.fillRect(x, y, player.width, player.height);
        
        // Detalhes pixelados no corpo
        ctx.fillStyle = index === 0 ? '#cc0000' : '#0000cc';
        for (let px = 0; px < player.width; px += PIXEL_SIZE * 2) {
            for (let py = 0; py < player.height; py += PIXEL_SIZE * 2) {
                ctx.fillRect(x + px, y + py, PIXEL_SIZE, PIXEL_SIZE);
            }
        }
        
        // Cabeça
        ctx.fillStyle = index === 0 ? '#ff6666' : '#6666ff';
        const headX = Math.floor(player.x + player.width/2 - 8);
        const headY = Math.floor(player.y - 8);
        ctx.fillRect(headX, headY, 16, 8);
        
        // Olhos
        ctx.fillStyle = '#ffffff';
        const eyeOffset = player.facing === 'right' ? 2 : -2;
        ctx.fillRect(headX + 4 + eyeOffset, headY + 2, 3, 3);
        ctx.fillRect(headX + 9 + eyeOffset, headY + 2, 3, 3);
        
        // Indicador do jogador local
        if (index === myPlayerId) {
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(headX + 6, headY - 4, 4, 4);
        }
    });
}

// Atualiza interface
function updateUI() {
    gameState.players.forEach((player, index) => {
        document.getElementById(`player${index + 1}-health`).style.width = `${player.health}%`;
        document.getElementById(`player${index + 1}-score`).textContent = `PONTOS: ${player.score.toString().padStart(3, '0')}`;
    });
}

// Limpa desenhos
function clearDrawings() {
    gameState.drawings = [];
    createPixelEffect(canvas.width/2, canvas.height/2, '#ffffff');
}

// Sistema de mensagens
function showMessage(title, text) {
    document.getElementById('messageTitle').textContent = title;
    document.getElementById('messageText').textContent = text;
    document.getElementById('gameMessage').style.display = 'block';
}

function hideMessage() {
    document.getElementById('gameMessage').style.display = 'none';
}

// Loop principal
function gameLoop() {
    updateDrawingsPhysics();
    updatePlayerPhysics();
    updateParticles();
    drawGame();
    updateUI();
    
    // Verifica vitória
    gameState.players.forEach((player, index) => {
        if (player.health <= 0) {
            const winnerIndex = 1 - index;
            gameState.players[winnerIndex].score += 100;
            showMessage('VITÓRIA!', `JOGADOR ${winnerIndex + 1} VENCEU!`);
            
            // Reseta
            setTimeout(() => {
                gameState.players.forEach(p => {
                    p.health = 100;
                    p.x = p === gameState.players[0] ? 100 : 500;
                    p.y = 300;
                });
                hideMessage();
            }, 2000);
        }
    });
    
    requestAnimationFrame(gameLoop);
}

// Inicia o jogo quando a página carrega
window.onload = init;