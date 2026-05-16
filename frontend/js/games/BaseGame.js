export class BaseGame {
  constructor({ id, title, tagline, stage, ui, audio, particles, scoreTracker, animation }) {
    this.id = id;
    this.title = title;
    this.tagline = tagline;
    this.stage = stage;
    this.ui = ui;
    this.audio = audio;
    this.particles = particles;
    this.scoreTracker = scoreTracker;
    this.animation = animation;
    this.score = 0;
    this.combo = 1;
    this.timers = [];
    this.frame = null;
  }

  mount() {
    this.score = 0;
    this.combo = 1;
    this.stage.innerHTML = "";
    this.ui.updateGameScore(0);
  }

  stop() {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers = [];
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = null;
  }

  addScore(points) {
    const earned = this.scoreTracker.add(points, this.combo);
    this.score += earned;
    this.ui.updateGameScore(this.score);
  }

  later(callback, delay) {
    const timer = window.setTimeout(callback, delay);
    this.timers.push(timer);
    return timer;
  }

  hud(items) {
    const hud = document.createElement("div");
    hud.className = "game-hud";
    Object.entries(items).forEach(([key, value]) => {
      const pill = document.createElement("div");
      pill.className = "pill";
      pill.innerHTML = `<span>${key}</span><strong>${value}</strong>`;
      hud.appendChild(pill);
    });
    this.stage.appendChild(hud);
    return hud;
  }

  updateHud(hud, items) {
    [...hud.children].forEach((pill, index) => {
      const value = Object.values(items)[index];
      pill.querySelector("strong").textContent = value;
    });
  }

  burstElement(element, color = "#61f5ff", count = 18) {
    const rect = element.getBoundingClientRect();
    this.particles.domBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, color, count);
  }
}
