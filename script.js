/* ============================================
   NEON PONG - ULTIMATE EDITION
   Complete Game Engine
   ============================================ */

// ---- SOUND ENGINE (Web Audio API) ----
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            this.enabled = false;
        }
    }

    play(type) {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        switch (type) {
            case 'hit':
                osc.type = 'square';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            case 'wall':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
                break;
            case 'score':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523, now);
                osc.frequency.setValueAtTime(659, now + 0.1);
                osc.frequency.setValueAtTime(784, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
                break;
            case 'powerup':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
            case 'win':
                osc.type = 'sine';
                [523, 659, 784, 1047].forEach((freq, i) => {
                    osc.frequency.setValueAtTime(freq, now + i * 0.15);
                });
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
                osc.start(now);
                osc.stop(now + 0.7);
                break;
            case 'lose':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
                break;
            case 'countdown':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            case 'go':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.setValueAtTime(1000, now + 0.05);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
        }
    }
}

// ---- PARTICLE SYSTEM ----
class Particle {
    constructor(x, y, vx, vy, life, color, size) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.size = size;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        this.vx *= 0.98;
        this.vy *= 0.98;
    }

    get alpha() {
        return Math.max(0, this.life / this.maxLife);
    }

    get alive() {
        return this.life > 0;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, count, color, options = {}) {
        const { speed = 200, life = 0.6, size = 3, spread = Math.PI * 2, angle = 0 } = options;
        for (let i = 0; i < count; i++) {
            const a = angle - spread / 2 + Math.random() * spread;
            const s = speed * (0.3 + Math.random() * 0.7);
            this.particles.push(new Particle(
                x, y,
                Math.cos(a) * s,
                Math.sin(a) * s,
                life * (0.5 + Math.random() * 0.5),
                color,
                size * (0.5 + Math.random() * 0.5)
            ));
        }
    }

    trail(x, y, color, size = 2) {
        this.particles.push(new Particle(
            x + (Math.random() - 0.5) * 4,
            y + (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            0.3 + Math.random() * 0.2,
            color,
            size
        ));
    }

    update(dt) {
        this.particles = this.particles.filter(p => {
            p.update(dt);
            return p.alive;
        });
    }

    draw(ctx) {
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}

// ---- POWER-UP SYSTEM ----
const POWERUP_TYPES = [
    { id: 'big_paddle', name: 'BIG PADDLE', color: '#00ff88', duration: 8, icon: '[]' },
    { id: 'small_paddle', name: 'SHRINK', color: '#ff4444', duration: 8, icon: '||', isDebuff: true },
    { id: 'fast_ball', name: 'SPEED UP', color: '#ff8800', duration: 6, icon: '>>' },
    { id: 'slow_ball', name: 'SLOW MO', color: '#8888ff', duration: 6, icon: '<<' },
    { id: 'multi_ball', name: 'MULTI BALL', color: '#ff00ff', duration: 0, icon: '**' },
    { id: 'curve_ball', name: 'CURVE BALL', color: '#ffff00', duration: 8, icon: '~' },
];

class PowerUp {
    constructor(x, y, type, canvasW, canvasH) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 15;
        this.alive = true;
        this.spawnTime = performance.now();
        this.lifetime = 10000;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.vy = 0;
        this.canvasH = canvasH;
        // Float gently
        this.baseY = y;
    }

    update(dt) {
        this.pulsePhase += dt * 3;
        this.y = this.baseY + Math.sin(this.pulsePhase) * 8;
        if (performance.now() - this.spawnTime > this.lifetime) {
            this.alive = false;
        }
    }

    draw(ctx) {
        const pulse = 0.8 + Math.sin(this.pulsePhase) * 0.2;
        const timeLeft = 1 - (performance.now() - this.spawnTime) / this.lifetime;

        ctx.save();
        ctx.globalAlpha = timeLeft < 0.3 ? (Math.sin(performance.now() / 100) * 0.5 + 0.5) : 1;

        // Glow
        ctx.shadowColor = this.type.color;
        ctx.shadowBlur = 20 * pulse;

        // Outer ring
        ctx.strokeStyle = this.type.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Inner
        ctx.fillStyle = this.type.color;
        ctx.globalAlpha *= 0.3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Icon text
        ctx.globalAlpha = timeLeft < 0.3 ? (Math.sin(performance.now() / 100) * 0.5 + 0.5) : 1;
        ctx.fillStyle = this.type.color;
        ctx.font = 'bold 10px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type.icon, this.x, this.y);

        ctx.restore();
    }
}

// ---- MAIN GAME ----
class NeonPong {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.sound = new SoundEngine();
        this.particles = new ParticleSystem();

