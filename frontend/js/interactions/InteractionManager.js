import * as THREE from "three";

export class InteractionManager {
  constructor({ camera, renderer, hud, audio, particles, distortion }) {
    this.camera = camera;
    this.renderer = renderer;
    this.hud = hud;
    this.audio = audio;
    this.particles = particles;
    this.distortion = distortion;
    this.pointer = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.objects = [];
    this.hovered = null;
    this.enabled = true;

    window.addEventListener("pointermove", (event) => this.onMove(event));
    window.addEventListener("pointerdown", (event) => this.onClick(event));
  }

  register(object, config) {
    object.userData.interactive = config;
    this.objects.push(object);
  }

  onMove(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  onClick(event) {
    if (!this.enabled || !this.hovered) return;
    const action = this.hovered.userData.interactive?.onClick;
    if (action) action(this.hovered, event);
  }

  update() {
    if (!this.enabled) return;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.objects, true);
    let next = hits[0]?.object ?? null;
    while (next && !next.userData.interactive) {
      next = next.parent;
    }

    if (next !== this.hovered) {
      if (this.hovered?.userData.interactive?.onLeave) {
        this.hovered.userData.interactive.onLeave(this.hovered);
      }
      this.hovered = next;
      if (this.hovered?.userData.interactive?.onEnter) {
        this.hovered.userData.interactive.onEnter(this.hovered);
      }
    }
  }
}
