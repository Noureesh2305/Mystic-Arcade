export class ScoreTracker {
  constructor() {
    this.total = 0;
    this.bestCombo = 0;
    this.listeners = new Set();
  }

  add(points, combo = 1) {
    const earned = Math.max(0, Math.round(points * Math.max(1, combo)));
    this.total += earned;
    this.bestCombo = Math.max(this.bestCombo, combo);
    this.emit();
    return earned;
  }

  resetRun() {
    this.emit();
  }

  onChange(listener) {
    this.listeners.add(listener);
    listener({ total: this.total, bestCombo: this.bestCombo });
  }

  emit() {
    const state = { total: this.total, bestCombo: this.bestCombo };
    this.listeners.forEach((listener) => listener(state));
  }
}
