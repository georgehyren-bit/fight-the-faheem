// ===== INTRO SCREEN =====
let introActive = true;
let introCanvas, introCtx;
let introAnimFrame = 0;
let introPlayer = null;
let introTrees = [];
let introTargetTreeIndex = 0;
let introCamX = 0;
let introCamY = 0;
let introWoodParticles = [];
let introShop = null;
let introAxeLevel = 0;
let introArmorLevel = 0;
let introAxeTiers = ['Wooden Axe', 'Stone Axe', 'Iron Axe', 'Gold Axe', 'Diamond Axe'];
let introMaxAxeLevel = 4;
let introMaxArmorLevel = 4;
let introHealth = 100;
let introMaxHealth = 100;
let introWolves = [];
let introUpgradeCooldown = 0;
let introUpgradeCount = 0;

function initIntroScreen() {
    introCanvas = document.getElementById('introCanvas');
    if (!introCanvas) return;
    introCtx = introCanvas.getContext('2d');
    
    const resize = () => {
        introCanvas.width = window.innerWidth;
        introCanvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', hideIntroScreen);
        startBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            hideIntroScreen();
        });
    }

    const initWorld = () => {
        introTrees = [];
        introWoodParticles = [];
        introWolves = [];
        introTargetTreeIndex = 0;
        introAnimFrame = 0;
        introAxeLevel = 0;
        introArmorLevel = 0;
        introHealth = introMaxHealth;
        introUpgradeCooldown = 0;
        introUpgradeCount = 0;

        const baseY = 240;
        const spacing = 140;
        for (let i = 0; i < 6; i++) {
            const x = 80 + i * spacing;
            const type = (i % 3 === 0) ? 'autumn' : (i % 3 === 1) ? 'dark' : 'normal';
            const t = {
                x,
                y: baseY,
                type,
                width: 30,
                height: 40,
                maxHealth: 10,
                health: 10,
                alive: true,
                trunkColor: type === 'dark' ? '#654321' : '#8B4513',
                leavesColor: type === 'autumn' ? '#FF8C00' : (type === 'dark' ? '#006400' : '#228B22')
            };
            introTrees.push(t);
        }

        introShop = {
            x: introTrees[introTrees.length - 1].x + 170,
            y: baseY + 10,
            w: 70,
            h: 60
        };

        introPlayer = {
            x: introTrees[0].x - 50,
            y: introTrees[0].y + 10,
            width: 20,
            height: 30,
            speed: 2.2,
            color: '#FF6B6B',
            cutting: false,
            cutTimer: 0,
            facing: 'right',
            state: 'walk'
        };

        introCamX = introPlayer.x;
        introCamY = introPlayer.y;
    };

    initWorld();
    
    requestAnimationFrame(drawIntroAnimation);
}

function hideIntroScreen() {
    introActive = false;
    const introScreen = document.getElementById('introScreen');
    if (introScreen) {
        introScreen.classList.add('hidden');
    }
}

function drawIntroAnimation() {
    if (!introActive || !introCtx) return;
    
    const w = introCanvas.width;
    const h = introCanvas.height;

    introAnimFrame++;

    const worldW = 900;
    const worldH = 320;
    const groundY = 260;

    if (introPlayer && introTrees.length) {
        const targetTree = introTrees[introTargetTreeIndex];
        const targetX = targetTree ? (targetTree.x - 45) : introPlayer.x;

        if (introPlayer.state === 'walk') {
            introPlayer.cutting = false;
            introPlayer.cutTimer = 0;
            const dx = targetX - introPlayer.x;
            if (Math.abs(dx) > 2) {
                introPlayer.facing = dx < 0 ? 'left' : 'right';
                introPlayer.x += Math.sign(dx) * introPlayer.speed;
            } else {
                introPlayer.state = 'chop';
                introPlayer.cutting = true;
                introPlayer.cutTimer = 30;
            }
        } else if (introPlayer.state === 'chop') {
            introPlayer.cutting = true;
            if (introPlayer.cutTimer > 0) {
                introPlayer.cutTimer--;
            } else {
                introPlayer.cutTimer = 30;
                if (targetTree && targetTree.alive) {
                    const dmg = 2 + Math.floor(introAxeLevel / 2);
                    targetTree.health -= dmg;
                    for (let i = 0; i < 6; i++) {
                        introWoodParticles.push({
                            x: targetTree.x + 10 + Math.random() * 10,
                            y: targetTree.y - 8 + Math.random() * 16,
                            vx: 0.5 + Math.random() * 1.2,
                            vy: -1.2 + Math.random() * -0.6,
                            life: 20 + Math.random() * 10
                        });
                    }

                    if (targetTree.health <= 0) {
                        targetTree.alive = false;
                        targetTree.health = 0;
                        if (introTargetTreeIndex >= introTrees.length - 1) {
                            introPlayer.state = 'walkShop';
                        } else {
                            introTargetTreeIndex++;
                            introPlayer.state = 'walk';
                        }
                    }
                }
            }
        } else if (introPlayer.state === 'walkShop') {
            introPlayer.cutting = false;
            introPlayer.cutTimer = 0;
            const shopTargetX = introShop ? (introShop.x - 60) : introPlayer.x;
            const dx = shopTargetX - introPlayer.x;
            if (Math.abs(dx) > 2) {
                introPlayer.facing = dx < 0 ? 'left' : 'right';
                introPlayer.x += Math.sign(dx) * introPlayer.speed;
            } else {
                introPlayer.state = 'shop';
                introUpgradeCooldown = 10;
            }
        } else if (introPlayer.state === 'shop') {
            introPlayer.cutting = false;
            introPlayer.cutTimer = 0;

            if (introUpgradeCooldown > 0) {
                introUpgradeCooldown--;
            } else {
                introUpgradeCooldown = 12;

                if ((introAxeLevel >= introMaxAxeLevel || introArmorLevel >= introMaxArmorLevel) && introUpgradeCount > 0) {
                    introPlayer.state = 'wolves';
                    introWolves = [];
                    for (let i = 0; i < 4; i++) {
                        introWolves.push({
                            x: introPlayer.x + 160 + i * 30,
                            y: introPlayer.y,
                            vx: 0,
                            vy: 0,
                            speed: 1.4 + Math.random() * 0.4,
                            alive: true
                        });
                    }
                } else {
                    // Random upgrades, but weapon progression is axes only.
                    const pick = Math.random() < 0.5 ? 'axe' : 'armor';
                    if (pick === 'axe') {
                        if (introAxeLevel < introMaxAxeLevel) { introAxeLevel++; introUpgradeCount++; }
                        else if (introArmorLevel < introMaxArmorLevel) { introArmorLevel++; introUpgradeCount++; }
                    } else {
                        if (introArmorLevel < introMaxArmorLevel) { introArmorLevel++; introUpgradeCount++; }
                        else if (introAxeLevel < introMaxAxeLevel) { introAxeLevel++; introUpgradeCount++; }
                    }
                }
            }
        } else if (introPlayer.state === 'wolves') {
            // Wolves chase and kill the player
            const armorMitigation = 0.15 * introArmorLevel;
            const dmgPerHit = Math.max(0.6, 2.0 - armorMitigation);

            for (const wv of introWolves) {
                if (!wv.alive) continue;
                const dx = introPlayer.x - wv.x;
                const dy = introPlayer.y - wv.y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                wv.vx = (dx / len) * wv.speed;
                wv.vy = (dy / len) * wv.speed;
                wv.x += wv.vx;
                wv.y += wv.vy;

                if (len < 22) {
                    introHealth -= dmgPerHit;
                }
            }

            if (introHealth <= 0) {
                // Reset loop: gear back to 0, trees back alive, health restored
                introHealth = introMaxHealth;
                introAxeLevel = 0;
                introArmorLevel = 0;
                introUpgradeCount = 0;
                introUpgradeCooldown = 0;
                introWolves = [];
                introWoodParticles = [];
                for (const t of introTrees) {
                    t.alive = true;
                    t.health = t.maxHealth;
                }
                introTargetTreeIndex = 0;
                introPlayer.x = introTrees[0].x - 50;
                introPlayer.y = introTrees[0].y + 10;
                introPlayer.facing = 'right';
                introPlayer.cutting = false;
                introPlayer.cutTimer = 0;
                introPlayer.state = 'walk';
                introCamX = introPlayer.x;
                introCamY = introPlayer.y;
            }
        }

        const desiredCamX = introPlayer.x;
        const desiredCamY = introPlayer.y;
        introCamX += (desiredCamX - introCamX) * 0.06;
        introCamY += (desiredCamY - introCamY) * 0.06;
    }

    // Camera will be clamped after we compute the visible viewport size (viewW/viewH)
    let camLeft = introCamX - worldW / 2;
    let camTop = introCamY - worldH / 2;

    const sky = introCtx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#87CEEB');
    sky.addColorStop(0.6, '#B0E0E6');
    sky.addColorStop(1, '#E0F6FF');
    introCtx.fillStyle = sky;
    introCtx.fillRect(0, 0, w, h);

    // Cover the whole screen (no letterboxing). This may crop a bit on some aspect ratios.
    const sx = w / worldW;
    const sy = h / worldH;
    const s = Math.max(sx, sy);
    const viewW = w / s;
    const viewH = h / s;
    introCtx.save();
    // Center-crop the world into the viewport
    introCtx.scale(s, s);
    introCtx.translate(-(worldW - viewW) / 2, -(worldH - viewH) / 2);

    // Clamp camera to the visible viewport so we never pan into empty space
    camLeft = introCamX - viewW / 2;
    camTop = introCamY - viewH / 2;
    camLeft = Math.max(0, Math.min(worldW - viewW, camLeft));
    camTop = Math.max(0, Math.min(worldH - viewH, camTop));

    introCtx.fillStyle = '#6b8e6b';
    introCtx.beginPath();
    introCtx.moveTo(0, 190);
    introCtx.lineTo(120, 90);
    introCtx.lineTo(240, 170);
    introCtx.lineTo(380, 80);
    introCtx.lineTo(520, 170);
    introCtx.lineTo(680, 95);
    introCtx.lineTo(860, 180);
    introCtx.lineTo(worldW, 140);
    introCtx.lineTo(worldW, worldH);
    introCtx.lineTo(0, worldH);
    introCtx.fill();

    introCtx.fillStyle = '#5a7d5a';
    introCtx.fillRect(0, groundY, worldW, worldH - groundY);

    introCtx.save();
    introCtx.translate(-camLeft, -camTop);

    if (introShop) {
        introCtx.fillStyle = '#3b2a1a';
        introCtx.fillRect(introShop.x - introShop.w/2, introShop.y - introShop.h/2, introShop.w, introShop.h);
        introCtx.fillStyle = '#8B4513';
        introCtx.fillRect(introShop.x - introShop.w/2, introShop.y - introShop.h/2, introShop.w, 10);
        introCtx.fillStyle = '#FFD700';
        introCtx.fillRect(introShop.x - 20, introShop.y - 10, 40, 8);
    }

    for (const t of introTrees) {
        if (!t.alive) continue;
        introCtx.fillStyle = t.trunkColor;
        introCtx.fillRect(t.x - 5, t.y, 10, 20);
        introCtx.fillStyle = t.leavesColor;
        introCtx.fillRect(t.x - 15, t.y - 20, 30, 25);
        if (t.health < t.maxHealth) {
            introCtx.fillStyle = '#FF0000';
            introCtx.fillRect(t.x - 15, t.y - 30, 30, 4);
            introCtx.fillStyle = '#00FF00';
            introCtx.fillRect(t.x - 15, t.y - 30, 30 * (t.health / t.maxHealth), 4);
        }
    }

    // Wolves in intro
    for (const wv of introWolves) {
        if (!wv.alive) continue;
        introCtx.fillStyle = '#808080';
        introCtx.fillRect(wv.x - 10, wv.y - 8, 20, 16);
        introCtx.fillStyle = '#000';
        introCtx.fillRect(wv.x - 6, wv.y - 4, 3, 3);
        introCtx.fillRect(wv.x + 3, wv.y - 4, 3, 3);
    }

    if (introPlayer) {
        const p = introPlayer;

        introCtx.fillStyle = p.color;
        introCtx.fillRect(p.x - p.width/2, p.y - p.height/2, p.width, p.height);

        introCtx.fillStyle = '#FDBCB4';
        introCtx.fillRect(p.x - p.width/2 - 5, p.y - p.height/2 + 5, 5, 15);
        introCtx.fillRect(p.x + p.width/2, p.y - p.height/2 + 5, 5, 15);

        introCtx.fillStyle = '#4169E1';
        introCtx.fillRect(p.x - 8, p.y + p.height/2 - 5, 6, 12);
        introCtx.fillRect(p.x + 2, p.y + p.height/2 - 5, 6, 12);

        introCtx.fillStyle = '#FDBCB4';
        introCtx.fillRect(p.x - 10, p.y - p.height/2 - 12, 20, 15);

        introCtx.fillStyle = '#000';
        if (p.facing === 'left') {
            introCtx.fillRect(p.x - 9, p.y - p.height/2 - 8, 3, 3);
            introCtx.fillRect(p.x - 3, p.y - p.height/2 - 8, 3, 3);
        } else if (p.facing === 'right') {
            introCtx.fillRect(p.x + 0, p.y - p.height/2 - 8, 3, 3);
            introCtx.fillRect(p.x + 6, p.y - p.height/2 - 8, 3, 3);
        } else {
            introCtx.fillRect(p.x - 6, p.y - p.height/2 - 8, 3, 3);
            introCtx.fillRect(p.x + 3, p.y - p.height/2 - 8, 3, 3);
        }

        introCtx.fillStyle = '#8B4513';
        introCtx.fillRect(p.x - 10, p.y - p.height/2 - 15, 20, 5);

        if (p.cutting) {
            introCtx.save();
            introCtx.translate(p.x, p.y);
            if (p.facing === 'left') {
                introCtx.rotate(Math.PI + Math.PI / 3);
            } else {
                introCtx.rotate(-Math.PI / 3);
            }

            introCtx.fillStyle = '#8B4513';
            introCtx.fillRect(10, -2, 2, 2);
            introCtx.fillRect(12, 0, 2, 2);
            introCtx.fillRect(14, 2, 2, 2);
            introCtx.fillRect(16, 4, 2, 2);
            introCtx.fillRect(18, 6, 2, 2);
            introCtx.fillRect(20, 8, 2, 2);

            introCtx.fillStyle = '#C0C0C0';
            introCtx.fillRect(18, -8, 8, 8);
            introCtx.fillStyle = '#000000';
            introCtx.fillRect(26, -6, 2, 6);
            introCtx.fillRect(20, -10, 4, 2);
            introCtx.restore();
        }
    }

    for (let i = introWoodParticles.length - 1; i >= 0; i--) {
        const p = introWoodParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.life -= 1;
        introCtx.fillStyle = '#8B4513';
        introCtx.fillRect(p.x, p.y, 3, 3);
        if (p.life <= 0) introWoodParticles.splice(i, 1);
    }

    introCtx.restore();

    // Intro HUD in screen-space (doesn't drift with camera)
    introCtx.fillStyle = 'rgba(0,0,0,0.35)';
    introCtx.fillRect(10, 10, 190, 54);
    introCtx.fillStyle = '#FFD700';
    introCtx.font = '12px monospace';
    const axeName = introAxeTiers[introAxeLevel] || 'Axe';
    introCtx.fillText(`AXE: ${axeName}`, 18, 30);
    introCtx.fillText(`ARM: ${introArmorLevel}/${introMaxArmorLevel}`, 18, 46);

    if (introPlayer && introPlayer.state === 'wolves') {
        const ratio = Math.max(0, Math.min(1, introHealth / introMaxHealth));
        introCtx.fillStyle = '#FF0000';
        introCtx.fillRect(18, 56, 160, 6);
        introCtx.fillStyle = '#00FF00';
        introCtx.fillRect(18, 56, 160 * ratio, 6);
    }

    introCtx.restore();

    requestAnimationFrame(drawIntroAnimation);
}

