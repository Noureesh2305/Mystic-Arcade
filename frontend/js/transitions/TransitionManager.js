import { gsap } from "gsap";

export class TransitionManager {
  constructor() {
    this.veil = document.querySelector("#transition-veil");
    this.title = this.veil.querySelector(".veil-title");
    this.ring = this.veil.querySelector(".veil-ring");
  }

  async portal(label, callback) {
    this.title.textContent = label;
    this.veil.classList.add("visible");
    await new Promise((resolve) => {
      gsap.timeline({ onComplete: resolve })
        .fromTo(this.veil, { opacity: 0 }, { opacity: 1, duration: 0.32, ease: "power2.out" })
        .fromTo(this.ring, { scale: 0.22, rotate: 0 }, { scale: 1.18, rotate: 180, duration: 0.58, ease: "power3.inOut" }, 0);
    });
    callback?.();
    await new Promise((resolve) => {
      gsap.timeline({ onComplete: resolve })
        .to(this.ring, { scale: 2.4, rotate: 360, duration: 0.46, ease: "power2.in" })
        .to(this.veil, { opacity: 0, duration: 0.32, ease: "power2.out" }, "-=0.18");
    });
    this.veil.classList.remove("visible");
  }
}
