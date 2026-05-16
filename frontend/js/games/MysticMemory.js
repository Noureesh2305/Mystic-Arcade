import { BaseGame } from "./BaseGame.js";

const SYMBOLS = ["✦", "☽", "✧", "◆", "✺", "✹", "◇", "☼", "✶", "✷", "✵", "✴"];

export class MysticMemory extends BaseGame {
  constructor(deps) {
    super({ ...deps, id: "memory", title: "Mystic Memory", tagline: "Match glowing runes before the chamber drifts." });
    this.level = 1;
  }

  mount() {
    super.mount();
    this.level = 1;
    this.startRound();
  }

  startRound() {
    this.stage.innerHTML = "";
    this.flipped = [];
    this.matches = 0;
    const pairs = Math.min(6 + this.level, 12);
    const deck = [...SYMBOLS.slice(0, pairs), ...SYMBOLS.slice(0, pairs)].sort(() => Math.random() - 0.5);
    const layout = document.createElement("div");
    layout.className = "game-layout";
    const grid = document.createElement("div");
    grid.className = "memory-grid";
    if (pairs > 8) grid.style.gridTemplateColumns = "repeat(6, minmax(44px, 1fr))";
    layout.appendChild(grid);
    this.stage.appendChild(layout);
    this.hudEl = this.hud({ Level: this.level, Combo: `${this.combo}x`, Matches: `0/${pairs}` });

    deck.forEach((symbol, index) => {
      const card = document.createElement("button");
      card.className = "memory-card";
      card.type = "button";
      card.textContent = symbol;
      card.dataset.symbol = symbol;
      card.dataset.index = index;
      card.addEventListener("click", () => this.flip(card, pairs));
      grid.appendChild(card);
    });
  }

  flip(card, pairs) {
    if (card.classList.contains("revealed") || card.classList.contains("matched") || this.flipped.length >= 2) return;
    this.audio.click();
    this.animation.flip(card, () => card.classList.add("revealed"));
    this.flipped.push(card);
    if (this.flipped.length < 2) return;
    const [a, b] = this.flipped;
    if (a.dataset.symbol === b.dataset.symbol) {
      this.combo += 1;
      this.matches += 1;
      a.classList.add("matched");
      b.classList.add("matched");
      this.burstElement(a, "#ffd166", 16);
      this.burstElement(b, "#ffd166", 16);
      this.audio.collect(this.combo);
      this.addScore(80);
      this.updateHud(this.hudEl, { Level: this.level, Combo: `${this.combo}x`, Matches: `${this.matches}/${pairs}` });
      this.flipped = [];
      if (this.matches === pairs) {
        this.audio.success();
        this.ui.say("Perfectly aligned. The next memory ring is harder.");
        this.later(() => {
          this.level += 1;
          this.startRound();
        }, 900);
      }
      return;
    }
    this.combo = 1;
    this.audio.wrong();
    this.stage.classList.add("stage-flash");
    this.updateHud(this.hudEl, { Level: this.level, Combo: `${this.combo}x`, Matches: `${this.matches}/${pairs}` });
    this.later(() => {
      this.animation.flip(a, () => a.classList.remove("revealed"));
      this.animation.flip(b, () => b.classList.remove("revealed"));
      this.flipped = [];
      this.stage.classList.remove("stage-flash");
    }, 620);
  }
}
