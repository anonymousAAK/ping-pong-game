/* ============================================
   NEON PONG - Sound, Particles, Music Engine
   ============================================ */

// ---- SOUND ENGINE ----
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
        } catch (e) { this.enabled = false; }
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
                osc.start(now); osc.stop(now + 0.1);
                break;
            case 'wall':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.start(now); osc.stop(now + 0.08);
                break;
            case 'score':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523, now);
                osc.frequency.setValueAtTime(659, now + 0.1);
                osc.frequency.setValueAtTime(784, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc.start(now); osc.stop(now + 0.4);
                break;
            case 'powerup':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.start(now); osc.stop(now + 0.3);
                break;
            case 'win':
                osc.type = 'sine';
                [523, 659, 784, 1047].forEach((freq, i) => {
                    osc.frequency.setValueAtTime(freq, now + i * 0.15);
                });
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
                osc.start(now); osc.stop(now + 0.7);
                break;
            case 'lose':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                osc.start(now); osc.stop(now + 0.5);
                break;
            case 'countdown':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.start(now); osc.stop(now + 0.15);
                break;
            case 'go':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.setValueAtTime(1000, now + 0.05);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.start(now); osc.stop(now + 0.2);
                break;
            case 'smash':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(1600, now + 0.08);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.start(now); osc.stop(now + 0.15);
                break;
            case 'achievement':
                osc.type = 'sine';
                [660, 880, 1100, 1320].forEach((freq, i) => {
                    osc.frequency.setValueAtTime(freq, now + i * 0.1);
                });
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                osc.start(now); osc.stop(now + 0.5);
                break;
        }
    }
}

// ---- MUSIC ENGINE (Procedural Ambient) ----
class MusicEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.playing = false;
        this.nodes = [];
        this.masterGain = null;
        this.intensity = 0;
    }

    init(audioCtx) {
        this.ctx = audioCtx;
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0;
        this.masterGain.connect(this.ctx.destination);
    }

    start() {
        if (!this.ctx || !this.enabled || this.playing) return;
        this.playing = true;
        this.masterGain.gain.setValueAtTime(0.06, this.ctx.currentTime);
        this._playBassLoop();
        this._playPadLoop();
        this._playArpLoop();
    }

    stop() {
        this.playing = false;
        if (this.masterGain) {
            this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
        }
        this.nodes.forEach(n => { try { n.stop(); } catch(e) {} });
        this.nodes = [];
    }

    setIntensity(val) {
        this.intensity = Math.max(0, Math.min(1, val));
    }

    _playBassLoop() {
        if (!this.playing) return;
        const now = this.ctx.currentTime;
        const notes = [55, 55, 65.41, 73.42]; // A1, A1, C2, D2
        const note = notes[Math.floor(Math.random() * notes.length)];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = note;
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 2);
        this.nodes.push(osc);
        osc.onended = () => {
            this.nodes = this.nodes.filter(n => n !== osc);
            if (this.playing) setTimeout(() => this._playBassLoop(), 0);
        };
    }

    _playPadLoop() {
        if (!this.playing) return;
        const now = this.ctx.currentTime;
        const chords = [[220, 277, 330], [196, 247, 294], [174.6, 220, 261.6]];
        const chord = chords[Math.floor(Math.random() * chords.length)];
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.08 + this.intensity * 0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
        gain.connect(this.masterGain);

        chord.forEach(freq => {
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            osc.connect(gain);
            osc.start(now);
            osc.stop(now + 4);
            this.nodes.push(osc);
            osc.onended = () => { this.nodes = this.nodes.filter(n => n !== osc); };
        });

        setTimeout(() => { if (this.playing) this._playPadLoop(); }, 4000);
    }

    _playArpLoop() {
        if (!this.playing) return;
        const now = this.ctx.currentTime;
        const scale = [440, 494, 523, 587, 659, 698, 784, 880];
        const stepTime = 0.15 - this.intensity * 0.05;
        const steps = 4 + Math.floor(this.intensity * 4);

        const gain = this.ctx.createGain();
        gain.connect(this.masterGain);

        for (let i = 0; i < steps; i++) {
            const osc = this.ctx.createOscillator();
            osc.type = 'triangle';
            const note = scale[Math.floor(Math.random() * scale.length)];
            osc.frequency.value = note;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.06 + this.intensity * 0.04, now + i * stepTime);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * stepTime + 0.1);
            osc.connect(g);
            g.connect(this.masterGain);
            osc.start(now + i * stepTime);
            osc.stop(now + i * stepTime + 0.12);
            this.nodes.push(osc);
            osc.onended = () => { this.nodes = this.nodes.filter(n => n !== osc); };
        }

        const loopTime = (steps * stepTime + 0.5 + Math.random() * 1.5) * 1000;
        setTimeout(() => { if (this.playing) this._playArpLoop(); }, loopTime);
    }
}

