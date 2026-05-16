import { BaseGame } from "./BaseGame.js";

const LEVELS = [
  [
    "############",
    "#P....#....#",
    "#.###.#.##.#",
    "#...#...#..#",
    "###.#####.##",
    "#...#...#..#",
    "#.#...#....#",
    "#.#####.##.#",
    "#.....#..#.#",
    "#.###....#E#",
    "#.....#....#",
    "############",
  ],
  [
    "############",
    "#P..#......#",
    "###.#.####.#",
    "#...#....#.#",
    "#.######.#.#",
    "#......#.#.#",
    "#.####.#.#.#",
    "#.#....#...#",
    "#.#.######.#",
    "#.#......#E#",
    "#........#.#",
    "############",
  ],
  [
    "############",
    "#P.....#...#",
    "#.###.###.#",
    "#.#...#...#",
    "#.#.###.###",
    "#...#.....#",
    "###.#.###.#",
    "#...#.#...#",
    "#.###.#.###",
    "#.....#...#",
    "#####...#E#",
    "############",
  ],
];

export class RuneMaze extends BaseGame {
  constructor(deps) {
    super({ ...deps, id: "maze", title: "Rune Maze", tagline: "A clear magical maze: collect crystals, reach the portal." });
  }

  mount() {
    super.mount();
    this.level = 0;
    this.moves = 0;
    this.crystals = new Set();
    this.keyHandler = (event) => this.onKey(event);
    window.addEventListener("keydown", this.keyHandler);
    this.loadLevel();
  }

  stop() {
    super.stop();
    window.removeEventListener("keydown", this.keyHandler);
  }

  loadLevel() {
    this.stage.innerHTML = "";
    this.moves = 0;
    this.crystals.clear();
    const raw = LEVELS[this.level % LEVELS.length];
    this.map = raw.map((row, y) => row.split("").map((cell, x) => {
      if (cell === "P") this.player = { x, y };
      if (cell === "E") this.exit = { x, y };
      if (cell === "." && (x * 5 + y * 3 + this.level) % 11 === 0) this.crystals.add(`${x},${y}`);
      return cell === "#" ? "#" : ".";
    }));

    const layout = document.createElement("div");
    layout.className = "game-layout maze-layout";
    const wrap = document.createElement("div");
    wrap.className = "simple-maze-wrap";
    this.mazeEl = document.createElement("div");
    this.mazeEl.className = "maze-grid";
    const controls = this.createControls();
    wrap.append(this.mazeEl, controls);
    layout.appendChild(wrap);
    this.stage.appendChild(layout);
    this.hudEl = this.hud({ Level: this.level + 1, Crystals: this.crystals.size, Moves: this.moves });
    this.ui.say("Move with WASD, arrow keys, or the on-screen arrows. Collect crystals, then reach the green portal.");
    this.render();
  }

  createControls() {
    const controls = document.createElement("div");
    controls.className = "maze-controls";
    const buttons = [
      ["", "", ""],
      ["", "↑", ""],
      ["←", "↓", "→"],
    ];
    buttons.flat().forEach((label) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "maze-control";
      button.textContent = label;
      if (!label) {
        button.disabled = true;
      } else {
        const dirs = { "↑": [0, -1], "↓": [0, 1], "←": [-1, 0], "→": [1, 0] };
        button.addEventListener("click", () => this.move(...dirs[label]));
      }
      controls.appendChild(button);
    });
    return controls;
  }

  onKey(event) {
    const dirs = {
      arrowup: [0, -1],
      w: [0, -1],
      arrowdown: [0, 1],
      s: [0, 1],
      arrowleft: [-1, 0],
      a: [-1, 0],
      arrowright: [1, 0],
      d: [1, 0],
    };
    const dir = dirs[event.key.toLowerCase()];
    if (!dir) return;
    event.preventDefault();
    this.move(dir[0], dir[1]);
  }

  move(dx, dy) {
    const next = { x: this.player.x + dx, y: this.player.y + dy };
    if (this.map[next.y]?.[next.x] === "#") {
      this.audio.wrong();
      this.stage.classList.add("stage-flash");
      this.later(() => this.stage.classList.remove("stage-flash"), 180);
      return;
    }

    this.player = next;
    this.moves += 1;
    this.audio.click();

    const crystalKey = `${next.x},${next.y}`;
    if (this.crystals.has(crystalKey)) {
      this.crystals.delete(crystalKey);
      this.combo += 1;
      this.addScore(45);
      this.audio.collect(this.combo);
      const cell = this.cellAt(next.x, next.y);
      if (cell) this.burstElement(cell, "#ffd166", 14);
    }

    if (next.x === this.exit.x && next.y === this.exit.y) {
      if (this.crystals.size > 0) {
        this.ui.say(`Collect ${this.crystals.size} more crystal${this.crystals.size === 1 ? "" : "s"} before entering the portal.`);
      } else {
        this.combo += 1;
        this.addScore(Math.max(120, 520 - this.moves * 6));
        this.audio.success();
        this.ui.say("Portal reached. A new maze opens.");
        this.level += 1;
        this.later(() => this.loadLevel(), 900);
        return;
      }
    }

    this.updateHud(this.hudEl, { Level: this.level + 1, Crystals: this.crystals.size, Moves: this.moves });
    this.render();
  }

  cellAt(x, y) {
    return this.mazeEl.querySelector(`[data-x="${x}"][data-y="${y}"]`);
  }

  render() {
    this.mazeEl.innerHTML = "";
    this.map.forEach((row, y) => {
      row.forEach((cellType, x) => {
        const cell = document.createElement("div");
        cell.className = "maze-cell";
        cell.dataset.x = x;
        cell.dataset.y = y;
        if (cellType === "#") cell.classList.add("maze-wall");
        if (this.crystals.has(`${x},${y}`)) {
          cell.classList.add("maze-crystal");
          cell.textContent = "◆";
        }
        if (x === this.exit.x && y === this.exit.y) cell.classList.add("maze-exit");
        if (x === this.player.x && y === this.player.y) {
          cell.classList.add("maze-player");
          cell.textContent = "✦";
        }
        this.mazeEl.appendChild(cell);
      });
    });
  }
}
