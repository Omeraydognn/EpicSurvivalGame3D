import * as THREE from 'three';
import { randomRange, clamp } from '../utils/math.js';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
  }

  emit(position, options = {}) {
    const {
      count = 10,
      color = 0xffffff,
      size = 0.15,
      speed = 3,
      lifetime = 1,
      gravity = -5,
      spread = 1,
      colors = null,
    } = options;

    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(size * (0.5 + Math.random() * 0.5), 4, 4);
      const c = colors ? colors[Math.floor(Math.random() * colors.length)] : color;
      const mat = new THREE.MeshBasicMaterial({
        color: c,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);
      mesh.position.x += (Math.random() - 0.5) * 0.5;
      mesh.position.y += Math.random() * 0.5;
      mesh.position.z += (Math.random() - 0.5) * 0.5;

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * speed * spread,
        Math.random() * speed,
        (Math.random() - 0.5) * speed * spread
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        gravity,
        lifetime,
        age: 0,
        maxAge: lifetime,
      });
    }
  }

  emitHit(position) {
    this.emit(position, {
      count: 8,
      color: 0xffaa00,
      size: 0.1,
      speed: 4,
      lifetime: 0.5,
      gravity: -8,
    });
  }

  emitWoodChips(position) {
    this.emit(position, {
      count: 12,
      colors: [0x8B4513, 0xA0522D, 0xD2B48C, 0xDEB887],
      size: 0.08,
      speed: 3,
      lifetime: 0.8,
      gravity: -6,
    });
  }

  emitStoneChips(position) {
    this.emit(position, {
      count: 10,
      colors: [0x888888, 0x666666, 0xaaaaaa, 0x999999],
      size: 0.07,
      speed: 4,
      lifetime: 0.6,
      gravity: -8,
    });
  }

  emitBlood(position) {
    this.emit(position, {
      count: 6,
      colors: [0xcc0000, 0x880000, 0xff0000],
      size: 0.06,
      speed: 2,
      lifetime: 0.7,
      gravity: -6,
    });
  }

  emitCollect(position) {
    this.emit(position, {
      count: 15,
      colors: [0xffd700, 0xffea00, 0xffff44],
      size: 0.08,
      speed: 2,
      lifetime: 1,
      gravity: -2,
      spread: 0.5,
    });
  }

  emitLevelUp(position) {
    this.emit(position, {
      count: 30,
      colors: [0xffd700, 0x00ff88, 0x44ffff, 0xff44ff],
      size: 0.12,
      speed: 5,
      lifetime: 1.5,
      gravity: -1,
      spread: 2,
    });
  }

  emitFire(position) {
    this.emit(position, {
      count: 3,
      colors: [0xff4400, 0xff6600, 0xffaa00, 0xff2200],
      size: 0.1,
      speed: 1.5,
      lifetime: 0.6,
      gravity: 3, // Fire goes up
      spread: 0.3,
    });
  }

  update(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += deltaTime;

      if (p.age >= p.maxAge) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      const t = p.age / p.maxAge;
      p.velocity.y += p.gravity * deltaTime;
      p.mesh.position.add(p.velocity.clone().multiplyScalar(deltaTime));
      p.mesh.material.opacity = 1 - t;
      p.mesh.scale.setScalar(1 - t * 0.5);
    }
  }
}