// ===== TRANSITION TIMING (max 0.5s) =====
const MAX_TRANSITION_MS = 500;

// Game variables
let canvas;
let ctx;
let money = 50;
let wood = 0;
let health = 100;
let maxHealth = 100;
let currentAxeIndex = 0;
let currentMap = 'forest';
let shopOpen = false;
let inventoryOpen = false;
let isNight = false;
let dayNightTimer = 0;
let inShop = false;
let showPlayerHealthBar = false;
let playerHealthBarTimer = 0;
let currentArmorIndex = -1; // -1 = no armor
let defense = 0;
let nightsSurvived = 0;
let currentDay = 1;
let bossActive = false;
let boss = null;
let gamePaused = false; // Add game pause state
let gameLoopRunning = true; // Add game loop control
let gameLoopRafId = null; // requestAnimationFrame handle (prevents stacked loops)
let respawnImmunity = 0; // Immunity timer after respawn
let reequipCooldown = 0; // Cooldown timer for re-equipping items

// Inventory system
let inventory = {
    bread: 0,
    maxBread: 10,
    selectedSlot: 0,
    items: []
};

// Quality of life settings
let qolSettings = {
    autoEat: false,
    healthRegen: false,
    damageNumbers: true,
    minimap: false,
    quickHeal: false,
    inventoryHotkeys: true
};

// Player object
let player;

// UI Update function - defined early to avoid "update is not defined" errors
function updateUI() {
    document.getElementById('money').textContent = money;
    document.getElementById('wood').textContent = wood;
    document.getElementById('health').textContent = Math.round(health);
    document.getElementById('currentMap').textContent = maps[currentMap].name;
    document.getElementById('timeOfDay').textContent = isNight ? 'Night' : 'Day';
    
    // Add day counter display
    let statsPanel = document.querySelector('.ui-panel');
    if (!document.getElementById('currentDay')) {
        const daysDiv = document.createElement('div');
        daysDiv.className = 'stat';
        daysDiv.id = 'currentDay';
        daysDiv.innerHTML = `Day: <span>${currentDay}</span>`;
        statsPanel.appendChild(daysDiv);
    } else {
        document.querySelector('#currentDay span').textContent = currentDay;
    }

    updateBowEquippedUI();
}

function updateBowEquippedUI() {
    const body = document.body;
    if (!body) return;
    const currentWeapon = weapons[currentAxeIndex];
    const bowEquipped = !!(currentWeapon && currentWeapon.type === 'bow' && currentWeapon.owned && currentMap === 'mountains');
    body.classList.toggle('bow-equipped', bowEquipped);
}

function toggleTestingPanelPopup() {
    const body = document.body;
    if (!body) return;
    body.classList.toggle('testing-open');
}

// Day/Night cycle function
function updateDayNightCycle() {
    // Don't update day/night cycle after night 10 (game ends after boss fight)
    if (nightsSurvived >= 10) {
        return;
    }
    
    dayNightTimer++;
    
    // Switch between day and night every 60 seconds (3600 frames at 60fps)
    if (dayNightTimer >= 3600) {
        if (isNight) {
            // Night ending - count survived night and increment day
            nightsSurvived++;
            currentDay++;
            
            // Check for night 10 to spawn Faheem BEFORE switching to day
            if (nightsSurvived === 10) {
                spawnBoss();
                // Don't switch to day if Faheem spawned
                if (boss && boss.alive) {
                    return;
                }
            }
            
            // Increment nightsSurvived and currentDay AFTER boss defeat
            // This ensures victory logic sees nightsSurvived === 10
            if (boss && boss.alive === false && nightsSurvived === 10) {
                nightsSurvived++;
                currentDay++;
                console.log('Boss defeated! nightsSurvived is now:', nightsSurvived, 'currentDay:', currentDay);
            }
        }
        
        isNight = !isNight;
        dayNightTimer = 0;
        
        // Clear wolves during day (but not boss)
        if (!isNight) {
            wolves = [];
        }
        
        updateUI();
    }
}

// Weapons configuration
let weapons = [
    { name: 'Wooden Axe', damage: 1, cost: 50, color: '#8B4513', owned: false },
    { name: 'Stone Axe', damage: 2, cost: 120, color: '#808080', owned: false },
    { name: 'Iron Axe', damage: 3, cost: 280, color: '#4169E1', owned: false },
    { name: 'Gold Axe', damage: 5, cost: 600, color: '#FFD700', owned: false },
    { name: 'Diamond Axe', damage: 8, cost: 1200, color: '#00CED1', owned: false },
    { name: 'Bow', damage: 4, cost: 400, color: '#8B4513', owned: false, mapRestriction: 'mountains', type: 'bow' },
    { name: 'Battle Axe', damage: 25, cost: 800, color: '#696969', owned: false, mapRestriction: 'winter', attackCooldown: 80 }
];

// Armor configuration
let armors = [
    { name: 'Leather', defense: 2, cost: 150, color: '#8B4513', owned: false },
    { name: 'Iron', defense: 4, cost: 350, color: '#708090', owned: false },
    { name: 'Gold', defense: 6, cost: 750, color: '#FFD700', owned: false },
    { name: 'Diamond', defense: 10, cost: 1500, color: '#00CED1', owned: false }
];

// Maps configuration
const maps = {
    forest: { name: 'Forest', unlocked: true, cost: 0, type: 'forest' },
    mountains: { name: 'Mountains', unlocked: false, cost: 0, type: 'mountains' },
    winter: { name: 'Winter', unlocked: false, cost: 0, type: 'winter' }
};

// Game entities
let trees = [];
let wolves = [];
let shop = null;
let cave = null;

// Boss class
class Boss {
    constructor(x, y, level, mapType = 'forest') {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 50;
        this.speed = 0.5; // Further nerfed from 0.6
        this.maxHealth = 250 + (level * 120);
        this.health = this.maxHealth;
        this.damage = 10 + (level * 3); // Reduced base damage for better balance
        this.attackCooldown = 0;
        this.alive = true;
        this.level = level;
        this.name = 'Faheem';
        this.mapType = mapType;
        this.specialAttackCooldown = 0;
        this.specialAttackWindup = 0;
        this.specialAttackActive = false;
        this.specialAttackDirection = null;
        this.bleedDamage = 0;
        this.bleedTimer = 0;
        this.chompCycle = 0; // Track multiple chomps
        this.particles = []; // Visual effects for chomp
        this.specialCharges = 5; // 2.5 charges per ability use (can charge up to 2.5 times)
        this.currentCharges = 5; // Start with full charges
        this.chargeRegenTimer = 0; // Track charge regeneration
        this.chompHitCooldown = 0;
        
        // Winter-specific ability properties
        this.iceStormActive = false;
        this.iceStormDuration = 0;
        this.iceStormRadius = 120;
        this.iceStormDamage = 0;
        this.iceStormCooldown = 0;
        this.iceShards = []; // Ice shard projectiles
        
        // Mountain-specific ability properties
        this.rockslideActive = false;
        this.rockslideDuration = 0;
        this.rockslideRadius = 100;
        this.rockslideDamage = 0;
        this.rockslideCooldown = 0;
        this.rockBoulders = []; // Rock boulder projectiles
        
        // Buff nearby wolves when spawned
        this.buffNearbyWolves();
    }

    buffNearbyWolves() {
        const buffRadius = 200; // Radius to buff wolves
        wolves.forEach(wolf => {
            if (wolf.alive) {
                const distance = Math.sqrt(Math.pow(wolf.x - this.x, 2) + Math.pow(wolf.y - this.y, 2));
                if (distance < buffRadius) {
                    wolf.buffByBoss();
                    
                    // Different buff effects based on map type
                    if (this.mapType === 'winter') {
                        // Winter buff: wolves slow player on attack
                        wolf.winterBuffed = true;
                        wolf.slowEffect = true;
                        wolf.slowDuration = 0;
                        wolf.slowAmount = 0.5; // Slow player to 50% speed
                        console.log('Wolf winter buffed - will slow player on attack');
                        console.log('Wolf state after buff:', {
                            winterBuffed: wolf.winterBuffed,
                            slowEffect: wolf.slowEffect,
                            slowAmount: wolf.slowAmount
                        });
                    } else if (this.mapType === 'mountains') {
                        // Mountain buff: wolves get armor and damage boost
                        wolf.mountainBuffed = true;
                        wolf.armorBuffed = true;
                        wolf.armorAmount = 0.5; // 50% damage reduction
                        wolf.damageBoost = 1.5; // 50% damage boost
                        console.log('Wolf mountain buffed - armor + damage boost');
                        console.log('Wolf state after buff:', {
                            mountainBuffed: wolf.mountainBuffed,
                            armorBuffed: wolf.armorBuffed,
                            armorAmount: wolf.armorAmount,
                            damageBoost: wolf.damageBoost
                        });
                    } else {
                        // Regular buff: give mini charge ability when buffed
                        if (!wolf.miniChargeActive) {
                            wolf.miniChargeActive = true;
                            wolf.miniChargeTimer = 300; // 5 seconds of mini charge
                            wolf.speed = 3; // Give wolf 2x speed when mini charged
                            console.log('Wolf mini charge activated - speed increased to 3');
                        }
                    }
                } else {
                    wolf.debuffByBoss(); // Remove buff if too far
                    if (this.mapType === 'winter') {
                        // Remove winter buff
                        wolf.winterBuffed = false;
                        wolf.slowEffect = false;
                        wolf.slowDuration = 0;
                        wolf.slowAmount = 0;
                        console.log('Wolf winter debuffed');
                    } else if (this.mapType === 'mountains') {
                        // Remove mountain buff
                        wolf.mountainBuffed = false;
                        wolf.armorBuffed = false;
                        wolf.armorAmount = 0;
                        wolf.damageBoost = 0;
                        console.log('Wolf mountain debuffed');
                    } else {
                        // Remove mini charge if too far
                        if (wolf.miniChargeActive) {
                            wolf.miniChargeActive = false;
                            wolf.miniChargeTimer = 0;
                            wolf.speed = 1.5; // Reset to normal speed
                        }
                    }
                }
            }
        });
    }
    
