import { BaseGame } from "./BaseGame.js";

const LEVELS = [
  {
    size: 5,
    path: [
      [0, 0], [1, 0], [2, 0], [3, 0], [4, 0],
      [4, 1], [3, 1], [2, 1], [1, 1], [0, 1],
      [0, 2], [1, 2], [2, 2], [3, 2], [4, 2],
      [4, 3], [3, 3], [2, 3], [1, 3], [0, 3],
      [0, 4], [1, 4], [2, 4], [3, 4], [4, 4],
    ],
    numbers: { 0: 1, 6: 2, 12: 3, 18: 4, 24: 5 },
  },
  {
    size: 6,
    path: [
      [0, 0], [0, 1], [1, 1], [1, 0], [2, 0], [3, 0],
      [4, 0], [5, 0], [5, 1], [4, 1], [3, 1], [2, 1],
      [2, 2], [3, 2], [4, 2], [5, 2], [5, 3], [4, 3],
      [3, 3], [2, 3], [1, 3], [1, 2], [0, 2], [0, 3],
      [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4],
      [5, 5], [4, 5], [3, 5], [2, 5], [1, 5], [0, 5],
    ],
    numbers: { 0: 1, 7: 2, 15: 3, 22: 4, 29: 5, 35: 6 },
  },
  {
    size: 6,
    path: [
      [2, 0], [1, 0], [0, 0], [0, 1], [0, 2], [1, 2],
      [1, 1], [2, 1], [3, 1], [3, 0], [4, 0], [5, 0],
      [5, 1], [4, 1], [4, 2], [5, 2], [5, 3], [4, 3],
      [3, 3], [3, 2], [2, 2], [2, 3], [1, 3], [0, 3],
      [0, 4], [0, 5], [1, 5], [1, 4], [2, 4], [2, 5],
      [3, 5], [3, 4], [4, 4], [4, 5], [5, 5], [5, 4],
    ],
    numbers: { 0: 1, 6: 2, 12: 3, 19: 4, 26: 5, 35: 6 },
  },
];

export class NumberPath extends BaseGame {
  constructor(deps) {
    super({ ...deps, id: "numberPath", title: "Number Path", tagline: "Connect numbers in order and fill the whole grid." });
  }

  mount() {
    super.mount();
    this.level = 0;
    this.isDrawing = false;
    this.loadLevel();
    this.ui.say("Hold and drag from 1. Draw through adjacent cells to reach each number and fill the board.");
  }

  stop() {
    super.stop();
    window.removeEventListener("pointerup", this.onPointerUp);
  }

  loadLevel() {
    this.data = LEVELS[this.level % LEVELS.length];
    this.size = this.data.size;
    this.solution = this.data.path.map(([x, y]) => this.key(x, y));
    this.numberByKey = new Map();
    Object.entries(this.data.numbers).forEach(([index, value]) => {
      this.numberByKey.set(this.solution[Number(index)], value);
    });
    this.maxNumber = Math.max(...this.numberByKey.values());
    this.path = [this.solution[0]];
    this.nextNumber = 2;
    this.errors = 0;
    this.stage.innerHTML = `
      <div class="game-layout number-layout">
        <div class="number-board"></div>
      </div>
    `;
    this.board = this.stage.querySelector(".number-board");
    this.board.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
    this.hudEl = this.hud({ Level: this.level + 1, Filled: `1/${this.solution.length}`, Next: this.nextNumber });
    this.bindDrawing();
    this.render();
  }

  bindDrawing() {
    if (this.onPointerUp) window.removeEventListener("pointerup", this.onPointerUp);

    this.onPointerDown = (event) => {
      const key = event.target.closest(".number-cell")?.dataset.key;
      if (!key) return;
      event.preventDefault();
      this.isDrawing = true;
      this.pick(key);
      this.board.setPointerCapture?.(event.pointerId);
    };

    this.onPointerMove = (event) => {
      if (!this.isDrawing) return;
      const element = document.elementFromPoint(event.clientX, event.clientY);
      const key = element?.closest(".number-cell")?.dataset.key;
      if (key) this.pick(key);
    };

    this.onPointerUp = () => {
      this.isDrawing = false;
    };

    this.board.addEventListener("pointerdown", this.onPointerDown);
    this.board.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
  }

