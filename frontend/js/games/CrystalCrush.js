import { BaseGame } from "./BaseGame.js";

const CRYSTALS = ["◆", "◇", "✦", "✺", "✧", "●"];
const COLORS = ["#61f5ff", "#78ffba", "#ffd166", "#ff6aa9", "#a97cff", "#ff5e68"];

export class CrystalCrush extends BaseGame {
  constructor(deps) {
    super({ ...deps, id: "crush", title: "Crystal Crush", tagline: "Swap enchanted crystals into chain reactions." });
    this.size = 8;
  }

  mount() {
    super.mount();
    this.moves = 24;
    this.selected = null;
    this.board = Array.from({ length: this.size }, () => Array.from({ length: this.size }, () => this.randomCrystal()));
    const layout = document.createElement("div");
    layout.className = "game-layout";
    this.gridEl = document.createElement("div");
    this.gridEl.className = "crush-grid";
    layout.appendChild(this.gridEl);
    this.stage.appendChild(layout);
    this.hudEl = this.hud({ Moves: this.moves, Combo: "1x", Goal: "Chains" });
    this.resolve(false);
    this.render();
  }

  randomCrystal() {
    return Math.floor(Math.random() * CRYSTALS.length);
  }

  render() {
    this.gridEl.innerHTML = "";
    for (let y = 0; y < this.size; y += 1) {
      for (let x = 0; x < this.size; x += 1) {
        const value = this.board[y][x];
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "crystal";
        cell.textContent = CRYSTALS[value];
        cell.style.color = COLORS[value];
        cell.style.textShadow = `0 0 16px ${COLORS[value]}`;
        if (this.selected?.x === x && this.selected?.y === y) cell.classList.add("selected");
        cell.addEventListener("click", () => this.pick(x, y));
        this.gridEl.appendChild(cell);
      }
    }
  }

  pick(x, y) {
    if (this.moves <= 0) return;
    if (!this.selected) {
      this.selected = { x, y };
      this.audio.click();
      this.render();
      return;
    }
    const dist = Math.abs(this.selected.x - x) + Math.abs(this.selected.y - y);
    if (dist !== 1) {
      this.selected = { x, y };
      this.render();
      return;
    }
    this.swap(this.selected, { x, y });
    const matches = this.findMatches();
    if (!matches.size) {
      this.swap(this.selected, { x, y });
      this.selected = null;
      this.audio.wrong();
      this.render();
      return;
    }
    this.moves -= 1;
    this.selected = null;
    this.resolve(true);
  }

  swap(a, b) {
    const next = this.board[a.y][a.x];
    this.board[a.y][a.x] = this.board[b.y][b.x];
    this.board[b.y][b.x] = next;
  }

  findMatches() {
    const matches = new Set();
    for (let y = 0; y < this.size; y += 1) {
      let run = 1;
      for (let x = 1; x <= this.size; x += 1) {
        if (x < this.size && this.board[y][x] === this.board[y][x - 1]) run += 1;
        else {
          if (run >= 3) for (let k = 0; k < run; k += 1) matches.add(`${x - 1 - k},${y}`);
          run = 1;
        }
      }
    }
    for (let x = 0; x < this.size; x += 1) {
      let run = 1;
      for (let y = 1; y <= this.size; y += 1) {
        if (y < this.size && this.board[y][x] === this.board[y - 1][x]) run += 1;
        else {
          if (run >= 3) for (let k = 0; k < run; k += 1) matches.add(`${x},${y - 1 - k}`);
          run = 1;
        }
      }
    }
    return matches;
  }

  resolve(playEffects) {
    let chains = 0;
    const step = () => {
      const matches = this.findMatches();
      if (!matches.size) {
        this.combo = Math.max(1, chains);
        this.updateHud(this.hudEl, { Moves: this.moves, Combo: `${this.combo}x`, Goal: "Chains" });
        this.render();
        if (this.moves <= 0) this.ui.say("The crystal board is spent. Return through the portal or keep admiring the sparks.");
        return;
      }
      chains += 1;
      if (playEffects) {
        this.combo = chains;
        this.addScore(matches.size * 18);
        this.audio.boom();
      }
      matches.forEach((key) => {
        const [x, y] = key.split(",").map(Number);
        this.board[y][x] = null;
      });
      for (let x = 0; x < this.size; x += 1) {
        const column = [];
        for (let y = this.size - 1; y >= 0; y -= 1) if (this.board[y][x] !== null) column.push(this.board[y][x]);
        while (column.length < this.size) column.push(this.randomCrystal());
        for (let y = this.size - 1; y >= 0; y -= 1) this.board[y][x] = column[this.size - 1 - y];
      }
      this.render();
      if (playEffects) this.stage.classList.add("stage-flash");
      this.later(() => {
        this.stage.classList.remove("stage-flash");
        step();
      }, playEffects ? 260 : 0);
    };
    step();
  }
}
