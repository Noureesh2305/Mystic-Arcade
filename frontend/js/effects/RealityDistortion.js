import { gsap } from "gsap";

export class RealityDistortion {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.overlay = document.querySelector("#screen-distortion");
    this.intensity = 0;
  }

  pulse(x = window.innerWidth / 2, y = window.innerHeight / 2) {
    this.overlay.style.setProperty("--pulse-x", `${x}px`);
    this.overlay.style.setProperty("--pulse-y", `${y}px`);

    gsap.fromTo(
      this.overlay,
      { opacity: 0.55, filter: "hue-rotate(0deg) contrast(1.4)" },
      { opacity: 0, filter: "hue-rotate(120deg) contrast(1)", duration: 0.75, ease: "power2.out" },
    );

    gsap.fromTo(
      this.camera.position,
      { x: this.camera.position.x + 0.05 },
      { x: this.camera.position.x, duration: 0.5, ease: "elastic.out(1, 0.45)" },
    );
  }

  update(time) {
    this.scene.fog.density = 0.028 + Math.sin(time * 0.45) * 0.004;
  }
}
