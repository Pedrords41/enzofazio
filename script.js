const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const wallHpContainer = document.getElementById('wallHpContainer');
const wallHpBar = document.getElementById('wallHpBar');
const loginScreen = document.getElementById('loginScreen');
const loginForm = document.getElementById('loginForm');
const hud = document.getElementById('hud');
const scoreValue = document.getElementById('scoreValue');
const crosshair = document.getElementById('customCrosshair');
const weaponContainer = document.getElementById('weaponContainer');
const muzzleFlash = document.querySelector('.muzzle-flash');

let currentPhase = 'WALL'; // Fases: 'WALL', 'LOGIN', 'GAME'
let score = 0;

// Ajustar tamanho do canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Move a mira customizada perfeitamente centralizada
let mouseX = 0, mouseY = 0;
window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    crosshair.style.left = `${mouseX}px`;
    crosshair.style.top = `${mouseY}px`;
});

/* =========================================================================
   FASE 1: MURO COM TREMOR EXCLUSIVO NO CLIQUE/METRALHADORA
   ========================================================================= */
const brickRows = 6;  
const brickCols = 8;  
let bricks = [];
let maxHp = brickRows * brickCols;
let currentHp = maxHp;

const brickWidth = canvas.width / brickCols;
const brickHeight = canvas.height / brickRows;
const brickColors = ['#1f2326', '#292e33', '#171a1c'];

function createWall() {
    bricks = [];
    for (let r = 0; r < brickRows; r++) {
        for (let c = 0; c < brickCols; c++) {
            bricks.push({
                x: c * brickWidth, y: r * brickHeight, w: brickWidth, h: brickHeight,
                color: brickColors[(r + c) % brickColors.length], isBroken: false,
                vx: 0, vy: 0, gravity: 0.4, rotation: 0, vRotation: 0, opacity: 1
            });
        }
    }
}
createWall();

let particles = [];
function createParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 2,
            size: Math.random() * 4 + 2,
            color: color, alpha: 1
        });
    }
}

// Metralhadora da parede
let isShootingWall = false;
let wallShootInterval = null;

window.addEventListener('mousedown', () => {
    if (currentPhase !== 'WALL') return;
    isShootingWall = true;
    
    // Liga o tremor imediatamente ao clicar na fase do muro
    document.body.classList.add('shake');
    
    fireWallBullet();
    if (!wallShootInterval) wallShootInterval = setInterval(fireWallBullet, 80);
});

const stopShootingWall = () => {
    isShootingWall = false;
    clearInterval(wallShootInterval);
    wallShootInterval = null;
    // Desliga o tremor assim que soltar o mouse na fase do muro
    document.body.classList.remove('shake');
};
window.addEventListener('mouseup', stopShootingWall);
window.addEventListener('mouseleave', stopShootingWall);

function fireWallBullet() {
    if (currentHp <= 0 || !isShootingWall || currentPhase !== 'WALL') {
        stopShootingWall();
        return;
    }
    const recoilX = mouseX + (Math.random() - 0.5) * 15;
    const recoilY = mouseY + (Math.random() - 0.5) * 15;
    createParticles(recoilX, recoilY, '#ff4655');

    bricks.forEach(brick => {
        if (!brick.isBroken && recoilX >= brick.x && recoilX <= brick.x + brick.w && recoilY >= brick.y && recoilY <= brick.y + brick.h) {
            brick.isBroken = true;
            brick.vx = (Math.random() - 0.5) * 14;
            brick.vy = (Math.random() - 0.5) * 6 - 4;
            brick.vRotation = (Math.random() - 0.5) * 0.3;
            createParticles(brick.x + brick.w/2, brick.y + brick.h/2, brick.color);
            currentHp--;
        }
    });

    wallHpBar.style.width = `${(currentHp / maxHp) * 100}%`;
    if (currentHp <= maxHp * 0.15) {
        breakRemainingWall();
        stopShootingWall();
    }
}

