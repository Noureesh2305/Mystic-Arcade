export class RunePuzzle {
  constructor({ runes, hud, audio, onSolved }) {
    this.runes = runes;
    this.hud = hud;
    this.audio = audio;
    this.onSolved = onSolved;
    this.solved = false;
    this.targets = [0, 2, 1];
    this.states = [3, 0, 2];
    this.names = ["Up", "Right", "Down", "Left"];
    this.applyStates();
    this.updateHud();
  }

  applyStates() {
    this.runes.forEach((rune, index) => {
      rune.userData.state = this.states[index];
      rune.rotation.z = (Math.PI / 2) * this.states[index];
      const disc = rune.children[0];
      const isAligned = this.states[index] === this.targets[index];
      if (disc?.material?.emissive) {
        disc.material.emissive.set(isAligned ? 0xffc857 : 0x56f7ff);
        disc.material.emissiveIntensity = isAligned ? 2.5 : 1.2;
      }
    });
  }

  rotate(rune) {
    if (this.solved) return;
    const index = this.runes.indexOf(rune);
    if (index < 0) return;
    this.states[index] = (this.states[index] + 1) % 4;
    rune.userData.state = this.states[index];
    this.audio.interaction();
    this.updateHud();
    this.checkSolved();
  }

  rotateIndex(index) {
    this.rotate(this.runes[index]);
  }

  updateHud() {
    const aligned = this.states.filter((state, index) => state === this.targets[index]).length;
    this.hud.setResonance(aligned / this.runes.length);
    this.hud.updatePuzzle({
      states: this.states,
      targets: this.targets,
      names: this.names,
      aligned,
    });
  }

  checkSolved() {
    this.applyStates();
    const complete = this.states.every((state, index) => state === this.targets[index]);
    if (!complete) return;
    this.solved = true;
    this.hud.setResonance(1);
    this.hud.markPortalReady();
    this.hud.say("The runes align. Dimensional energy returns to the portal.");
    this.audio.success();
    this.onSolved();
  }
}
