import { gsap } from "gsap";

export class AnimationManager {
  pop(target, scale = 1.08) {
    gsap.fromTo(target, { scale }, { scale: 1, duration: 0.36, ease: "back.out(2)" });
  }

  pulse(target) {
    gsap.fromTo(target, { filter: "brightness(1.9)" }, { filter: "brightness(1)", duration: 0.4, ease: "power2.out" });
  }

  flip(target, onHalf) {
    gsap.to(target, {
      rotateY: 90,
      duration: 0.16,
      ease: "power2.in",
      onComplete: () => {
        onHalf?.();
        gsap.to(target, { rotateY: 0, duration: 0.2, ease: "power2.out" });
      },
    });
  }
}