    // Winter-themed Ice Storm ability
    iceStorm() {
        if (this.mapType !== 'winter' || this.iceStormCooldown > 0 || this.currentCharges < 2.5) {
            return;
        }
        
        // Start ice storm
        this.iceStormActive = true;
        this.iceStormDuration = 180; // 3 seconds
        this.iceStormCooldown = 300; // 5 second cooldown
        this.iceStormDamage = Math.floor(25 + (this.level * 8)); // Buffed damage
        this.currentCharges -= 2.5; // Same charge cost as chomp
        
        // Create ice shards in a circle
        const shardCount = 12;
        for (let i = 0; i < shardCount; i++) {
            const angle = (Math.PI * 2 * i) / shardCount;
            this.iceShards.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * 4,
                vy: Math.sin(angle) * 4,
                life: 120, // 2 seconds
                size: 3,
                damage: Math.floor(this.iceStormDamage / 2) // Each shard does 1/2 damage (buffed)
            });
        }
        
        // Create ice storm visual effect
        this.createIceStormEffect();
    }
    
    createIceStormEffect() {
        // Create ice storm particles
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.iceStormRadius;
            this.particles.push({
                x: this.x + Math.cos(angle) * distance,
                y: this.y + Math.sin(angle) * distance,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 60,
                type: 'ice',
                size: 4 + Math.random() * 4
            });
        }
    }
    
    updateIceStorm() {
        if (!this.iceStormActive) return;
        
        this.iceStormDuration--;
        
        // Update ice shards
        this.iceShards = this.iceShards.filter(shard => {
            shard.x += shard.vx;
            shard.y += shard.vy;
            shard.life--;
            
            // Check collision with player
            const playerDist = Math.sqrt(Math.pow(shard.x - player.x, 2) + Math.pow(shard.y - player.y, 2));
            if (playerDist < 15 && respawnImmunity === 0) {
                // Apply damage and freeze effect
                health = Math.max(0, health - shard.damage);
                showPlayerHealthBar = true;
                playerHealthBarTimer = 180;
                updateUI();
                
                // Slow player temporarily (freeze effect)
                player.speed = 1; // Slow from 3 to 1
                setTimeout(() => {
                    if (player.speed < 3) player.speed = 3; // Restore speed after 1 second
                }, 1000);
                
                if (qolSettings.damageNumbers) {
                    showDamageNumber(player.x, player.y - 20, shard.damage);
                }
                
                return false; // Remove shard on hit
            }
            
            // Draw ice shard
            ctx.fillStyle = `rgba(173, 216, 230, ${shard.life / 120})`;
            ctx.fillRect(shard.x - shard.size/2, shard.y - shard.size/2, shard.size, shard.size);
            
            return shard.life > 0;
        });
        
        // Draw ice storm effect
        if (this.iceStormDuration % 10 === 0) {
            this.createIceStormEffect();
        }
        
        // Draw ice storm radius indicator
        ctx.strokeStyle = `rgba(173, 216, 230, ${0.3 * (this.iceStormDuration / 180)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.iceStormRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // End ice storm
        if (this.iceStormDuration <= 0) {
            this.iceStormActive = false;
            this.iceShards = [];
        }
    }

    rockslide() {
        if (this.mapType !== 'mountains' || this.rockslideCooldown > 0 || this.currentCharges < 2.5) {
            return;
        }

        this.rockslideActive = true;
        this.rockslideDuration = 90;
        this.rockslideCooldown = 300;
        this.rockslideDamage = Math.floor(25 + (this.level * 8));
        this.currentCharges -= 2.5;

        // Reset throw timer and start a volley of boulders aimed at the player
        this.rockThrowTimer = 0;
        this.rockBoulders = [];
        this.throwBoulderAtPlayer();

        this.createRockslideEffect();
    }

    throwBoulderAtPlayer() {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        const speed = 7;
        const size = 14; // medium boulder
        const spawnOffset = 24;
        const damage = Math.max(1, Math.floor(this.rockslideDamage * 0.8));

        this.rockBoulders.push({
            x: this.x + Math.cos(angle) * spawnOffset,
            y: this.y + Math.sin(angle) * spawnOffset,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 180,
            size,
            damage
        });
    }

    createRockslideEffect() {
        for (let i = 0; i < 18; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.rockslideRadius;
            this.particles.push({
                x: this.x + Math.cos(angle) * distance,
                y: this.y + Math.sin(angle) * distance,
                vx: (Math.random() - 0.5) * 2.5,
                vy: (Math.random() - 0.5) * 2.5,
                life: 60,
                type: 'rock',
                size: 3 + Math.random() * 3
            });
        }
    }

    updateRockslide() {
        if (!this.rockslideActive) return;

        this.rockslideDuration--;

        if (this.rockThrowTimer === undefined) this.rockThrowTimer = 0;
        this.rockThrowTimer++;

        // Throw more boulders straight at the player during the ability (3 total)
        if ((this.rockThrowTimer === 30 || this.rockThrowTimer === 60) && this.rockslideDuration > 0) {
            this.throwBoulderAtPlayer();
            this.createRockslideEffect();
        }

        this.rockBoulders = this.rockBoulders.filter(boulder => {
            boulder.x += boulder.vx;
            boulder.y += boulder.vy;
            boulder.life--;

            const playerDist = Math.sqrt(Math.pow(boulder.x - player.x, 2) + Math.pow(boulder.y - player.y, 2));
            if (playerDist < (boulder.size * 0.6 + 6) && respawnImmunity === 0) {
                const hitDamage = Math.max(1, boulder.damage - defense);
                health = Math.max(0, health - hitDamage);
                showPlayerHealthBar = true;
                playerHealthBarTimer = 180;
                updateUI();

                if (qolSettings.damageNumbers) {
                    showDamageNumber(player.x, player.y - 20, hitDamage);
                }

                return false;
            }

            // Drop boulders if they leave the arena
            const outOfBounds = (
                boulder.x < -50 || boulder.x > canvas.width + 50 ||
                boulder.y < -50 || boulder.y > canvas.height + 50
            );

            return boulder.life > 0 && !outOfBounds;
        });

        // End ability once timer is done and no boulders remain
        if (this.rockslideDuration <= 0 && this.rockBoulders.length === 0) {
            this.rockslideActive = false;
        }
    }
    
    draw() {
        if (!this.alive) return;
        
        // Update and draw particles
        this.updateParticles();

        // Draw mountain boulders AFTER the canvas clear (rendered here, not in update)
        if (this.mapType === 'mountains' && this.rockBoulders && this.rockBoulders.length > 0) {
            this.rockBoulders.forEach(boulder => {
                const alpha = Math.max(0, Math.min(1, boulder.life / 180));
                ctx.fillStyle = `rgba(139, 115, 85, ${alpha})`;
                ctx.strokeStyle = `rgba(80, 60, 40, ${alpha})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(boulder.x, boulder.y, boulder.size / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            });
        }
        
        // Draw special attack windup with enhanced effects
        if (this.specialAttackWindup > 0) {
            const windupProgress = 1 - (this.specialAttackWindup / 60);
            const pulseSize = 80 + (windupProgress * 30);
            
            // Different colors for different map types
            const windupColor = this.mapType === 'winter' ? [173, 216, 230] : [255, 50, 0];
            
            // Multiple pulsing circles
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = `rgba(${windupColor[0]}, ${windupColor[1]}, ${windupColor[2]}, ${0.2 - i * 0.05 + windupProgress * 0.3})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, pulseSize + i * 15, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Energy crackles
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const distance = pulseSize + 10;
                const x = this.x + Math.cos(angle) * distance;
                const y = this.y + Math.sin(angle) * distance;
                ctx.fillStyle = `rgba(255, 100, 0, ${windupProgress})`;
                ctx.fillRect(x - 2, y - 2, 4, 4);
            }
            
            // Enhanced warning text with glow
            ctx.shadowColor = '#FF0000';
            ctx.shadowBlur = 10 + windupProgress * 10;
            ctx.fillStyle = '#FF0000';
            ctx.font = `bold ${18 + windupProgress * 6}px monospace`;
            ctx.fillText('CHOMP!', this.x - 40, this.y - 70 - windupProgress * 15);
            ctx.shadowBlur = 0;
            ctx.font = '10px monospace';
            
            // Directional charge lines with animation
            if (windupProgress > 0.3) {
                ctx.strokeStyle = `rgba(255, 0, 0, ${windupProgress})`;
                ctx.lineWidth = 3;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    const lineX = player.x + Math.cos(Date.now() * 0.001 + i) * 20;
                    const lineY = player.y + Math.sin(Date.now() * 0.001 + i) * 20;
                    ctx.lineTo(lineX, lineY);
                    ctx.stroke();
                }
            }
        }
        
        // Draw boss body with map-specific colors
        if (this.mapType === 'winter') {
            // Winter Faheem - white/ice colors
            ctx.fillStyle = '#E0E0E0';
            ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
            
            // Ice crystals on body
            ctx.fillStyle = '#B0E0E6';
            ctx.fillRect(this.x - 20, this.y - 10, 5, 5);
            ctx.fillRect(this.x + 15, this.y - 5, 4, 4);
            ctx.fillRect(this.x - 10, this.y + 10, 3, 3);
        } else if (this.mapType === 'mountains') {
            // Mountain Faheem - brown/rock colors
            ctx.fillStyle = '#8B7355';
            ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
            
            // Rock texture
            ctx.fillStyle = '#696969';
            ctx.fillRect(this.x - 15, this.y - 8, 8, 6);
            ctx.fillRect(this.x + 10, this.y + 5, 6, 8);
        } else {
            // Forest Faheem - original dark colors
            ctx.fillStyle = '#2F2F2F';
            ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        }
        
        // Draw boss legs
        ctx.fillStyle = this.mapType === 'winter' ? '#C0C0C0' : '#1F1F1F';
        ctx.fillRect(this.x - 20, this.y + this.height/2 - 8, 6, 16);
        ctx.fillRect(this.x - 8, this.y + this.height/2 - 8, 6, 16);
        ctx.fillRect(this.x + 4, this.y + this.height/2 - 8, 6, 16);
        ctx.fillRect(this.x + 14, this.y + this.height/2 - 8, 6, 16);
        
        // Draw boss head (big triangular)
        ctx.fillStyle = this.mapType === 'winter' ? '#D0D0D0' : (this.mapType === 'mountains' ? '#A0826D' : '#1F1F1F');
        ctx.beginPath();
        ctx.moveTo(this.x - 15, this.y - this.height/2);
        ctx.lineTo(this.x, this.y - this.height/2 - 20);
        ctx.lineTo(this.x + 15, this.y - this.height/2);
        ctx.closePath();
        ctx.fill();
        
        // Draw boss ears
        ctx.fillStyle = this.mapType === 'winter' ? '#B0B0B0' : (this.mapType === 'mountains' ? '#8B7355' : '#1F1F1F');
        ctx.fillRect(this.x - 10, this.y - this.height/2 - 25, 5, 8);
        ctx.fillRect(this.x + 5, this.y - this.height/2 - 25, 5, 8);
        
        // Draw glowing red eyes
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x - 8, this.y - this.height/2 - 10, 4, 4);
        ctx.fillRect(this.x + 4, this.y - this.height/2 - 10, 4, 4);
        
        // Draw special attack mouth with enhanced animation
        if (this.specialAttackActive) {
            // Glowing mouth
            ctx.fillStyle = '#FF0000';
            ctx.shadowColor = '#FF0000';
            ctx.shadowBlur = 15;
            ctx.fillRect(this.x - 12, this.y - this.height/2 + 3, 24, 12);
            ctx.shadowBlur = 0;
            
            // Animated teeth
            ctx.fillStyle = '#FFFFFF';
            for (let i = 0; i < 6; i++) {
                const toothOffset = Math.sin(this.chompCycle * 0.2 + i) * 2;
                ctx.fillRect(this.x - 8 + i * 3, this.y - this.height/2 + 6 + toothOffset, 2, 3);
            }
            
            // Chomp shockwave
            const chompProgress = (this.chompCycle % 20) / 20;
            ctx.strokeStyle = `rgba(255, 0, 0, ${0.5 - chompProgress * 0.5})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 30 + chompProgress * 20, 0, Math.PI * 2);
            ctx.stroke();
            
            // Create bite particles
            if (this.chompCycle % 5 === 0) {
                this.createParticles(this.x, this.y - this.height/2 + 8, 'bite');
            }
        }
        
        // Draw boss name with map variant and charge indicator
        ctx.fillStyle = this.mapType === 'winter' ? '#ADD8E6' : '#FF0000';
        ctx.font = 'bold 12px monospace';
        const variantName = this.mapType === 'winter' ? 'Ice Faheem' : (this.mapType === 'mountains' ? 'Rock Faheem' : 'Forest Faheem');
        ctx.fillText(variantName, this.x - 35, this.y - this.height/2 - 35);
        
        // Draw charge indicator
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`Charges: ${this.currentCharges.toFixed(1)}/${this.specialCharges.toFixed(1)}`, this.x - 30, this.y - this.height/2 - 20);
        
        // Draw ice storm indicator for winter variant
        if (this.mapType === 'winter' && this.iceStormCooldown > 0) {
            ctx.fillStyle = '#87CEEB';
            ctx.font = 'bold 9px monospace';
            const cooldownSeconds = Math.ceil(this.iceStormCooldown / 60);
            ctx.fillText(`Ice Storm: ${cooldownSeconds}s`, this.x - 30, this.y - this.height/2 - 8);
        }
        
        // Draw rockslide indicator for mountain variant
        if (this.mapType === 'mountains' && this.rockslideCooldown > 0) {
            ctx.fillStyle = '#8B7355';
            ctx.font = 'bold 9px monospace';
            const cooldownSeconds = Math.ceil(this.rockslideCooldown / 60);
            ctx.fillText(`Rockslide: ${cooldownSeconds}s`, this.x - 30, this.y - this.height/2 - 8);
        }
        
        // Draw health bar
        if (this.health < this.maxHealth) {
            ctx.fillStyle = '#111111';
            ctx.fillRect(this.x - 30, this.y - this.height/2 - 45, 60, 6);
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x - 30, this.y - this.height/2 - 45, 60, 6);
            ctx.fillStyle = '#FF3030';
            ctx.fillRect(this.x - 30, this.y - this.height/2 - 45, 60 * (this.health / this.maxHealth), 6);
        }
        
        // Reset font
        ctx.font = '10px monospace';
    }
    
    createParticles(x, y, type) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 30,
                type: type,
                size: 2 + Math.random() * 3
            });
        }
    }
    
    updateParticles() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            
            // Draw particle based on type
            if (p.type === 'bite') {
                ctx.fillStyle = `rgba(255, 100, 0, ${p.life / 30})`;
            } else if (p.type === 'ice') {
                ctx.fillStyle = `rgba(173, 216, 230, ${p.life / 60})`;
            } else if (p.type === 'rock') {
                ctx.fillStyle = `rgba(139, 115, 85, ${p.life / 60})`;
            } else {
                ctx.fillStyle = `rgba(255, 255, 0, ${p.life / 30})`;
            }
            ctx.fillRect(p.x, p.y, p.size, p.size);
            
            return p.life > 0;
        });
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.alive = false;
            money += 500 + (this.level * 100); // 500 base + level bonus
            
            console.log('Boss defeated! Current map:', currentMap);
            console.log('Maps before unlock:', JSON.stringify(maps));
            
            // Check if this was wave 10 boss kill
            if (nightsSurvived === 10) {
                // Unlock next map based on current map
                if (currentMap === 'forest' && !maps.mountains.unlocked) {
                    console.log('Unlocking Mountains map...');
                    maps.mountains.unlocked = true;
                    showUnlockMessage('Mountains');
                } else if (currentMap === 'mountains' && !maps.winter.unlocked) {
                    console.log('Unlocking Winter map...');
                    console.log('Current map before unlock:', currentMap);
                    console.log('Winter map unlocked before:', maps.winter.unlocked);
                    maps.winter.unlocked = true;
                    console.log('Winter map unlocked after:', maps.winter.unlocked);
                    showUnlockMessage('Winter');
                }
                
                console.log('Maps after unlock:', JSON.stringify(maps));
                
                endGame();
                return; // Exit immediately to show victory
            }
            
            updateUI();
        }
    }
    
    update() {
        if (!this.alive) return;

        this.buffNearbyWolves();

        if (this.specialAttackCooldown > 0) this.specialAttackCooldown--;
        if (this.iceStormCooldown > 0) this.iceStormCooldown--;
        if (this.rockslideCooldown > 0) this.rockslideCooldown--;

        if (this.bleedTimer > 0) {
            this.bleedTimer--;
            if (this.bleedTimer === 0 && this.bleedDamage > 0 && respawnImmunity === 0) {
                health = Math.max(0, health - this.bleedDamage);
                updateUI();
            }
        }

        if (this.iceStormActive) this.updateIceStorm();
        if (this.rockslideActive) this.updateRockslide();

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        // Use special abilities when fully charged.
        // Mountains: throw boulders at any range.
        // Winter/Forest: keep closer-range trigger.
        const canUseSpecialAtThisRange = (this.mapType === 'mountains') ? true : (distance < 150);
        if (this.currentCharges >= 5 && canUseSpecialAtThisRange && this.specialAttackCooldown === 0) {
            if (this.mapType === 'winter') {
                this.iceStorm();
            } else if (this.mapType === 'mountains') {
                this.rockslide();
            } else {
                this.specialAttackWindup = 60;
                this.specialAttackCooldown = 300;
            }
        }

        if (this.specialAttackWindup > 0) {
            this.specialAttackWindup--;
            if (this.specialAttackWindup === 0) {
                this.specialAttackActive = true;
                this.specialAttackDirection = {
                    x: (dx / distance) * 11,
                    y: (dy / distance) * 11
                };
                this.currentCharges = Math.max(0, this.currentCharges - 2.5);
                this.chompCycle = 0;
            }
            return;
        }

        if (this.specialAttackActive) {
            const nextX = this.x + this.specialAttackDirection.x;
            const nextY = this.y + this.specialAttackDirection.y;
            const playerDist = Math.sqrt(Math.pow(nextX - player.x, 2) + Math.pow(nextY - player.y, 2));

            if (playerDist < 40) {
                this.specialAttackActive = false;
                this.specialAttackDirection = null;
                this.chompCycle = 0;

                if (respawnImmunity === 0) {
                    const hitDamage = Math.max(1, Math.floor(this.damage * 2) - defense);
                    health = Math.max(0, health - hitDamage);
                    showPlayerHealthBar = true;
                    playerHealthBarTimer = 180;
                    updateUI();

                    if (qolSettings.damageNumbers) {
                        showDamageNumber(player.x, player.y - 20, hitDamage);
                    }

                    if (health <= 0) {
                        showRespawnButton();
                    }
                }
                return;
            }

            this.x = nextX;
            this.y = nextY;

            if (this.chompHitCooldown > 0) this.chompHitCooldown--;

            this.chompCycle = (this.chompCycle || 0) + 1;
            if (this.chompCycle % 20 === 0) {
                this.currentCharges = Math.max(0, this.currentCharges - 0.5);
            }

            const pdx = player.x - this.x;
            const pdy = player.y - this.y;
            const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
            if (pdist < 85 && this.chompHitCooldown === 0 && respawnImmunity === 0) {
                this.bleedDamage = Math.floor(10 + (this.level * 3));
                this.bleedTimer = 180;

                const damage = Math.max(1, Math.floor(this.damage * 2) - defense);
                health = Math.max(0, health - damage);
                showPlayerHealthBar = true;
                playerHealthBarTimer = 180;
                updateUI();

                if (qolSettings.damageNumbers) {
                    showDamageNumber(player.x, player.y - 20, damage);
                }

                this.chompHitCooldown = 18;

                if (health <= 0) {
                    showRespawnButton();
                }
            }

            if (this.chompCycle >= 125 || this.currentCharges <= 0) {
                this.specialAttackActive = false;
                this.specialAttackDirection = null;
                this.chompCycle = 0;
            }
            return;
        }

        if (distance > 50) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }

        if (distance < 50 && this.attackCooldown <= 0 && respawnImmunity === 0) {
            const damage = Math.max(1, this.damage - defense);
            health = Math.max(0, health - damage);
            this.attackCooldown = 90;
            showPlayerHealthBar = true;
            playerHealthBarTimer = 180;
            updateUI();

            if (qolSettings.damageNumbers) {
                showDamageNumber(player.x, player.y - 20, damage);
            }

            if (health <= 0) {
                showRespawnButton();
            }
        }

        if (this.attackCooldown > 0) this.attackCooldown--;

        this.chargeRegenTimer++;
        if (this.chargeRegenTimer >= 300) {
            this.currentCharges = Math.min(this.specialCharges, this.currentCharges + 0.5);
            this.chargeRegenTimer = 0;
        }
    }
}

