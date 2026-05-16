import { BaseGame } from "./BaseGame.js";

const RUNES = ["✦", "◇", "✺", "☽"];

export class SpellTiles extends BaseGame {
  constructor(deps) {
    super({ ...deps, id: "tiles", title: "Spell Tiles", tagline: "Tap the falling runes and keep the spell alive." });
  }

  mount() {
    super.mount();
    this.speed = 2.25;
    this.misses = 0;
    this.tiles = [];
    const layout = document.createElement("div");
    layout.className = "game-layout";
    this.board = document.createElement("div");
    this.board.className = "tiles-board";
    for (let i = 0; i < 4; i += 1) {
      const lane = document.createElement("div");
      lane.className = "tile-lane";
      this.board.appendChild(lane);
    }
    layout.appendChild(this.board);
    this.stage.appendChild(layout);
    this.hudEl = this.hud({ Combo: "1x", Misses: 0, Speed: "1.0" });
    this.running = true;
    this.spawn();
    this.loop();
  }

  stop() {
    super.stop();
    this.running = false;
  }

  spawn() {
    if (!this.running) return;
    const lane = Math.floor(Math.random() * 4);
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "spell-tile";
    tile.textContent = RUNES[lane];
    tile.style.top = "-90px";
    tile.addEventListener("click", () => this.hit(tile));
    this.board.children[lane].appendChild(tile);
    this.tiles.push({ el: tile, y: -90, lane });
    this.later(() => this.spawn(), Math.max(330, 780 - this.speed * 50));
  }

  hit(tile) {
    const item = this.tiles.find((entry) => entry.el === tile);
    if (!item) return;
    this.combo += 1;
    this.speed += 0.04;
    this.addScore(24);
    this.audio.beat(this.combo);
    this.burstElement(tile, "#ffd166", 12);
    tile.remove();
    this.tiles = this.tiles.filter((entry) => entry !== item);
    this.updateHud(this.hudEl, { Combo: `${this.combo}x`, Misses: this.misses, Speed: (this.speed / 2.25).toFixed(1) });
  }

  loop() {
    if (!this.running) return;
    const boardHeight = this.board.clientHeight || 640;
    this.tiles.forEach((tile) => {
      tile.y += this.speed;
      tile.el.style.top = `${tile.y}px`;
      if (tile.y > boardHeight && !tile.missed) {
        tile.missed = true;
        this.misses += 1;
        this.combo = 1;
        this.speed = Math.max(2.25, this.speed - 0.3);
        this.audio.wrong();
        tile.el.remove();
        this.stage.classList.add("stage-flash");
        this.later(() => this.stage.classList.remove("stage-flash"), 200);
      }
    });
    this.tiles = this.tiles.filter((tile) => !tile.missed);
    this.updateHud(this.hudEl, { Combo: `${this.combo}x`, Misses: this.misses, Speed: (this.speed / 2.25).toFixed(1) });
    this.frame = requestAnimationFrame(() => this.loop());
  }
}
