/* ============================================
   NEON PONG - ULTIMATE EDITION v2
   Main Game Controller
   ============================================ */

class NeonPong {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.sound = new SoundEngine();
        this.music = new MusicEngine();
        this.particles = new ParticleSystem();

        // Game state
        this.currentScreen = 'menu';
        this.gameMode = 'single';
        this.gameState = 'idle';
        this.settings = {
            difficulty: 'medium', winScore: 10, tournamentSets: 3,
            powerupsEnabled: true, soundEnabled: true, musicEnabled: true,
            shakeEnabled: true, crtEnabled: false, theme: 'neon',
        };

        // Stats
        this.stats = this.loadStats();
        this.achievements = this.loadAchievements();

        // Scores
        this.p1Score = 0;
        this.p2Score = 0;

        // Tournament
        this.tournamentMode = false;
        this.setsToWin = 2;
        this.p1Sets = 0;
        this.p2Sets = 0;
        this.setHistory = [];

        // Ball
        this.ball = { x: 0, y: 0, vx: 0, vy: 0, radius: 8, speed: 0, spin: 0 };
        this.extraBalls = [];
        this.ballTrail = [];
        this.baseSpeed = 350;

        // Paddles
        this.paddleHeight = 14;
        this.paddleWidth = 120;
        this.paddleRadius = 7;
        this.p1 = { x: 0, y: 0, width: this.paddleWidth, targetX: 0, speed: 600, prevX: 0, ghostTrail: [] };
        this.p2 = { x: 0, y: 0, width: this.paddleWidth, targetX: 0, speed: 600, prevX: 0, ghostTrail: [] };

        // Smash system
        this.p1Smash = 0;
        this.p2Smash = 0;
        this.smashMax = 100;
        this.p1Smashing = false;
        this.p2Smashing = false;
        this.smashChargeRate = 50;
        this.totalSmashHits = 0;
        this.gameSmashHits = 0;

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
        this.totalHits = 0;
        this.gameSmashHits = 0;

        // AI
        this.aiTargetX = 0;
        this.aiReactionTimer = 0;
        this.aiError = 0;

        // Timing
        this.lastTime = 0;
        this.countdownValue = 3;
        this.countdownTimer = 0;
        this.goalTimer = 0;

        // Effects
        this.shakeAmount = 0;
        this.shakeDecay = 10;
        this.dashOffset = 0;
        this.announcerTimeout = null;
        this.slowMotion = 1;
        this.slowMotionTimer = 0;
        this.flashAlpha = 0;

        // Practice mode
        this.practiceMode = false;
        this.practiceTimer = 0;
        this.practiceBallInterval = 2;

        // Cached colors
        this._colorCache = {};
        this._colorCacheTheme = '';

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        this.canvas.addEventListener('touchstart', (e) => this.onTouch(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.onTouch(e), { passive: false });
        this.canvas.addEventListener('touchend', () => { this.touchX = null; });
        this.setupMenuListeners();
        this.updateStatsDisplay();
        this.loadSettings();
        this.renderAchievements();
        this.loop(performance.now());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.W = this.canvas.width;
        this.H = this.canvas.height;
        this._colorCache = {};
    }

    // ---- PERSISTENCE ----
    loadStats() {
        try {
            const s = localStorage.getItem('neonpong_stats_v2');
            if (s) return JSON.parse(s);
        } catch (e) {}
        return { highScore: 0, gamesPlayed: 0, wins: 0, streak: 0, bestStreak: 0, totalSmashes: 0 };
    }
    saveStats() { try { localStorage.setItem('neonpong_stats_v2', JSON.stringify(this.stats)); } catch(e) {} }

    loadAchievements() {
        try {
            const a = localStorage.getItem('neonpong_achievements');
            if (a) return JSON.parse(a);
        } catch (e) {}
        return {};
    }
    saveAchievements() { try { localStorage.setItem('neonpong_achievements', JSON.stringify(this.achievements)); } catch(e) {} }

    loadSettings() {
        try {
            const s = localStorage.getItem('neonpong_settings_v2');
            if (s) Object.assign(this.settings, JSON.parse(s));
        } catch (e) {}
        this.applySettings();
    }
    saveSettings() { try { localStorage.setItem('neonpong_settings_v2', JSON.stringify(this.settings)); } catch(e) {} }