// Tree class
class Tree {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        
        // Set size and values based on tree type
        switch(type) {
            case 'dark':
                this.width = 20; // Smaller
                this.height = 30;
                this.maxHealth = 8;
                this.health = this.maxHealth;
                this.woodValue = 1;
                this.moneyValue = 10; // 10 money
                break;
            case 'light':
                this.width = 54; // 1.8x bigger (30 * 1.8)
                this.height = 72;
                this.maxHealth = 18;
                this.health = this.maxHealth;
                this.woodValue = 5;
                this.moneyValue = 40; // 40 money
                break;
            default:
                this.width = 30; // Normal size
                this.height = 40;
                this.maxHealth = 10;
                this.health = this.maxHealth;
                this.woodValue = Math.floor(Math.random() * 3) + 2;
                this.moneyValue = 20; // 20 money
        }
        
        this.respawnTimer = 0;
        this.alive = true;
        this.type = type;
        
        // Set tree colors based on type
        switch(type) {
            case 'dark':
                this.trunkColor = '#654321';
                this.leavesColor = '#006400';
                break;
            case 'light':
                this.trunkColor = '#DEB887';
                this.leavesColor = '#90EE90';
                break;
            case 'autumn':
                this.trunkColor = '#8B4513';
                this.leavesColor = '#FF8C00';
                break;
            case 'winter':
                this.trunkColor = '#696969';
                this.leavesColor = '#F0F8FF';
                break;
            default:
                this.trunkColor = '#8B4513';
                this.leavesColor = '#228B22';
        }
    }
    
    draw() {
        if (!this.alive) return;
        
        // Draw tree trunk
        ctx.fillStyle = this.trunkColor;
        ctx.fillRect(this.x - 5, this.y, 10, 20);
        
        // Draw tree leaves
        ctx.fillStyle = this.leavesColor;
        ctx.fillRect(this.x - 15, this.y - 20, 30, 25);
        
        // Add some detail to leaves
        if (this.type === 'winter') {
            // Snow on winter trees
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(this.x - 12, this.y - 18, 24, 3);
        }
        
        // Draw health bar
        if (this.health < this.maxHealth) {
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(this.x - 15, this.y - 30, 30, 4);
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(this.x - 15, this.y - 30, 30 * (this.health / this.maxHealth), 4);
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.alive = false;
            this.respawnTimer = 300; // 5 seconds at 60fps
            wood += this.woodValue;
            money += this.moneyValue;
            updateUI();
        }
    }
    
    update() {
        if (!this.alive) {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) {
                this.alive = true;
                this.health = this.maxHealth;
                
                // Reset values based on tree type
                switch(this.type) {
                    case 'dark':
                        this.woodValue = 1;
                        this.moneyValue = 10;
                        break;
                    case 'light':
                        this.woodValue = 5;
                        this.moneyValue = 40;
                        break;
                    default:
                        this.woodValue = Math.floor(Math.random() * 3) + 2;
                        this.moneyValue = 20;
                }
            }
        }
    }
}

// Wolf class
class Wolf {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 20;
        this.speed = 1.5;
        
        // Progressive difficulty based on nights survived
        const difficultyProgress = Math.min(nightsSurvived / 10, 1); // 0 to 1 over 10 nights
        
        // Start very weak, scale to full strength by night 10
        this.maxHealth = Math.floor(2 + (8 * difficultyProgress)); // 2 HP at start, 10 HP by night 10
        this.health = this.maxHealth;
        this.damage = Math.floor(2 + (8 * difficultyProgress)); // 2 damage at start, 10 damage by night 10
        
        this.attackCooldown = 0;
        this.alive = true;
        this.targetX = player.x;
        this.targetY = player.y;
        this.spreadOffset = Math.random() * Math.PI * 2; // For spreading wolves
        this.buffedByBoss = false;
        this.originalMaxHealth = this.maxHealth;
        this.originalDamage = this.damage;
        this.originalSpeed = this.speed;
        this.miniChargeActive = false;
        this.miniChargeTimer = 0;
        
        // Winter buff properties
        this.winterBuffed = false;
        this.slowEffect = false;
        this.slowDuration = 0;
        this.slowAmount = 0.5; // Slow player to 50% speed
        
        // Mountain buff properties
        this.mountainBuffed = false;
        this.armorBuffed = false;
        this.armorAmount = 0.5; // 50% damage reduction
        this.damageBoost = 1.5; // 50% damage boost
    }
    
    buffByBoss() {
        // Store original stats if not already stored
        if (!this.originalMaxHealth) {
            this.originalMaxHealth = this.maxHealth;
            this.originalDamage = this.damage;
            this.originalSpeed = this.speed;
        }
        
        if (!this.buffedByBoss) {
            this.buffedByBoss = true;
            
            // Apply buff
            this.maxHealth = Math.floor(this.originalMaxHealth * 1.8);
            this.health = this.maxHealth; // heal to full when buffed
            this.damage = Math.floor(this.originalDamage * 1.8);
            this.speed = this.originalSpeed * 1.8;
        }
    }
    
    debuffByBoss() {
        if (!this.buffedByBoss) return;
        
        this.buffedByBoss = false;
        
        // Restore original stats
        this.maxHealth = this.originalMaxHealth;
        this.health = Math.min(this.health, this.originalMaxHealth); // adjust current health if needed
        this.damage = this.originalDamage;
        this.speed = this.originalSpeed;
    }
    
    draw() {
        if (!this.alive) return;
        
        const difficultyProgress = Math.min(nightsSurvived / 10, 1);
        
        // Enhanced body colors with more variety and better gradients
        let bodyColor;
        if (this.winterBuffed) {
            bodyColor = '#00BFFF'; // Ice blue for winter buffed wolves
        } else if (this.buffedByBoss) {
            bodyColor = '#8B0000'; // Dark red when buffed
        } else {
            // More sophisticated color progression
            if (difficultyProgress < 0.3) {
                bodyColor = '#8B4513'; // Brown
            } else if (difficultyProgress < 0.6) {
                bodyColor = '#708090'; // Steel gray
            } else if (difficultyProgress < 0.8) {
                bodyColor = '#2F4F4F'; // Dark gray
            } else {
                bodyColor = '#1C1C1C'; // Near black
            }
        }
        
        // Draw shadow for depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x - this.width/2 + 2, this.y - this.height/2 + 2, this.width, this.height);
        
        // Draw main body
        ctx.fillStyle = bodyColor;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // Draw simple legs
        ctx.fillStyle = bodyColor;
        ctx.fillRect(this.x - 8, this.y + this.height/2 - 8, 4, 16);
        ctx.fillRect(this.x + 4, this.y + this.height/2 - 8, 4, 16);
        
        // Draw head
        ctx.fillStyle = bodyColor;
        ctx.fillRect(this.x - 8, this.y - this.height/2 - 15, 16, 15);
        
        // Draw eyes
        ctx.fillStyle = isNight ? '#FF0000' : '#FF6B35';
        const eyeSize = 3 + Math.floor(difficultyProgress * 2);
        ctx.fillRect(this.x - 4, this.y - this.height/2 - 5, eyeSize, eyeSize);
        ctx.fillRect(this.x + 2, this.y - this.height/2 - 5, eyeSize, eyeSize);
        
        // Draw tail
        ctx.fillStyle = bodyColor;
        ctx.fillRect(this.x - this.width/2 - 5, this.y - 2, 10, 3);
        
        // Draw teeth when aggressive
        if (difficultyProgress > 0.3) {
            ctx.fillStyle = '#FFFFFF';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(this.x - 1 + i * 2, this.y - this.height/2 - 10, 1, 2);
            }
        }
        
        // Draw strength indicator
        if (difficultyProgress > 0) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 10px monospace';
            const strengthText = difficultyProgress < 0.5 ? 'Weak' : (difficultyProgress < 1 ? 'Strong' : 'Alpha');
            ctx.fillText(strengthText, this.x - 15, this.y - this.height/2 - 30);
        }
        
        // Draw buff indicators
        if (this.mountainBuffed) {
            ctx.shadowColor = '#8B4513';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#D2691E';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - this.width/2 - 10, this.y - this.height/2 - 10, this.width + 20, this.height + 20);
            ctx.shadowBlur = 0;
        } else if (this.winterBuffed) {
            ctx.shadowColor = '#4169E1';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#87CEEB';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - this.width/2 - 10, this.y - this.height/2 - 10, this.width + 20, this.height + 20);
            ctx.shadowBlur = 0;
        }
        
        // Draw health bar
        if (this.health < this.maxHealth) {
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(this.x - 15, this.y - this.height/2 - 20, 30, 4);
            const healthPercent = this.health / this.maxHealth;
            ctx.fillStyle = healthPercent > 0.6 ? '#00FF00' : (healthPercent > 0.3 ? '#FFFF00' : '#FF0000');
            ctx.fillRect(this.x - 15, this.y - this.height/2 - 20, 30 * healthPercent, 4);
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.alive = false;
            money += Math.floor(Math.random() * 10) + 5;
            updateUI();
        }
    }
    
    update() {
        if (!this.alive) return;
        
        // Move towards player with spreading behavior
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 30) {
            // Add spreading behavior to prevent grouping
            let moveX = (dx / distance) * this.speed;
            let moveY = (dy / distance) * this.speed;
            
            // Check nearby wolves and spread out
            wolves.forEach(otherWolf => {
                if (otherWolf !== this && otherWolf.alive) {
                    const otherDist = Math.sqrt(Math.pow(otherWolf.x - this.x, 2) + Math.pow(otherWolf.y - this.y, 2));
                    if (otherDist < 50) {
                        // Spread away from nearby wolves
                        const avoidX = (this.x - otherWolf.x) / otherDist;
                        const avoidY = (this.y - otherWolf.y) / otherDist;
                        moveX += avoidX * 0.5;
                        moveY += avoidY * 0.5;
                    }
                }
            });
            
            this.x += moveX;
            this.y += moveY;
        }
        
        // Attack player if close enough
        if (distance < 40 && this.attackCooldown <= 0 && respawnImmunity === 0) {
            let damage = Math.max(1, this.damage - defense); // Armor reduces damage
            health -= damage;
            this.attackCooldown = 60; // 1 second cooldown
            showPlayerHealthBar = true;
            playerHealthBarTimer = 180; // Show for 3 seconds
            updateUI();
            
            if (health <= 0) {
                // Player death - show respawn button
                showRespawnButton();
            }
        }
        
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
    }
}

// Shop class
class Shop {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 50;
    }
    
    draw() {
        // Draw shop building
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // Draw roof
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(this.x - this.width/2 - 5, this.y - this.height/2 - 10, this.width + 10, 10);
        
        // Draw door
        ctx.fillStyle = '#654321';
        ctx.fillRect(this.x - 8, this.y - 5, 16, 25);
        
        // Draw sign
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.x - 15, this.y - this.height/2 - 20, 30, 8);
        ctx.fillStyle = '#000';
        ctx.font = '8px monospace';
        ctx.fillText('SHOP', this.x - 12, this.y - this.height/2 - 14);
    }
    
    isPlayerInside() {
        return Math.abs(player.x - this.x) < this.width/2 && 
               Math.abs(player.y - this.y) < this.height/2;
    }
}

// Cave class
class Cave {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 40;
        this.spawnTimer = 0;
        this.wolvesSpawnedThisNight = 0; // Track wolves spawned per night
    }
    
    draw() {
        // Draw cave entrance
        ctx.fillStyle = '#2F4F4F';
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // Draw cave darkness
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - this.width/2 + 10, this.y - this.height/2 + 10, this.width - 20, this.height - 20);
    }
    
    update() {
        if (isNight) {
            this.spawnTimer++;
            
            // Progressive wolf limits - increases each night
            const maxWolvesPerNight = Math.min(3 + Math.floor(nightsSurvived * 0.8), 12); // 3-12 wolves per night
            const maxWolvesAtOnce = Math.min(2 + Math.floor(nightsSurvived * 0.3), 6); // 2-6 wolves at once
            const spawnRate = Math.max(240 - (nightsSurvived * 15), 60); // Faster spawning at higher waves (4-1 minutes)
            
            // Check if we can spawn more wolves
            if (this.spawnTimer >= spawnRate && 
                wolves.length < maxWolvesAtOnce && 
                this.wolvesSpawnedThisNight < maxWolvesPerNight) {
                wolves.push(new Wolf(this.x, this.y));
                this.spawnTimer = 0;
                this.wolvesSpawnedThisNight++;
            }
        } else {
            this.spawnTimer = 0;
            // Reset counter when day comes
            this.wolvesSpawnedThisNight = 0;
        }
    }
}

// Input handling
const keys = {};
let mouseX = 0;
let mouseY = 0;

