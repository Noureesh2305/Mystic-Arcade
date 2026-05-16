import * as THREE from "three";
import { gsap } from "gsap";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ParticleEngine } from "../particles/ParticleEngine.js";
import { PortalSystem } from "./PortalSystem.js";
import { InteractionManager } from "../interactions/InteractionManager.js";
import { RunePuzzle } from "../puzzles/RunePuzzle.js";
import { RealityDistortion } from "../effects/RealityDistortion.js";

export class NexusScene {
  constructor({ canvas, hud, audio }) {
    this.canvas = canvas;
    this.hud = hud;
    this.audio = audio;
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x03050a);
    this.scene.fog = new THREE.FogExp2(0x07111a, 0.028);

    this.camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 80);
    this.camera.position.set(0, 2.2, 8.5);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 4.2;
    this.controls.maxDistance = 9.5;
    this.controls.maxPolarAngle = Math.PI * 0.52;
    this.controls.target.set(0, 1.1, -1.2);
    this.controls.enabled = false;

    this.particles = new ParticleEngine(this.scene);
    this.distortion = new RealityDistortion(this.scene, this.camera);
    this.interactions = new InteractionManager({
      camera: this.camera,
      renderer: this.renderer,
      hud,
      audio,
      particles: this.particles,
      distortion: this.distortion,
    });

    this.mixers = [];
    this.runes = [];
    this.artifacts = [];
    this.guides = [];
    this.shards = [];
    this.collectedShards = 0;
    this.totalShards = 5;
    this.phase = "shards";
    this.chapter = 1;
    this.activatedArtifacts = new Set();

    this.build();
    this.portal = new PortalSystem({
      scene: this.scene,
      particles: this.particles,
      hud,
      audio,
      distortion: this.distortion,
      onEntered: () => this.completeChapter(),
    });
    this.createInteractions();
    this.resize = this.resize.bind(this);
    window.addEventListener("resize", this.resize);
  }

  build() {
    this.addLights();
    this.addChamber();
    this.addRunes();
    this.addArtifacts();
    this.addShards();
    this.addGuides();
    this.particles.createDust();
  }

  addLights() {
    const ambient = new THREE.HemisphereLight(0x7bdcff, 0x08040a, 1.4);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight(0xaeefff, 2.1);
    key.position.set(-3, 6, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    this.scene.add(key);

    const portalGlow = new THREE.PointLight(0x56f7ff, 7, 9, 1.8);
    portalGlow.position.set(0, 1.6, -3.8);
    this.scene.add(portalGlow);

    const ember = new THREE.PointLight(0xffc857, 2.2, 7, 2);
    ember.position.set(2.8, 1.3, 0.2);
    this.scene.add(ember);
  }

  addChamber() {
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x0b1218,
      metalness: 0.42,
      roughness: 0.58,
      emissive: 0x06131a,
      emissiveIntensity: 0.4,
    });
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.8, 0.22, 96), floorMaterial);
    floor.receiveShadow = true;
    floor.position.y = -0.12;
    this.scene.add(floor);

    const rings = [1.3, 2.2, 3.2, 4.05];
    rings.forEach((radius, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.012, 8, 160),
        new THREE.MeshBasicMaterial({
          color: index % 2 ? 0xffc857 : 0x56f7ff,
          transparent: true,
          opacity: 0.58,
        }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.012 + index * 0.006;
      this.scene.add(ring);
    });

    for (let i = 0; i < 9; i += 1) {
      const angle = (i / 9) * Math.PI * 2;
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.09, 1.7, 12),
        new THREE.MeshStandardMaterial({
          color: 0x14232c,
          emissive: i % 2 ? 0x40210a : 0x082d33,
          emissiveIntensity: 0.75,
          roughness: 0.35,
        }),
      );
      pillar.position.set(Math.cos(angle) * 4.05, 0.78, Math.sin(angle) * 4.05 - 0.7);
      pillar.castShadow = true;
      this.scene.add(pillar);
    }
  }

  addRunes() {
    const runeMaterial = new THREE.MeshStandardMaterial({
      color: 0x16313b,
      emissive: 0x56f7ff,
      emissiveIntensity: 1.2,
      roughness: 0.34,
      metalness: 0.28,
    });
    const positions = [
      [-1.65, 0.22, 0.7],
      [0, 0.22, 1.05],
      [1.65, 0.22, 0.7],
    ];

    positions.forEach((position, index) => {
      const group = new THREE.Group();
      group.position.set(...position);
      group.rotation.x = -Math.PI / 2;

      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 48), runeMaterial.clone());
      disc.castShadow = true;
      group.add(disc);

      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.64, 0.035, 0.035),
        new THREE.MeshBasicMaterial({ color: index === 1 ? 0xffc857 : 0x9dfcff }),
      );
      bar.position.z = 0.045;
      group.add(bar);

      this.scene.add(group);
      this.runes.push(group);
    });
  }

  addArtifacts() {
    const shapes = [
      new THREE.IcosahedronGeometry(0.34, 1),
      new THREE.OctahedronGeometry(0.38),
      new THREE.TorusKnotGeometry(0.25, 0.055, 72, 8),
    ];
    const positions = [
      [-2.55, 1.15, -1.1],
      [2.45, 1.35, -1.0],
      [0, 2.5, -1.65],
    ];

    shapes.forEach((geometry, index) => {
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
          color: index === 1 ? 0x231825 : 0x10232d,
          emissive: index === 1 ? 0xff6fae : 0x56f7ff,
          emissiveIntensity: 1.1,
          metalness: 0.45,
          roughness: 0.2,
        }),
      );
      mesh.position.set(...positions[index]);
      mesh.castShadow = true;
      mesh.userData.baseY = mesh.position.y;
      this.scene.add(mesh);
      this.artifacts.push(mesh);
    });
  }

  addShards() {
    const shardMaterial = new THREE.MeshStandardMaterial({
      color: 0x102a34,
      emissive: 0x56f7ff,
      emissiveIntensity: 2.6,
      roughness: 0.18,
      metalness: 0.25,
    });
    const positions = [
      [-2.8, 1.05, 1.35],
      [2.55, 1.15, 1.15],
      [-1.2, 1.85, -2.15],
      [1.35, 2.05, -2.35],
      [0, 2.7, 0.1],
    ];

    positions.forEach((position, index) => {
      const shard = new THREE.Group();
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), shardMaterial.clone());
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.32, 0.012, 8, 48),
        new THREE.MeshBasicMaterial({
          color: 0xffc857,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      halo.rotation.x = Math.PI / 2;
      shard.position.set(...position);
      shard.userData.baseY = position[1];
      shard.userData.index = index;
      shard.add(crystal, halo);
      this.scene.add(shard);
      this.shards.push(shard);
    });
  }

  addGuides() {
    const guideMaterial = new THREE.MeshBasicMaterial({
      color: 0xffc857,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.runes.forEach((rune, index) => {
      const beacon = new THREE.Group();
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.01, 8, 72), guideMaterial.clone());
      const pointer = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.22, 4),
        new THREE.MeshBasicMaterial({
          color: 0x56f7ff,
          transparent: true,
          opacity: 0.86,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );

      halo.rotation.x = Math.PI / 2;
      pointer.position.y = 0.35;
      pointer.rotation.y = Math.PI / 4;
      beacon.position.copy(rune.position);
      beacon.position.y += 0.38;
      beacon.userData.index = index;
      beacon.add(halo, pointer);
      this.scene.add(beacon);
      this.guides.push(beacon);
    });
  }

  createInteractions() {
    this.runePuzzle = new RunePuzzle({
      runes: this.runes,
      hud: this.hud,
      audio: this.audio,
      onSolved: () => this.portal.unlock(),
    });

    this.runes.forEach((rune) => {
      this.interactions.register(rune, {
        onEnter: (object) => {
          if (this.phase !== "runes") {
            this.hud.say("The rune console is locked. Collect all 5 shards first.", 1700);
            return;
          }
          object.scale.setScalar(1.08);
          this.hud.say("Click this glowing floor rune to rotate it.", 1700);
        },
        onLeave: (object) => object.scale.setScalar(1),
        onClick: (object) => {
          if (this.phase !== "runes") {
            this.hud.say("Collect all 5 floating shards to charge the runes.");
            return;
          }
          this.runePuzzle.rotate(object);
        },
      });
    });

    this.shards.forEach((shard) => {
      this.interactions.register(shard, {
        onEnter: (object) => {
          if (object.userData.collected) return;
          object.scale.setScalar(1.18);
          this.hud.say("Click the glowing shard to collect portal energy.", 1300);
        },
        onLeave: (object) => {
          if (!object.userData.collected) object.scale.setScalar(1);
        },
        onClick: (object, event) => this.collectShard(object, event),
      });
    });

    this.artifacts.forEach((artifact, index) => {
      this.interactions.register(artifact, {
        onEnter: (object) => {
          object.material.emissiveIntensity = 2.4;
          this.hud.say(["The astrolabe hums.", "A memory prism refracts hidden stars.", "The anchor bends gravity."][index], 1500);
        },
        onLeave: (object) => {
          object.material.emissiveIntensity = 1.1;
        },
        onClick: (object, event) => {
          this.audio.interaction();
          this.particles.burst(object.position, index === 1 ? 0xff6fae : 0xffc857);
          this.distortion.pulse(event.clientX, event.clientY);
          if (this.chapter === 2) {
            this.activateMirrorArtifact(index, object);
          }
          gsap.to(object.rotation, {
            x: object.rotation.x + Math.PI * 1.5,
            y: object.rotation.y + Math.PI * 1.2,
            duration: 1,
            ease: "power3.out",
          });
        },
      });
    });

    this.interactions.register(this.portal.surface, {
      onEnter: () => this.hud.say("A portal breathes behind the veil.", 1600),
      onClick: () => this.portal.enter(this.camera),
    });
  }

  playIntro(onReady) {
    this.controls.enabled = false;
    this.camera.position.set(0, 1.8, 9.5);
    this.camera.lookAt(0, 1.4, -4);

    const timeline = gsap.timeline({ onComplete: onReady });
    timeline.to(this.camera.position, { z: 6.4, y: 2.2, duration: 3.2, ease: "power2.inOut" });
    timeline.to(this.camera.position, { z: 5.2, y: 1.8, duration: 1.2, ease: "power2.out" }, "-=0.6");
  }

  enableExplore() {
    this.controls.enabled = true;
    this.hud.show();
    this.hud.setShardState(0, this.totalShards);
    this.hud.setObjective("Collect Nexus Shards", [
      "Find and click 5 glowing shards floating around the chamber.",
      "Charge the rune console.",
      "Solve the rune puzzle to open the portal.",
    ]);
    this.hud.say("Game start: collect the 5 glowing shards first. Drag to look around the chamber.", 6200);
    gsap.to(this.controls.target, { x: 0, y: 1.2, z: -0.7, duration: 1.2, ease: "power2.out" });
  }

  rotateRuneByIndex(index) {
    if (this.phase !== "runes") {
      this.hud.say("The rune console needs shard energy first. Collect all 5 glowing shards.");
      return;
    }
    this.runePuzzle.rotateIndex(index);
  }

  collectShard(shard, event) {
    if (shard.userData.collected || this.phase !== "shards") return;
    shard.userData.collected = true;
    this.collectedShards += 1;
    this.hud.setShardState(this.collectedShards, this.totalShards);
    this.hud.say(`Shard collected: ${this.collectedShards} of ${this.totalShards}`, 1400);
    this.audio.interaction();
    this.particles.burst(shard.position, 0x56f7ff);
    this.distortion.pulse(event.clientX, event.clientY);
    gsap.to(shard.scale, {
      x: 0.01,
      y: 0.01,
      z: 0.01,
      duration: 0.35,
      ease: "power2.in",
      onComplete: () => {
        shard.visible = false;
      },
    });

    if (this.collectedShards === this.totalShards) {
      this.unlockRunePhase();
    }
  }

  unlockRunePhase() {
    this.phase = "runes";
    this.hud.setStepDone(0);
    this.hud.showRuneConsole();
    this.hud.setObjective("Solve the Rune Lock", [
      "Rotate the three rune dials until each matches its target.",
      "Reach 100% Resonance.",
      "Click the awakened portal.",
    ]);
    this.hud.say("Shard energy complete. Now solve the rune puzzle in the bottom-right console.", 5200);
    this.audio.success();
    this.guides.forEach((guide) => {
      guide.visible = true;
      gsap.fromTo(guide.scale, { x: 0.2, y: 0.2, z: 0.2 }, { x: 1, y: 1, z: 1, duration: 0.7, ease: "back.out(2)" });
    });
  }

  completeChapter() {
    this.controls.enabled = false;
    this.hud.completeChapter();
  }

  continueToMirrorLibrary() {
    this.chapter = 2;
    this.controls.enabled = true;
    this.hud.hideEnding();
    this.hud.hideRuneConsole();
    this.hud.setPortalState("Crossed");
    this.hud.setObjective("Stabilize the Mirror Library", [
      "Click the three floating artifacts: left crystal, right prism, and upper anchor.",
      "Each artifact releases a memory spark.",
      "When all three are awake, the demo is complete.",
    ]);
    this.hud.say("New objective: click the three floating artifacts around the chamber.", 5200);
    gsap.to(this.camera.position, { x: 0, y: 2.2, z: 6.2, duration: 1.2, ease: "power2.out" });
    gsap.to(this.controls.target, { x: 0, y: 1.4, z: -1.2, duration: 1.2, ease: "power2.out" });
    this.artifacts.forEach((artifact) => {
      artifact.material.emissiveIntensity = 2;
      gsap.to(artifact.scale, { x: 1.22, y: 1.22, z: 1.22, duration: 0.8, yoyo: true, repeat: 1 });
    });
  }

  activateMirrorArtifact(index, object) {
    if (this.activatedArtifacts.has(index)) return;
    this.activatedArtifacts.add(index);
    object.material.emissive.set(0xffc857);
    object.material.emissiveIntensity = 3.2;
    this.hud.say(`${this.activatedArtifacts.size} of 3 mirror artifacts awakened.`, 2200);

    if (this.activatedArtifacts.size === 1) this.hud.setStepDone(0);
    if (this.activatedArtifacts.size === 2) this.hud.setStepDone(1);
    if (this.activatedArtifacts.size === 3) {
      this.hud.setStepDone(2);
      this.hud.say("Demo complete. You solved the portal and stabilized the Mirror Library.", 6000);
      this.audio.success();
      this.distortion.pulse();
    }
  }

  update() {
    const time = this.clock.getElapsedTime();
    this.controls.update();
    this.interactions.update();
    this.particles.update(time);
    this.portal.update(time);
    this.distortion.update(time);

    this.runes.forEach((rune, index) => {
      rune.position.y = 0.22 + Math.sin(time * 1.1 + index) * 0.035;
    });

    this.guides.forEach((guide, index) => {
      const rune = this.runes[index];
      guide.position.x = rune.position.x;
      guide.position.z = rune.position.z;
      guide.position.y = rune.position.y + 0.42 + Math.sin(time * 2.2 + index) * 0.055;
      guide.rotation.y += 0.018;
      guide.visible = this.phase === "runes" && !this.runePuzzle?.solved;
    });

    this.shards.forEach((shard, index) => {
      if (shard.userData.collected) return;
      shard.rotation.y += 0.025;
      shard.rotation.x += 0.012;
      shard.position.y = shard.userData.baseY + Math.sin(time * 1.8 + index) * 0.14;
    });

    this.artifacts.forEach((artifact, index) => {
      artifact.rotation.y += 0.005 + index * 0.002;
      artifact.position.y = artifact.userData.baseY + Math.sin(time * 0.9 + index * 1.4) * 0.12;
    });

    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
