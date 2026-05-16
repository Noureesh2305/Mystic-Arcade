export class ArcadeUI {
  constructor(scoreTracker) {
    this.scoreTracker = scoreTracker;
    this.intro = document.querySelector("#intro");
    this.topbar = document.querySelector("#topbar");
    this.portalPanel = document.querySelector("#portal-panel");
    this.portalTitle = document.querySelector("#portal-title");
    this.portalCopy = document.querySelector("#portal-copy");
    this.playSelected = document.querySelector("#play-selected");
    this.gameShell = document.querySelector("#game-shell");
    this.gameTitle = document.querySelector("#game-title");
    this.gameSubtitle = document.querySelector("#game-subtitle");
    this.gameScore = document.querySelector("#game-score");
    this.realmName = document.querySelector("#realm-name");
    this.toast = document.querySelector("#toast");
    this.scoreTracker.onChange(({ total, bestCombo }) => {
      document.querySelector("#total-score").textContent = total.toLocaleString();
      document.querySelector("#best-combo").textContent = `${bestCombo}x`;
    });
  }

  showHub() {
    document.body.classList.remove("game-active");
    this.realmName.textContent = "Arcade Hub";
    this.gameShell.classList.remove("visible");
    this.portalPanel.classList.add("visible");
    this.topbar.classList.add("visible");
  }

  hideIntro() {
    this.intro.classList.add("hidden");
    this.topbar.classList.add("visible");
    this.portalPanel.classList.add("visible");
  }

  setPortal(game) {
    if (!game) {
      this.portalTitle.textContent = "Hover a Game Portal";
      this.portalCopy.textContent = "Drag gently to orbit the floating arcade, then click a glowing portal to play.";
      this.playSelected.disabled = true;
      return;
    }
    this.portalTitle.textContent = game.title;
    this.portalCopy.textContent = game.copy;
    this.playSelected.disabled = false;
  }

  openGame(game) {
    document.body.classList.add("game-active");
    this.realmName.textContent = game.title;
    this.gameTitle.textContent = game.title;
    this.gameSubtitle.textContent = game.tagline;
    this.gameScore.textContent = "0";
    this.portalPanel.classList.remove("visible");
    this.gameShell.classList.add("visible");
  }

  updateGameScore(score) {
    this.gameScore.textContent = Math.max(0, Math.round(score)).toLocaleString();
  }

  say(message, duration = 2200) {
    this.toast.textContent = message;
    this.toast.classList.add("visible");
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toast.classList.remove("visible"), duration);
  }
}