document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    // Prevent default for arrow keys to avoid page scrolling
    if(['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
        e.preventDefault();
    }
    
    // Inventory hotkeys
    if (qolSettings.inventoryHotkeys) {
        if (e.key.toLowerCase() === 'e') {
            eatBread();
        }
        if (e.key.toLowerCase() === 'q') {
            toggleInventory();
        }
        if (e.key >= '1' && e.key <= '9') {
            const slot = parseInt(e.key) - 1;
            selectInventorySlot(slot);
        }
    }
    
    if (e.key.toLowerCase() === 'i') {
        toggleInventory();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

 // Mouse tracking for bow aiming
 function updatePointerPosition(clientX, clientY) {
     const rect = canvas.getBoundingClientRect();
     const scaleX = canvas.width / rect.width;
     const scaleY = canvas.height / rect.height;
     mouseX = (clientX - rect.left) * scaleX;
     mouseY = (clientY - rect.top) * scaleY;
 }
 
 
 function shootArrow(angleOverride = null, speedOverride = null) {
     const currentWeapon = weapons[currentAxeIndex];
     const angle = (typeof angleOverride === 'number') ? angleOverride : Math.atan2(mouseY - player.y, mouseX - player.x);
     const speed = (typeof speedOverride === 'number') ? speedOverride : 10;
     
     player.arrows.push({
         x: player.x,
         y: player.y,
         vx: Math.cos(angle) * speed,
         vy: Math.sin(angle) * speed,
         damage: currentWeapon.damage,
         life: 120 // 2 seconds at 60fps
     });
 }

// UI functions
function toggleInventory() {
    inventoryOpen = !inventoryOpen;
    const inventory = document.getElementById('inventory');
    inventory.style.display = inventoryOpen ? 'block' : 'none';
    if (inventoryOpen) {
        populateInventory();
    }
}

function selectAxe(index) {
    const weapon = weapons[index];
    if (!weapon || !weapon.owned) {
        return;
    }
    if (weapon.mapRestriction && weapon.mapRestriction !== currentMap) {
        return;
    }
    currentAxeIndex = index;
    inventory.selectedSlot = index + 1;
    updateUI();
    populateInventory();
}

function selectInventorySlot(slot) {
    if (slot >= 0 && slot < 10) {
        inventory.selectedSlot = slot;
        if (slot > 0) {
            selectAxe(slot - 1);
            return;
        }
        populateInventory();
    }
}

function eatBread() {
    if (inventory.bread > 0 && health < maxHealth && respawnImmunity === 0) {
        inventory.bread--;
        const healAmount = Math.min(25, maxHealth - health);
        health = Math.min(maxHealth, health + healAmount);
        
        // Show healing effect
        showHealingEffect(healAmount);
        
        updateUI();
        populateInventory();
        
        console.log(`Ate bread, healed ${healAmount} HP`);
    }
}

function showHealingEffect(amount) {
    // Create floating heal number
    const healText = document.createElement('div');
    healText.textContent = `+${amount}`;
    const pos = canvasToScreen(player.x, player.y - 30);
    healText.style.cssText = `
        position: absolute;
        left: ${pos.x}px;
        top: ${pos.y}px;
        color: #00FF00;
        font: bold 20px monospace;
        pointer-events: none;
        z-index: 1000;
        animation: healFloat 1s ease-out;
    `;
    document.body.appendChild(healText);
    
    setTimeout(() => {
        if (healText.parentNode) {
            healText.parentNode.removeChild(healText);
        }
    }, 1000);
}

function toggleShop() {
    shopOpen = !shopOpen;
    const shop = document.getElementById('shop');
    shop.style.display = shopOpen ? 'block' : 'none';
    if (shopOpen) {
        populateShop();
    }
}

function populateInventory() {
    const inventoryItems = document.getElementById('inventoryItems');
    inventoryItems.innerHTML = '';
    
    // Add bread slot
    const breadSlot = document.createElement('div');
    breadSlot.className = `inventory-item ${inventory.selectedSlot === 0 ? 'selected' : ''}`;
    breadSlot.innerHTML = `
        <h4>Bread [${inventory.selectedSlot === 0 ? 'E' : '1'}]</h4>
        <p>Heals: 25 HP</p>
        <p>Quantity: ${inventory.bread}/${inventory.maxBread}</p>
        <p style="font-size: 10px; color: #888;">Press ${qolSettings.inventoryHotkeys ? 'E' : 'Click'} to eat</p>
    `;
    
    if (inventory.selectedSlot === 0) {
        breadSlot.onclick = eatBread;
    }
    
    inventoryItems.appendChild(breadSlot);
    
    // Add equipped items
    weapons.forEach((weapon, index) => {
        if (weapon.owned) {
            const item = document.createElement('div');
            item.className = 'inventory-item';
            if (index === currentAxeIndex) {
                item.style.border = '2px solid #00FF00';
                item.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
            }
            
            item.innerHTML = `
                <h4>${weapon.name}</h4>
                <p>Damage: ${weapon.damage}</p>
                <p style="font-size: 10px; color: #888;">Slot ${index + 2}</p>
            `;
            
            item.onclick = () => selectAxe(index);
            inventoryItems.appendChild(item);
        }
    });
}

function switchShopTab(tabName) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.shop-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.shop-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    event.target.classList.add('active');
    document.getElementById(tabName + '-content').classList.add('active');
}

function populateShop() {
    console.log('Populating shop - reequipCooldown:', reequipCooldown);
    
    // Clear all tabs completely
    const foodContent = document.getElementById('food-content');
    const armorContent = document.getElementById('armor-content'); 
    const weaponsContent = document.getElementById('weapons-content');
    const mapsContent = document.getElementById('maps-content');
    
    foodContent.innerHTML = '';
    armorContent.innerHTML = '';
    weaponsContent.innerHTML = '';
    mapsContent.innerHTML = '';
    
    // === FOOD TAB ===
    const breadItem = createShopItem('Bread', 'Heals: 25 HP', '$15', () => buyBread());
    breadItem.innerHTML += `<p>Inventory: ${inventory.bread}/${inventory.maxBread}</p>`;
    foodContent.appendChild(breadItem);
    
    // === ARMOR TAB ===
    armors.forEach((armor, index) => {
        const isEquipped = index === currentArmorIndex;
        const isOnCooldown = reequipCooldown > 0;
        
        if (!armor.owned) {
            // Show unowned armor for purchase
            const item = createShopItem(`${armor.name} Armor`, `Defense: ${armor.defense}`, `$${armor.cost}`, () => buyArmor(index));
            armorContent.appendChild(item);
        } else if (!isEquipped && !isOnCooldown) {
            // Show owned but unequipped armor (no cooldown)
            const item = createShopItem(`${armor.name} Armor (Owned)`, `Defense: ${armor.defense}`, 'Click to equip', () => {
                currentArmorIndex = index;
                defense = armor.defense;
                updateUI();
                console.log(`Equipped ${armor.name} Armor`);
            });
            armorContent.appendChild(item);
        }
        // If equipped or on cooldown, don't show at all
    });
    
    // === WEAPONS TAB ===
    weapons.forEach((weapon, index) => {
        // Skip map-restricted weapons
        if (weapon.mapRestriction && weapon.mapRestriction !== currentMap) {
            return;
        }
        
        const isEquipped = index === currentAxeIndex;
        const isOnCooldown = reequipCooldown > 0;
        
        if (!weapon.owned) {
            // Show unowned weapon for purchase
            const mapRestrictionText = weapon.mapRestriction ? 
                `<p style="font-size: 12px; color: #FFA500;">Only on ${maps[weapon.mapRestriction].name} map</p>` : '';
            
            const item = createShopItem(weapon.name, `Damage: ${weapon.damage}`, `$${weapon.cost}`, () => buyWeapon(index));
            item.innerHTML += mapRestrictionText;
            weaponsContent.appendChild(item);
        } else if (!isEquipped && !isOnCooldown) {
            // Show owned but unequipped weapon (no cooldown)
            const mapRestrictionText = weapon.mapRestriction ? 
                `<p style="font-size: 12px; color: #FFA500;">Only on ${maps[weapon.mapRestriction].name} map</p>` : '';
            
            const item = createShopItem(`${weapon.name} (Owned)`, `Damage: ${weapon.damage}`, 'Click to equip', () => {
                currentAxeIndex = index;
                updateUI();
                console.log(`Equipped ${weapon.name}`);
            });
            item.innerHTML += mapRestrictionText;
            weaponsContent.appendChild(item);
        }
        // If equipped or on cooldown, don't show at all
    });
    
    // === MAPS TAB ===
    Object.entries(maps).forEach(([key, map]) => {
        const item = createShopItem(`${map.name} Map`, '', '', () => {});
        
        if (map.unlocked) {
            item.innerHTML = `
                <p>Status: <span style="color: #00FF00;">UNLOCKED</span></p>
                <button onclick="switchToMap('${key}')" style="
                    padding: 8px 16px;
                    font-size: 14px;
                    background: #00FF00;
                    color: #000;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                    font-weight: bold;
                ">Go to Map</button>
            `;
        } else {
            let unlockText = '';
            if (key === 'mountains') {
                unlockText = 'Complete 10 days in Forest to unlock!';
            } else if (key === 'winter') {
                unlockText = 'Complete 10 days in Mountains to unlock!';
            }
            
            item.innerHTML = `
                <p>Status: <span style="color: #FF0000;">LOCKED</span></p>
                <p>${unlockText}</p>
                <p style="font-size: 12px; color: #ccc;">Complete maps in order to unlock</p>
            `;
        }
        
        mapsContent.appendChild(item);
    });
}

// Helper function to create consistent shop items
function createShopItem(title, description, costText, onClick) {
    const item = document.createElement('div');
    item.className = 'shop-item';
    item.innerHTML = `<h4>${title}</h4><p>${description}</p><p>${costText}</p>`;
    item.onclick = onClick;
    return item;
}

function loadMap(mapKey) {
    console.log('=== LOAD MAP START ===');
    console.log('Before reset - currentDay:', currentDay, 'nightsSurvived:', nightsSurvived, 'isNight:', isNight);
    console.log('Before reset - inventory:', JSON.stringify(inventory));
    console.log('Before reset - money:', money, 'wood:', wood);
    
    // Reset game state for new map
    stopGameLoop();
    
    // Reset player stats
    health = maxHealth;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.speed = 3;
    money = 50; // Reset to starting money
    wood = 0;
    nightsSurvived = 0;
    currentDay = 1;
    isNight = false;
    dayNightTimer = 0;
    bossActive = false;
    boss = null;
    wolves = [];
    gamePaused = false;
    respawnImmunity = 0;
    currentArmorIndex = -1;
    defense = 0;
    armors.forEach(armor => {
        armor.owned = false;
    });
    // Reset weapon back to starter axe
    if (weapons && weapons.length) {
        weapons.forEach(w => {
            w.owned = false;
        });
        if (weapons[0]) {
            weapons[0].owned = true;
        }
    }
    currentAxeIndex = 0;
    
    // Reset inventory when switching maps
    inventory.bread = 0; // Lose all bread
    inventory.maxBread = 10; // Reset max bread to default
    inventory.selectedSlot = 1; // Starter axe slot
    inventory.items = []; // Clear all inventory items
    
    // Set new map
    currentMap = mapKey;
    
    // Generate map-specific content
    generateMapContent();
    
    console.log('Map loaded successfully');
}

// Generate map-specific content
function generateMapContent() {
    // Clear existing entities
    trees = [];
    wolves = [];
    boss = null;
    bossActive = false;
    
    // Create shop
    shop = new Shop(canvas.width / 2 - 100, canvas.height / 2);
    
    // Create cave
    cave = new Cave(canvas.width / 2, 100);
    
    // Generate trees based on map type
    const treeCount = 15 + Math.floor(Math.random() * 5);
    for (let i = 0; i < treeCount; i++) {
        let x = Math.random() * (canvas.width - 100) + 50;
        let y = Math.random() * (canvas.height - 200) + 100;
        
        // Ensure trees don't spawn too close to shop or cave
        while (Math.abs(x - shop.x) < 80) {
            x = Math.random() * (canvas.width - 100) + 50;
        }
        while (Math.abs(y - cave.y) < 80) {
            y = Math.random() * (canvas.height - 200) + 100;
        }
        
        // Random tree type based on map
        let treeType = 'normal';
        if (currentMap === 'winter') {
            treeType = Math.random() < 0.3 ? 'dark' : 'normal';
        }
        
        trees.push(new Tree(x, y, treeType));
    }
    
    console.log(`Generated ${trees.length} trees for ${maps[currentMap].name} map`);
}

function loadMapLegacy(mapKey) {
    console.log('=== LOADING MAP ===');
    console.log('Loading map:', mapKey);
    populateInventory();
}

function buyWeapon(index) {
    const weapon = weapons[index];
    if (money >= weapon.cost) {
        money -= weapon.cost;
        weapon.owned = true;
        currentAxeIndex = index;
        updateUI();
        populateShop();
        console.log(`Bought ${weapon.name} for $${weapon.cost}`);
    }
}

function buyBread() {
    if (money >= 15 && inventory.bread < inventory.maxBread) {
        money -= 15;
        inventory.bread++;
        updateUI();
        populateShop();
        console.log('Bought bread, inventory now has ' + inventory.bread + ' bread');
    }
}

function buyArmor(index) {
    const armor = armors[index];
    if (money >= armor.cost) {
        money -= armor.cost;
        armor.owned = true;
        currentArmorIndex = index;
        defense = armor.defense;
        updateUI();
        populateShop();
        console.log(`Bought ${armor.name} Armor for $${armor.cost}`);
    }
}

function buyMap(mapKey) {
    const map = maps[mapKey];
    if (money >= map.cost) {
        money -= map.cost;
        map.unlocked = true;
        currentMap = mapKey;
        updateUI();
        loadMap(mapKey);
        populateShop();
    }
}

function switchToMap(mapKey) {
    if (!maps[mapKey] || !maps[mapKey].unlocked) {
        return;
    }
    loadMap(mapKey);
    updateUI();
    populateShop();
    startGameLoop();
}

document.getElementById('closeShop').onclick = toggleShop;
document.getElementById('closeInventory').onclick = toggleInventory;

// QoL panel wiring
window.addEventListener('load', function() {
    const autoEatEl = document.getElementById('qolAutoEat');
    const dmgNumsEl = document.getElementById('qolDamageNumbers');
    const regenEl = document.getElementById('qolHealthRegen');
    const invHotkeysEl = document.getElementById('qolInventoryHotkeys');

    if (autoEatEl) {
        autoEatEl.checked = !!qolSettings.autoEat;
        autoEatEl.addEventListener('change', (e) => {
            qolSettings.autoEat = e.target.checked;
        });
    }

    if (dmgNumsEl) {
        dmgNumsEl.checked = !!qolSettings.damageNumbers;
        dmgNumsEl.addEventListener('change', (e) => {
            qolSettings.damageNumbers = e.target.checked;
        });
    }

    if (regenEl) {
        regenEl.checked = !!qolSettings.healthRegen;
        regenEl.addEventListener('change', (e) => {
            qolSettings.healthRegen = e.target.checked;
        });
    }

    if (invHotkeysEl) {
        invHotkeysEl.checked = !!qolSettings.inventoryHotkeys;
        invHotkeysEl.addEventListener('change', (e) => {
            qolSettings.inventoryHotkeys = e.target.checked;
        });
    }

     const bindHoldButton = (id, onDown, onUp) => {
         const el = document.getElementById(id);
         if (!el) return;

         const handleDown = (e) => {
             e.preventDefault();
             e.stopPropagation();
             onDown();
         };

         const handleUp = (e) => {
             e.preventDefault();
             e.stopPropagation();
             onUp();
         };

         el.addEventListener('pointerdown', handleDown);
         el.addEventListener('pointerup', handleUp);
         el.addEventListener('pointercancel', handleUp);
         el.addEventListener('pointerleave', handleUp);
     };

     const setMoveKey = (keyName, isDown) => {
         keys[keyName] = isDown;
     };

    // Remove old D-pad bindings since we're using joystick
    // bindHoldButton('mobileUp', () => setMoveKey('w', true), () => setMoveKey('w', false));
    // bindHoldButton('mobileDown', () => setMoveKey('s', true), () => setMoveKey('s', false));
    // bindHoldButton('mobileLeft', () => setMoveKey('a', true), () => setMoveKey('a', false));
    // bindHoldButton('mobileRight', () => setMoveKey('d', true), () => setMoveKey('d', false));

     bindHoldButton('mobileAttack', () => {
         const currentWeapon = weapons[currentAxeIndex];
         if (currentWeapon && currentWeapon.type === 'bow' && currentWeapon.owned && currentMap === 'mountains') {
             return;
         } else {
             keys[' '] = true;
         }
     }, () => {
         keys[' '] = false;
     });

     const mobileEat = document.getElementById('mobileEat');
     if (mobileEat) {
         mobileEat.addEventListener('pointerdown', (e) => {
             e.preventDefault();
             e.stopPropagation();
             eatBread();
         });
     }

     const mobileInv = document.getElementById('mobileInventory');
     if (mobileInv) {
         mobileInv.addEventListener('pointerdown', (e) => {
             e.preventDefault();
             e.stopPropagation();
             toggleInventory();
         });
     }
});

// Toggle QoL panel
function toggleQolPanel() {
    const content = document.getElementById('qolContent');
    const toggle = document.getElementById('qolToggle');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.textContent = '▼';
    } else {
        content.style.display = 'none';
        toggle.textContent = '▶';
    }
}

// Toggle Testing panel
function toggleTestingPanel() {
    const content = document.getElementById('testingContent');
    const toggle = document.getElementById('testingToggle');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.textContent = '▼';
    } else {
        content.style.display = 'none';
        toggle.textContent = '▶';
    }
}

// Testing functions
function testAddMoney() {
    money += 100;
    updateUI();
    console.log('Added $100');
}