        // Game state
        this.currentScreen = 'menu';
        this.gameMode = 'single'; // single, two-player, arcade
        this.gameState = 'idle'; // idle, countdown, playing, paused, goal, gameover
        this.settings = {
            difficulty: 'medium',
            winScore: 10,
            powerupsEnabled: true,
            soundEnabled: true,
            shakeEnabled: true,
            theme: 'neon',
        };

        // Stats
        this.stats = this.loadStats();

        // Player scores
        this.p1Score = 0;
        this.p2Score = 0;

        // Ball
        this.ball = { x: 0, y: 0, vx: 0, vy: 0, radius: 8, speed: 0 };
        this.extraBalls = [];
        this.ballTrail = [];
        this.baseSpeed = 350;

        // Paddles
        this.paddleHeight = 14;
        this.paddleWidth = 120;
        this.paddleRadius = 7;
        this.p1 = { x: 0, y: 0, width: this.paddleWidth, targetX: 0, speed: 600 };
        this.p2 = { x: 0, y: 0, width: this.paddleWidth, targetX: 0, speed: 600 };

        // Input
        this.keys = {};
        this.touchX = null;

        // Power-ups
        this.powerups = [];
        this.activePowerups = [];
        this.lastPowerupSpawn = 0;
        this.powerupInterval = 8000;

        // Match stats
        this.rallyCount = 0;
        this.maxRally = 0;
        this.comboCount = 0;
        this.maxCombo = 0;
        this.powerupsCollected = 0;
        this.maxBallSpeed = 0;

        // AI
        this.aiTargetX = 0;
        this.aiReactionTimer = 0;
        this.aiError = 0;

        // Timing
        this.lastTime = 0;
        this.countdownValue = 3;
        this.countdownTimer = 0;
        this.goalTimer = 0;

        // Screen shake
        this.shakeAmount = 0;
        this.shakeDecay = 10;

