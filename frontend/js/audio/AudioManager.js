export class AudioManager {
  constructor() {
    this.context = null;
    this.master = null;
    this.music = null;
    this.enabled = true;
    this.started = false;
  }

  async start() {
    if (this.started) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0.18;
    this.master.connect(this.context.destination);
    this.started = true;
    this.ambient();
  }

  ambient() {
    const low = this.context.createOscillator();
    const lowGain = this.context.createGain();
    low.type = "sine";
    low.frequency.value = 65;
    lowGain.gain.value = 0.1;
    low.connect(lowGain).connect(this.master);
    low.start();

    const shimmer = this.context.createOscillator();
    const shimmerGain = this.context.createGain();
    shimmer.type = "triangle";
    shimmer.frequency.value = 196;
    shimmerGain.gain.value = 0.018;
    shimmer.connect(shimmerGain).connect(this.master);
    shimmer.start();

    window.setInterval(() => {
      if (!this.enabled || !this.context) return;
      this.tone(420 + Math.random() * 360, 1.1, 0.018, "sine");
    }, 1900);
  }

  tone(frequency, duration = 0.22, gain = 0.055, type = "triangle", bend = 1) {
    if (!this.started || !this.enabled) return;
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const amp = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(24, frequency * bend), now + duration);
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + 0.025);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(amp).connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  portal() {
    this.tone(88, 0.9, 0.11, "sawtooth", 2.2);
    setTimeout(() => this.tone(660, 0.42, 0.07, "triangle", 0.7), 120);
  }

  click() {
    this.tone(520, 0.16, 0.05);
  }

  collect(combo = 1) {
    this.tone(620 + combo * 38, 0.18, 0.06);
    this.tone(940 + combo * 44, 0.24, 0.025, "sine");
  }

  wrong() {
    this.tone(150, 0.34, 0.06, "sawtooth", 0.62);
  }

  boom() {
    this.tone(120, 0.38, 0.09, "square", 0.45);
    setTimeout(() => this.tone(780, 0.28, 0.05), 80);
  }

  success() {
    [392, 523, 659, 880, 1175].forEach((note, index) => {
      setTimeout(() => this.tone(note, 0.46, 0.06, "triangle"), index * 75);
    });
  }

  beat(combo = 1) {
    this.tone(220 + combo * 22, 0.08, 0.035, "square");
    this.tone(880 + combo * 30, 0.12, 0.035, "sine");
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.master) this.master.gain.value = this.enabled ? 0.18 : 0;
    return this.enabled;
  }
}