function testAddWood() {
    wood += 10;
    updateUI();
    console.log('Added 10 wood');
}

function testHeal() {
    health = maxHealth;
    updateUI();
    console.log('Full heal');
}

function testAddBread() {
    inventory.bread = Math.min(inventory.bread + 5, inventory.maxBread);
    updateUI();
    console.log('Added 5 bread');
}

function testSpawnWolf() {
    const x = Math.random() * (canvas.width - 100) + 50;
    const y = Math.random() * (canvas.height - 100) + 50;
    wolves.push(new Wolf(x, y));
    console.log('Spawned wolf at', x, y);
}

function testSpawnBoss() {
    if (!bossActive) {
        const x = canvas.width / 2;
        const y = canvas.height / 2;
        boss = new Boss(x, y, 1, maps[currentMap].type);
        bossActive = true;
        console.log('Spawned boss');
    }
}

function testToggleNight() {
    isNight = !isNight;
    if (!isNight) {
        wolves = []; // Clear wolves when switching to day
    }
    updateUI();
    console.log('Toggled to', isNight ? 'Night' : 'Day');
}

function testSkipToNight10() {
    nightsSurvived = 9;
    currentDay = 10;
    isNight = true;
    dayNightTimer = 0;
    updateUI();
    console.log('Skipped to Night 10');
}

function testUnlockAllWeapons() {
    weapons.forEach(weapon => {
        weapon.owned = true;
    });
    currentAxeIndex = weapons.length - 1;
    updateUI();
    populateShop();
    console.log('Unlocked all weapons');
}

function testUnlockAllArmor() {
    armors.forEach(armor => {
        armor.owned = true;
    });
    currentArmorIndex = armors.length - 1;
    defense = armors[currentArmorIndex].defense;
    updateUI();
    populateShop();
    console.log('Unlocked all armor');
}

function testUnlockMaps() {
    Object.keys(maps).forEach(key => {
        maps[key].unlocked = true;
    });
    updateUI();
    populateShop();
    console.log('Unlocked all maps');
}

function testKillAllEnemies() {
    wolves = [];
    if (boss) {
        boss.alive = false;
        boss = null;
        bossActive = false;
    }
    console.log('Killed all enemies');
}

function testResetGame() {
    location.reload();
}

function testToggleMobileControls() {
    const body = document.body;
    const mobileControls = document.querySelectorAll('.mobile-controls');
    
    if (body.classList.contains('mobile-force')) {
        // Remove mobile controls
        body.classList.remove('mobile-force');
        console.log('Mobile controls hidden');
    } else {
        // Show mobile controls
        body.classList.add('mobile-force');
        console.log('Mobile controls shown');
    }
}

