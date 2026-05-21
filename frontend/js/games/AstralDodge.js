import { BaseGame } from "./BaseGame.js";

export class AstralDodge extends BaseGame {
  constructor(deps) {
    super({ ...deps, id: "dodge", title: "Astral Dodge", tagline: "Guide the nexus orb, collect energy, and avoid void shards." });
  }

  mount() {
    super.mount();
    this.running = true;
    this.lives = 3;
    this.energy = 0;
    this.level = 1;
    this.player = { x: 440, y: 270, radius: 18 };
    this.pointer = { x: 440, y: 270 };
    this.hazards = [];
    this.orbs = [];
    this.stage.innerHTML = `
      <div class="game-layout">
        <canvas class="action-canvas" width="880" height="520"></canvas>
      </div>
    `;
    this.canvas = this.stage.querySelector(".action-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.hudEl = this.hud({ Lives: this.lives, Energy: "0/10", Wave: this.level });
    this.bindInput();
    this.spawnHazard();
    this.spawnOrb();
    this.loop();
    this.ui.say("Move the orb with your mouse. Collect 10 energy sparks and avoid red void shards.");
  }

  stop() {
    super.stop();
    this.running = false;
    this.canvas?.removeEventListener("pointermove", this.onMove);
    this.canvas?.removeEventListener("pointerdown", this.onMove);
  }

  bindInput() {
    this.onMove = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * this.canvas.width;
      this.pointer.y = ((event.clientY - rect.top) / rect.height) * this.canvas.height;
    };
    this.canvas.addEventListener("pointermove", this.onMove);
    this.canvas.addEventListener("pointerdown", this.onMove);
  }

  spawnHazard() {
    if (!this.running) return;
    const side = Math.floor(Math.random() * 4);
    const speed = 1.7 + this.level * 0.28 + Math.random() * 1.4;
    const hazard = { radius: 17 + Math.random() * 12, vx: 0, vy: 0, x: 0, y: 0, rot: 0 };
    if (side === 0) {
      hazard.x = Math.random() * 880;
      hazard.y = -30;
      hazard.vy = speed;
      hazard.vx = (Math.random() - 0.5) * 1.2;
    } else if (side === 1) {
      hazard.x = 910;
      hazard.y = Math.random() * 520;
      hazard.vx = -speed;
      hazard.vy = (Math.random() - 0.5) * 1.2;
    } else if (side === 2) {
      hazard.x = Math.random() * 880;
      hazard.y = 550;
      hazard.vy = -speed;
      hazard.vx = (Math.random() - 0.5) * 1.2;
    } else {
      hazard.x = -30;
      hazard.y = Math.random() * 520;
      hazard.vx = speed;
      hazard.vy = (Math.random() - 0.5) * 1.2;
    }
    this.hazards.push(hazard);
    this.later(() => this.spawnHazard(), Math.max(360, 980 - this.level * 54));
  }

  spawnOrb() {
    if (!this.running) return;
    this.orbs.push({
      x: 60 + Math.random() * 760,
      y: 60 + Math.random() * 400,
      radius: 13,
      pulse: Math.random() * 10,
    });
    this.later(() => this.spawnOrb(), Math.max(900, 1550 - this.level * 45));
  }

  loop() {
    if (!this.running) return;
    this.update();
    this.draw();
    this.frame = requestAnimationFrame(() => this.loop());
  }

  update() {
    this.player.x += (this.pointer.x - this.player.x) * 0.16;
    this.player.y += (this.pointer.y - this.player.y) * 0.16;

    this.hazards.forEach((hazard) => {
      hazard.x += hazard.vx;
      hazard.y += hazard.vy;
      hazard.rot += 0.04;
      if (this.distance(this.player, hazard) < this.player.radius + hazard.radius) {
        hazard.hit = true;
        this.lives -= 1;
        this.combo = 1;
        this.audio.boom();
        this.stage.classList.add("stage-flash");
        this.later(() => this.stage.classList.remove("stage-flash"), 220);
        if (this.lives <= 0) this.resetRun("The void caught the orb. New run.");
      }
    });

    this.orbs.forEach((orb) => {
      orb.pulse += 0.08;
      if (this.distance(this.player, orb) < this.player.radius + orb.radius) {
        orb.hit = true;
        this.energy += 1;
        this.combo += 1;
        this.addScore(45);
        this.audio.collect(this.combo);
        this.particles.domBurst(this.screenX(orb.x), this.screenY(orb.y), "#78ffba", 16);
        if (this.energy >= 10) this.levelUp();
      }
    });

    this.hazards = this.hazards.filter((item) => !item.hit && item.x > -80 && item.x < 960 && item.y > -80 && item.y < 600);
    this.orbs = this.orbs.filter((item) => !item.hit);
    this.updateHud(this.hudEl, { Lives: this.lives, Energy: `${this.energy}/10`, Wave: this.level });
  }

  levelUp() {
    this.level += 1;
    this.energy = 0;
    this.combo += 2;
    this.addScore(200);
    this.audio.success();
    this.ui.say(`Wave ${this.level}. Faster void shards incoming.`);
  }

  resetRun(message) {
    this.lives = 3;
    this.energy = 0;
    this.level = 1;
    this.hazards = [];
    this.orbs = [];
    this.player.x = 440;
    this.player.y = 270;
    this.pointer.x = 440;
    this.pointer.y = 270;
    this.ui.say(message);
  }

  distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  screenX(x) {
    const rect = this.canvas.getBoundingClientRect();
    return rect.left + (x / this.canvas.width) * rect.width;
  }

  screenY(y) {
    const rect = this.canvas.getBoundingClientRect();
    return rect.top + (y / this.canvas.height) * rect.height;
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 880, 520);
    const bg = ctx.createLinearGradient(0, 0, 0, 520);
    bg.addColorStop(0, "#061527");
    bg.addColorStop(1, "#150817");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 880, 520);

    ctx.strokeStyle = "rgba(97,245,255,.12)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i += 1) {
      ctx.beginPath();
      ctx.arc(440, 260, 46 + i * 54, 0, Math.PI * 2);
      ctx.stroke();
    }

    this.orbs.forEach((orb) => {
      ctx.save();
      ctx.translate(orb.x, orb.y);
      ctx.shadowColor = "#78ffba";
      ctx.shadowBlur = 22;
      ctx.fillStyle = "#78ffba";
      ctx.beginPath();
      ctx.arc(0, 0, orb.radius + Math.sin(orb.pulse) * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    this.hazards.forEach((hazard) => {
      ctx.save();
      ctx.translate(hazard.x, hazard.y);
      ctx.rotate(hazard.rot);
      ctx.shadowColor = "#ff5e68";
      ctx.shadowBlur = 22;
      ctx.fillStyle = "#ff5e68";
      ctx.beginPath();
      for (let i = 0; i < 6; i += 1) {
        const angle = (i / 6) * Math.PI * 2;
        const radius = i % 2 ? hazard.radius * 0.55 : hazard.radius;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.shadowColor = "#61f5ff";
    ctx.shadowBlur = 30;
    ctx.fillStyle = "#61f5ff";
    ctx.beginPath();
    ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,209,102,.8)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, this.player.radius + 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
