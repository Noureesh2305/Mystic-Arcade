import { BaseGame } from "./BaseGame.js";

const FRUITS = ["🍎", "🍋", "🍇", "🍉", "🍊", "🥝"];

export class FruitSmash extends BaseGame {
  constructor(deps) {
    super({ ...deps, id: "fruit", title: "Fruit Smash", tagline: "Slice enchanted fruit with your mouse. Avoid bombs." });
  }

  mount() {
    super.mount();
    this.running = true;
    this.lives = 3;
    this.level = 1;
    this.items = [];
    this.trail = [];
    this.pointerDown = false;
    this.stage.innerHTML = `
      <div class="game-layout fruit-layout">
        <div class="fruit-playfield fruit-arena">
          <canvas class="fruit-canvas" width="880" height="520"></canvas>
        </div>
      </div>
    `;
    this.canvas = this.stage.querySelector(".fruit-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.hudEl = this.hud({ Lives: this.lives, Combo: "1x", Speed: "1.0" });
    this.bindPointer();
    this.spawn();
    this.loop();
    this.ui.say("Hold and drag through fruit to smash them. Avoid bombs.");
  }

  stop() {
    super.stop();
    this.running = false;
    this.canvas?.removeEventListener("pointerdown", this.onDown);
    this.canvas?.removeEventListener("pointerup", this.onUp);
    this.canvas?.removeEventListener("pointerleave", this.onUp);
    this.canvas?.removeEventListener("pointermove", this.onMove);
  }

  bindPointer() {
    this.onDown = (event) => {
      this.pointerDown = true;
      this.slicePointer(event);
    };
    this.onUp = () => {
      this.pointerDown = false;
      this.trail = [];
    };
    this.onMove = (event) => {
      if (!this.pointerDown) return;
      this.slicePointer(event);
    };
    this.canvas.addEventListener("pointerdown", this.onDown);
    this.canvas.addEventListener("pointerup", this.onUp);
    this.canvas.addEventListener("pointerleave", this.onUp);
    this.canvas.addEventListener("pointermove", this.onMove);
  }

  spawn() {
    if (!this.running) return;
    const bomb = Math.random() < Math.min(0.32, 0.13 + this.level * 0.025);
    const side = Math.random() < 0.5 ? -1 : 1;
    this.items.push({
      x: 110 + Math.random() * 660,
      y: 570,
      vx: side * (1.2 + Math.random() * 2.4),
      vy: -(12 + Math.random() * 8 + this.level * 0.6),
      gravity: 0.3,
      radius: bomb ? 34 : 32,
      bomb,
      glyph: bomb ? "💣" : FRUITS[Math.floor(Math.random() * FRUITS.length)],
      spin: -0.1 + Math.random() * 0.2,
      rot: 0,
    });
    this.later(() => this.spawn(), Math.max(250, 650 - this.level * 34));
  }

  slicePointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * this.canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * this.canvas.height;
    this.trail.push({ x, y, life: 16 });
    if (this.trail.length > 10) this.trail.shift();
    this.sliceAt(x, y);
  }

  sliceAt(x, y) {
    this.items.forEach((item) => {
      if (item.hit) return;
      if (Math.hypot(item.x - x, item.y - y) > item.radius + 24) return;
      item.hit = true;
      if (item.bomb) {
        this.lives -= 1;
        this.combo = 1;
        this.audio.boom();
        this.stage.classList.add("stage-flash");
        this.later(() => this.stage.classList.remove("stage-flash"), 240);
        this.ui.say(this.lives > 0 ? "Bomb hit. Stay sharp." : "Out of lives. New round.");
        if (this.lives <= 0) this.resetRun();
      } else {
        this.combo += 1;
        this.level = Math.min(14, this.level + 0.08);
        this.addScore(35);
        this.audio.collect(this.combo);
        this.particles.domBurst(eventToScreenX(this.canvas, x), eventToScreenY(this.canvas, y), "#ffd166", 16);
      }
      this.updateHud(this.hudEl, { Lives: this.lives, Combo: `${this.combo}x`, Speed: (this.level / 1).toFixed(1) });
    });
  }

  resetRun() {
    this.lives = 3;
    this.combo = 1;
    this.level = 1;
    this.items = [];
    this.updateHud(this.hudEl, { Lives: this.lives, Combo: `${this.combo}x`, Speed: "1.0" });
  }

  loop() {
    if (!this.running) return;
    this.update();
    this.draw();
    this.frame = requestAnimationFrame(() => this.loop());
  }

  update() {
    this.items.forEach((item) => {
      item.x += item.vx;
      item.y += item.vy;
      item.vy += item.gravity;
      item.rot += item.spin;
    });
    this.items = this.items.filter((item) => item.y < 620 && !item.hit);
    this.trail.forEach((point) => {
      point.life -= 1;
    });
    this.trail = this.trail.filter((point) => point.life > 0);
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const bg = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    bg.addColorStop(0, "#071326");
    bg.addColorStop(1, "#19091b");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.strokeStyle = "rgba(97,245,255,.16)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 9; i += 1) {
      ctx.beginPath();
      ctx.arc(440, 560, 120 + i * 60, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
    }

    if (this.trail.length > 1) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(97,245,255,.86)";
      ctx.shadowColor = "#61f5ff";
      ctx.shadowBlur = 22;
      ctx.lineWidth = 9;
      ctx.beginPath();
      this.trail.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.font = "58px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    this.items.forEach((item) => {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(item.rot);
      ctx.shadowColor = item.bomb ? "#ff5e68" : "#ffd166";
      ctx.shadowBlur = 26;
      ctx.fillText(item.glyph, 0, 0);
      ctx.restore();
    });
  }
}

function eventToScreenX(canvas, x) {
  const rect = canvas.getBoundingClientRect();
  return rect.left + (x / canvas.width) * rect.width;
}

function eventToScreenY(canvas, y) {
  const rect = canvas.getBoundingClientRect();
  return rect.top + (y / canvas.height) * rect.height;
}
