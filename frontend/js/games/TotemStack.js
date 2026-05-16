import { BaseGame } from "./BaseGame.js";

const COLORS = ["#61f5ff", "#ffd166", "#ff6aa9", "#78ffba", "#a97cff"];

export class TotemStack extends BaseGame {
  constructor(deps) {
    super({ ...deps, id: "totem", title: "Totem Stack", tagline: "Stack enchanted blocks while wind and curses bend the tower." });
  }

  mount() {
    super.mount();
    const layout = document.createElement("div");
    layout.className = "game-layout";
    this.canvas = document.createElement("canvas");
    this.canvas.className = "totem-canvas";
    this.canvas.width = 900;
    this.canvas.height = 560;
    layout.appendChild(this.canvas);
    this.stage.appendChild(layout);
    this.ctx = this.canvas.getContext("2d");
    this.hudEl = this.hud({ Height: 0, Wind: "Calm", Balance: "100%" });
    this.dropHandler = () => this.drop();
    this.keyHandler = (event) => {
      if (event.code === "Space") {
        event.preventDefault();
        if (this.gameOver) this.reset();
        else this.drop();
      }
    };
    this.canvas.addEventListener("pointerdown", this.dropHandler);
    window.addEventListener("keydown", this.keyHandler);
    this.reset();
    this.loop();
    this.ui.say("Click or press Space to drop each magical block. Keep the totem balanced.");
  }

  stop() {
    super.stop();
    this.running = false;
    this.canvas?.removeEventListener("pointerdown", this.dropHandler);
    window.removeEventListener("keydown", this.keyHandler);
  }

  reset() {
    this.running = true;
    this.gameOver = false;
    this.blocks = [];
    this.height = 0;
    this.cameraY = 0;
    this.wind = 0;
    this.windTimer = 0;
    this.gravityFlip = false;
    this.curseTimer = 0;
    this.spawnBlock();
    this.updateHud(this.hudEl, { Height: 0, Wind: "Calm", Balance: "100%" });
  }

  spawnBlock() {
    const width = Math.max(64, 140 - this.height * 3);
    this.active = {
      x: 160,
      y: 110,
      w: width,
      h: 34,
      dir: 1,
      speed: 3.2 + this.height * 0.13,
      color: COLORS[this.height % COLORS.length],
      dropped: false,
      vy: 0,
      rot: 0,
    };
  }

  drop() {
    if (!this.active || this.active.dropped || this.gameOver) return;
    this.active.dropped = true;
    this.active.vy = this.gravityFlip ? -1.5 : 3.5;
    this.audio.click();
  }

  loop() {
    if (!this.running) return;
    this.update();
    this.draw();
    this.frame = requestAnimationFrame(() => this.loop());
  }

  update() {
    if (this.gameOver) return;
    this.updateMagic();
    if (!this.active) return;
    if (!this.active.dropped) {
      this.active.x += this.active.dir * this.active.speed;
      if (this.active.x < 95 || this.active.x + this.active.w > 805) this.active.dir *= -1;
      this.active.x += this.wind * 0.18;
      return;
    }

    this.active.vy += this.gravityFlip ? -0.18 : 0.34;
    this.active.y += this.active.vy;
    this.active.x += this.wind * 0.32;
    this.active.rot += this.wind * 0.0009;
    const landingY = this.groundY() - this.blocks.length * 34;
    if ((!this.gravityFlip && this.active.y >= landingY) || (this.gravityFlip && this.active.y <= landingY)) {
      this.land(landingY);
    }
  }

  updateMagic() {
    this.windTimer -= 1;
    this.curseTimer -= 1;
    if (this.windTimer <= 0) {
      this.wind = (Math.random() - 0.5) * Math.min(9, 2.5 + this.height * 0.28);
      this.windTimer = 120 + Math.random() * 130;
    }
    if (this.curseTimer <= 0 && this.height >= 5) {
      this.gravityFlip = Math.random() < 0.28;
      this.curseTimer = 220 + Math.random() * 180;
      if (this.gravityFlip) {
        this.ui.say("Gravity curse. The next block floats strangely.");
        this.later(() => {
          this.gravityFlip = false;
        }, 1800);
      }
    }
  }

  groundY() {
    return 492 + this.cameraY;
  }

