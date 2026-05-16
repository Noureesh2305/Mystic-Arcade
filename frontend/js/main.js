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
import { TotemStack } from "./games/TotemStack.js";
import { SpellTiles } from "./games/SpellTiles.js";
import { CrystalCrush } from "./games/CrystalCrush.js";

const canvas = document.querySelector("#arcade-canvas");
const stage = document.querySelector("#game-stage");
const enterButton = document.querySelector("#enter-button");
const playSelected = document.querySelector("#play-selected");
const hubButton = document.querySelector("#hub-button");
const muteButton = document.querySelector("#mute-button");
const cursor = document.querySelector("#cursor-magic");
const loading = document.querySelector("#loading");

const gameMeta = [
  { id: "memory", title: "Mystic Memory", tagline: "Rune matching", copy: "Flip floating rune cards, build combos, and survive trickier layouts." },
  { id: "fruit", title: "Fruit Smash", tagline: "Mouse slicing", copy: "Hold and drag through enchanted fruit to smash them. Hit fruit, avoid bombs." },
  { id: "totem", title: "Totem Stack", tagline: "Magical balance tower", copy: "Drop enchanted blocks, fight wind and curses, and build the tallest balanced totem." },
  { id: "tiles", title: "Spell Tiles", tagline: "Rhythm tapping", copy: "Tap falling spell tiles as speed and combo pressure rise." },
  { id: "crush", title: "Crystal Crush", tagline: "Match three", copy: "Swap crystals to trigger elemental chains and glowing board explosions." },
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
  if (meta.id === "totem") return new TotemStack(deps);
  if (meta.id === "tiles") return new SpellTiles(deps);
  return new CrystalCrush(deps);
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