// ---- PARTICLE SYSTEM ----
class Particle {
    constructor(x, y, vx, vy, life, color, size) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.life = life; this.maxLife = life;
        this.color = color; this.size = size;
    }
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        this.vx *= 0.98;
        this.vy *= 0.98;
    }
    get alpha() { return Math.max(0, this.life / this.maxLife); }
    get alive() { return this.life > 0; }
}

class ParticleSystem {
    constructor() { this.particles = []; }

    emit(x, y, count, color, options = {}) {
        const { speed = 200, life = 0.6, size = 3, spread = Math.PI * 2, angle = 0 } = options;
        for (let i = 0; i < count; i++) {
            const a = angle - spread / 2 + Math.random() * spread;
            const s = speed * (0.3 + Math.random() * 0.7);
            this.particles.push(new Particle(x, y, Math.cos(a) * s, Math.sin(a) * s,
                life * (0.5 + Math.random() * 0.5), color, size * (0.5 + Math.random() * 0.5)));
        }
    }

    trail(x, y, color, size = 2) {
        this.particles.push(new Particle(
            x + (Math.random() - 0.5) * 4, y + (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20,
            0.3 + Math.random() * 0.2, color, size));
    }

    update(dt) {
        this.particles = this.particles.filter(p => { p.update(dt); return p.alive; });
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

// ---- POWER-UP TYPES ----
const POWERUP_TYPES = [
    { id: 'big_paddle', name: 'BIG PADDLE', color: '#00ff88', duration: 8, icon: '[ ]' },
    { id: 'small_paddle', name: 'SHRINK', color: '#ff4444', duration: 8, icon: '||' },
    { id: 'fast_ball', name: 'SPEED UP', color: '#ff8800', duration: 6, icon: '>>' },
    { id: 'slow_ball', name: 'SLOW MO', color: '#8888ff', duration: 6, icon: '<<' },
    { id: 'multi_ball', name: 'MULTI BALL', color: '#ff00ff', duration: 0, icon: '**' },
    { id: 'curve_ball', name: 'CURVE BALL', color: '#ffff00', duration: 8, icon: '~' },
    { id: 'ghost_ball', name: 'GHOST BALL', color: '#aaaaff', duration: 7, icon: '??' },
    { id: 'magnet', name: 'MAGNET', color: '#ff6688', duration: 6, icon: 'U' },
];

class PowerUp {
    constructor(x, y, type, W, H) {
        this.x = x; this.y = y;
        this.type = type;
        this.radius = 15;
        this.alive = true;
        this.spawnTime = performance.now();
        this.lifetime = 10000;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.baseY = y;
    }
    update(dt) {
        this.pulsePhase += dt * 3;
        this.y = this.baseY + Math.sin(this.pulsePhase) * 8;
        if (performance.now() - this.spawnTime > this.lifetime) this.alive = false;
    }
    draw(ctx) {
        const pulse = 0.8 + Math.sin(this.pulsePhase) * 0.2;
        const timeLeft = 1 - (performance.now() - this.spawnTime) / this.lifetime;
        ctx.save();
        ctx.globalAlpha = timeLeft < 0.3 ? (Math.sin(performance.now() / 100) * 0.5 + 0.5) : 1;
        ctx.shadowColor = this.type.color;
        ctx.shadowBlur = 20 * pulse;
        ctx.strokeStyle = this.type.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = this.type.color;
        ctx.globalAlpha *= 0.3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = timeLeft < 0.3 ? (Math.sin(performance.now() / 100) * 0.5 + 0.5) : 1;
        ctx.fillStyle = this.type.color;
        ctx.font = 'bold 9px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type.icon, this.x, this.y);
        ctx.restore();
    }
}

// ---- ACHIEVEMENTS ----
const ACHIEVEMENTS = [
    { id: 'first_win', name: 'FIRST BLOOD', desc: 'Win your first game', icon: '&#9733;' },
    { id: 'rally_10', name: 'RALLY MASTER', desc: 'Achieve a 10-hit rally', icon: '&#9733;' },
    { id: 'rally_25', name: 'UNSTOPPABLE', desc: 'Achieve a 25-hit rally', icon: '&#9733;' },
    { id: 'rally_50', name: 'LEGENDARY RALLY', desc: '50-hit rally!', icon: '&#9733;' },
    { id: 'smash_first', name: 'SMASH!', desc: 'Land your first smash hit', icon: '&#9889;' },
    { id: 'smash_10', name: 'SMASH KING', desc: 'Land 10 smash hits total', icon: '&#9889;' },
    { id: 'perfect_game', name: 'FLAWLESS', desc: 'Win without losing a point', icon: '&#9812;' },
    { id: 'speed_demon', name: 'SPEED DEMON', desc: 'Ball exceeds 800 px/s', icon: '&#9889;' },
    { id: 'win_streak_3', name: 'HAT TRICK', desc: 'Win 3 games in a row', icon: '&#127942;' },
    { id: 'win_streak_5', name: 'DOMINATION', desc: 'Win 5 games in a row', icon: '&#127942;' },
    { id: 'games_10', name: 'DEDICATED', desc: 'Play 10 games', icon: '&#127918;' },
    { id: 'games_50', name: 'ADDICTED', desc: 'Play 50 games', icon: '&#127918;' },
    { id: 'powerup_5', name: 'POWER HUNGRY', desc: 'Collect 5 power-ups in one game', icon: '&#9889;' },
    { id: 'arcade_15', name: 'ARCADE PRO', desc: 'Score 15 in Arcade mode', icon: '&#127918;' },
    { id: 'tournament_win', name: 'CHAMPION', desc: 'Win a tournament', icon: '&#127942;' },
    { id: 'beat_insane', name: 'INHUMAN', desc: 'Beat INSANE difficulty AI', icon: '&#128293;' },
    { id: 'combo_5', name: 'COMBO STARTER', desc: 'Get a 5x rally combo', icon: '&#128165;' },
    { id: 'combo_15', name: 'COMBO MANIAC', desc: 'Get a 15x rally combo', icon: '&#128165;' },
];

// ---- ANNOUNCER LINES ----
const ANNOUNCER = {
    rallyStart: ['RALLY ON!', 'KEEP IT UP!', 'HERE WE GO!'],
    rallyMid: ['INCREDIBLE!', 'AMAZING RALLY!', 'UNSTOPPABLE!', 'ON FIRE!'],
    rallyHigh: ['LEGENDARY!', 'GODLIKE!', 'UNREAL!', 'IMPOSSIBLE!'],
    smash: ['SMASHED!', 'DESTROYED!', 'OBLITERATED!', 'ANNIHILATED!'],
    closeGame: ['NECK AND NECK!', 'SO CLOSE!', 'TENSION!', 'ANYONE\'S GAME!'],
    matchPoint: ['MATCH POINT!', 'THE FINAL STRETCH!', 'NOW OR NEVER!'],
    comeback: ['COMEBACK!', 'NEVER GIVE UP!', 'TURNING THE TIDE!'],
};