function showUnlockMessage(mapName) {
    const unlockMessage = document.createElement('div');
    unlockMessage.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #FFD700, #FFA500);
        color: #000;
        padding: 20px 40px;
        border-radius: 10px;
        font-size: 24px;
        font-weight: bold;
        text-align: center;
        z-index: 10000;
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
        animation: unlockPulse 2s ease-in-out;
    `;
    unlockMessage.innerHTML = `
        <div>🎉 MAP UNLOCKED! 🎉</div>
        <div style="font-size: 18px; margin-top: 10px;">${mapName}</div>
    `;
    document.body.appendChild(unlockMessage);
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes unlockPulse {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
            50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // Remove message after 5 seconds
    setTimeout(() => {
        if (unlockMessage.parentNode) {
            unlockMessage.parentNode.removeChild(unlockMessage);
        }
    }, 5000);
    
    updateUI();
    populateShop(); // Refresh shop to show unlocked map
}

// Initialize joystick events with multi-touch support
let joystickTouchId = null; // Track specific touch for joystick
let joystickCenter = { x: 0, y: 0 };

window.addEventListener('load', function() {
    const joystickHandle = document.getElementById('joystickHandle');
    if (!joystickHandle) return;
    const joystickBase = joystickHandle.parentElement;
    let joystickPointerId = null;

    const forceEndMoveJoystick = () => {
        if (!joystickActive && joystickPointerId === null) return;
        joystickActive = false;
        joystickPointerId = null;
        resetJoystick(joystickHandle);
        resetJoystickBase(joystickBase);
    };
    
    const handleStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (joystickPointerId !== null) return;
        joystickPointerId = e.pointerId;
        joystickActive = true;
        setJoystickBaseCenter(joystickBase, e.clientX, e.clientY);
        resetJoystick(joystickHandle);
        joystickBase.setPointerCapture(joystickPointerId);
    };
    
    const handleMove = (e) => {
        if (!joystickActive) return;
        if (e.pointerId !== joystickPointerId) return;
        e.preventDefault();
        updateJoystickPositionDynamic(joystickHandle, e.clientX, e.clientY);
    };
    
    const handleEnd = (e) => {
        if (e.pointerId !== joystickPointerId) return;
        e.preventDefault();
        forceEndMoveJoystick();
    };

    joystickBase.addEventListener('pointerdown', handleStart);
    joystickBase.addEventListener('pointermove', handleMove);
    joystickBase.addEventListener('pointerup', handleEnd);
    joystickBase.addEventListener('pointercancel', handleEnd);
    joystickBase.addEventListener('pointerleave', forceEndMoveJoystick);
    joystickBase.addEventListener('lostpointercapture', forceEndMoveJoystick);

    const globalEnd = (e) => {
        if (joystickPointerId === null) return;
        if (e.pointerId !== joystickPointerId) return;
        forceEndMoveJoystick();
    };

    window.addEventListener('pointerup', globalEnd, true);
    window.addEventListener('pointercancel', globalEnd, true);

    window.addEventListener('blur', forceEndMoveJoystick);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) forceEndMoveJoystick();
    });
});

// Aim joystick state (right side)
let aimJoystickTouchId = null;
let aimJoystickActive = false;
let aimJoystickVector = { x: 0, y: 0 };
let aimJoystickCenter = { x: 0, y: 0 };
let aimJoystickLastVector = { x: 1, y: 0 };

window.addEventListener('load', function() {
    const aimHandle = document.getElementById('aimJoystickHandle');
    if (!aimHandle) return;
    const aimBase = aimHandle.parentElement;
    let aimPointerId = null;

    const canUseBow = () => {
        const currentWeapon = weapons[currentAxeIndex];
        return currentWeapon && currentWeapon.type === 'bow' && currentWeapon.owned && currentMap === 'mountains';
    };

    const setAimBaseCenter = (clientX, clientY) => {
        const rect = aimBase.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = clientX - centerX;
        const dy = clientY - centerY;
        aimBase.style.transform = `translate(${dx}px, ${dy}px)`;
        aimJoystickCenter = { x: clientX, y: clientY };
    };

    const resetAimBase = () => {
        aimBase.style.transform = 'translate(0px, 0px)';
        const rect = aimBase.getBoundingClientRect();
        aimJoystickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };

    const updateAimJoystickDynamic = (clientX, clientY) => {
        const rect = aimBase.getBoundingClientRect();
        const centerX = aimJoystickCenter.x || (rect.left + rect.width / 2);
        const centerY = aimJoystickCenter.y || (rect.top + rect.height / 2);

        let deltaX = clientX - centerX;
        let deltaY = clientY - centerY;

        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxDistance = rect.width / 2 - 20;

        const deadZonePx = 8;
        if (distance < deadZonePx) {
            aimHandle.style.transform = 'translate(-50%, -50%)';
            aimJoystickVector = { x: 0, y: 0 };
            return;
        }

        if (distance > maxDistance) {
            deltaX = (deltaX / distance) * maxDistance;
            deltaY = (deltaY / distance) * maxDistance;
        }

        aimHandle.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;

        const normalizedX = deltaX / maxDistance;
        const normalizedY = deltaY / maxDistance;
        aimJoystickVector = { x: normalizedX, y: normalizedY };
        aimJoystickLastVector = { x: normalizedX, y: normalizedY };

        if (Math.abs(normalizedX) > 0.02 || Math.abs(normalizedY) > 0.02) {
            mouseX = player.x + normalizedX * 100;
            mouseY = player.y + normalizedY * 100;
        }
    };

    const resetAimJoystick = () => {
        aimHandle.style.transform = 'translate(-50%, -50%)';
        aimJoystickVector = { x: 0, y: 0 };
    };

    const startBowCharge = () => {
        if (!player) return;
        player.bowCharging = true;
        // Keep existing bowCharge ramp behavior in updatePlayer
    };

    const releaseBowCharge = () => {
        if (!player) return;

        if (player.bowCharging) {
            player.bowCharging = false;

            const v = (Math.abs(aimJoystickVector.x) > 0.02 || Math.abs(aimJoystickVector.y) > 0.02)
                ? aimJoystickVector
                : aimJoystickLastVector;

            const dx = v.x;
            const dy = v.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const chargeRatio = player.maxBowCharge ? Math.min(1, (player.bowCharge || 0) / player.maxBowCharge) : 0;

            if (len > 0.05) {
                const angle = Math.atan2(dy, dx);
                const speed = 10 + (10 * chargeRatio);
                shootArrow(angle, speed);
            } else {
                // Fallback: fire in facing direction
                const angle = player.facing === 'up' ? -Math.PI / 2
                    : player.facing === 'down' ? Math.PI / 2
                    : player.facing === 'left' ? Math.PI
                    : 0;
                const speed = 10 + (10 * chargeRatio);
                shootArrow(angle, speed);
            }

            player.bowCharge = 0;
        }
    };

    const handleAimStart = (e) => {
        if (!canUseBow()) return;
        e.preventDefault();
        e.stopPropagation();
        if (aimPointerId !== null) return;
        aimPointerId = e.pointerId;
        aimJoystickActive = true;
        setAimBaseCenter(e.clientX, e.clientY);
        resetAimJoystick();
        startBowCharge();
        aimBase.setPointerCapture(aimPointerId);
    };

    const handleAimMove = (e) => {
        if (!aimJoystickActive) return;
        if (e.pointerId !== aimPointerId) return;
        e.preventDefault();
        updateAimJoystickDynamic(e.clientX, e.clientY);
    };

    const handleAimEnd = (e) => {
        if (e.pointerId !== aimPointerId) return;
        e.preventDefault();
        if (!aimJoystickActive) return;
        aimJoystickActive = false;
        aimPointerId = null;
        releaseBowCharge();
        resetAimJoystick();
        resetAimBase();
    };

    aimBase.addEventListener('pointerdown', handleAimStart);
    aimBase.addEventListener('pointermove', handleAimMove);
    aimBase.addEventListener('pointerup', handleAimEnd);
    aimBase.addEventListener('pointercancel', handleAimEnd);
});

// Joystick functionality
let joystickActive = false;
let joystickOrigin = { x: 0, y: 0 };
let joystickPosition = { x: 0, y: 0 };

function updateJoystickPosition(handle, x, y) {
    const base = handle.parentElement;
    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let deltaX = x - centerX;
    let deltaY = y - centerY;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = rect.width / 2 - 20;
    
    if (distance > maxDistance) {
        deltaX = (deltaX / distance) * maxDistance;
        deltaY = (deltaY / distance) * maxDistance;
    }
    
    handle.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
    
    // Update movement keys based on joystick position
    const threshold = 0.3;
    const normalizedX = deltaX / maxDistance;
    const normalizedY = deltaY / maxDistance;
    
    keys['w'] = normalizedY < -threshold;
    keys['s'] = normalizedY > threshold;
    keys['a'] = normalizedX < -threshold;
    keys['d'] = normalizedX > threshold;
    
    joystickPosition = { x: normalizedX, y: normalizedY };
}

function resetJoystick(handle) {
    handle.style.transform = 'translate(-50%, -50%)';
    keys['w'] = false;
    keys['s'] = false;
    keys['a'] = false;
    keys['d'] = false;
    joystickPosition = { x: 0, y: 0 };
}

function setJoystickBaseCenter(baseEl, clientX, clientY) {
    const rect = baseEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    baseEl.style.transform = `translate(${dx}px, ${dy}px)`;
    joystickCenter = { x: clientX, y: clientY };
}

function resetJoystickBase(baseEl) {
    baseEl.style.transform = 'translate(0px, 0px)';
    const rect = baseEl.getBoundingClientRect();
    joystickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function updateJoystickPositionDynamic(handle, x, y) {
    const base = handle.parentElement;
    const rect = base.getBoundingClientRect();
    const centerX = joystickCenter.x || (rect.left + rect.width / 2);
    const centerY = joystickCenter.y || (rect.top + rect.height / 2);
    
    let deltaX = x - centerX;
    let deltaY = y - centerY;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = rect.width / 2 - 20;

    // Roblox-style: don't move until finger actually drags a bit
    const deadZonePx = 8;
    if (distance < deadZonePx) {
        handle.style.transform = 'translate(-50%, -50%)';
        keys['w'] = false;
        keys['s'] = false;
        keys['a'] = false;
        keys['d'] = false;
        joystickPosition = { x: 0, y: 0 };
        return;
    }
    
    if (distance > maxDistance) {
        deltaX = (deltaX / distance) * maxDistance;
        deltaY = (deltaY / distance) * maxDistance;
    }
    
    handle.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
    
    const threshold = 0.3;
    const normalizedX = deltaX / maxDistance;
    const normalizedY = deltaY / maxDistance;
    
    keys['w'] = normalizedY < -threshold;
    keys['s'] = normalizedY > threshold;
    keys['a'] = normalizedX < -threshold;
    keys['d'] = normalizedX > threshold;
    
    joystickPosition = { x: normalizedX, y: normalizedY };
}

// Map functions
function loadMapSimple(mapName) {
    trees = [];
    wolves = [];
    
    if (mapName === 'forest') {
        // Forest map - normal trees
        for (let i = 0; i < 15; i++) {
            let x, y;
            do {
                x = Math.random() * (canvas.width - 40) + 20;
                y = Math.random() * (canvas.height - 60) + 30;
            } while (Math.abs(x - player.x) < 50 && Math.abs(y - player.y) < 50);
            
            const treeTypes = ['normal', 'dark', 'light'];
            const treeType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
            trees.push(new Tree(x, y, treeType));
        }
        
        shop = new Shop(100, 100);
        cave = new Cave(canvas.width - 100, canvas.height - 100);
        
    } else if (mapName === 'mountains') {
        // Mountains map - more trees, autumn colors
        for (let i = 0; i < 20; i++) {
            let x, y;
            do {
                x = Math.random() * (canvas.width - 40) + 20;
                y = Math.random() * (canvas.height - 60) + 30;
            } while (Math.abs(x - player.x) < 50 && Math.abs(y - player.y) < 50);
            
            const treeTypes = ['normal', 'dark', 'autumn'];
            const treeType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
            trees.push(new Tree(x, y, treeType));
        }
        
        shop = new Shop(100, 100);
        cave = new Cave(canvas.width - 100, 100);
        
    } else if (mapName === 'winter') {
        // Winter map - winter trees
        for (let i = 0; i < 18; i++) {
            let x, y;
            do {
                x = Math.random() * (canvas.width - 40) + 20;
                y = Math.random() * (canvas.height - 60) + 30;
            } while (Math.abs(x - player.x) < 50 && Math.abs(y - player.y) < 50);
            
            trees.push(new Tree(x, y, 'winter'));
        }
        
        shop = new Shop(100, 100);
        cave = new Cave(canvas.width - 100, canvas.height - 100);
    }
}

// Update functions
function updatePlayer() {
    // Ensure player speed is always at default value
    if (player.speed !== 3) {
        player.speed = 3;
    }
    
    // Movement with facing direction
    let moved = false;
    if (keys['w'] || keys['arrowup']) {
        player.y -= player.speed;
        player.facing = 'up';
        moved = true;
    }
    if (keys['s'] || keys['arrowdown']) {
        player.y += player.speed;
        player.facing = 'down';
        moved = true;
    }
    if (keys['a'] || keys['arrowleft']) {
        player.x -= player.speed;
        player.facing = 'left';
        moved = true;
    }
    if (keys['d'] || keys['arrowright']) {
        player.x += player.speed;
        player.facing = 'right';
        moved = true;
    }
    
    // Keep player in bounds
    player.x = Math.max(player.width/2, Math.min(canvas.width - player.width/2, player.x));
    player.y = Math.max(player.height/2, Math.min(canvas.height - player.height/2, player.y));
    
    // Check shop interaction
    if (shop && shop.isPlayerInside() && !inShop) {
        inShop = true;
        toggleShop();
    } else if (shop && !shop.isPlayerInside() && inShop) {
        inShop = false;
        if (shopOpen) toggleShop();
    }
    
    // Attack/Chopping
    if (keys[' '] && !player.cutting && player.attackCooldown <= 0) {
        const currentWeapon = weapons[currentAxeIndex];
        
        // Only melee weapons can chop trees and attack with spacebar
        if (!currentWeapon.type || currentWeapon.type !== 'bow') {
            player.cutting = true;
            player.cutTimer = 30;
            // Use weapon's custom cooldown or default to 20
            player.attackCooldown = currentWeapon.attackCooldown || 20;
            
            // Check for nearby trees
            trees.forEach(tree => {
                if (tree.alive) {
                    const dist = Math.sqrt(Math.pow(tree.x - player.x, 2) + Math.pow(tree.y - player.y, 2));
                    if (dist < 40) {
                        tree.takeDamage(currentWeapon.damage);
                    }
                }
            });
            
            // Check for nearby wolves
            wolves.forEach(wolf => {
                if (wolf.alive) {
                    const dist = Math.sqrt(Math.pow(wolf.x - player.x, 2) + Math.pow(wolf.y - player.y, 2));
                    if (dist < 40) {
                        // Progressive damage to wolves based on weapon level
                        let wolfDamage = Math.ceil(currentWeapon.damage * 0.6); // 60% damage to wolves
                        if (wolfDamage < 1) wolfDamage = 1;
                        wolf.takeDamage(wolfDamage);
                        
                        // Show damage numbers if enabled
                        if (qolSettings.damageNumbers) {
                            showDamageNumber(wolf.x, wolf.y, wolfDamage);
                        }
                    }
                }
            });
            
            // Check for boss
            if (boss && boss.alive) {
                const dist = Math.sqrt(Math.pow(boss.x - player.x, 2) + Math.pow(boss.y - player.y, 2));
                if (dist < 50) {
                    // Full damage to boss (not reduced)
                    boss.takeDamage(currentWeapon.damage);
                    
                    // Show damage numbers if enabled
                    if (qolSettings.damageNumbers) {
                        showDamageNumber(boss.x, boss.y, currentWeapon.damage);
                    }
                }
            }
        }
    }
    
    if (player.cutTimer > 0) {
        player.cutTimer--;
        if (player.cutTimer === 0) {
            player.cutting = false;
        }
    }
    
    if (player.attackCooldown > 0) {
        player.attackCooldown--;
    }
    
    // Bow charging mechanics
    if (player.bowCharging) {
        player.bowCharge = Math.min(player.bowCharge + 1, player.maxBowCharge);
    }
    
    // Update arrows
    player.arrows = player.arrows.filter(arrow => {
        arrow.x += arrow.vx;
        arrow.y += arrow.vy;
        arrow.life--;
        
        // Check collision with wolves
        wolves.forEach(wolf => {
            if (wolf.alive) {
                const dist = Math.sqrt(Math.pow(wolf.x - arrow.x, 2) + Math.pow(wolf.y - arrow.y, 2));
                if (dist < 15) {
                    wolf.takeDamage(arrow.damage);
                    if (qolSettings.damageNumbers) {
                        showDamageNumber(wolf.x, wolf.y, arrow.damage);
                    }
                    return false; // Remove arrow
                }
            }
        });
        
        // Check collision with boss
        if (boss && boss.alive) {
            const dist = Math.sqrt(Math.pow(boss.x - arrow.x, 2) + Math.pow(boss.y - arrow.y, 2));
            if (dist < 30) {
                boss.takeDamage(arrow.damage);
                if (qolSettings.damageNumbers) {
                    showDamageNumber(boss.x, boss.y, arrow.damage);
                }
                return false; // Remove arrow
            }
        }
        
        // Remove arrow if out of bounds or expired
        return arrow.life > 0 && 
               arrow.x > 0 && arrow.x < canvas.width && 
               arrow.y > 0 && arrow.y < canvas.height;
    });
}


function endGame() {
    // Stop game loop
    stopGameLoop();
    
    // Show victory screen
    const victoryScreen = document.createElement('div');
    victoryScreen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
        color: #FFD700;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: monospace;
    `;
    
    victoryScreen.innerHTML = `
        <div style="text-align: center;">
            <h1 style="font-size: 48px; margin-bottom: 20px; text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);">VICTORY!</h1>
            <div style="font-size: 24px; margin-bottom: 10px;">You survived 10 waves!</div>
            <div style="font-size: 18px; margin-bottom: 30px; color: #ccc;">Final Stats:</div>
            <div style="font-size: 16px; margin-bottom: 5px;">Money: $${money}</div>
            <div style="font-size: 16px; margin-bottom: 5px;">Wood: ${wood}</div>
            <div style="font-size: 16px; margin-bottom: 30px;">Maps Unlocked: ${Object.values(maps).filter(m => m.unlocked).length}/3</div>
            ${currentMap === 'forest' && maps.mountains.unlocked ? `
                <button onclick="switchToVictoryMap('mountains')" style="
                    padding: 15px 30px;
                    font-size: 18px;
                    background: linear-gradient(135deg, #00FF00, #00AA00);
                    color: #000;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                    margin-bottom: 10px;
                ">Play in Mountains</button>
            ` : ''}
            ${currentMap === 'mountains' && maps.winter.unlocked ? `
                <button onclick="switchToVictoryMap('winter')" style="
                    padding: 15px 30px;
                    font-size: 18px;
                    background: linear-gradient(135deg, #00CED1, #0088CC);
                    color: #000;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                    margin-bottom: 10px;
                ">Play in Winter</button>
            ` : ''}
            <button onclick="location.reload()" style="
                padding: 15px 30px;
                font-size: 18px;
                background: linear-gradient(135deg, #FF6B6B, #8B0000);
                color: #FFF;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                margin-top: 10px;
            ">Play Again</button>
        </div>
    `;
    
    document.body.appendChild(victoryScreen);
    
    // Store reference to victory screen
    window.currentVictoryScreen = victoryScreen;
}

function switchToVictoryMap(mapKey) {
    if (maps[mapKey].unlocked) {
        // Remove victory screen
        if (window.currentVictoryScreen) {
            document.body.removeChild(window.currentVictoryScreen);
            window.currentVictoryScreen = null;
        }
        
        // Switch to map
        currentMap = mapKey;
        loadMap(mapKey);
        updateUI();
        console.log(`Switched to ${maps[mapKey].name} map from victory screen!`);
        
        // Restart game loop
        startGameLoop();
    }
}


function spawnBoss() {
    // Only spawn boss during night 10 and prevent respawning
    if (cave && !bossActive && !boss && isNight && (nightsSurvived === 10 || (currentDay === 10 && isNight))) {
        const bossLevel = Math.floor(currentDay / 10); // Boss level increases every 10 days
        boss = new Boss(cave.x, cave.y, bossLevel, maps[currentMap].type);
        bossActive = true;
        console.log('Faheem spawned for wave 10 boss fight!');
    }
}

function showRespawnButton() {
    // Pause the game
    gamePaused = true;
    
    // Show respawn screen
    const respawnScreen = document.createElement('div');
    respawnScreen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        color: #FF0000;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: monospace;
    `;
    
    respawnScreen.innerHTML = `
        <div style="text-align: center;">
            <h1 style="font-size: 48px; margin-bottom: 20px; text-shadow: 0 0 20px rgba(255, 0, 0, 0.8);">YOU DIED!</h1>
            <div style="font-size: 24px; margin-bottom: 30px;">You were defeated!</div>
            <button onclick="respawnPlayer()" style="
                padding: 15px 30px;
                font-size: 18px;
                background: linear-gradient(135deg, #FF0000, #8B0000);
                color: #FFF;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                text-transform: uppercase;
            ">Respawn</button>
        </div>
    `;
    
    document.body.appendChild(respawnScreen);
    
    // Store reference to respawn screen
    window.currentRespawnScreen = respawnScreen;
}

function respawnPlayer() {
    // Remove respawn screen
    if (window.currentRespawnScreen) {
        document.body.removeChild(window.currentRespawnScreen);
        window.currentRespawnScreen = null;
    }

    stopGameLoop();
    
    // Reset player position and stats
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    health = maxHealth;
    showPlayerHealthBar = false;
    playerHealthBarTimer = 0;
    
    // Give 5 seconds of immunity (300 frames at 60fps)
    respawnImmunity = 300;
    
    // Reset player speed to default (in case it was modified)
    player.speed = 3;
    
    updateUI();
    
    // Unpause the game
    gamePaused = false;
    
    // Restart single game loop
    startGameLoop();
}

// Drawing functions
function drawPlayer() {
    // Draw player health bar if damaged
    if (showPlayerHealthBar && health < maxHealth) {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(player.x - 20, player.y - player.height/2 - 25, 40, 4);
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(player.x - 20, player.y - player.height/2 - 25, 40 * (health / maxHealth), 4);
        
        // Update timer
        playerHealthBarTimer--;
        if (playerHealthBarTimer <= 0) {
            showPlayerHealthBar = false;
        }
    }
    
    // Draw player body (more detailed)
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x - player.width/2, player.y - player.height/2, player.width, player.height);
    
    // Draw armor if equipped
    if (currentArmorIndex >= 0) {
        ctx.fillStyle = armors[currentArmorIndex].color;
        ctx.fillRect(player.x - player.width/2 - 2, player.y - player.height/2 - 2, player.width + 4, player.height + 4);
    }
    
    // Draw player arms
    ctx.fillStyle = '#FDBCB4';
    ctx.fillRect(player.x - player.width/2 - 5, player.y - player.height/2 + 5, 5, 15);
    ctx.fillRect(player.x + player.width/2, player.y - player.height/2 + 5, 5, 15);
    
    // Draw player legs
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(player.x - 8, player.y + player.height/2 - 5, 6, 12);
    ctx.fillRect(player.x + 2, player.y + player.height/2 - 5, 6, 12);
    
    // Draw player head (round)
    ctx.fillStyle = '#FDBCB4';
    ctx.fillRect(player.x - 10, player.y - player.height/2 - 12, 20, 15);
    
    // Draw eyes facing movement direction
    ctx.fillStyle = '#000';
    if (player.facing === 'left') {
        ctx.fillRect(player.x - 9, player.y - player.height/2 - 8, 3, 3);
        ctx.fillRect(player.x - 3, player.y - player.height/2 - 8, 3, 3);
    } else if (player.facing === 'right') {
        ctx.fillRect(player.x + 0, player.y - player.height/2 - 8, 3, 3);
        ctx.fillRect(player.x + 6, player.y - player.height/2 - 8, 3, 3);
    } else {
        // Default forward facing for up/down
        ctx.fillRect(player.x - 6, player.y - player.height/2 - 8, 3, 3);
        ctx.fillRect(player.x + 3, player.y - player.height/2 - 8, 3, 3);
    }
    
    // Draw hair
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(player.x - 10, player.y - player.height/2 - 15, 20, 5);
    
    // Draw axe based on facing direction
    if (player.cutting) {
        ctx.save();
        ctx.translate(player.x, player.y);
        
        // Rotate based on facing direction
        if (player.facing === 'left') {
            ctx.rotate(Math.PI + Math.PI / 3);
        } else if (player.facing === 'right') {
            ctx.rotate(-Math.PI / 3);
        } else if (player.facing === 'up') {
            ctx.rotate(-Math.PI / 2 - Math.PI / 3);
        } else {
            ctx.rotate(Math.PI / 2 - Math.PI / 3);
        }
        
        // Draw axe handle (pixelated brown)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(10, -2, 2, 2);
        ctx.fillRect(12, 0, 2, 2);
        ctx.fillRect(14, 2, 2, 2);
        ctx.fillRect(16, 4, 2, 2);
        ctx.fillRect(18, 6, 2, 2);
        ctx.fillRect(20, 8, 2, 2);
        
        // Draw axe head with material color
        ctx.fillStyle = weapons[currentAxeIndex].color;
        ctx.fillRect(18, -8, 8, 8);
        ctx.fillStyle = '#000000';
        ctx.fillRect(26, -6, 2, 6);
        ctx.fillRect(20, -10, 4, 2);
        
        ctx.restore();
    } else {
        // Check if player has bow equipped
        const currentWeapon = weapons[currentAxeIndex];
        if (currentWeapon.type === 'bow' && currentWeapon.owned) {
            // Draw bow
            ctx.fillStyle = '#8B4513';
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            
            // Calculate bow angle based on mouse position
            const bowAngle = Math.atan2(mouseY - player.y, mouseX - player.x);
            ctx.save();
            ctx.translate(player.x, player.y);
            ctx.rotate(bowAngle);
            
            // Draw bow (simple arc)
            ctx.beginPath();
            ctx.arc(0, 0, 15, -Math.PI/3, Math.PI/3, false);
            ctx.stroke();
            
            // Draw bowstring
            if (player.bowCharging) {
                // Draw pulled bowstring
                ctx.strokeStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.moveTo(-15 * Math.cos(-Math.PI/3), -15 * Math.sin(-Math.PI/3));
                ctx.lineTo(-15 * Math.cos(Math.PI/3), -15 * Math.sin(Math.PI/3));
                ctx.stroke();
                
                // Draw charge indicator
                const chargePercent = player.bowCharge / player.maxBowCharge;
                ctx.fillStyle = `rgba(255, ${255 * (1 - chargePercent)}, 0, 0.8)`;
                ctx.fillRect(-20, -25, 40 * chargePercent, 3);
            } else {
                // Draw relaxed bowstring
                ctx.strokeStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.moveTo(-15 * Math.cos(-Math.PI/3), -15 * Math.sin(-Math.PI/3));
                ctx.lineTo(-15 * Math.cos(Math.PI/3), -15 * Math.sin(Math.PI/3));
                ctx.stroke();
            }
            
            ctx.restore();
        } else {
            // Draw idle axe based on facing direction
            ctx.fillStyle = '#8B4513';
            
            if (player.facing === 'left') {
                // Left facing
                ctx.fillRect(player.x - 25, player.y - 2, 15, 3);
                ctx.fillStyle = weapons[currentAxeIndex].color;
                ctx.fillRect(player.x - 35, player.y - 6, 8, 8);
                ctx.fillStyle = '#000000';
                ctx.fillRect(player.x - 35, player.y - 4, 2, 6);
                ctx.fillRect(player.x - 31, player.y - 8, 4, 2);
            } else if (player.facing === 'right') {
                // Right facing (original)
                ctx.fillRect(player.x + 10, player.y - 2, 15, 3);
                ctx.fillStyle = weapons[currentAxeIndex].color;
                ctx.fillRect(player.x + 16, player.y - 6, 8, 8);
                ctx.fillStyle = '#000000';
                ctx.fillRect(player.x + 24, player.y - 4, 2, 6);
                ctx.fillRect(player.x + 18, player.y - 8, 4, 2);
            } else {
                // Up/Down facing - default to right
                ctx.fillRect(player.x + 10, player.y - 2, 15, 3);
                ctx.fillStyle = weapons[currentAxeIndex].color;
                ctx.fillRect(player.x + 16, player.y - 6, 8, 8);
                ctx.fillStyle = '#000000';
                ctx.fillRect(player.x + 24, player.y - 4, 2, 6);
                ctx.fillRect(player.x + 18, player.y - 8, 4, 2);
            }
        }
    }
    
    // Draw arrows
    player.arrows.forEach(arrow => {
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        
        // Draw arrow shaft
        ctx.save();
        ctx.translate(arrow.x, arrow.y);
        ctx.rotate(Math.atan2(arrow.vy, arrow.vx));
        ctx.fillRect(-8, -1, 16, 2);
        
        // Draw arrowhead
        ctx.fillStyle = '#696969';
        ctx.fillRect(8, -2, 4, 4);
        
        // Draw fletching
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(-8, -2, 3, 4);
        
        ctx.restore();
    });
}

function drawBackground() {
    const mapType = maps[currentMap].type;
    const isBloodMoon = bossActive && isNight;
    
    // Draw sky with gradient
    if (isNight) {
        // Night sky gradient with blood moon effect
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height - 100);
        if (isBloodMoon) {
            // Blood moon - red sky
            gradient.addColorStop(0, '#8B0000');
            gradient.addColorStop(0.5, '#CD5C5C');
            gradient.addColorStop(1, '#DC143C');
        } else if (mapType === 'winter') {
            gradient.addColorStop(0, '#0F0F3A');
            gradient.addColorStop(0.5, '#1A1A5C');
            gradient.addColorStop(1, '#2A2A7C');
        } else {
            gradient.addColorStop(0, '#0C1445');
            gradient.addColorStop(0.5, '#1E3A8A');
            gradient.addColorStop(1, '#3B5998');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height - 100);
        
        // Draw moon
        if (isBloodMoon) {
            // Blood moon
            ctx.fillStyle = '#8B0000';
            ctx.beginPath();
            ctx.arc(100, 80, 25, 0, Math.PI * 2);
            ctx.fill();
            
            // Blood moon glow
            ctx.fillStyle = 'rgba(139, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(100, 80, 35, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Normal moon
            ctx.fillStyle = '#F0E68C';
            ctx.beginPath();
            ctx.arc(100, 80, 25, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw stars with varying brightness
        for (let i = 0; i < 80; i++) {
            const x = (i * 73 + i * 13) % canvas.width;
            const y = (i * 37 + i * 7) % (canvas.height - 100);
            const size = (i % 3) + 1;
            const brightness = isBloodMoon ? 0.1 + (i % 7) * 0.05 : 0.3 + (i % 7) * 0.1;
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            ctx.fillRect(x, y, size, size);
        }
    } else {
        // Day sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height - 100);
        if (mapType === 'mountains') {
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(0.4, '#B0E0E6');
            gradient.addColorStop(0.7, '#E0F6FF');
            gradient.addColorStop(1, '#F0F8FF');
        } else if (mapType === 'winter') {
            // Winter sky with more contrast
            gradient.addColorStop(0, '#B8C6DB');
            gradient.addColorStop(0.3, '#D4DDE8');
            gradient.addColorStop(0.6, '#E8EEF4');
            gradient.addColorStop(1, '#F5F7FA');
        } else {
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(0.3, '#98D8E8');
            gradient.addColorStop(0.6, '#B0E0E6');
            gradient.addColorStop(1, '#E0F6FF');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height - 100);
        
        // Draw sun
        if (mapType !== 'winter') {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(canvas.width - 80, 80, 30, 0, Math.PI * 2);
            ctx.fill();
            
            // Sun rays
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI / 4);
                const x1 = canvas.width - 80 + Math.cos(angle) * 40;
                const y1 = 80 + Math.sin(angle) * 40;
                const x2 = canvas.width - 80 + Math.cos(angle) * 50;
                const y2 = 80 + Math.sin(angle) * 50;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }
        
        // Draw clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        for (let i = 0; i < 3; i++) {
            const x = (i * 250 + 100) % canvas.width;
            const y = 50 + (i % 2) * 30;
            // Cloud made of circles
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, Math.PI * 2);
            ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
            ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
            ctx.arc(x + 15, y - 10, 18, 0, Math.PI * 2);
            ctx.arc(x + 35, y - 10, 18, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Draw background elements based on map
    if (mapType === 'mountains') {
        // Draw mountains in background
        ctx.fillStyle = '#8B7355';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 100);
        ctx.lineTo(200, canvas.height - 250);
        ctx.lineTo(400, canvas.height - 200);
        ctx.lineTo(600, canvas.height - 280);
        ctx.lineTo(canvas.width, canvas.height - 150);
        ctx.lineTo(canvas.width, canvas.height - 100);
        ctx.closePath();
        ctx.fill();
        
        // Snow caps on mountains
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(180, canvas.height - 230);
        ctx.lineTo(200, canvas.height - 250);
        ctx.lineTo(220, canvas.height - 230);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(580, canvas.height - 260);
        ctx.lineTo(600, canvas.height - 280);
        ctx.lineTo(620, canvas.height - 260);
        ctx.closePath();
        ctx.fill();
        
    } else if (mapType === 'winter') {
        // Draw snow ground with texture
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
        
        // Add snow texture with slight blue tint
        ctx.fillStyle = '#F0F8FF';
        for (let i = 0; i < 50; i++) {
            const x = (i * 37 + i * 13) % canvas.width;
            const y = canvas.height - 90 + (i % 5) * 8;
            const size = 1 + (i % 2);
            ctx.fillRect(x, y, size, size);
        }
        
        // Draw some snow mounds with shadows
        for (let i = 0; i < 8; i++) {
            const x = (i * 120) % canvas.width;
            const y = canvas.height - 80 + (i % 3) * 10;
            
            // Snow mound shadow
            ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
            ctx.beginPath();
            ctx.arc(x + 2, y + 2, 22, 0, Math.PI, true);
            ctx.fill();
            
            // Snow mound
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, Math.PI, true);
            ctx.fill();
            
            // Snow mound highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(x - 5, y - 5, 8, 0, Math.PI, true);
            ctx.fill();
        }
        
        // Add some frozen grass poking through
        ctx.fillStyle = '#8B7355';
        for (let i = 0; i < 20; i++) {
            const x = (i * 43 + i * 7) % canvas.width;
            const y = canvas.height - 20 + (i % 4) * 5;
            const height = 2 + (i % 3);
            ctx.fillRect(x, y, 1, height);
        }
        
        return; // Skip normal ground drawing for winter
    }
    
    // Draw normal ground with texture
    const groundGradient = ctx.createLinearGradient(0, canvas.height - 100, 0, canvas.height);
    if (isNight) {
        groundGradient.addColorStop(0, '#2F4F2F');
        groundGradient.addColorStop(1, '#1F3F1F');
    } else {
        groundGradient.addColorStop(0, '#90EE90');
        groundGradient.addColorStop(1, '#7CB342');
    }
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
    
    // Draw grass details with more variety
    const grassColors = isNight ? ['#1F3F1F', '#2A4A2A', '#355535'] : ['#228B22', '#32CD32', '#7CFC00'];
    for (let i = 0; i < 100; i++) {
        const x = (i * 37 + i * 7) % canvas.width;
        const y = canvas.height - 80 + (i % 3) * 15;
        const height = 3 + (i % 4);
        const colorIndex = i % grassColors.length;
        ctx.fillStyle = grassColors[colorIndex];
        ctx.fillRect(x, y, 2, height);
    }
    
    // Add some small rocks/pebbles
    for (let i = 0; i < 15; i++) {
        const x = (i * 53 + i * 11) % canvas.width;
        const y = canvas.height - 30 + (i % 5) * 10;
        const size = 2 + (i % 3);
        ctx.fillStyle = isNight ? '#4A4A4A' : '#696969';
        ctx.fillRect(x, y, size, size);
    }
}

function canvasToScreen(x, y) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;
    return {
        x: rect.left + (x * scaleX),
        y: rect.top + (y * scaleY)
    };
}

function showDamageNumber(x, y, damage) {
    const damageText = document.createElement('div');
    damageText.textContent = `-${damage}`;
    const pos = canvasToScreen(x, y);
    damageText.style.cssText = `
        position: absolute;
        left: ${pos.x}px;
        top: ${pos.y}px;
        color: #FF0000;
        font: bold 16px monospace;
        pointer-events: none;
        z-index: 1000;
        animation: damageFloat 1s ease-out;
    `;
    document.body.appendChild(damageText);
    
    setTimeout(() => {
        if (damageText.parentNode) {
            damageText.parentNode.removeChild(damageText);
        }
    }, 1000);
}

function updateHealthRegeneration() {
    // Only regenerate if health regen is enabled AND player is not immune
    if (qolSettings.healthRegen && health < maxHealth && respawnImmunity === 0) {
        health = Math.min(maxHealth, health + 1/60); // 1 HP per second (60 fps)
        updateUI();
    }
}

// Add CSS for floating animations
const style = document.createElement('style');
style.textContent = `
    @keyframes healFloat {
        0% { transform: translateY(0px); opacity: 1; }
        100% { transform: translateY(-50px); opacity: 0; }
    }
    
    @keyframes damageFloat {
        0% { transform: translateY(0px); opacity: 1; }
        100% { transform: translateY(-30px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Game loop
function stopGameLoop() {
    gameLoopRunning = false;
    if (gameLoopRafId !== null) {
        cancelAnimationFrame(gameLoopRafId);
        gameLoopRafId = null;
    }
}

function startGameLoop() {
    // Guarantee only one loop instance
    stopGameLoop();
    gameLoopRunning = true;
    gameLoop();
}

function gameLoop() {
    // Stop loop if gameLoopRunning is false
    if (!gameLoopRunning) {
        return;
    }
    
    // If game is paused, don't update anything but keep rendering
    if (!gamePaused) {
        // Ensure player speed is always correct
        if (player.speed !== 3) {
            player.speed = 3;
        }
        
        // Update game logic only when not paused
        updatePlayer();
        updateDayNightCycle();
        
        // Update respawn immunity
        if (respawnImmunity > 0) {
            respawnImmunity--;
        }
        
        // Update reequip cooldown
        if (reequipCooldown > 0) {
            reequipCooldown--;
            if (reequipCooldown === 0) {
                console.log('Re-equip cooldown ended');
                populateShop(); // Refresh shop to show available equips
            }
        }
        
        // Auto-eat bread if health is low and setting is enabled
        if (qolSettings.autoEat && health < maxHealth * 0.3 && inventory.bread > 0) {
            eatBread();
        }
        
        // Health regeneration
        updateHealthRegeneration();
        
        // Update and draw shop
        if (shop) {
            shop.draw();
        }
        
        // Update and draw cave
        if (cave) {
            cave.update();
            cave.draw();
        }
        
        // Check for boss spawning
        spawnBoss();
        
        // Update and draw trees
        trees.forEach(tree => {
            tree.update();
            tree.draw();
        });
        
        // Update and draw wolves
        wolves = wolves.filter(wolf => wolf.alive);
        wolves.forEach(wolf => {
            wolf.update();
            wolf.draw();
        });
        
        // Update and draw boss
        if (boss && boss.alive) {
            boss.update();
            boss.draw();
        } else if (boss && !boss.alive) {
            boss = null;
            bossActive = false;
        }
    }
    
    // Always render the game world
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    
    // Draw game entities (even when paused)
    if (shop) {
        shop.draw();
    }
    
    if (cave) {
        cave.draw();
    }
    
    trees.forEach(tree => {
        tree.draw();
    });
    
    wolves.forEach(wolf => {
        wolf.draw();
    });
    
    if (boss && boss.alive) {
        boss.draw();
    }
    
    // Draw player
    drawPlayer();
    
    // Continue game loop
    gameLoopRafId = requestAnimationFrame(gameLoop);
}

// Initialize game
window.addEventListener('load', function() {
    try {
        console.log('=== GAME INITIALIZATION ===');
        
        // Initialize intro screen first
        initIntroScreen();
        
        // Get canvas element from HTML
        canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            throw new Error('Canvas element not found');
        }
        
        // Get canvas context
        ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Canvas context failed - trying fallback');
        }
        
        // Set canvas properties
        ctx.imageSmoothingEnabled = false;
        
        // Simple direct initialization - no complex functions
        console.log('Initializing game state directly...');
        
        // Initialize all game variables directly
        money = 50;
        wood = 0;
        health = 100;
        maxHealth = 100;
        currentAxeIndex = 0;
        currentMap = 'forest';
        shopOpen = false;
        inventoryOpen = false;
        isNight = false;
        dayNightTimer = 0;
        inShop = false;
        showPlayerHealthBar = false;
        playerHealthBarTimer = 0;
        currentArmorIndex = -1;
        defense = 0;
        nightsSurvived = 0;
        currentDay = 1;
        bossActive = false;
        boss = null;
        wolves = [];
        gamePaused = false;
        respawnImmunity = 0;
        reequipCooldown = 0;
        
        // Initialize inventory
        inventory = {
            bread: 0,
            maxBread: 10,
            selectedSlot: 0,
            items: []
        };
        
        // Initialize QoL settings
        qolSettings = {
            autoEat: false,
            healthRegen: false,
            damageNumbers: true,
            minimap: false,
            quickHeal: false,
            inventoryHotkeys: true
        };
        
        // Initialize player object
        player = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            width: 20,
            height: 30,
            speed: 3,
            color: '#FF6B6B',
            cutting: false,
            cutTimer: 0,
            attackCooldown: 0,
            facing: 'right',
            bowCharge: 0,
            bowCharging: false,
            maxBowCharge: 60,
            arrows: []
        };
        
        // Initialize entities
        trees = [];
        shop = null;
        cave = null;
        
        console.log('Direct initialization complete - starting game');
        
        // Simple loadMap function
        loadMap(currentMap);
        
        // Add canvas event listeners after canvas is initialized
        canvas.addEventListener('mousemove', function(e) {
            updatePointerPosition(e.clientX, e.clientY);
        });
        
        canvas.addEventListener('touchmove', function(e) {
            if (e.touches && e.touches[0]) {
                updatePointerPosition(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });
        
        canvas.addEventListener('mousedown', function(e) {
            if (e.button === 0) { // Left click
                const currentWeapon = weapons[currentAxeIndex];
                if (currentWeapon.type === 'bow' && currentWeapon.owned && currentMap === 'mountains') {
                    player.bowCharging = true;
                    player.bowCharge = 0;
                }
            }
        });
        
        canvas.addEventListener('mouseup', function(e) {
            if (e.button === 0) { // Left click
                if (player.bowCharging) {
                    player.bowCharging = false;
                    if (player.bowCharge >= player.maxBowCharge) {
                        shootArrow();
                    }
                    player.bowCharge = 0;
                }
            }
        });
        
        // Start game
        updateUI();
        startGameLoop();
        
        console.log('Game started successfully!');
        
    } catch (error) {
        console.error('Error starting game:', error);
        document.body.innerHTML += '<div style="color: red; font-size: 20px;">Game Error: ' + error.message + '</div>';
    }
});
