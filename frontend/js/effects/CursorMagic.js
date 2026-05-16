import { gsap } from "gsap";

export class CursorMagic {
  constructor(audio) {
    this.audio = audio;
    this.cursor = document.querySelector("#cursor-magic");
    this.x = window.innerWidth / 2;
    this.y = window.innerHeight / 2;
    this.tx = this.x;
    this.ty = this.y;

    window.addEventListener("pointermove", (event) => this.move(event));
    window.addEventListener("pointerdown", (event) => this.click(event));
  }

  move(event) {
    this.tx = event.clientX;
    this.ty = event.clientY;
    if (Math.random() > 0.72) this.spark(event.clientX, event.clientY);
  }

  click(event) {
    this.audio.interaction();
    for (let i = 0; i < 10; i += 1) {
      setTimeout(() => this.spark(event.clientX, event.clientY, true), i * 12);
    }
  }

  spark(x, y, burst = false) {
    const dot = document.createElement("span");
    dot.className = "spark";
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    document.body.appendChild(dot);

    gsap.to(dot, {
      x: (Math.random() - 0.5) * (burst ? 100 : 36),
      y: (Math.random() - 0.5) * (burst ? 100 : 36),
      scale: 0,
      opacity: 0,
      duration: burst ? 0.7 : 0.45,
      ease: "power2.out",
      onComplete: () => dot.remove(),
    });
  }

  update() {
    this.x += (this.tx - this.x) * 0.2;
    this.y += (this.ty - this.y) * 0.2;
    this.cursor.style.transform = `translate(${this.x - 9}px, ${this.y - 9}px)`;
  }
}