function breakRemainingWall() {
    bricks.forEach(brick => {
        if (!brick.isBroken) {
            brick.isBroken = true;
            brick.vx = (Math.random() - 0.5) * 6; brick.vy = Math.random() * 4;
        }
    });
    currentHp = 0;
    wallHpBar.style.width = '0%';
    wallHpContainer.style.opacity = '0';
    document.body.classList.remove('shake');

    setTimeout(() => {
        wallHpContainer.classList.add('hidden');
        loginScreen.classList.remove('hidden'); // Alterna de forma limpa usando a classe que você fez
        currentPhase = 'LOGIN';
    }, 500);
}

/* =========================================================================
   FASE 2: LOGIN
   ========================================================================= */
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loginScreen.style.opacity = '0';
    setTimeout(() => {
        loginScreen.classList.add('hidden');
        startFpsGame();
    }, 500);
});

/* =========================================================================
   FASE 3: MINI FPS
   ========================================================================= */
let targets = [];
let targetSpawnInterval = null;

function startFpsGame() {
    currentPhase = 'GAME';
    hud.classList.remove('hidden');
    weaponContainer.classList.remove('hidden');

    targetSpawnInterval = setInterval(() => {
        if (currentPhase !== 'GAME') return;
        targets.push({
            x: Math.random() * (canvas.width - 80) + 40,
            y: Math.random() * (canvas.height - 200) + 100,
            radius: Math.random() * 15 + 20,
            color: '#ff4655',
            pulse: 0
        });
    }, 1000);
}

window.addEventListener('click', () => {
    if (currentPhase !== 'GAME') return;

    // Recuo da pistola
    weaponContainer.classList.remove('shoot-recoil');
    void weaponContainer.offsetWidth; 
    weaponContainer.classList.add('shoot-recoil');

    // Fogo
    muzzleFlash.style.display = 'block';
    muzzleFlash.style.opacity = '1';
    setTimeout(() => {
        muzzleFlash.style.display = 'none';
        muzzleFlash.style.opacity = '0';
    }, 40);

    // Partículas de fumaça branca na mira
    createParticles(mouseX, mouseY, '#fff', 5);

    // Checar acerto nos alvos
    for (let i = targets.length - 1; i >= 0; i--) {
        let t = targets[i];
        let dist = Math.hypot(mouseX - t.x, mouseY - t.y);
        
        if (dist <= t.radius) {
            createParticles(t.x, t.y, '#ff4655', 15);
            targets.splice(i, 1);
            score += 100;
            scoreValue.innerText = score;
            break;
        }
    }
});

/* =========================================================================
   LOOP CANVAS
   ========================================================================= */
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentPhase === 'WALL' || currentPhase === 'LOGIN') {
        bricks.forEach(brick => {
            if (!brick.isBroken) {
                ctx.fillStyle = brick.color;
                ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
                ctx.strokeStyle = '#0f141c';
                ctx.strokeRect(brick.x, brick.y, brick.w, brick.h);
            } else if (brick.opacity > 0) {
                brick.x += brick.vx; brick.y += brick.vy; brick.vy += brick.gravity;
                brick.rotation += brick.vRotation; brick.opacity -= 0.015;
                ctx.save();
                ctx.translate(brick.x + brick.w / 2, brick.y + brick.h / 2);
                ctx.rotate(brick.rotation);
                ctx.globalAlpha = Math.max(0, brick.opacity);
                ctx.fillStyle = brick.color;
                ctx.fillRect(-brick.w / 2, -brick.h / 2, brick.w, brick.h);
                ctx.restore();
            }
        });
    }

    if (currentPhase === 'GAME') {
        targets.forEach((t) => {
            t.pulse += 0.05;
            let dynamicRadius = t.radius + Math.sin(t.pulse) * 2;

            ctx.beginPath();
            ctx.arc(t.x, t.y, dynamicRadius, 0, Math.PI * 2);
            ctx.fillStyle = t.color;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(t.x, t.y, dynamicRadius * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(t.x, t.y, dynamicRadius * 0.25, 0, Math.PI * 2);
            ctx.fillStyle = t.color;
            ctx.fill();
        });
    }

    particles.forEach((p, index) => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.alpha -= 0.02;
        if (p.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
            ctx.restore();
        }
    });

    requestAnimationFrame(animate);
}

animate();