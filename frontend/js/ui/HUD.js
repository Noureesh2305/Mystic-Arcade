export class HUD {
  constructor() {
    this.hud = document.querySelector("#hud");
    this.message = document.querySelector("#message");
    this.resonance = document.querySelector("#resonance-value");
    this.portal = document.querySelector("#portal-state");
    this.shards = document.querySelector("#shard-state");
    this.objective = document.querySelector("#objective-panel");
    this.runeConsole = document.querySelector("#rune-console");
    this.ending = document.querySelector("#ending-panel");
    this.objectiveTitle = document.querySelector("#objective-title");
    this.continueButton = document.querySelector("#continue-button");
    this.restartButton = document.querySelector("#restart-button");
    this.puzzleState = document.querySelector("#puzzle-state");
    this.runeButtons = [...document.querySelectorAll(".rune-button")];
    this.runeSymbols = [
      document.querySelector("#rune-symbol-0"),
      document.querySelector("#rune-symbol-1"),
      document.querySelector("#rune-symbol-2"),
    ];
    this.steps = [...document.querySelectorAll("#objective-steps li")];
    this.messageTimer = null;
  }

  show() {
    this.hud.classList.add("visible");
    this.objective.classList.add("visible");
  }

  setResonance(value) {
    this.resonance.textContent = `${Math.round(value * 100)}%`;
  }

  setPortalState(value) {
    this.portal.textContent = value;
  }

  setShardState(current, total) {
    this.shards.textContent = `${current} / ${total}`;
  }

  showRuneConsole() {
    this.runeConsole.classList.add("visible");
  }

  bindRuneButtons(onRuneClick) {
    this.runeButtons.forEach((button) => {
      button.addEventListener("click", () => onRuneClick(Number(button.dataset.rune)));
    });
  }

  bindEndingButtons({ onContinue, onRestart }) {
    this.continueButton.addEventListener("click", onContinue);
    this.restartButton.addEventListener("click", onRestart);
  }

  setObjective(title, steps) {
    this.objectiveTitle.textContent = title;
    this.steps.forEach((step, index) => {
      step.textContent = steps[index] ?? "";
      step.className = index === 0 ? "active" : "";
    });
  }

  setStepDone(index) {
    this.steps[index]?.classList.add("done");
    this.steps[index]?.classList.remove("active");
    this.steps[index + 1]?.classList.add("active");
  }

  hideRuneConsole() {
    this.runeConsole.classList.remove("visible");
  }

  updatePuzzle({ states, targets, names, aligned }) {
    this.puzzleState.textContent = `${aligned} / ${states.length} aligned`;
    this.runeButtons.forEach((button, index) => {
      const isAligned = states[index] === targets[index];
      button.classList.toggle("aligned", isAligned);
      this.runeSymbols[index].textContent = names[states[index]];
    });

    this.steps[0].classList.toggle("done", aligned === states.length);
    this.steps[0].classList.toggle("active", aligned < states.length);
    this.steps[1].classList.toggle("done", aligned === states.length);
    this.steps[1].classList.toggle("active", aligned === states.length);
  }

  markPortalReady() {
    this.steps[0].classList.add("done");
    this.steps[1].classList.add("done");
    this.steps[2].classList.add("active");
  }

  completeChapter() {
    this.steps[2].classList.add("done");
    this.ending.classList.add("visible");
  }

  hideEnding() {
    this.ending.classList.remove("visible");
  }

  say(text, duration = 2600) {
    clearTimeout(this.messageTimer);
    this.message.textContent = text;
    this.message.classList.add("visible");
    this.messageTimer = setTimeout(() => this.message.classList.remove("visible"), duration);
  }
}