    applySettings() {
        document.body.setAttribute('data-theme', this.settings.theme);
        document.getElementById('powerups-toggle').checked = this.settings.powerupsEnabled;
        document.getElementById('sound-toggle').checked = this.settings.soundEnabled;
        document.getElementById('music-toggle').checked = this.settings.musicEnabled;
        document.getElementById('shake-toggle').checked = this.settings.shakeEnabled;
        document.getElementById('crt-toggle').checked = this.settings.crtEnabled;
        this.sound.enabled = this.settings.soundEnabled;
        this.music.enabled = this.settings.musicEnabled;
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.toggle('active', b.dataset.diff === this.settings.difficulty));
        document.querySelectorAll('.score-btn').forEach(b => b.classList.toggle('active', parseInt(b.dataset.score) === this.settings.winScore));
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === this.settings.theme));
        document.querySelectorAll('.sets-btn').forEach(b => b.classList.toggle('active', parseInt(b.dataset.sets) === this.settings.tournamentSets));
        this._colorCache = {};
    }

    updateStatsDisplay() {
        document.getElementById('menu-high-score').textContent = this.stats.highScore;
        document.getElementById('menu-games-played').textContent = this.stats.gamesPlayed;
        const rate = this.stats.gamesPlayed > 0 ? Math.round((this.stats.wins / this.stats.gamesPlayed) * 100) : 0;
        document.getElementById('menu-win-rate').textContent = rate + '%';
        document.getElementById('menu-streak').textContent = this.stats.streak;
        const unlocked = ACHIEVEMENTS.filter(a => this.achievements[a.id]).length;
        document.getElementById('achievement-count').textContent = unlocked + ' / ' + ACHIEVEMENTS.length;
    }

    // ---- ACHIEVEMENTS ----
    unlock(id) {
        if (this.achievements[id]) return;
        this.achievements[id] = true;
        this.saveAchievements();
        const ach = ACHIEVEMENTS.find(a => a.id === id);
        if (!ach) return;
        this.sound.play('achievement');
        const popup = document.getElementById('achievement-popup');
        document.getElementById('achievement-popup-name').textContent = ach.name;
        popup.classList.remove('hidden');
        popup.style.animation = 'none';
        popup.offsetHeight;
        popup.style.animation = '';
        setTimeout(() => popup.classList.add('hidden'), 3500);
        this.renderAchievements();
    }

    renderAchievements() {
        const grid = document.getElementById('achievements-grid');
        grid.innerHTML = ACHIEVEMENTS.map(a => {
            const unlocked = this.achievements[a.id];
            return `<div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
                <span class="achievement-card-icon">${a.icon}</span>
                <div class="achievement-card-info">
                    <span class="achievement-card-name">${unlocked ? a.name : '???'}</span>
                    <span class="achievement-card-desc">${a.desc}</span>
                </div>
            </div>`;
        }).join('');
    }

    checkAchievements() {
        if (this.stats.wins >= 1) this.unlock('first_win');
        if (this.maxRally >= 10) this.unlock('rally_10');
        if (this.maxRally >= 25) this.unlock('rally_25');
        if (this.maxRally >= 50) this.unlock('rally_50');
        if (this.maxCombo >= 5) this.unlock('combo_5');
        if (this.maxCombo >= 15) this.unlock('combo_15');
        if (this.stats.totalSmashes >= 1) this.unlock('smash_first');
        if (this.stats.totalSmashes >= 10) this.unlock('smash_10');
        if (this.maxBallSpeed >= 800) this.unlock('speed_demon');
        if (this.stats.streak >= 3) this.unlock('win_streak_3');
        if (this.stats.streak >= 5) this.unlock('win_streak_5');
        if (this.stats.gamesPlayed >= 10) this.unlock('games_10');
        if (this.stats.gamesPlayed >= 50) this.unlock('games_50');
        if (this.powerupsCollected >= 5) this.unlock('powerup_5');
    }

    // ---- ANNOUNCER ----
    announce(category) {
        const lines = ANNOUNCER[category];
        if (!lines) return;
        const text = lines[Math.floor(Math.random() * lines.length)];
        const el = document.getElementById('announcer-text');
        el.textContent = text;
        el.classList.remove('hidden');
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = '';
        clearTimeout(this.announcerTimeout);
        this.announcerTimeout = setTimeout(() => el.classList.add('hidden'), 2200);
    }

    // ---- MENU ----
    setupMenuListeners() {
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.sound.init();
                if (this.sound.ctx && !this.music.ctx) this.music.init(this.sound.ctx);
                switch (action) {
                    case 'single-player': this.startGame('single'); break;
                    case 'two-player': this.startGame('two-player'); break;
                    case 'arcade': this.startGame('arcade'); break;
                    case 'tournament': this.startGame('tournament'); break;
                    case 'practice': this.startGame('practice'); break;
                    case 'achievements': this.showScreen('achievements'); break;
                    case 'settings': this.showScreen('settings'); break;
                    case 'back-to-menu': this.showScreen('menu'); break;
                    case 'resume': this.resumeGame(); break;
                    case 'restart': this.restartGame(); break;
                    case 'rematch': this.restartGame(); break;
                    case 'quit': this.showScreen('menu'); this.gameState = 'idle'; this.music.stop(); break;
                }
            });
        });

        // Settings selectors
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
        document.querySelectorAll('.sets-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.sets-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.tournamentSets = parseInt(btn.dataset.sets);
                this.saveSettings();
            });
        });
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.theme = btn.dataset.theme;
                document.body.setAttribute('data-theme', this.settings.theme);
                this._colorCache = {};
                this.saveSettings();
            });
        });
        document.getElementById('powerups-toggle').addEventListener('change', (e) => { this.settings.powerupsEnabled = e.target.checked; this.saveSettings(); });
        document.getElementById('sound-toggle').addEventListener('change', (e) => { this.settings.soundEnabled = e.target.checked; this.sound.enabled = e.target.checked; this.saveSettings(); });
        document.getElementById('music-toggle').addEventListener('change', (e) => { this.settings.musicEnabled = e.target.checked; this.music.enabled = e.target.checked; if (!e.target.checked) this.music.stop(); this.saveSettings(); });
        document.getElementById('shake-toggle').addEventListener('change', (e) => { this.settings.shakeEnabled = e.target.checked; this.saveSettings(); });
        document.getElementById('crt-toggle').addEventListener('change', (e) => {
            this.settings.crtEnabled = e.target.checked;
            document.getElementById('crt-overlay').classList.toggle('hidden', !e.target.checked);
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
        this.totalHits = 0;
        this.gameSmashHits = 0;
        this.powerups = [];
        this.activePowerups = [];
        this.extraBalls = [];
        this.lastPowerupSpawn = performance.now();
        this.p1Smash = 0;
        this.p2Smash = 0;
        this.practiceMode = mode === 'practice';

        // Tournament
        this.tournamentMode = mode === 'tournament';
        this.p1Sets = 0;
        this.p2Sets = 0;
        this.setHistory = [];
        this.setsToWin = Math.ceil(this.settings.tournamentSets / 2);

        // Names
        document.getElementById('p1-name').textContent = mode === 'practice' ? 'TRAINING' : 'PLAYER 1';
        if (mode === 'two-player') {
            document.getElementById('p2-name').textContent = 'PLAYER 2';
        } else if (mode === 'practice') {
            document.getElementById('p2-name').textContent = 'BALL MACHINE';
        } else {
            const names = { easy: 'CPU EASY', medium: 'CPU MED', hard: 'CPU HARD', impossible: 'CPU INSANE' };
            document.getElementById('p2-name').textContent = names[this.settings.difficulty] || 'CPU';
        }

        // Tournament display
        const tDisp = document.getElementById('tournament-display');
        if (this.tournamentMode) {
            tDisp.classList.remove('hidden');
            tDisp.textContent = 'SET 1 | FIRST TO ' + this.setsToWin;
        } else {
            tDisp.classList.add('hidden');
        }

        // CRT
        document.getElementById('crt-overlay').classList.toggle('hidden', !this.settings.crtEnabled);

        this.updateHUD();
        this.showScreen('game');
        this.resetRound(true);

        // Music
        if (this.settings.musicEnabled && this.music.ctx) this.music.start();
    }

    restartGame() {
        document.getElementById('pause-overlay').classList.add('hidden');
        this.startGame(this.gameMode);
    }

    resetRound(isFirst = false) {
        this.resetBall();
        this.resetPaddles();
        this.extraBalls = [];
        this.activePowerups = this.activePowerups.filter(p =>
            p.type.id !== 'big_paddle' && p.type.id !== 'small_paddle');
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
        this.ball.spin = 0;
        this.ballTrail = [];
    }

    resetPaddles() {
        this.p1.x = this.W / 2; this.p1.y = this.H - 40; this.p1.targetX = this.W / 2; this.p1.prevX = this.W / 2;
        this.p2.x = this.W / 2; this.p2.y = 40; this.p2.targetX = this.W / 2; this.p2.prevX = this.W / 2;
        this.p1.ghostTrail = [];
        this.p2.ghostTrail = [];
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

        if (this.rallyCount > this.maxRally) this.maxRally = this.rallyCount;
        if (this.comboCount > this.maxCombo) this.maxCombo = this.comboCount;

        // Smash bar charge on scoring
        if (scorer === 1) this.p1Smash = Math.min(this.smashMax, this.p1Smash + 30);
        else this.p2Smash = Math.min(this.smashMax, this.p2Smash + 30);

        // Arcade high score
        if (this.gameMode === 'arcade' && scorer === 1 && this.p1Score > this.stats.highScore) {
            this.stats.highScore = this.p1Score;
        }

        // Announcer for close games
        const winScore = this.getWinScore();
        const diff = Math.abs(this.p1Score - this.p2Score);
        if (diff <= 1 && this.p1Score >= winScore - 2 && this.p2Score >= winScore - 2) {
            this.announce('closeGame');
        } else if (this.p1Score === winScore - 1 || this.p2Score === winScore - 1) {
            this.announce('matchPoint');
        }

        // Comeback detection
        if (scorer === 1 && this.p1Score >= 3 && this.p2Score >= this.p1Score + 2) {
            this.announce('comeback');
        } else if (scorer === 2 && this.p2Score >= 3 && this.p1Score >= this.p2Score + 2) {
            this.announce('comeback');
        }

        // Slow motion effect on score
        this.slowMotion = 0.3;
        this.slowMotionTimer = 0.5;
        this.flashAlpha = 0.3;

        // Goal overlay
        this.gameState = 'goal';
        this.goalTimer = 1.5;
        document.getElementById('goal-overlay').classList.remove('hidden');
        document.getElementById('goal-text').textContent = this.gameMode === 'arcade' ? 'POINT!' : 'GOAL!';
        document.getElementById('goal-scorer').textContent = scorer === 1 ? 'PLAYER 1' :
            (this.gameMode === 'two-player' ? 'PLAYER 2' : 'CPU');

        this.particles.emit(this.ball.x, this.ball.y, 50, scorer === 1 ? this.getColor('primary') : this.getColor('secondary'), { speed: 500, life: 1.2 });

        if (this.settings.shakeEnabled) this.shakeAmount = 12;

        // Check win
        if (this.p1Score >= winScore || this.p2Score >= winScore) {
            this.goalTimer = 0.8;
        }

        this.checkAchievements();
    }

    getWinScore() {
        if (this.gameMode === 'arcade' || this.practiceMode) return Infinity;
        return this.settings.winScore;
    }

    onSetEnd() {
        const p1Won = this.p1Score > this.p2Score;
        this.setHistory.push({ p1: this.p1Score, p2: this.p2Score });
        if (p1Won) this.p1Sets++;
        else this.p2Sets++;

        if (this.p1Sets >= this.setsToWin || this.p2Sets >= this.setsToWin) {
            this.onGameOver();
        } else {
            // Next set
            this.p1Score = 0;
            this.p2Score = 0;
            const tDisp = document.getElementById('tournament-display');
            tDisp.textContent = 'SET ' + (this.setHistory.length + 1) + ' | ' + this.p1Sets + '-' + this.p2Sets;
            this.updateHUD();
            this.resetRound();
        }
    }

    onGameOver() {
        const p1Won = this.p1Score > this.p2Score || (this.tournamentMode && this.p1Sets > this.p2Sets);

        this.stats.gamesPlayed++;
        if (p1Won) {
            this.stats.wins++;
            this.stats.streak++;
            if (this.stats.streak > this.stats.bestStreak) this.stats.bestStreak = this.stats.streak;
        } else {
            this.stats.streak = 0;
        }
        this.stats.totalSmashes += this.gameSmashHits;
        this.saveStats();

        // Achievement checks
        if (p1Won && this.p2Score === 0 && this.gameMode !== 'practice') this.unlock('perfect_game');
        if (p1Won && this.gameMode === 'arcade' && this.p1Score >= 15) this.unlock('arcade_15');
        if (p1Won && this.tournamentMode) this.unlock('tournament_win');
        if (p1Won && this.settings.difficulty === 'impossible' && this.gameMode === 'single') this.unlock('beat_insane');
        this.checkAchievements();

        this.sound.play(p1Won ? 'win' : 'lose');
        this.music.stop();

        // Populate game over
        document.getElementById('winner-text').textContent = p1Won ? 'PLAYER 1 WINS!' :
            (this.gameMode === 'two-player' ? 'PLAYER 2 WINS!' : 'CPU WINS!');
        document.getElementById('final-p1-name').textContent = 'PLAYER 1';
        document.getElementById('final-p2-name').textContent = this.gameMode === 'two-player' ? 'PLAYER 2' : 'CPU';

        if (this.tournamentMode) {
            document.getElementById('final-p1-score').textContent = this.p1Sets;
            document.getElementById('final-p2-score').textContent = this.p2Sets;
            document.getElementById('tournament-result').classList.remove('hidden');
            document.getElementById('set-scores').innerHTML = this.setHistory.map((s, i) => {
                const p1won = s.p1 > s.p2;
                return `<span class="set-score-item ${p1won ? 'won' : ''}">S${i+1}: ${s.p1}-${s.p2}</span>`;
            }).join('');
        } else {
            document.getElementById('final-p1-score').textContent = this.p1Score;
            document.getElementById('final-p2-score').textContent = this.p2Score;
            document.getElementById('tournament-result').classList.add('hidden');
        }

        document.getElementById('stat-rally').textContent = this.maxRally;
        document.getElementById('stat-combo').textContent = this.maxCombo;
        document.getElementById('stat-smashes').textContent = this.gameSmashHits;
        document.getElementById('stat-powerups').textContent = this.powerupsCollected;
        document.getElementById('stat-speed').textContent = Math.round(this.maxBallSpeed) + ' px/s';
        document.getElementById('stat-hits').textContent = this.totalHits;

        this.gameState = 'gameover';
        this.showScreen('gameover');
    }

    updateHUD() {
        document.getElementById('p1-score').textContent = this.p1Score;
        document.getElementById('p2-score').textContent = this.p2Score;
        document.getElementById('p1-smash-bar').style.width = (this.p1Smash / this.smashMax * 100) + '%';
        document.getElementById('p2-smash-bar').style.width = (this.p2Smash / this.smashMax * 100) + '%';
    }

    // ---- INPUT ----
    onKeyDown(e) {
        this.keys[e.code] = true;
        if (e.code === 'Escape') {
            if (this.gameState === 'playing') this.pauseGame();
            else if (this.gameState === 'paused') this.resumeGame();
        }
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    }

    onKeyUp(e) { this.keys[e.code] = false; }

    onTouch(e) {
        e.preventDefault();
        if (e.touches.length > 0) this.touchX = e.touches[0].clientX;
    }

    // ---- AI ----
    updateAI(dt) {
        let reactionSpeed, accuracy, predictiveness, maxSpeed;
        switch (this.settings.difficulty) {
            case 'easy': reactionSpeed = 0.3; accuracy = 0.6; predictiveness = 0.2; maxSpeed = 300; break;
            case 'medium': reactionSpeed = 0.15; accuracy = 0.8; predictiveness = 0.5; maxSpeed = 450; break;
            case 'hard': reactionSpeed = 0.08; accuracy = 0.93; predictiveness = 0.8; maxSpeed = 600; break;
            case 'impossible': reactionSpeed = 0.03; accuracy = 0.99; predictiveness = 0.95; maxSpeed = 800; break;
            default: reactionSpeed = 0.15; accuracy = 0.8; predictiveness = 0.5; maxSpeed = 450;
        }

        this.aiReactionTimer -= dt;
        if (this.aiReactionTimer <= 0) {
            this.aiReactionTimer = reactionSpeed;
            let targetX = this.ball.x;
            if (this.ball.vy < 0) {
                const timeToReach = Math.abs((this.p2.y - this.ball.y) / this.ball.vy);
                let predictX = this.ball.x + this.ball.vx * timeToReach * predictiveness;
                let bounces = 0;
                while ((predictX < 0 || predictX > this.W) && bounces < 5) {
                    if (predictX < 0) predictX = -predictX;
                    if (predictX > this.W) predictX = 2 * this.W - predictX;
                    bounces++;
                }
                targetX = predictX;
            } else {
                targetX = this.W / 2;
            }
            this.aiError = (1 - accuracy) * (Math.random() - 0.5) * this.p2.width * 2;
            this.aiTargetX = targetX + this.aiError;
        }

        // AI uses smash when bar is full and ball is close
        if (this.p2Smash >= this.smashMax && this.ball.vy < 0 && Math.abs(this.ball.y - this.p2.y) < 100) {
            this.p2Smashing = true;
        } else {
            this.p2Smashing = false;
        }

        const diff2 = this.aiTargetX - this.p2.x;
        const moveSpeed = Math.min(Math.abs(diff2), maxSpeed * dt);
        if (Math.abs(diff2) > 5) this.p2.x += Math.sign(diff2) * moveSpeed;
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
                const paddle = collector === 1 ? this.p2 : this.p1;
                paddle.width = this.paddleWidth * 0.5;
                this.activePowerups.push({ type, collector, endTime: performance.now() + type.duration * 1000 });
                break;
            }
            case 'fast_ball':
                this.ball.speed *= 1.5;
                this.ball.vx *= 1.5; this.ball.vy *= 1.5;
                this.activePowerups.push({ type, collector, endTime: performance.now() + type.duration * 1000 });
                break;
            case 'slow_ball':
                this.ball.speed *= 0.5;
                this.ball.vx *= 0.5; this.ball.vy *= 0.5;
                this.activePowerups.push({ type, collector, endTime: performance.now() + type.duration * 1000 });
                break;
            case 'multi_ball':
                for (let i = 0; i < 2; i++) {
                    const angle = (Math.random() - 0.5) * Math.PI * 0.5;
                    this.extraBalls.push({
                        x: this.ball.x, y: this.ball.y,
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
            case 'ghost_ball':
                this.activePowerups.push({ type, collector, endTime: performance.now() + type.duration * 1000 });
                break;
            case 'magnet':
                this.activePowerups.push({ type, collector, endTime: performance.now() + type.duration * 1000 });
                break;
        }
    }

    updatePowerups(dt) {
        const now = performance.now();
        if (now - this.lastPowerupSpawn > this.powerupInterval && this.powerups.length < 3) {
            this.spawnPowerup();
            this.lastPowerupSpawn = now;
        }

        this.powerups.forEach(p => p.update(dt));
        this.powerups = this.powerups.filter(p => p.alive);

        // Ball collision with powerups
        const allBalls = [this.ball, ...this.extraBalls];
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            for (const b of allBalls) {
                const dx = b.x - p.x, dy = b.y - p.y;
                if (Math.sqrt(dx * dx + dy * dy) < (b.radius || this.ball.radius) + p.radius) {
                    const collector = b.vy > 0 ? 1 : 2;
                    this.applyPowerup(p.type, collector);
                    this.particles.emit(p.x, p.y, 20, p.type.color, { speed: 200, life: 0.5 });
                    this.powerups.splice(i, 1);
                    break;
                }
            }
        }

        // Expire
        for (let i = this.activePowerups.length - 1; i >= 0; i--) {
            const ap = this.activePowerups[i];
            if (ap.endTime && now > ap.endTime) {
                switch (ap.type.id) {
                    case 'big_paddle': case 'small_paddle': {
                        const paddle = ap.type.id === 'big_paddle'
                            ? (ap.collector === 1 ? this.p1 : this.p2)
                            : (ap.collector === 1 ? this.p2 : this.p1);
                        paddle.width = this.paddleWidth;
                        break;
                    }
                    case 'fast_ball':
                        this.ball.vx /= 1.5; this.ball.vy /= 1.5; this.ball.speed /= 1.5;
                        break;
                    case 'slow_ball':
                        this.ball.vx /= 0.5; this.ball.vy /= 0.5; this.ball.speed /= 0.5;
                        break;
                }
                this.activePowerups.splice(i, 1);
            }
        }
    }

    // ---- PHYSICS ----
    updateBall(dt) {
        // Curve effect
        if (this.activePowerups.some(p => p.type.id === 'curve_ball')) {
            this.ball.vx += Math.sin(performance.now() / 200) * 500 * dt;
        }

        // Magnet effect - ball curves toward collector's paddle
        const magnetPower = this.activePowerups.find(p => p.type.id === 'magnet');
        if (magnetPower) {
            const paddle = magnetPower.collector === 1 ? this.p1 : this.p2;
            const dx = paddle.x - this.ball.x;
            this.ball.vx += Math.sign(dx) * 150 * dt;
        }

        // Apply spin
        this.ball.vx += this.ball.spin * dt * 100;
        this.ball.spin *= 0.99;

        this.ball.x += this.ball.vx * dt;
        this.ball.y += this.ball.vy * dt;

        const currentSpeed = Math.sqrt(this.ball.vx ** 2 + this.ball.vy ** 2);
        if (currentSpeed > this.maxBallSpeed) this.maxBallSpeed = currentSpeed;

        // Wall bounce
        if (this.ball.x - this.ball.radius < 0) {
            this.ball.x = this.ball.radius;
            this.ball.vx = Math.abs(this.ball.vx);
            this.sound.play('wall');
            this.particles.emit(this.ball.x, this.ball.y, 10, this.getColor('accent'), { speed: 150, spread: Math.PI, angle: 0 });
        } else if (this.ball.x + this.ball.radius > this.W) {
            this.ball.x = this.W - this.ball.radius;
            this.ball.vx = -Math.abs(this.ball.vx);
            this.sound.play('wall');
            this.particles.emit(this.ball.x, this.ball.y, 10, this.getColor('accent'), { speed: 150, spread: Math.PI, angle: Math.PI });
        }

        // Paddle collisions
        this.checkPaddleCollision(this.p1, 1);
        this.checkPaddleCollision(this.p2, 2);

        // Score detection (not in practice mode)
        if (this.ball.y - this.ball.radius > this.H) {
            if (this.practiceMode) this.resetBall();
            else this.onScore(2);
        } else if (this.ball.y + this.ball.radius < 0) {
            if (this.practiceMode) this.resetBall();
            else this.onScore(1);
        }

        // Trail
        this.ballTrail.push({ x: this.ball.x, y: this.ball.y });
        if (this.ballTrail.length > 25) this.ballTrail.shift();

        if (Math.random() < 0.4) this.particles.trail(this.ball.x, this.ball.y, this.getColor('ball'), 2);
    }

    updateExtraBalls(dt) {
        for (let i = this.extraBalls.length - 1; i >= 0; i--) {
            const eb = this.extraBalls[i];
            eb.x += eb.vx * dt;
            eb.y += eb.vy * dt;

            if (eb.x - eb.radius < 0 || eb.x + eb.radius > this.W) {
                eb.vx = -eb.vx;
                eb.x = Math.max(eb.radius, Math.min(this.W - eb.radius, eb.x));
            }

            this.checkExtraBallPaddleCollision(eb, this.p1);
            this.checkExtraBallPaddleCollision(eb, this.p2);

            if (eb.y < -50 || eb.y > this.H + 50) {
                this.extraBalls.splice(i, 1);
                continue;
            }

            eb.trail.push({ x: eb.x, y: eb.y });
            if (eb.trail.length > 10) eb.trail.shift();
        }
    }

    checkPaddleCollision(paddle, playerNum) {
        const isP1 = playerNum === 1;
        const pTop = paddle.y - this.paddleHeight / 2;
        const pBot = paddle.y + this.paddleHeight / 2;
        const pLeft = paddle.x - paddle.width / 2;
        const pRight = paddle.x + paddle.width / 2;

        let hit = false;
        if (isP1) {
            hit = this.ball.y + this.ball.radius >= pTop && this.ball.y + this.ball.radius <= pBot + 8 &&
                  this.ball.x >= pLeft && this.ball.x <= pRight && this.ball.vy > 0;
        } else {
            hit = this.ball.y - this.ball.radius <= pBot && this.ball.y - this.ball.radius >= pTop - 8 &&
                  this.ball.x >= pLeft && this.ball.x <= pRight && this.ball.vy < 0;
        }

        if (!hit) return;

        const hitPos = (this.ball.x - paddle.x) / (paddle.width / 2);
        const maxAngle = Math.PI / 3;
        const angle = hitPos * maxAngle;

        // Paddle movement adds spin
        const paddleVelocity = paddle.x - paddle.prevX;
        this.ball.spin += paddleVelocity * 0.05;

        // Smash hit check
        const isSmashing = isP1 ? (this.p1Smashing && this.p1Smash >= this.smashMax) : (this.p2Smashing && this.p2Smash >= this.smashMax);
        let speedMultiplier = 1;

        if (isSmashing) {
            speedMultiplier = 1.8;
            if (isP1) this.p1Smash = 0;
            else this.p2Smash = 0;
            this.gameSmashHits++;
            this.sound.play('smash');
            this.announce('smash');
            this.particles.emit(this.ball.x, isP1 ? pTop : pBot, 30,
                this.getColor('accent'), { speed: 400, life: 0.6 });
            if (this.settings.shakeEnabled) this.shakeAmount = 8;
            this.flashAlpha = 0.2;
            this.slowMotion = 0.2;
            this.slowMotionTimer = 0.3;
        }

        this.ball.speed = Math.min(this.ball.speed + 8, 900) * speedMultiplier;
        if (speedMultiplier > 1) {
            // Clamp post-smash
            this.ball.speed = Math.min(this.ball.speed, 1200);
        }

        this.ball.vx = Math.sin(angle) * this.ball.speed;
        this.ball.vy = (isP1 ? -1 : 1) * Math.cos(angle) * this.ball.speed;

        if (isP1) this.ball.y = pTop - this.ball.radius;
        else this.ball.y = pBot + this.ball.radius;

        this.rallyCount++;
        this.comboCount++;
        this.totalHits++;
        if (this.comboCount > this.maxCombo) this.maxCombo = this.comboCount;
        if (this.rallyCount > this.maxRally) this.maxRally = this.rallyCount;

        // Smash bar charge from rallying
        if (isP1) this.p1Smash = Math.min(this.smashMax, this.p1Smash + 12);
        else this.p2Smash = Math.min(this.smashMax, this.p2Smash + 12);

        // Combo display
        if (this.comboCount >= 3) {
            const comboEl = document.getElementById('combo-display');
            comboEl.textContent = this.comboCount + 'x RALLY';
            comboEl.classList.remove('hidden');
        }

        // Announcer based on rally
        if (this.rallyCount === 5) this.announce('rallyStart');
        else if (this.rallyCount === 10) this.announce('rallyMid');
        else if (this.rallyCount === 20) this.announce('rallyHigh');
        else if (this.rallyCount > 20 && this.rallyCount % 10 === 0) this.announce('rallyHigh');

        this.sound.play('hit');

        const pColor = isP1 ? this.getColor('primary') : this.getColor('secondary');
        this.particles.emit(this.ball.x, isP1 ? pTop : pBot, 15, pColor,
            { speed: 200, life: 0.4, spread: Math.PI, angle: isP1 ? -Math.PI / 2 : Math.PI / 2 });

        if (this.ball.speed > 500 && this.settings.shakeEnabled && !isSmashing) {
            this.shakeAmount = Math.min((this.ball.speed - 500) / 50, 6);
        }

        // Music intensity based on rally
        this.music.setIntensity(Math.min(1, this.rallyCount / 15));

        this.checkAchievements();
    }

    checkExtraBallPaddleCollision(eb, paddle) {
        const pTop = paddle.y - this.paddleHeight / 2;
        const pBot = paddle.y + this.paddleHeight / 2;
        const pLeft = paddle.x - paddle.width / 2;
        const pRight = paddle.x + paddle.width / 2;

        if (eb.y + eb.radius >= pTop && eb.y - eb.radius <= pBot &&
            eb.x >= pLeft && eb.x <= pRight) {
            eb.vy = -eb.vy;
            this.sound.play('hit');
        }
    }

    // ---- PRACTICE MODE ----
    updatePractice(dt) {
        this.practiceTimer += dt;
        // Practice auto-controls P2 paddle perfectly
        this.p2.x += (this.ball.x - this.p2.x) * 0.15;
        this.p2.x = Math.max(this.p2.width / 2, Math.min(this.W - this.p2.width / 2, this.p2.x));
    }

    // ---- UPDATE ----
    update(dt) {
        dt = Math.min(dt, 0.05);
        if (this.currentScreen !== 'game') return;

        this.particles.update(dt);

        // Slow motion
        if (this.slowMotionTimer > 0) {
            this.slowMotionTimer -= dt;
            if (this.slowMotionTimer <= 0) this.slowMotion = 1;
        }

        // Flash fade
        if (this.flashAlpha > 0) this.flashAlpha -= dt * 2;

        // Shake decay
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
                    ctEl.style.animation = 'none'; ctEl.offsetHeight; ctEl.style.animation = '';
                    this.sound.play('countdown');
                } else {
                    ctEl.textContent = 'GO!';
                    ctEl.style.animation = 'none'; ctEl.offsetHeight; ctEl.style.animation = '';
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
                const winScore = this.getWinScore();
                if (this.p1Score >= winScore || this.p2Score >= winScore) {
                    if (this.tournamentMode) this.onSetEnd();
                    else this.onGameOver();
                } else {
                    this.resetRound();
                }
            }
            return;
        }

        if (this.gameState !== 'playing') return;

        const gameDt = dt * this.slowMotion;

        // P1 Input (bottom)
        this.p1.prevX = this.p1.x;
        const p1Speed = this.p1.speed;
        if (this.keys['KeyA'] || (this.keys['ArrowLeft'] && this.gameMode !== 'two-player')) {
            this.p1.x -= p1Speed * gameDt;
        }
        if (this.keys['KeyD'] || (this.keys['ArrowRight'] && this.gameMode !== 'two-player')) {
            this.p1.x += p1Speed * gameDt;
        }
        // Smash: hold Space (P1) or ShiftRight (P2)
        this.p1Smashing = this.keys['Space'] || false;
        if (this.gameMode === 'two-player') this.p2Smashing = this.keys['ShiftRight'] || false;

        // Touch
        if (this.touchX !== null) {
            const diff = this.touchX - this.p1.x;
            this.p1.x += Math.sign(diff) * Math.min(Math.abs(diff), p1Speed * gameDt * 1.5);
        }
        this.p1.x = Math.max(this.p1.width / 2, Math.min(this.W - this.p1.width / 2, this.p1.x));

        // Ghost trail for P1
        if (Math.abs(this.p1.x - this.p1.prevX) > 2) {
            this.p1.ghostTrail.push({ x: this.p1.prevX, alpha: 0.4 });
            if (this.p1.ghostTrail.length > 5) this.p1.ghostTrail.shift();
        }

        // P2
        this.p2.prevX = this.p2.x;
        if (this.gameMode === 'two-player') {
            if (this.keys['ArrowLeft']) this.p2.x -= this.p2.speed * gameDt;
            if (this.keys['ArrowRight']) this.p2.x += this.p2.speed * gameDt;
            this.p2.x = Math.max(this.p2.width / 2, Math.min(this.W - this.p2.width / 2, this.p2.x));
        } else if (this.practiceMode) {
            this.updatePractice(gameDt);
        } else {
            this.updateAI(gameDt);
        }

        // Ghost trail for P2
        if (Math.abs(this.p2.x - this.p2.prevX) > 2) {
            this.p2.ghostTrail.push({ x: this.p2.prevX, alpha: 0.4 });
            if (this.p2.ghostTrail.length > 5) this.p2.ghostTrail.shift();
        }

        // Fade ghost trails
        for (const g of this.p1.ghostTrail) g.alpha -= dt * 2;
        for (const g of this.p2.ghostTrail) g.alpha -= dt * 2;
        this.p1.ghostTrail = this.p1.ghostTrail.filter(g => g.alpha > 0);
        this.p2.ghostTrail = this.p2.ghostTrail.filter(g => g.alpha > 0);

        // Ball
        this.updateBall(gameDt);
        this.updateExtraBalls(gameDt);

        // Power-ups
        if (this.settings.powerupsEnabled) this.updatePowerups(gameDt);

        // HUD
        this.updateHUD();

        this.dashOffset += dt * 30;
    }

    // ---- RENDER ----
    getColor(name) {
        const theme = this.settings.theme;
        if (this._colorCacheTheme !== theme) {
            this._colorCache = {};
            this._colorCacheTheme = theme;
        }
        if (this._colorCache[name]) return this._colorCache[name];
        const style = getComputedStyle(document.body);
        let val;
        switch (name) {
            case 'primary': val = style.getPropertyValue('--primary').trim() || '#00f0ff'; break;
            case 'secondary': val = style.getPropertyValue('--secondary').trim() || '#ff00e5'; break;
            case 'accent': val = style.getPropertyValue('--accent').trim() || '#ffdd00'; break;
            case 'ball': val = style.getPropertyValue('--ball-color').trim() || '#ffdd00'; break;
            case 'bg': val = style.getPropertyValue('--bg-dark').trim() || '#0a0a1a'; break;
            default: val = '#ffffff';
        }
        this._colorCache[name] = val;
        return val;
    }

    draw() {
        const ctx = this.ctx;
        if (this.currentScreen !== 'game') return;

        ctx.fillStyle = this.getColor('bg');
        ctx.fillRect(0, 0, this.W, this.H);

        ctx.save();
        if (this.shakeAmount > 0) {
            ctx.translate((Math.random() - 0.5) * this.shakeAmount * 2,
                          (Math.random() - 0.5) * this.shakeAmount * 2);
        }

        this.drawCourt(ctx);
        this.powerups.forEach(p => p.draw(ctx));
        this.drawBallTrail(ctx);
        this.drawExtraBalls(ctx);
        this.drawSpeedLines(ctx);
        this.drawBall(ctx);
        this.drawPaddleGhosts(ctx, this.p1, this.getColor('primary'));
        this.drawPaddleGhosts(ctx, this.p2, this.getColor('secondary'));
        this.drawPaddle(ctx, this.p1, this.getColor('primary'), this.p1Smash, this.p1Smashing);
        this.drawPaddle(ctx, this.p2, this.getColor('secondary'), this.p2Smash, this.p2Smashing);
        this.particles.draw(ctx);

        // Flash effect
        if (this.flashAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = this.flashAlpha;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, this.W, this.H);
            ctx.restore();
        }

        ctx.restore();
    }

    drawCourt(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 2;
        ctx.setLineDash([15, 15]);
        ctx.lineDashOffset = this.dashOffset;
        ctx.beginPath();
        ctx.moveTo(0, this.H / 2);
        ctx.lineTo(this.W, this.H / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Center circle
        ctx.beginPath();
        ctx.arc(this.W / 2, this.H / 2, 60, 0, Math.PI * 2);
        ctx.stroke();

        // Win score markers (dots showing how many to win)
        const winScore = this.getWinScore();
        if (winScore !== Infinity && winScore <= 21) {
            const dotRadius = 3;
            const spacing = 15;
            const startX = this.W / 2 - ((winScore - 1) * spacing) / 2;

            // P1 dots (bottom half)
            for (let i = 0; i < winScore; i++) {
                ctx.beginPath();
                ctx.arc(startX + i * spacing, this.H / 2 + 25, dotRadius, 0, Math.PI * 2);
                if (i < this.p1Score) {
                    ctx.fillStyle = this.getColor('primary');
                    ctx.shadowColor = this.getColor('primary');
                    ctx.shadowBlur = 8;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                } else {
                    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                    ctx.stroke();
                }
            }
            // P2 dots (top half)
            for (let i = 0; i < winScore; i++) {
                ctx.beginPath();
                ctx.arc(startX + i * spacing, this.H / 2 - 25, dotRadius, 0, Math.PI * 2);
                if (i < this.p2Score) {
                    ctx.fillStyle = this.getColor('secondary');
                    ctx.shadowColor = this.getColor('secondary');
                    ctx.shadowBlur = 8;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                } else {
                    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                    ctx.stroke();
                }
            }
        }

        ctx.restore();
    }

    drawSpeedLines(ctx) {
        const speed = Math.sqrt(this.ball.vx ** 2 + this.ball.vy ** 2);
        if (speed < 500) return;

        const intensity = Math.min(1, (speed - 500) / 400);
        const count = Math.floor(intensity * 12);
        const angle = Math.atan2(this.ball.vy, this.ball.vx);

        ctx.save();
        ctx.globalAlpha = intensity * 0.15;
        ctx.strokeStyle = this.getColor('ball');
        ctx.lineWidth = 1.5;

        for (let i = 0; i < count; i++) {
            const offset = (Math.random() - 0.5) * 200;
            const perpAngle = angle + Math.PI / 2;
            const startX = this.ball.x + Math.cos(perpAngle) * offset;
            const startY = this.ball.y + Math.sin(perpAngle) * offset;
            const len = 30 + Math.random() * 60;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX - Math.cos(angle) * len, startY - Math.sin(angle) * len);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawBallTrail(ctx) {
        const isGhost = this.activePowerups.some(p => p.type.id === 'ghost_ball');
        for (let i = 0; i < this.ballTrail.length; i++) {
            const t = this.ballTrail[i];
            const pct = i / this.ballTrail.length;
            const alpha = pct * (isGhost ? 0.15 : 0.3);
            const size = this.ball.radius * pct * 0.8;
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
        const speed = Math.sqrt(b.vx ** 2 + b.vy ** 2);

        // Ghost ball effect - ball flickers in and out
        const isGhost = this.activePowerups.some(p => p.type.id === 'ghost_ball');
        if (isGhost && Math.sin(performance.now() / 50) > 0.3) {
            return; // Don't draw - invisible
        }

        // Ball deformation (squash and stretch)
        const stretchFactor = Math.min(1.4, 1 + speed / 2000);
        const angle = Math.atan2(b.vy, b.vx);

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(angle);

        // Glow
        ctx.shadowColor = this.getColor('ball');
        ctx.shadowBlur = 15 + speed / 50;

        // Stretched ball
        ctx.fillStyle = this.getColor('ball');
        ctx.beginPath();
        ctx.ellipse(0, 0, b.radius * stretchFactor, b.radius / stretchFactor, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner highlight
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.ellipse(-b.radius * 0.15, -b.radius * 0.15, b.radius * 0.3, b.radius * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawExtraBalls(ctx) {
        for (const eb of this.extraBalls) {
            for (let i = 0; i < eb.trail.length; i++) {
                const t = eb.trail[i];
                ctx.save();
                ctx.globalAlpha = (i / eb.trail.length) * 0.2;
                ctx.fillStyle = this.getColor('ball');
                ctx.beginPath();
                ctx.arc(t.x, t.y, eb.radius * (i / eb.trail.length) * 0.6, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
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

    drawPaddleGhosts(ctx, paddle, color) {
        for (const ghost of paddle.ghostTrail) {
            if (ghost.alpha <= 0) continue;
            ctx.save();
            ctx.globalAlpha = ghost.alpha * 0.3;
            const x = ghost.x - paddle.width / 2;
            const y = paddle.y - this.paddleHeight / 2;
            ctx.fillStyle = color;
            ctx.beginPath();
            this._roundRect(ctx, x, y, paddle.width, this.paddleHeight, this.paddleRadius);
            ctx.fill();
            ctx.restore();
        }
    }

    drawPaddle(ctx, paddle, color, smashCharge, isSmashing) {
        const x = paddle.x - paddle.width / 2;
        const y = paddle.y - this.paddleHeight / 2;
        const w = paddle.width;
        const h = this.paddleHeight;

        ctx.save();

        // Smash glow when charged
        if (smashCharge >= this.smashMax) {
            ctx.shadowColor = this.getColor('accent');
            ctx.shadowBlur = 25 + Math.sin(performance.now() / 100) * 10;
        } else {
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
        }

        // Smashing animation - paddle pulses
        if (isSmashing && smashCharge >= this.smashMax) {
            ctx.shadowBlur = 35;
            const pulse = 1 + Math.sin(performance.now() / 50) * 0.05;
            ctx.translate(paddle.x, paddle.y);
            ctx.scale(pulse, pulse);
            ctx.translate(-paddle.x, -paddle.y);
        }

        // Paddle body
        ctx.fillStyle = smashCharge >= this.smashMax ? this.getColor('accent') : color;
        ctx.beginPath();
        this._roundRect(ctx, x, y, w, h, this.paddleRadius);
        ctx.fill();

        // Highlight
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x + 8, y + 2, w - 16, 3);

        // Smash charge indicator on paddle
        if (smashCharge > 0 && smashCharge < this.smashMax) {
            const chargeWidth = (smashCharge / this.smashMax) * (w - 16);
            ctx.fillStyle = this.getColor('accent');
            ctx.globalAlpha = 0.4;
            ctx.fillRect(x + 8, y + h - 4, chargeWidth, 2);
        }

        ctx.restore();
    }

    _roundRect(ctx, x, y, w, h, r) {
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
    }

    // ---- GAME LOOP ----
    loop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;
        this.update(dt);
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }
}

// ---- LAUNCH ----
window.addEventListener('DOMContentLoaded', () => { new NeonPong(); });