        // Center line dash offset for animation
        this.dashOffset = 0;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));

        // Touch support
        this.canvas.addEventListener('touchstart', (e) => this.onTouch(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.onTouch(e), { passive: false });
        this.canvas.addEventListener('touchend', () => { this.touchX = null; });

        // Mouse support for paddle control
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.gameState === 'playing') {
                this.p1.targetX = e.clientX;
                if (this.gameMode !== 'two-player') {
                    // Mouse controls P1 only in single player
                }
            }
        });

        this.setupMenuListeners();
        this.updateStatsDisplay();
        this.loadSettings();
        this.loop(performance.now());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.W = this.canvas.width;
        this.H = this.canvas.height;
    }

    // ---- SETTINGS & PERSISTENCE ----
    loadStats() {
        try {
            const saved = localStorage.getItem('neonpong_stats');
            if (saved) return JSON.parse(saved);
        } catch (e) { /* ignore */ }
        return { highScore: 0, gamesPlayed: 0, wins: 0 };
    }

    saveStats() {
        try {
            localStorage.setItem('neonpong_stats', JSON.stringify(this.stats));
        } catch (e) { /* ignore */ }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('neonpong_settings');
            if (saved) {
                Object.assign(this.settings, JSON.parse(saved));
                this.applySettings();
            }
        } catch (e) { /* ignore */ }
    }

    saveSettings() {
        try {
            localStorage.setItem('neonpong_settings', JSON.stringify(this.settings));
        } catch (e) { /* ignore */ }
    }

    applySettings() {
        document.body.setAttribute('data-theme', this.settings.theme);
        document.getElementById('powerups-toggle').checked = this.settings.powerupsEnabled;
        document.getElementById('sound-toggle').checked = this.settings.soundEnabled;
        document.getElementById('shake-toggle').checked = this.settings.shakeEnabled;
        this.sound.enabled = this.settings.soundEnabled;

        // Update active buttons
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.toggle('active', b.dataset.diff === this.settings.difficulty));
        document.querySelectorAll('.score-btn').forEach(b => b.classList.toggle('active', parseInt(b.dataset.score) === this.settings.winScore));
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === this.settings.theme));
    }

    updateStatsDisplay() {
        document.getElementById('menu-high-score').textContent = this.stats.highScore;
        document.getElementById('menu-games-played').textContent = this.stats.gamesPlayed;
        const rate = this.stats.gamesPlayed > 0 ? Math.round((this.stats.wins / this.stats.gamesPlayed) * 100) : 0;
        document.getElementById('menu-win-rate').textContent = rate + '%';
    }

    // ---- MENU & UI ----
    setupMenuListeners() {
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.sound.init();
                switch (action) {
                    case 'single-player': this.startGame('single'); break;
                    case 'two-player': this.startGame('two-player'); break;
                    case 'arcade': this.startGame('arcade'); break;
                    case 'settings': this.showScreen('settings'); break;
                    case 'back-to-menu': this.showScreen('menu'); break;
                    case 'resume': this.resumeGame(); break;
                    case 'restart': this.restartGame(); break;
                    case 'rematch': this.restartGame(); break;
                    case 'quit': this.showScreen('menu'); this.gameState = 'idle'; break;
                }
            });
        });

        // Settings listeners
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.difficulty = btn.dataset.diff;
                this.saveSettings();
            });
        });

        document.querySelectorAll('.score-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.score-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.winScore = parseInt(btn.dataset.score);
                this.saveSettings();
            });
        });

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.theme = btn.dataset.theme;
                document.body.setAttribute('data-theme', this.settings.theme);
                this.saveSettings();
            });
        });

        document.getElementById('powerups-toggle').addEventListener('change', (e) => {
            this.settings.powerupsEnabled = e.target.checked;
            this.saveSettings();
        });
        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            this.settings.soundEnabled = e.target.checked;
            this.sound.enabled = e.target.checked;
            this.saveSettings();
        });
        document.getElementById('shake-toggle').addEventListener('change', (e) => {
            this.settings.shakeEnabled = e.target.checked;
            this.saveSettings();
        });
    }

    showScreen(name) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(name + '-screen').classList.add('active');
        this.currentScreen = name;
        if (name === 'menu') this.updateStatsDisplay();
    }

    // ---- GAME FLOW ----
    startGame(mode) {
        this.gameMode = mode;
        this.p1Score = 0;
        this.p2Score = 0;
        this.rallyCount = 0;
        this.maxRally = 0;
        this.comboCount = 0;
        this.maxCombo = 0;
        this.powerupsCollected = 0;
        this.maxBallSpeed = 0;
        this.powerups = [];
        this.activePowerups = [];
        this.extraBalls = [];
        this.lastPowerupSpawn = performance.now();

        // Set names
        document.getElementById('p1-name').textContent = 'PLAYER 1';
        if (mode === 'two-player') {
            document.getElementById('p2-name').textContent = 'PLAYER 2';
        } else {
            const diffNames = { easy: 'CPU (EASY)', medium: 'CPU (MED)', hard: 'CPU (HARD)', impossible: 'CPU (INSANE)' };
            document.getElementById('p2-name').textContent = diffNames[this.settings.difficulty] || 'CPU';
        }

        this.updateHUD();
        this.showScreen('game');
        this.resetRound(true);
    }

    restartGame() {
        document.getElementById('pause-overlay').classList.add('hidden');
        this.startGame(this.gameMode);
    }

    resetRound(isFirst = false) {
        this.resetBall();
        this.resetPaddles();
        this.extraBalls = [];

        // Clear paddle powerup effects
        this.activePowerups = this.activePowerups.filter(p => p.type.id !== 'big_paddle' && p.type.id !== 'small_paddle');
        this.p1.width = this.paddleWidth;
        this.p2.width = this.paddleWidth;

        this.rallyCount = 0;
        this.comboCount = 0;
        this.startCountdown();
    }

    resetBall() {
        this.ball.x = this.W / 2;
        this.ball.y = this.H / 2;
        const angle = (Math.random() * 0.5 + 0.25) * Math.PI * (Math.random() < 0.5 ? 1 : -1);
        const dir = Math.random() < 0.5 ? -1 : 1;
        this.ball.speed = this.baseSpeed;
        this.ball.vx = Math.sin(angle) * this.ball.speed;
        this.ball.vy = Math.cos(angle) * this.ball.speed * dir;
        this.ballTrail = [];
    }

    resetPaddles() {
        this.p1.x = this.W / 2;
        this.p1.y = this.H - 40;
        this.p1.targetX = this.W / 2;
        this.p2.x = this.W / 2;
        this.p2.y = 40;
        this.p2.targetX = this.W / 2;
    }

    startCountdown() {
        this.gameState = 'countdown';
        this.countdownValue = 3;
        this.countdownTimer = 0;
        document.getElementById('countdown-overlay').classList.remove('hidden');
        document.getElementById('countdown-text').textContent = '3';
        this.sound.play('countdown');
    }

    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pause-overlay').classList.remove('hidden');
        }
    }

    resumeGame() {
        if (this.gameState === 'paused') {
            document.getElementById('pause-overlay').classList.add('hidden');
            this.startCountdown();
        }
    }

    onScore(scorer) {
        if (scorer === 1) this.p1Score++;
        else this.p2Score++;

        this.updateHUD();
        this.sound.play('score');

        // Track max rally
        if (this.rallyCount > this.maxRally) this.maxRally = this.rallyCount;
        if (this.comboCount > this.maxCombo) this.maxCombo = this.comboCount;

        // Arcade mode scoring
        if (this.gameMode === 'arcade' && scorer === 1) {
            if (this.p1Score > this.stats.highScore) {
                this.stats.highScore = this.p1Score;
            }
        }

        // Show goal overlay
        this.gameState = 'goal';
        this.goalTimer = 1.5;
        const goalOverlay = document.getElementById('goal-overlay');
        goalOverlay.classList.remove('hidden');
        document.getElementById('goal-text').textContent = this.gameMode === 'arcade' ? 'POINT!' : 'GOAL!';
        document.getElementById('goal-scorer').textContent = scorer === 1 ? 'PLAYER 1' : (this.gameMode === 'two-player' ? 'PLAYER 2' : 'CPU');

        // Particles explosion
        this.particles.emit(this.ball.x, this.ball.y, 40, scorer === 1 ? this.getColor('primary') : this.getColor('secondary'), { speed: 400, life: 1 });

        // Screen shake
        if (this.settings.shakeEnabled) {
            this.shakeAmount = 10;
        }

        // Check win condition
        const winScore = this.gameMode === 'arcade' ? Infinity : this.settings.winScore;
        if (this.p1Score >= winScore || this.p2Score >= winScore) {
            this.goalTimer = 0.5; // shorter for game end
        }
    }

    onGameOver() {
        const p1Won = this.p1Score > this.p2Score;

        this.stats.gamesPlayed++;
        if (p1Won) this.stats.wins++;
        this.saveStats();

        this.sound.play(p1Won ? 'win' : 'lose');

        // Populate game over screen
        document.getElementById('winner-text').textContent = p1Won ? 'PLAYER 1 WINS!' : (this.gameMode === 'two-player' ? 'PLAYER 2 WINS!' : 'CPU WINS!');
        document.getElementById('final-p1-name').textContent = 'PLAYER 1';
        document.getElementById('final-p2-name').textContent = this.gameMode === 'two-player' ? 'PLAYER 2' : 'CPU';
        document.getElementById('final-p1-score').textContent = this.p1Score;
        document.getElementById('final-p2-score').textContent = this.p2Score;
        document.getElementById('stat-rally').textContent = this.maxRally;
        document.getElementById('stat-combo').textContent = this.maxCombo;
        document.getElementById('stat-powerups').textContent = this.powerupsCollected;
        document.getElementById('stat-speed').textContent = Math.round(this.maxBallSpeed) + ' px/s';

        this.gameState = 'gameover';
        this.showScreen('gameover');
    }

    updateHUD() {
        document.getElementById('p1-score').textContent = this.p1Score;
        document.getElementById('p2-score').textContent = this.p2Score;
    }

    // ---- INPUT ----
    onKeyDown(e) {
        this.keys[e.code] = true;

        if (e.code === 'Escape') {
            if (this.gameState === 'playing') this.pauseGame();
            else if (this.gameState === 'paused') this.resumeGame();
        }

        // Prevent scrolling with arrow keys and space
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
            e.preventDefault();
        }
    }

    onKeyUp(e) {
        this.keys[e.code] = false;
    }

    onTouch(e) {
        e.preventDefault();
        if (e.touches.length > 0) {
            this.touchX = e.touches[0].clientX;
        }
    }

    // ---- AI ----
    updateAI(dt) {
        const diff = this.settings.difficulty;
        let reactionSpeed, accuracy, predictiveness, maxSpeed;

        switch (diff) {
            case 'easy':
                reactionSpeed = 0.3;
                accuracy = 0.6;
                predictiveness = 0.2;
                maxSpeed = 300;
                break;
            case 'medium':
                reactionSpeed = 0.15;
                accuracy = 0.8;
                predictiveness = 0.5;
                maxSpeed = 450;
                break;
            case 'hard':
                reactionSpeed = 0.08;
                accuracy = 0.93;
                predictiveness = 0.8;
                maxSpeed = 600;
                break;
            case 'impossible':
                reactionSpeed = 0.03;
                accuracy = 0.99;
                predictiveness = 0.95;
                maxSpeed = 800;
                break;
            default:
                reactionSpeed = 0.15;
                accuracy = 0.8;
                predictiveness = 0.5;
                maxSpeed = 450;
        }

        this.aiReactionTimer -= dt;
        if (this.aiReactionTimer <= 0) {
            this.aiReactionTimer = reactionSpeed;

            // Predict where ball will be
            let targetX = this.ball.x;
            if (this.ball.vy < 0) {
                // Ball moving toward AI
                const timeToReach = Math.abs((this.p2.y - this.ball.y) / this.ball.vy);
                let predictX = this.ball.x + this.ball.vx * timeToReach * predictiveness;

                // Simulate wall bounces
                while (predictX < 0 || predictX > this.W) {
                    if (predictX < 0) predictX = -predictX;
                    if (predictX > this.W) predictX = 2 * this.W - predictX;
                }

                targetX = predictX;
            } else {
                // Ball moving away, return to center
                targetX = this.W / 2;
            }

            // Add error based on accuracy
            this.aiError = (1 - accuracy) * (Math.random() - 0.5) * this.p2.width * 2;
            this.aiTargetX = targetX + this.aiError;
        }

        // Move toward target
        const diff2 = this.aiTargetX - this.p2.x;
        const moveSpeed = Math.min(Math.abs(diff2), maxSpeed * dt);
        if (Math.abs(diff2) > 5) {
            this.p2.x += Math.sign(diff2) * moveSpeed;
        }

        // Clamp
        this.p2.x = Math.max(this.p2.width / 2, Math.min(this.W - this.p2.width / 2, this.p2.x));
    }

    // ---- POWER-UPS ----
    spawnPowerup() {
        if (!this.settings.powerupsEnabled) return;
        const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
        const x = 50 + Math.random() * (this.W - 100);
        const y = this.H * 0.3 + Math.random() * (this.H * 0.4);
        this.powerups.push(new PowerUp(x, y, type, this.W, this.H));
    }

    applyPowerup(type, collector) {
        this.sound.play('powerup');
        this.powerupsCollected++;

        const notice = document.getElementById('powerup-notice');
        notice.textContent = type.name + '!';
        notice.classList.remove('hidden');
        setTimeout(() => notice.classList.add('hidden'), 2000);

        switch (type.id) {
            case 'big_paddle': {
                const paddle = collector === 1 ? this.p1 : this.p2;
                paddle.width = this.paddleWidth * 1.8;
                this.activePowerups.push({ type, collector, endTime: performance.now() + type.duration * 1000 });
                break;
            }
            case 'small_paddle': {
                // Shrinks the opponent
                const paddle = collector === 1 ? this.p2 : this.p1;
                paddle.width = this.paddleWidth * 0.5;
                this.activePowerups.push({ type, collector, endTime: performance.now() + type.duration * 1000 });
                break;
            }
            case 'fast_ball':
                this.ball.speed *= 1.5;
                this.ball.vx *= 1.5;
                this.ball.vy *= 1.5;
                this.activePowerups.push({ type, collector, endTime: performance.now() + type.duration * 1000 });
                break;
            case 'slow_ball':
                this.ball.speed *= 0.5;
                this.ball.vx *= 0.5;
                this.ball.vy *= 0.5;
                this.activePowerups.push({ type, collector, endTime: performance.now() + type.duration * 1000 });
                break;
            case 'multi_ball':
                for (let i = 0; i < 2; i++) {
                    const angle = (Math.random() - 0.5) * Math.PI * 0.5;
                    this.extraBalls.push({
                        x: this.ball.x,
                        y: this.ball.y,
                        vx: Math.sin(angle) * this.ball.speed,
                        vy: this.ball.vy > 0 ? -this.ball.speed * 0.8 : this.ball.speed * 0.8,
                        radius: this.ball.radius * 0.75,
                        speed: this.ball.speed,
                        trail: [],
                    });
                }
                break;
            case 'curve_ball':
                this.activePowerups.push({ type, collector, endTime: performance.now() + type.duration * 1000 });
                break;
        }
    }

    updatePowerups(dt) {
        // Spawn
        const now = performance.now();
        if (now - this.lastPowerupSpawn > this.powerupInterval && this.powerups.length < 3) {
            this.spawnPowerup();
            this.lastPowerupSpawn = now;
        }

        // Update
        this.powerups.forEach(p => p.update(dt));
        this.powerups = this.powerups.filter(p => p.alive);

        // Check collision with ball
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            const dx = this.ball.x - p.x;
            const dy = this.ball.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.ball.radius + p.radius) {
                const collector = this.ball.vy > 0 ? 1 : 2; // who last hit it
                this.applyPowerup(p.type, collector);
                this.particles.emit(p.x, p.y, 20, p.type.color, { speed: 200, life: 0.5 });
                this.powerups.splice(i, 1);
            }
        }

        // Expire active powerups
        for (let i = this.activePowerups.length - 1; i >= 0; i--) {
            const ap = this.activePowerups[i];
            if (ap.endTime && now > ap.endTime) {
                // Revert
                switch (ap.type.id) {
                    case 'big_paddle':
                    case 'small_paddle': {
                        const paddle = ap.type.id === 'big_paddle'
                            ? (ap.collector === 1 ? this.p1 : this.p2)
                            : (ap.collector === 1 ? this.p2 : this.p1);
                        paddle.width = this.paddleWidth;
                        break;
                    }
                    case 'fast_ball':
                        this.ball.speed /= 1.5;
                        { const ratio = 1 / 1.5; this.ball.vx *= ratio; this.ball.vy *= ratio; }
                        break;
                    case 'slow_ball':
                        this.ball.speed /= 0.5;
                        { const ratio = 1 / 0.5; this.ball.vx *= ratio; this.ball.vy *= ratio; }
                        break;
                }
                this.activePowerups.splice(i, 1);
            }
        }
    }

    // ---- PHYSICS ----
    updateBall(dt) {
        // Curve ball effect
        const hasCurve = this.activePowerups.some(p => p.type.id === 'curve_ball');
        if (hasCurve) {
            this.ball.vx += Math.sin(performance.now() / 200) * 500 * dt;
        }

        this.ball.x += this.ball.vx * dt;
        this.ball.y += this.ball.vy * dt;

        // Track max speed
        const currentSpeed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
        if (currentSpeed > this.maxBallSpeed) this.maxBallSpeed = currentSpeed;

        // Wall bounce (left/right)
        if (this.ball.x - this.ball.radius < 0) {
            this.ball.x = this.ball.radius;
            this.ball.vx = Math.abs(this.ball.vx);
            this.sound.play('wall');
            this.particles.emit(this.ball.x, this.ball.y, 8, this.getColor('accent'), { speed: 150, spread: Math.PI, angle: 0 });
        } else if (this.ball.x + this.ball.radius > this.W) {
            this.ball.x = this.W - this.ball.radius;
            this.ball.vx = -Math.abs(this.ball.vx);
            this.sound.play('wall');
            this.particles.emit(this.ball.x, this.ball.y, 8, this.getColor('accent'), { speed: 150, spread: Math.PI, angle: Math.PI });
        }

        // Paddle collisions
        this.checkPaddleCollision(this.p1, 1);
        this.checkPaddleCollision(this.p2, 2);

        // Score detection
        if (this.ball.y - this.ball.radius > this.H) {
            this.onScore(2); // P2 scores (ball went past P1 at bottom)
        } else if (this.ball.y + this.ball.radius < 0) {
            this.onScore(1); // P1 scores (ball went past P2 at top)
        }

        // Ball trail
        this.ballTrail.push({ x: this.ball.x, y: this.ball.y, life: 0.15 });
        if (this.ballTrail.length > 20) this.ballTrail.shift();

        // Particles trail
        if (Math.random() < 0.3) {
            this.particles.trail(this.ball.x, this.ball.y, this.getColor('ball'), 2);
        }
    }

    updateExtraBalls(dt) {
        for (let i = this.extraBalls.length - 1; i >= 0; i--) {
            const eb = this.extraBalls[i];
            eb.x += eb.vx * dt;
            eb.y += eb.vy * dt;

            // Wall bounce
            if (eb.x - eb.radius < 0 || eb.x + eb.radius > this.W) {
                eb.vx = -eb.vx;
                eb.x = Math.max(eb.radius, Math.min(this.W - eb.radius, eb.x));
            }

            // Check paddle collision for extra balls
            this.checkExtraBallPaddleCollision(eb, this.p1);
            this.checkExtraBallPaddleCollision(eb, this.p2);

            // Remove if out of bounds
            if (eb.y < -50 || eb.y > this.H + 50) {
                this.extraBalls.splice(i, 1);
                continue;
            }

            // Trail
            eb.trail.push({ x: eb.x, y: eb.y, life: 0.1 });
            if (eb.trail.length > 10) eb.trail.shift();
        }
    }

    checkPaddleCollision(paddle, playerNum) {
        const isP1 = playerNum === 1;
        const paddleTop = paddle.y - this.paddleHeight / 2;
        const paddleBottom = paddle.y + this.paddleHeight / 2;
        const paddleLeft = paddle.x - paddle.width / 2;
        const paddleRight = paddle.x + paddle.width / 2;

        const ballBottom = this.ball.y + this.ball.radius;
        const ballTop = this.ball.y - this.ball.radius;

        let hit = false;
        if (isP1) {
            // P1 is at bottom
            hit = ballBottom >= paddleTop && ballBottom <= paddleBottom + 5 &&
                  this.ball.x >= paddleLeft && this.ball.x <= paddleRight &&
                  this.ball.vy > 0;
        } else {
            // P2 is at top
            hit = ballTop <= paddleBottom && ballTop >= paddleTop - 5 &&
                  this.ball.x >= paddleLeft && this.ball.x <= paddleRight &&
                  this.ball.vy < 0;
        }

        if (hit) {
            // Calculate hit position (-1 to 1)
            const hitPos = (this.ball.x - paddle.x) / (paddle.width / 2);
            const maxAngle = Math.PI / 3; // 60 degrees
            const angle = hitPos * maxAngle;

            // Increase speed slightly with each rally
            this.ball.speed = Math.min(this.ball.speed + 8, 900);

            this.ball.vx = Math.sin(angle) * this.ball.speed;
            this.ball.vy = (isP1 ? -1 : 1) * Math.cos(angle) * this.ball.speed;

            // Position correction
            if (isP1) {
                this.ball.y = paddleTop - this.ball.radius;
            } else {
                this.ball.y = paddleBottom + this.ball.radius;
            }

            this.rallyCount++;
            this.comboCount++;
            if (this.comboCount > this.maxCombo) this.maxCombo = this.comboCount;

            // Show combo
            if (this.comboCount >= 3) {
                const comboEl = document.getElementById('combo-display');
                comboEl.textContent = this.comboCount + 'x RALLY';
                comboEl.classList.remove('hidden');
            }

            this.sound.play('hit');

            // Particles
            this.particles.emit(
                this.ball.x, isP1 ? paddleTop : paddleBottom,
                15,
                isP1 ? this.getColor('primary') : this.getColor('secondary'),
                { speed: 200, life: 0.4, spread: Math.PI, angle: isP1 ? -Math.PI / 2 : Math.PI / 2 }
            );

            // Screen shake on fast hits
            if (this.ball.speed > 500 && this.settings.shakeEnabled) {
                this.shakeAmount = Math.min((this.ball.speed - 500) / 50, 8);
            }
        }
    }

    checkExtraBallPaddleCollision(eb, paddle) {
        const paddleTop = paddle.y - this.paddleHeight / 2;
        const paddleBottom = paddle.y + this.paddleHeight / 2;
        const paddleLeft = paddle.x - paddle.width / 2;
        const paddleRight = paddle.x + paddle.width / 2;

        if (eb.y + eb.radius >= paddleTop && eb.y - eb.radius <= paddleBottom &&
            eb.x >= paddleLeft && eb.x <= paddleRight) {
            eb.vy = -eb.vy;
            this.sound.play('hit');
        }
    }

    // ---- UPDATE ----
    update(dt) {
        dt = Math.min(dt, 0.05); // Cap delta time

        if (this.currentScreen !== 'game') return;

        // Update particles always
        this.particles.update(dt);

        // Screen shake decay
        if (this.shakeAmount > 0) {
            this.shakeAmount -= this.shakeDecay * dt;
            if (this.shakeAmount < 0) this.shakeAmount = 0;
        }

        if (this.gameState === 'countdown') {
            this.countdownTimer += dt;
            if (this.countdownTimer >= 1) {
                this.countdownTimer = 0;
                this.countdownValue--;
                const ctEl = document.getElementById('countdown-text');
                if (this.countdownValue > 0) {
                    ctEl.textContent = this.countdownValue;
                    ctEl.style.animation = 'none';
                    ctEl.offsetHeight; // trigger reflow
                    ctEl.style.animation = '';
                    this.sound.play('countdown');
                } else {
                    ctEl.textContent = 'GO!';
                    ctEl.style.animation = 'none';
                    ctEl.offsetHeight;
                    ctEl.style.animation = '';
                    this.sound.play('go');
                    setTimeout(() => {
                        document.getElementById('countdown-overlay').classList.add('hidden');
                        this.gameState = 'playing';
                    }, 400);
                }
            }
            return;
        }

        if (this.gameState === 'goal') {
            this.goalTimer -= dt;
            if (this.goalTimer <= 0) {
                document.getElementById('goal-overlay').classList.add('hidden');
                document.getElementById('combo-display').classList.add('hidden');

                const winScore = this.gameMode === 'arcade' ? Infinity : this.settings.winScore;
                if (this.p1Score >= winScore || this.p2Score >= winScore) {
                    this.onGameOver();
                } else {
                    this.resetRound();
                }
            }
            return;
        }

        if (this.gameState !== 'playing') return;

        // Input - P1 (bottom)
        const p1Speed = this.p1.speed;
        if (this.keys['KeyA'] || this.keys['ArrowLeft'] && this.gameMode !== 'two-player') {
            this.p1.x -= p1Speed * dt;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight'] && this.gameMode !== 'two-player') {
            this.p1.x += p1Speed * dt;
        }

        // Touch/mouse control for P1
        if (this.touchX !== null) {
            const diff = this.touchX - this.p1.x;
            this.p1.x += Math.sign(diff) * Math.min(Math.abs(diff), p1Speed * dt * 1.5);
        }

        // Clamp P1
        this.p1.x = Math.max(this.p1.width / 2, Math.min(this.W - this.p1.width / 2, this.p1.x));

        // P2 input or AI
        if (this.gameMode === 'two-player') {
            if (this.keys['ArrowLeft']) {
                this.p2.x -= this.p2.speed * dt;
            }
            if (this.keys['ArrowRight']) {
                this.p2.x += this.p2.speed * dt;
            }
            this.p2.x = Math.max(this.p2.width / 2, Math.min(this.W - this.p2.width / 2, this.p2.x));
        } else {
            this.updateAI(dt);
        }

        // Ball
        this.updateBall(dt);
        this.updateExtraBalls(dt);

        // Power-ups
        if (this.settings.powerupsEnabled) {
            this.updatePowerups(dt);
        }

        // Dash offset animation
        this.dashOffset += dt * 30;
    }

    // ---- RENDER ----
    getColor(name) {
        const style = getComputedStyle(document.body);
        switch (name) {
            case 'primary': return style.getPropertyValue('--primary').trim() || '#00f0ff';
            case 'secondary': return style.getPropertyValue('--secondary').trim() || '#ff00e5';
            case 'accent': return style.getPropertyValue('--accent').trim() || '#ffdd00';
            case 'ball': return style.getPropertyValue('--ball-color').trim() || '#ffdd00';
            case 'bg': return style.getPropertyValue('--bg-dark').trim() || '#0a0a1a';
            default: return '#ffffff';
        }
    }

    draw() {
        const ctx = this.ctx;
        const W = this.W;
        const H = this.H;

        if (this.currentScreen !== 'game') return;

        // Clear
        ctx.fillStyle = this.getColor('bg');
        ctx.fillRect(0, 0, W, H);

        // Screen shake transform
        ctx.save();
        if (this.shakeAmount > 0) {
            const sx = (Math.random() - 0.5) * this.shakeAmount * 2;
            const sy = (Math.random() - 0.5) * this.shakeAmount * 2;
            ctx.translate(sx, sy);
        }

        // Draw court
        this.drawCourt(ctx, W, H);

        // Draw power-ups
        this.powerups.forEach(p => p.draw(ctx));

        // Draw ball trail
        this.drawBallTrail(ctx);

        // Draw extra balls
        this.drawExtraBalls(ctx);

        // Draw ball
        this.drawBall(ctx);

        // Draw paddles
        this.drawPaddle(ctx, this.p1, this.getColor('primary'));
        this.drawPaddle(ctx, this.p2, this.getColor('secondary'));

        // Draw particles
        this.particles.draw(ctx);

        ctx.restore();
    }

    drawCourt(ctx, W, H) {
        // Center line
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 2;
        ctx.setLineDash([15, 15]);
        ctx.lineDashOffset = this.dashOffset;
        ctx.beginPath();
        ctx.moveTo(0, H / 2);
        ctx.lineTo(W, H / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Center circle
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, 60, 0, Math.PI * 2);
        ctx.stroke();

        // Corner arcs
        const cornerRadius = 30;
        ctx.beginPath();
        ctx.arc(0, 0, cornerRadius, 0, Math.PI / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(W, 0, cornerRadius, Math.PI / 2, Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, H, cornerRadius, -Math.PI / 2, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(W, H, cornerRadius, Math.PI, Math.PI * 1.5);
        ctx.stroke();

        ctx.restore();
    }

    drawBallTrail(ctx) {
        for (let i = 0; i < this.ballTrail.length; i++) {
            const t = this.ballTrail[i];
            const alpha = (i / this.ballTrail.length) * 0.3;
            const size = this.ball.radius * (i / this.ballTrail.length) * 0.8;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.getColor('ball');
            ctx.beginPath();
            ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    drawBall(ctx) {
        const b = this.ball;
        ctx.save();

        // Glow
        ctx.shadowColor = this.getColor('ball');
        ctx.shadowBlur = 20;

        // Ball
        ctx.fillStyle = this.getColor('ball');
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner highlight
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(b.x - b.radius * 0.2, b.y - b.radius * 0.2, b.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawExtraBalls(ctx) {
        for (const eb of this.extraBalls) {
            // Trail
            for (let i = 0; i < eb.trail.length; i++) {
                const t = eb.trail[i];
                const alpha = (i / eb.trail.length) * 0.2;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = this.getColor('ball');
                ctx.beginPath();
                ctx.arc(t.x, t.y, eb.radius * (i / eb.trail.length) * 0.6, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Ball
            ctx.save();
            ctx.shadowColor = this.getColor('ball');
            ctx.shadowBlur = 15;
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = this.getColor('ball');
            ctx.beginPath();
            ctx.arc(eb.x, eb.y, eb.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    drawPaddle(ctx, paddle, color) {
        const x = paddle.x - paddle.width / 2;
        const y = paddle.y - this.paddleHeight / 2;
        const w = paddle.width;
        const h = this.paddleHeight;
        const r = this.paddleRadius;

        ctx.save();

        // Glow
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;

        // Paddle body
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();

        // Highlight line
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x + 10, y + 2, w - 20, 3);

        ctx.restore();
    }

    // ---- GAME LOOP ----
    loop(timestamp) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }
}

// ---- LAUNCH ----
window.addEventListener('DOMContentLoaded', () => {
    new NeonPong();
});
