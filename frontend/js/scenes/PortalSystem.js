import * as THREE from "three";
import { gsap } from "gsap";
import { portalFragmentShader, portalVertexShader } from "../shaders/portalShader.js";

export class PortalSystem {
  constructor({ scene, particles, hud, audio, distortion, onEntered }) {
    this.scene = scene;
    this.particles = particles;
    this.hud = hud;
    this.audio = audio;
    this.distortion = distortion;
    this.onEntered = onEntered;
    this.openAmount = 0.28;
    this.unlocked = false;
    this.group = new THREE.Group();
    this.group.position.set(0, 1.65, -4.2);

    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x0d2530,
      emissive: 0x26dfff,
      emissiveIntensity: 1.5,
      metalness: 0.55,
      roughness: 0.22,
    });

    this.outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.58, 0.045, 18, 150), ringMaterial);
    this.innerRing = new THREE.Mesh(new THREE.TorusGeometry(1.28, 0.02, 12, 140), ringMaterial.clone());
    this.innerRing.material.emissive.set(0xffc857);
    this.group.add(this.outerRing, this.innerRing);

    this.portalMaterial = new THREE.ShaderMaterial({
      vertexShader: portalVertexShader,
      fragmentShader: portalFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uOpen: { value: this.openAmount },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.surface = new THREE.Mesh(new THREE.CircleGeometry(1.5, 96), this.portalMaterial);
    this.group.add(this.surface);
    this.vortex = particles.createVortex(this.group);
    this.scene.add(this.group);
  }

  unlock() {
    this.unlocked = true;
    this.hud.setPortalState("Awake");
    this.audio.portal();
    gsap.to(this, { openAmount: 1, duration: 1.5, ease: "power3.out" });
    gsap.to(this.group.scale, { x: 1.08, y: 1.08, z: 1.08, duration: 1.5, yoyo: true, repeat: 1 });
  }

  enter(camera) {
    if (!this.unlocked) {
      this.hud.say("The portal is listening, but the rune circuit is incomplete.");
      return;
    }
    this.audio.portal();
    this.distortion.pulse();
    this.hud.say("The chamber folds inward. A hidden nexus answers.");
    gsap.to(camera.position, { x: 0, y: 1.6, z: -2.9, duration: 1.4, ease: "power3.inOut" });
    gsap.to(camera.rotation, { x: 0, y: 0, z: 0, duration: 1.4, ease: "power3.inOut" });
    gsap.to(this.group.rotation, { z: this.group.rotation.z + Math.PI * 2, duration: 1.4, ease: "power3.inOut" });
    gsap.delayedCall(1.25, () => this.onEntered?.());
  }

  update(time) {
    this.portalMaterial.uniforms.uTime.value = time;
    this.portalMaterial.uniforms.uOpen.value = this.openAmount;
    this.outerRing.rotation.z = time * 0.18;
    this.innerRing.rotation.z = -time * 0.26;
    this.vortex.update(time, this.openAmount);
  }
}
