import * as THREE from "three";
import { gsap } from "gsap";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ParticleEngine } from "../particles/ParticleEngine.js";

const PORTAL_COLORS = [0x61f5ff, 0xffd166, 0xff6aa9, 0x78ffba, 0xa97cff];

export class ArcadeHub {
  constructor({ canvas, games, ui, audio }) {
    this.canvas = canvas;
    this.games = games;
    this.ui = ui;
    this.audio = audio;
    this.clock = new THREE.Clock();
    this.selected = null;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x03040a);
    this.scene.fog = new THREE.FogExp2(0x06101a, 0.035);

    this.camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 90);
    this.camera.position.set(0, 3.2, 9.2);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.55));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 5.8;
    this.controls.maxDistance = 12;
    this.controls.maxPolarAngle = Math.PI * 0.58;
    this.controls.target.set(0, 1, 0);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.portals = [];
    this.particles = new ParticleEngine(this.scene);
    this.enabled = false;
    this.build();
    this.bind();
  }

  build() {
    this.scene.add(new THREE.HemisphereLight(0x9af7ff, 0x100513, 1.35));
    const key = new THREE.DirectionalLight(0xe7fbff, 1.8);
    key.position.set(-4, 7, 6);
    this.scene.add(key);

    const floor = new THREE.Mesh(
      new THREE.CylinderGeometry(4.6, 5.1, 0.25, 96),
      new THREE.MeshStandardMaterial({ color: 0x101923, emissive: 0x08151d, emissiveIntensity: 0.8, roughness: 0.44, metalness: 0.22 }),
    );
    floor.position.y = -0.18;
    this.scene.add(floor);

    [1.35, 2.35, 3.45, 4.35].forEach((radius, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.012, 8, 180),
        new THREE.MeshBasicMaterial({ color: index % 2 ? 0xffd166 : 0x61f5ff, transparent: true, opacity: 0.62, blending: THREE.AdditiveBlending }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.02 + index * 0.008;
      this.scene.add(ring);
    });

    const skyGeometry = new THREE.BufferGeometry();
    const count = 900;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const direction = new THREE.Vector3().randomDirection().multiplyScalar(24 + Math.random() * 20);
      positions.set([direction.x, direction.y, direction.z], i * 3);
    }
    skyGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.scene.add(new THREE.Points(skyGeometry, new THREE.PointsMaterial({ color: 0xd8fbff, size: 0.045, transparent: true, opacity: 0.75 })));
    this.particles.createDust();

    this.games.forEach((game, index) => this.createPortal(game, index));
  }

  createPortal(game, index) {
    const angle = (index / this.games.length) * Math.PI * 2 - Math.PI / 2;
    const radius = 3.65;
    const color = PORTAL_COLORS[index % PORTAL_COLORS.length];
    const group = new THREE.Group();
    group.position.set(Math.cos(angle) * radius, 1.15 + (index % 2) * 0.32, Math.sin(angle) * radius);
    group.lookAt(0, 1, 0);
    group.userData.game = game;

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.72, 0.035, 12, 96),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending }),
    );
    const surface = new THREE.Mesh(
      new THREE.CircleGeometry(0.62, 72),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { time: { value: 0 }, color: { value: new THREE.Color(color) } },
        vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
        fragmentShader: "uniform float time; uniform vec3 color; varying vec2 vUv; void main(){ vec2 p=vUv-.5; float r=length(p); float swirl=sin(18.0*r-time*3.0+atan(p.y,p.x)*4.0); float alpha=smoothstep(.55,.12,r)*(0.42+swirl*.12); gl_FragColor=vec4(color*(1.2-r), alpha); }",
      }),
    );
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.08, 0.04),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 }),
    );
    sign.position.y = -0.95;
    group.add(surface, ring, sign);
    this.scene.add(group);
    this.portals.push({ group, ring, surface, game, color });
  }

  bind() {
    window.addEventListener("resize", () => this.resize());
    this.canvas.addEventListener("pointermove", (event) => this.pick(event));
    this.canvas.addEventListener("click", () => {
      if (this.selected && this.enabled) {
        this.audio.portal();
        this.ui.playSelected.click();
      }
    });
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.controls.enabled = enabled;
  }

  focusPortal(id) {
    const portal = this.portals.find((item) => item.game.id === id);
    if (!portal) return;
    gsap.to(this.camera.position, {
      x: portal.group.position.x * 0.45,
      y: 2.2,
      z: portal.group.position.z * 0.45 + 5.2,
      duration: 0.75,
      ease: "power2.out",
    });
  }

  pick(event) {
    if (!this.enabled) return;
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.portals.map((portal) => portal.surface), false);
    const next = hits[0]?.object?.parent?.userData?.game ?? null;
    if (next?.id !== this.selected?.id) {
      this.selected = next;
      this.ui.setPortal(next);
      if (next) this.audio.click();
    }
  }

  intro() {
    this.camera.position.set(0, 3, 12);
    return new Promise((resolve) => {
      gsap.to(this.camera.position, { z: 8.2, duration: 1.8, ease: "power2.inOut", onComplete: resolve });
    });
  }

  update() {
    const time = this.clock.getElapsedTime();
    this.controls.update();
    this.particles.update(time);
    this.portals.forEach((portal, index) => {
      portal.group.position.y += Math.sin(time * 1.2 + index) * 0.0018;
      portal.group.rotation.z = Math.sin(time + index) * 0.08;
      portal.ring.rotation.z += 0.012 + index * 0.001;
      portal.surface.material.uniforms.time.value = time;
      const active = this.selected?.id === portal.game.id;
      portal.group.scale.lerp(new THREE.Vector3(active ? 1.14 : 1, active ? 1.14 : 1, active ? 1.14 : 1), 0.08);
    });
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