  key(x, y) {
    return `${x},${y}`;
  }

  coords(key) {
    return key.split(",").map(Number);
  }

  pick(key) {
    const last = this.path[this.path.length - 1];
    const previousIndex = this.path.length - 2;

    if (previousIndex >= 0 && this.path[previousIndex] === key) {
      this.path.pop();
      this.updateNextNumber();
      this.audio.click();
      this.render();
      return;
    }

    if (this.path.includes(key)) return;
    if (!this.adjacent(last, key)) {
      this.error("Move to an adjacent square.");
      return;
    }

    const cellNumber = this.numberByKey.get(key);
    if (cellNumber && cellNumber !== this.nextNumber) {
      this.error(`You must reach ${this.nextNumber} next.`);
      return;
    }

    if (!cellNumber && this.passedNextNumber(key)) {
      this.error(`Connect to ${this.nextNumber} before passing it.`);
      return;
    }

    this.path.push(key);
    if (cellNumber === this.nextNumber) {
      this.nextNumber += 1;
      this.combo += 1;
      this.audio.collect(this.combo);
    } else {
      this.audio.click();
    }

    if (this.path.length === this.solution.length && this.nextNumber > this.maxNumber) {
      this.completeLevel();
      return;
    }

    this.render();
  }

  passedNextNumber(key) {
    const nextKey = [...this.numberByKey.entries()].find(([, number]) => number === this.nextNumber)?.[0];
    if (!nextKey) return false;
    return this.solution.indexOf(key) > this.solution.indexOf(nextKey);
  }

  adjacent(a, b) {
    const [ax, ay] = this.coords(a);
    const [bx, by] = this.coords(b);
    return Math.abs(ax - bx) + Math.abs(ay - by) === 1;
  }

  updateNextNumber() {
    const reached = this.path.map((key) => this.numberByKey.get(key)).filter(Boolean);
    this.nextNumber = Math.max(...reached) + 1;
  }

  error(message) {
    this.errors += 1;
    this.combo = 1;
    this.audio.wrong();
    this.ui.say(message);
    this.stage.classList.add("stage-flash");
    this.later(() => this.stage.classList.remove("stage-flash"), 180);
  }

  completeLevel() {
    const bonus = Math.max(220, 900 - this.errors * 80);
    this.combo += 2;
    this.addScore(bonus);
    this.audio.success();
    this.particles.domBurst(window.innerWidth / 2, window.innerHeight / 2, "#ffd166", 32);
    this.ui.say("Grid complete. Next number path opening.");
    this.later(() => {
      this.level += 1;
      this.loadLevel();
    }, 950);
  }

  render() {
    this.board.innerHTML = "";
    const pathSet = new Set(this.path);

    for (let y = 0; y < this.size; y += 1) {
      for (let x = 0; x < this.size; x += 1) {
        const key = this.key(x, y);
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "number-cell";
        if (pathSet.has(key)) cell.classList.add("number-filled");
        if (key === this.path[this.path.length - 1]) cell.classList.add("number-current");
        if (this.numberByKey.has(key)) {
          cell.classList.add("number-anchor");
          cell.textContent = this.numberByKey.get(key);
        }
        cell.dataset.key = key;
        this.board.appendChild(cell);
      }
    }

    this.updateHud(this.hudEl, {
      Level: this.level + 1,
      Filled: `${this.path.length}/${this.solution.length}`,
      Next: this.nextNumber > this.maxNumber ? "Fill" : this.nextNumber,
    });
  }
}
