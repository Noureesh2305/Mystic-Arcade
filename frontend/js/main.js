import { gsap } from "gsap";
import { AudioManager } from "./audio/AudioManager.js";
import { ArcadeHub } from "./scenes/ArcadeHub.js";
import { ArcadeUI } from "./ui/ArcadeUI.js";
import { ScoreTracker } from "./core/ScoreTracker.js";
import { GameState } from "./core/GameState.js";
import { AnimationManager } from "./core/AnimationManager.js";
import { TransitionManager } from "./transitions/TransitionManager.js";
import { MysticMemory } from "./games/MysticMemory.js";
import { FruitSmash } from "./games/FruitSmash.js";
import { AstralDodge } from "./games/AstralDodge.js";
import { CircuitConnector } from "./games/CircuitConnector.js";
import { NumberPath } from "./games/NumberPath.js";

const canvas = document.querySelector("#arcade-canvas");
const stage = document.querySelector("#game-stage");
const enterButton = document.querySelector("#enter-button");
const playSelected = document.querySelector("#play-selected");
const hubButton = document.querySelector("#hub-button");
const muteButton = document.querySelector("#mute-button");
const cursor = document.querySelector("#cursor-magic");
const loading = document.querySelector("#loading");

const gameMeta = [
  {
    id: "memory",
    title: "Mystic Memory",
    tagline: "Rune matching",
    copy: "Flip floating rune cards, build combos, and survive trickier layouts.",
    rules: [
      { label: "Goal", text: "Find every matching pair of rune cards." },
      { label: "Move", text: "Click two cards to reveal them." },
      { label: "Score", text: "Fast matches and streaks increase combo points." },
      { label: "Round", text: "Clear the board to start a harder layout." },
    ],
  },
  {
    id: "fruit",
    title: "Fruit Smash",
    tagline: "Mouse slicing",
    copy: "Hold and drag through enchanted fruit to smash them. Hit fruit, avoid bombs.",
    rules: [
      { label: "Goal", text: "Slice fruit for points and keep your lives." },
      { label: "Move", text: "Hold and drag through fruit with mouse or touch." },
      { label: "Avoid", text: "Bombs remove lives and reset your combo." },
      { label: "Score", text: "Longer streaks raise speed and score." },
    ],
  },
  {
    id: "dodge",
    title: "Astral Dodge",
    tagline: "Survival movement",
    copy: "Guide the nexus orb, collect energy sparks, and dodge incoming void shards.",
    rules: [
      { label: "Goal", text: "Collect 10 green sparks to advance waves." },
      { label: "Move", text: "Move the orb with mouse or touch." },
      { label: "Avoid", text: "Red void shards cost lives." },
      { label: "Score", text: "Higher waves make hazards faster." },
    ],
  },
  {
    id: "circuit",
    title: "Circuit Connector",
    tagline: "Power the bulb",
    copy: "Rotate wire pieces to connect the battery circuit and switch on the magical bulb.",
    rules: [
      { label: "Goal", text: "Connect the battery to the bulb." },
      { label: "Move", text: "Click wire tiles to rotate them." },
      { label: "Hint", text: "Glowing wires are carrying power." },
      { label: "Score", text: "Use fewer rotations for more points." },
    ],
  },
  {
    id: "numberPath",
    title: "Number Path",
    tagline: "Connect numbers",
    copy: "Connect numbered checkpoints in order while filling every square of the grid.",
    rules: [
      { label: "Goal", text: "Connect 1 to 2 to 3 and fill the entire board." },
      { label: "Move", text: "Hold and drag across adjacent cells to draw." },
      { label: "Undo", text: "Drag back onto the previous cell to step back." },
      { label: "Score", text: "Fewer mistakes give more points." },
    ],
  },
];

const audio = new AudioManager();
const scoreTracker = new ScoreTracker();
const state = new GameState();
const animation = new AnimationManager();
const ui = new ArcadeUI(scoreTracker);
const transitions = new TransitionManager();
const hub = new ArcadeHub({ canvas, games: gameMeta, ui, audio });
const games = new Map();
let activeGame = null;
let selectedGame = null;
let started = false;

function makeGame(meta) {
  const deps = { stage, ui, audio, particles: hub.particles, scoreTracker, animation };
  if (meta.id === "memory") return new MysticMemory(deps);
  if (meta.id === "fruit") return new FruitSmash(deps);
  if (meta.id === "dodge") return new AstralDodge(deps);
  if (meta.id === "circuit") return new CircuitConnector(deps);
  return new NumberPath(deps);
}

gameMeta.forEach((meta) => games.set(meta.id, makeGame(meta)));

function animate() {
  requestAnimationFrame(animate);
  hub.update();
}

async function enterArcade() {
  if (started) return;
  started = true;
  enterButton.disabled = true;
  await audio.start();
  audio.portal();
  await hub.intro();
  ui.hideIntro();
  hub.setEnabled(true);
  state.set("hub");
  ui.say("Click a glowing portal, or hover one and press Open Portal.");
}

async function openGame(id) {
  const meta = gameMeta.find((game) => game.id === id);
  const game = games.get(id);
  if (!game) return;
  activeGame?.stop();
  audio.portal();
  hub.focusPortal(id);
  await transitions.portal(meta.title, () => {
    hub.setEnabled(false);
    activeGame = game;
    ui.openGame(meta);
    game.mount();
    state.set(id);
  });
}

async function returnHub() {
  if (!activeGame) return;
  activeGame.stop();
  activeGame = null;
  audio.portal();
  await transitions.portal("Arcade Hub", () => {
    stage.innerHTML = "";
    ui.showHub();
    hub.setEnabled(true);
    state.set("hub");
  });
}

function bindUI() {
  playSelected.addEventListener("click", () => {
    const id = selectedGame?.id ?? hub.selected?.id;
    if (id) openGame(id);
  });
  hubButton.addEventListener("click", returnHub);
  enterButton.addEventListener("click", enterArcade);
  muteButton.addEventListener("click", () => {
    const enabled = audio.toggle();
    muteButton.textContent = enabled ? "♪" : "×";
    ui.say(enabled ? "Audio resonance restored." : "Audio muted.");
  });
  document.addEventListener("pointermove", (event) => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
    selectedGame = hub.selected;
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeGame) returnHub();
    if (event.key.toLowerCase() === "m" && !activeGame) muteButton.click();
  });
}

window.addEventListener("load", () => {
  loading.classList.add("hidden");
  gsap.timeline()
    .to(".intro-kicker", { opacity: 1, y: -4, duration: 0.9, ease: "power2.out" }, 0.1)
    .to(".intro h1", { opacity: 1, scale: 1.02, duration: 1.1, ease: "power2.out" }, 0.35)
    .to("#enter-button", { opacity: 1, y: -2, duration: 0.8, ease: "power2.out" }, 0.85);
  animate();
});

bindUI();
