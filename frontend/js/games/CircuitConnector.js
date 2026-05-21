import { BaseGame } from "./BaseGame.js";

const DIRS = [
  { name: "up", dx: 0, dy: -1, opposite: "down" },
  { name: "right", dx: 1, dy: 0, opposite: "left" },
  { name: "down", dx: 0, dy: 1, opposite: "up" },
  { name: "left", dx: -1, dy: 0, opposite: "right" },
];

const DIR_INDEX = new Map(DIRS.map((dir, index) => [dir.name, index]));

const LEVELS = [
  {
    size: 6,
    source: [0, 2],
    bulb: [5, 2],
    tiles: [
      [1, 2, ["left", "right"], 1],
      [2, 2, ["left", "down"], 2],
      [2, 3, ["up", "down"], 1],
      [2, 4, ["up", "right"], 3],
      [3, 4, ["left", "right"], 2],
      [4, 4, ["left", "up"], 1],
      [4, 3, ["up", "down"], 3],
      [4, 2, ["down", "right"], 2],
    ],
    decoys: [
      [1, 1, ["up", "right"], 1],
      [3, 1, ["left", "down"], 2],
      [5, 4, ["up", "left"], 1],
    ],
  },
  {
    size: 6,
    source: [0, 4],
    bulb: [5, 1],
    tiles: [
      [1, 4, ["left", "right"], 2],
      [2, 4, ["left", "up"], 1],
      [2, 3, ["up", "down"], 3],
      [2, 2, ["up", "right"], 2],
      [3, 2, ["left", "right"], 1],
      [4, 2, ["left", "up"], 3],
      [4, 1, ["down", "right"], 2],
    ],
    decoys: [
      [1, 2, ["left", "down"], 1],
      [3, 4, ["up", "right"], 2],
      [5, 3, ["up", "down"], 1],
    ],
  },
  {
    size: 7,
    source: [0, 3],
    bulb: [6, 5],
    tiles: [
      [1, 3, ["left", "right"], 1],
      [2, 3, ["left", "down"], 2],
      [2, 4, ["up", "down"], 1],
      [2, 5, ["up", "right"], 3],
      [3, 5, ["left", "right"], 2],
      [4, 5, ["left", "up"], 1],
      [4, 4, ["up", "down"], 3],
      [4, 3, ["down", "right"], 1],
      [5, 3, ["left", "down"], 2],
      [5, 4, ["up", "down"], 1],
      [5, 5, ["up", "right"], 3],
    ],
    decoys: [
      [1, 1, ["left", "right"], 1],
      [3, 2, ["up", "right"], 2],
      [6, 2, ["up", "down"], 3],
    ],
  },
];

export class CircuitConnector extends BaseGame {
  constructor(deps) {
    super({ ...deps, id: "circuit", title: "Circuit Connector", tagline: "Rotate wires to power the bulb." });
  }

  mount() {
    super.mount();
    this.level = 0;
    this.moves = 0;
    this.stage.innerHTML = `
      <div class="game-layout circuit-layout">
        <div class="circuit-board"></div>
      </div>
    `;
    this.board = this.stage.querySelector(".circuit-board");
    this.hudEl = this.hud({ Level: 1, Rotations: 0, Bulb: "Off" });
    this.loadLevel();
    this.ui.say("Click wire pieces to rotate them. Connect the battery to the bulb.");
  }

  loadLevel() {
    const data = LEVELS[this.level % LEVELS.length];
    this.size = data.size;
    this.source = data.source;
    this.bulb = data.bulb;
    this.moves = 0;
    this.tiles = new Map();

    [...data.tiles, ...data.decoys].forEach(([x, y, connections, rotation]) => {
      this.tiles.set(this.key(x, y), {
        x,
        y,
        base: connections,
        rotation,
      });
    });

    this.updatePower();
    this.render();
  }

  key(x, y) {
    return `${x},${y}`;
  }

  rotateTile(key) {
    const tile = this.tiles.get(key);
    if (!tile || this.solved) return;
    tile.rotation = (tile.rotation + 1) % 4;
    this.moves += 1;
    this.audio.click();
    this.updatePower();
    this.render();

    if (this.solved) {
      const bonus = Math.max(150, 620 - this.moves * 24);
      this.combo += 1;
      this.addScore(bonus);
      this.audio.success();
      this.particles.domBurst(window.innerWidth / 2, window.innerHeight / 2, "#ffd166", 30);
      this.ui.say("Bulb on. Next circuit board loading.");
      this.later(() => {
        this.level += 1;
        this.loadLevel();
      }, 950);
    }
  }

  connectionsAt(x, y) {
    if (x === this.source[0] && y === this.source[1]) return ["right"];
    if (x === this.bulb[0] && y === this.bulb[1]) return ["left"];
    const tile = this.tiles.get(this.key(x, y));
    if (!tile) return [];
    return tile.base.map((dir) => DIRS[(DIR_INDEX.get(dir) + tile.rotation) % 4].name);
  }

  updatePower() {
    this.powered = new Set();
    this.solved = false;
    const queue = [this.source];
    this.powered.add(this.key(...this.source));

    while (queue.length) {
      const [x, y] = queue.shift();
      const here = this.connectionsAt(x, y);
      for (const dirName of here) {
        const dir = DIRS[DIR_INDEX.get(dirName)];
        const nx = x + dir.dx;
        const ny = y + dir.dy;
        if (nx < 0 || ny < 0 || nx >= this.size || ny >= this.size) continue;
        const nextConnections = this.connectionsAt(nx, ny);
        if (!nextConnections.includes(dir.opposite)) continue;
        const nextKey = this.key(nx, ny);
        if (this.powered.has(nextKey)) continue;
        this.powered.add(nextKey);
        queue.push([nx, ny]);
      }
    }

    this.solved = this.powered.has(this.key(...this.bulb));
    this.updateHud(this.hudEl, {
      Level: this.level + 1,
      Rotations: this.moves,
      Bulb: this.solved ? "On" : "Off",
    });
  }

  render() {
    this.board.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
    this.board.innerHTML = "";

    for (let y = 0; y < this.size; y += 1) {
      for (let x = 0; x < this.size; x += 1) {
        const key = this.key(x, y);
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "circuit-cell";
        const powered = this.powered.has(key);
        if (powered) cell.classList.add("circuit-powered");

        if (x === this.source[0] && y === this.source[1]) {
          cell.classList.add("circuit-source");
          cell.innerHTML = `<span class="circuit-label">BAT</span>${this.wires(["right"])}`;
          cell.disabled = true;
        } else if (x === this.bulb[0] && y === this.bulb[1]) {
          cell.classList.add("circuit-bulb", this.solved ? "bulb-on" : "bulb-off");
          cell.innerHTML = `<span class="circuit-label">BULB</span>${this.wires(["left"])}`;
          cell.disabled = true;
        } else if (this.tiles.has(key)) {
          const connections = this.connectionsAt(x, y);
          cell.classList.add("circuit-wire");
          cell.innerHTML = this.wires(connections);
          cell.addEventListener("click", () => this.rotateTile(key));
        } else {
          cell.disabled = true;
        }

        this.board.appendChild(cell);
      }
    }
  }

  wires(connections) {
    const center = `<span class="wire-center"></span>`;
    return `${center}${connections.map((dir) => `<span class="wire wire-${dir}"></span>`).join("")}`;
  }
}
