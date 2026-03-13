// Audio Manager - Procedural Sound Effects using Web Audio API
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.initialized = false;
    this.musicPlaying = false;
    this.musicGain = null;
    this.sfxGain = null;
  }

  init() {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.6;
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.15;
    this.musicGain.connect(this.masterGain);

    this.initialized = true;
  }

  playNote(freq, duration, type = 'sine', gainVal = 0.3, dest = null) {
    if (!this.initialized) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(dest || this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playHit() {
    this.playNote(150, 0.15, 'sawtooth', 0.4);
    this.playNote(80, 0.2, 'square', 0.2);
  }

  playCollect() {
    this.playNote(523, 0.1, 'sine', 0.3);
    setTimeout(() => this.playNote(659, 0.1, 'sine', 0.3), 50);
    setTimeout(() => this.playNote(784, 0.15, 'sine', 0.3), 100);
  }

  playCraft() {
    this.playNote(440, 0.08, 'square', 0.2);
    setTimeout(() => this.playNote(554, 0.08, 'square', 0.2), 80);
    setTimeout(() => this.playNote(659, 0.12, 'square', 0.25), 160);
    setTimeout(() => this.playNote(880, 0.2, 'sine', 0.3), 240);
  }

  playBuild() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this.playNote(200 + i * 50, 0.1, 'triangle', 0.25), i * 60);
    }
  }

  playDamage() {
    this.playNote(100, 0.3, 'sawtooth', 0.5);
    this.playNote(60, 0.4, 'square', 0.3);
  }

  playDeath() {
    const notes = [440, 415, 392, 349, 330, 294, 262, 220];
    notes.forEach((n, i) => {
      setTimeout(() => this.playNote(n, 0.3, 'sawtooth', 0.3), i * 150);
    });
  }

  playEnemyDeath() {
    this.playNote(300, 0.1, 'sawtooth', 0.4);
    setTimeout(() => this.playNote(200, 0.2, 'sawtooth', 0.3), 50);
    setTimeout(() => this.playNote(100, 0.4, 'sawtooth', 0.2), 100);
  }

  playJump() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playFootstep() {
    if (!this.initialized) return;
    const freq = 60 + Math.random() * 40;
    this.playNote(freq, 0.08, 'triangle', 0.1);
  }

  playAmbient() {
    if (!this.initialized || this.musicPlaying) return;
    this.musicPlaying = true;
    this._playAmbientLoop();
  }

  _playAmbientLoop() {
    if (!this.musicPlaying) return;
    // Simple procedural ambient music
    const scale = [262, 294, 330, 349, 392, 440, 494, 523];
    const chord = [
      [0, 2, 4], [3, 5, 7], [4, 6, 1], [0, 3, 5]
    ];
    let time = 0;
    const playChord = (idx) => {
      if (!this.musicPlaying) return;
      const c = chord[idx % chord.length];
      c.forEach(n => {
        this.playNote(scale[n] * 0.5, 3, 'sine', 0.06, this.musicGain);
      });
      setTimeout(() => playChord(idx + 1), 3000);
    };
    playChord(0);
  }

  stopAmbient() {
    this.musicPlaying = false;
  }

  playButtonClick() {
    this.playNote(800, 0.06, 'sine', 0.2);
    setTimeout(() => this.playNote(1000, 0.08, 'sine', 0.15), 40);
  }

  playWaterSplash() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playNote(200 + Math.random() * 400, 0.1, 'sine', 0.1);
      }, i * 30);
    }
  }

  playEat() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this.playNote(300 + Math.random() * 100, 0.08, 'square', 0.1), i * 80);
    }
  }
}