  land(y) {
    const below = this.blocks[this.blocks.length - 1];
    const baseX = below ? below.x : 450 - this.active.w / 2;
    const baseW = below ? below.w : 190;
    const overlap = Math.min(this.active.x + this.active.w, baseX + baseW) - Math.max(this.active.x, baseX);
    const allowed = Math.max(30, this.active.w * 0.34);
    if (overlap < allowed) {
      this.fail();
      return;
    }

    const centerOffset = this.active.x + this.active.w / 2 - (baseX + baseW / 2);
    const balance = Math.max(0, 100 - Math.abs(centerOffset) * 1.4 - Math.abs(this.wind) * 2);
    this.blocks.push({
      x: this.active.x,
      y,
      w: this.active.w,
      h: this.active.h,
      color: this.active.color,
      offset: centerOffset,
      tilt: centerOffset * 0.0018,
    });
    this.height += 1;
    this.combo += balance > 78 ? 1 : 0;
    this.addScore(balance > 78 ? 80 : 45);
    this.audio.collect(this.combo);
    this.particles.domBurst(eventToScreenX(this.canvas, this.active.x + this.active.w / 2), eventToScreenY(this.canvas, y), this.active.color, 14);
    if (Math.abs(centerOffset) > 58 || balance < 36) {
      this.wobble();
    }
    if (this.blocks.length > 8) this.cameraY += 34;
    this.updateHud(this.hudEl, { Height: this.height, Wind: this.windName(), Balance: `${Math.round(balance)}%` });
    this.spawnBlock();
  }

  wobble() {
    this.stage.classList.add("stage-flash");
    this.audio.wrong();
    this.later(() => this.stage.classList.remove("stage-flash"), 180);
    if (Math.random() < 0.25 + this.height * 0.015) this.fail();
  }

  fail() {
    this.gameOver = true;
    this.audio.boom();
    this.ui.say("The totem toppled. Press Space or click to rebuild.");
  }

  windName() {
    const abs = Math.abs(this.wind);
    if (abs < 1.8) return "Calm";
    if (abs < 4.4) return this.wind > 0 ? "East" : "West";
    return this.wind > 0 ? "Gale →" : "← Gale";
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawWorld(ctx);
    this.drawBlocks(ctx);
    this.drawActive(ctx);
    if (this.gameOver) this.drawGameOver(ctx);
  }

  drawWorld(ctx) {
    const bg = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    bg.addColorStop(0, "#081225");
    bg.addColorStop(1, "#18091f");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.strokeStyle = "rgba(97,245,255,.12)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i += 1) {
      ctx.beginPath();
      ctx.arc(450, 520, 90 + i * 58, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,209,102,.16)";
    ctx.fillRect(185, 505, 530, 10);
  }

  drawBlocks(ctx) {
    this.blocks.forEach((block, index) => {
      this.drawBlock(ctx, block.x, block.y - this.cameraY, block.w, block.h, block.color, block.tilt, index);
    });
  }

  drawActive(ctx) {
    if (!this.active) return;
    this.drawBlock(
      this.ctx,
      this.active.x,
      this.active.y - this.cameraY,
      this.active.w,
      this.active.h,
      this.active.color,
      this.active.rot,
      this.height,
    );
  }

  drawBlock(ctx, x, y, w, h, color, tilt, index) {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(tilt);
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = color;
    roundRect(ctx, -w / 2, -h / 2, w, h, 7);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(5,10,16,.34)";
    ctx.font = "18px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(["✦", "☽", "◆", "✺", "◇"][index % 5], 0, 1);
    ctx.restore();
  }

  drawGameOver(ctx) {
    ctx.fillStyle = "rgba(3,4,10,.7)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd166";
    ctx.font = "48px Georgia";
    ctx.fillText("Totem Toppled", 450, 240);
    ctx.fillStyle = "#f3fbff";
    ctx.font = "21px sans-serif";
    ctx.fillText("Press Space or click to stack again", 450, 288);
  }
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
}

function eventToScreenX(canvas, x) {
  const rect = canvas.getBoundingClientRect();
  return rect.left + (x / canvas.width) * rect.width;
}

function eventToScreenY(canvas, y) {
  const rect = canvas.getBoundingClientRect();
  return rect.top + (y / canvas.height) * rect.height;
}
