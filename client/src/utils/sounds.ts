// sounds.ts — Web Audio API Synthesized Sound Effects & Interactive Ambient Music
// Zero external asset downloads, instant playback, works in all browsers & offline.

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private musicPlaying: boolean = false;
  private ambientInterval: any = null;

  private getContext(): AudioContext | null {
    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
        }
      }
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      return this.audioContext;
    } catch {
      return null;
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopAmbientMusic();
    }
  }

  getEnabled(): boolean {
    return this.enabled;
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.2,
    detune: number = 0
  ) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      if (detune) osc.detune.setValueAtTime(detune, ctx.currentTime);

      gain.gain.setValueAtTime(Math.max(0.001, volume), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }

  // ── UI Micro-Interactions ──────────────────────────────────────────────────

  click() {
    this.playTone(800, 0.04, 'sine', 0.08);
  }

  buttonTap() {
    this.playTone(520, 0.05, 'triangle', 0.1);
  }

  // ── Game Event Sounds ──────────────────────────────────────────────────────

  diceRoll() {
    if (!this.enabled) return;
    // Fast snappy rattle (300ms total)
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playTone(280 + Math.random() * 250, 0.04, 'square', 0.08);
      }, i * 50);
    }
  }

  diceResult() {
    if (!this.enabled) return;
    this.playTone(523.25, 0.12, 'sine', 0.18); // C5
    setTimeout(() => this.playTone(659.25, 0.16, 'sine', 0.2), 80); // E5
  }

  doubles() {
    if (!this.enabled) return;
    const chord = [523.25, 659.25, 783.99, 1046.5];
    chord.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.15), idx * 60);
    });
  }

  propertyBuy() {
    if (!this.enabled) return;
    // Regal Gujarati merchant coin fanfare
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.22, 'sine', 0.18), i * 90);
    });
  }

  rentPay() {
    if (!this.enabled) return;
    // Cash transfer
    this.playTone(392, 0.14, 'triangle', 0.18);
    setTimeout(() => this.playTone(293.66, 0.2, 'triangle', 0.22), 110);
  }

  salary() {
    if (!this.enabled) return;
    // Passing Go / Start: Happy coin reward
    const notes = [587.33, 739.99, 880, 1174.66];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.18, 'sine', 0.16), i * 80);
    });
  }

  buildHouse() {
    if (!this.enabled) return;
    // Hammer strike + positive chord
    this.playTone(220, 0.08, 'sawtooth', 0.12);
    setTimeout(() => this.playTone(659.25, 0.12, 'sine', 0.15), 90);
    setTimeout(() => this.playTone(880, 0.18, 'sine', 0.18), 180);
  }

  jailSlam() {
    if (!this.enabled) return;
    this.playTone(180, 0.25, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(120, 0.35, 'sawtooth', 0.25), 100);
  }

  jailRelease() {
    if (!this.enabled) return;
    this.playTone(440, 0.15, 'sine', 0.15);
    setTimeout(() => this.playTone(659.25, 0.22, 'sine', 0.18), 100);
  }

  moneyReceive() {
    this.playTone(659.25, 0.1, 'sine', 0.16);
    setTimeout(() => this.playTone(880, 0.15, 'sine', 0.18), 80);
  }

  tokenMove() {
    this.playTone(493.88, 0.04, 'sine', 0.08);
  }

  notification() {
    this.playTone(880, 0.1, 'sine', 0.14);
    setTimeout(() => this.playTone(1108.73, 0.12, 'sine', 0.16), 70);
  }

  error() {
    this.playTone(240, 0.18, 'sawtooth', 0.12);
    setTimeout(() => this.playTone(180, 0.22, 'sawtooth', 0.12), 90);
  }

  victory() {
    if (!this.enabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.35, 'sine', 0.22), i * 140);
    });
  }

  playerJoin() {
    this.playTone(659.25, 0.1, 'sine', 0.15);
    setTimeout(() => this.playTone(880, 0.15, 'sine', 0.18), 90);
  }

  chat() {
    this.playTone(1046.5, 0.06, 'sine', 0.1);
  }

  bankruptcy() {
    const notes = [392, 349.23, 293.66, 220];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 'triangle', 0.18), i * 180);
    });
  }

  // ── Traditional Ambient Indian Pentatonic Music Synthesizer ───────────────

  startAmbientMusic() {
    if (!this.enabled || this.musicPlaying) return;
    this.musicPlaying = true;

    // Raag Bhupali / Mohanam Pentatonic Scale: C4, D4, E4, G4, A4, C5
    const pentatonic = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 659.25];
    let step = 0;

    this.ambientInterval = setInterval(() => {
      if (!this.enabled || !this.musicPlaying) return;
      const note = pentatonic[step % pentatonic.length];
      // Gentle soft bell tone
      this.playTone(note, 0.8, 'sine', 0.04);
      // Soft harmony drone occasionally
      if (step % 4 === 0) {
        this.playTone(130.81, 1.6, 'triangle', 0.03); // Low C drone
      }
      step = (step + Math.floor(Math.random() * 3) + 1) % pentatonic.length;
    }, 1800);
  }

  stopAmbientMusic() {
    this.musicPlaying = false;
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }

  toggleAmbientMusic(): boolean {
    if (this.musicPlaying) {
      this.stopAmbientMusic();
      return false;
    } else {
      this.startAmbientMusic();
      return true;
    }
  }

  isMusicPlaying(): boolean {
    return this.musicPlaying;
  }
}

export const soundManager = new SoundManager();
