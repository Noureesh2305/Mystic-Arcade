import * as THREE from "three";
import { gsap } from "gsap";

export class ParticleEngine {
  constructor(scene) {
    this.scene = scene;
    this.systems = [];
  }

  createDust({ count = 800, radius = 18, color = 0x86f7ff, size = 0.035 } = {}) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const r = 2 + Math.random() * radius;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = (Math.random() - 0.4) * 9;
      positions[i * 3 + 2] = Math.sin(a) * r;
      phases[i] = Math.random() * Math.PI * 2;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
    this.systems.push({
      update: (time) => {
        points.rotation.y = time * 0.025;
        const pos = geometry.attributes.position.array;
        for (let i = 0; i < count; i += 1) {
          pos[i * 3 + 1] += Math.sin(time * 0.8 + phases[i]) * 0.0012;
        }
        geometry.attributes.position.needsUpdate = true;
      },
    });
  }

  burst(position, color = 0xffd166, count = 90) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];
    for (let i = 0; i < count; i += 1) {
      velocities.push(new THREE.Vector3().randomDirection().multiplyScalar(0.035 + Math.random() * 0.08));
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color,
      size: 0.065,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    points.position.copy(position);
    this.scene.add(points);
    let life = 1;
    const system = {
      update: () => {
        life -= 0.025;
        const pos = geometry.attributes.position.array;
        for (let i = 0; i < count; i += 1) {
          pos[i * 3] += velocities[i].x;
          pos[i * 3 + 1] += velocities[i].y;
          pos[i * 3 + 2] += velocities[i].z;
        }
        material.opacity = Math.max(0, life);
        geometry.attributes.position.needsUpdate = true;
        if (life <= 0) {
          this.scene.remove(points);
          geometry.dispose();
          material.dispose();
          this.systems = this.systems.filter((item) => item !== system);
        }
      },
    };
    this.systems.push(system);
  }

  domBurst(x, y, color = "#61f5ff", count = 18) {
    for (let i = 0; i < count; i += 1) {
      const spark = document.createElement("span");
      spark.className = "dom-spark";
      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;
      spark.style.background = color;
      spark.style.boxShadow = `0 0 14px ${color}`;
      document.body.appendChild(spark);
      const angle = (i / count) * Math.PI * 2;
      const distance = 26 + Math.random() * 54;
      gsap.to(spark, {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        scale: 0,
        opacity: 0,
        duration: 0.62,
        ease: "power2.out",
        onComplete: () => spark.remove(),
      });
    }
  }

  update(time) {
    this.systems.forEach((system) => system.update(time));
  }
}
