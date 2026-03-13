// ===== NPC & HAYVAN SİSTEMİ =====
import * as THREE from 'three';
import { randomRange, distance2D, clamp } from '../utils/math.js';

// NPC Types
const NPC_DEFS = {
  trader: {
    name: 'Tüccar',
    color: 0x4444cc,
    icon: '🧑‍💼',
    speed: 1.5,
    health: 100,
    friendly: true,
    trades: [
      { give: 'wood', giveAmount: 10, receive: 'stone_sword', receiveAmount: 1 },
      { give: 'stone', giveAmount: 8, receive: 'bandage', receiveAmount: 3 },
      { give: 'wood', giveAmount: 15, receive: 'iron_ingot', receiveAmount: 2 },
      { give: 'stone', giveAmount: 20, receive: 'iron_pickaxe', receiveAmount: 1 },
      { give: 'iron_ore', giveAmount: 5, receive: 'iron_sword', receiveAmount: 1 },
      { give: 'gold_ore', giveAmount: 3, receive: 'iron_armor', receiveAmount: 1 },
      { give: 'leather', giveAmount: 6, receive: 'leather_armor', receiveAmount: 1 },
    ],
  },
  villager: {
    name: 'Köylü',
    color: 0xcc8844,
    icon: '👨‍🌾',
    speed: 1.2,
    health: 60,
    friendly: true,
    trades: [
      { give: 'berry', giveAmount: 5, receive: 'cooked_meat', receiveAmount: 2 },
      { give: 'wood', giveAmount: 5, receive: 'water_bottle', receiveAmount: 2 },
      { give: 'fiber', giveAmount: 8, receive: 'bandage', receiveAmount: 3 },
      { give: 'mushroom', giveAmount: 5, receive: 'medkit', receiveAmount: 1 },
    ],
  },
};

// Animal Types
const ANIMAL_DEFS = {
  chicken: {
    name: 'Tavuk',
    color: 0xeeeeee,
    icon: '🐔',
    speed: 2,
    health: 10,
    hostile: false,
    drops: [{ item: 'meat', amount: 1, chance: 1 }],
    bodyScale: 0.4,
    fleeRange: 8,
  },
  cow: {
    name: 'İnek',
    color: 0x8B4513,
    icon: '🐄',
    speed: 2.5,
    health: 40,
    hostile: false,
    drops: [
      { item: 'meat', amount: 3, chance: 1 },
      { item: 'leather', amount: 2, chance: 0.8 },
    ],
    bodyScale: 1.0,
    fleeRange: 10,
  },
  wolf: {
    name: 'Kurt',
    color: 0x666666,
    icon: '🐺',
    speed: 6,
    health: 50,
    hostile: true,
    damage: 10,
    attackRange: 2,
    alertRange: 20,
    attackInterval: 1.5,
    drops: [
      { item: 'meat', amount: 2, chance: 1 },
      { item: 'leather', amount: 1, chance: 0.5 },
    ],
    bodyScale: 0.7,
  },
  bear: {
    name: 'Ayı',
    color: 0x553322,
    icon: '🐻',
    speed: 5,
    health: 120,
    hostile: true,
    damage: 20,
    attackRange: 3,
    alertRange: 15,
    attackInterval: 2,
    drops: [
      { item: 'meat', amount: 5, chance: 1 },
      { item: 'leather', amount: 3, chance: 1 },
    ],
    bodyScale: 1.3,
  },
  deer: {
    name: 'Geyik',
    color: 0xBB8844,
    icon: '🦌',
    speed: 8,
    health: 30,
    hostile: false,
    drops: [
      { item: 'meat', amount: 2, chance: 1 },
      { item: 'leather', amount: 1, chance: 0.7 },
    ],
    bodyScale: 0.9,
    fleeRange: 18,
  },
};

export { NPC_DEFS, ANIMAL_DEFS };

// ===== NPC CLASS =====
export class NPC {
  constructor(scene, position, type = 'trader') {
    this.scene = scene;
    this.type = type;
    this.def = NPC_DEFS[type];
    this.position = position.clone();
    this.alive = true;
    this.homePosition = position.clone();
    this.wanderTimer = 0;
    this.wanderDir = new THREE.Vector3();
    this.interacting = false;

    this.createMesh();
  }

  createMesh() {
    this.mesh = new THREE.Group();

    const color = this.def.color;

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.6, 1.0, 0.4);
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.0;
    body.castShadow = true;
    this.mesh.add(body);

    // Head
    const headGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xddaa77, roughness: 0.6 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.75;
    head.castShadow = true;
    this.mesh.add(head);

    // Hat (trader) or straw hat (villager)
    if (this.type === 'trader') {
      const hatGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.4, 8);
      const hatMat = new THREE.MeshStandardMaterial({ color: 0x222244 });
      const hat = new THREE.Mesh(hatGeo, hatMat);
      hat.position.y = 2.15;
      this.mesh.add(hat);
    } else {
      const hatGeo = new THREE.ConeGeometry(0.35, 0.3, 8);
      const hatMat = new THREE.MeshStandardMaterial({ color: 0xaaaa44 });
      const hat = new THREE.Mesh(hatGeo, hatMat);
      hat.position.y = 2.1;
      this.mesh.add(hat);
    }

    // Arms
    const armGeo = new THREE.BoxGeometry(0.18, 0.6, 0.18);
    const armMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
    this.leftArm = new THREE.Mesh(armGeo, armMat);
    this.leftArm.position.set(-0.48, 1.0, 0);
    this.mesh.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, armMat);
    this.rightArm.position.set(0.48, 1.0, 0);
    this.mesh.add(this.rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.5, 0.2);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    this.leftLeg = new THREE.Mesh(legGeo, legMat);
    this.leftLeg.position.set(-0.16, 0.25, 0);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, legMat);
    this.rightLeg.position.set(0.16, 0.25, 0);
    this.mesh.add(this.rightLeg);

    // Name label (using sprite)
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.def.icon} ${this.def.name}`, 128, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.y = 2.6;
    sprite.scale.set(2, 0.5, 1);
    this.mesh.add(sprite);

    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }

  update(deltaTime, playerPos, worldGenerator) {
    if (!this.alive) return;

    // Wander near home
    this.wanderTimer -= deltaTime;
    if (this.wanderTimer <= 0) {
      this.wanderTimer = 3 + Math.random() * 5;
      const angle = Math.random() * Math.PI * 2;
      this.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));

      // Stay near home
      const distFromHome = distance2D(this.position.x, this.position.z, this.homePosition.x, this.homePosition.z);
      if (distFromHome > 15) {
        this.wanderDir.set(
          this.homePosition.x - this.position.x,
          0,
          this.homePosition.z - this.position.z
        ).normalize();
      }
    }

    // Face player when nearby
    const distToPlayer = distance2D(this.position.x, this.position.z, playerPos.x, playerPos.z);
    if (distToPlayer < 5) {
      const dir = new THREE.Vector3(playerPos.x - this.position.x, 0, playerPos.z - this.position.z).normalize();
      this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
    } else {
      // Move
      this.position.x += this.wanderDir.x * this.def.speed * 0.3 * deltaTime;
      this.position.z += this.wanderDir.z * this.def.speed * 0.3 * deltaTime;
      this.mesh.rotation.y = Math.atan2(this.wanderDir.x, this.wanderDir.z);

      // Walk animation
      const t = performance.now() / 1000;
      this.leftArm.rotation.x = Math.sin(t * 3) * 0.3;
      this.rightArm.rotation.x = -Math.sin(t * 3) * 0.3;
      this.leftLeg.rotation.x = -Math.sin(t * 3) * 0.2;
      this.rightLeg.rotation.x = Math.sin(t * 3) * 0.2;
    }

    // Terrain
    const h = worldGenerator.getHeightAt(this.position.x, this.position.z);
    this.position.y = h;
    this.mesh.position.copy(this.position);
  }
}

// ===== ANIMAL CLASS =====
export class Animal {
  constructor(scene, position, type = 'chicken') {
    this.scene = scene;
    this.type = type;
    this.def = ANIMAL_DEFS[type];
    this.position = position.clone();
    this.velocity = new THREE.Vector3();
    this.alive = true;
    this.health = this.def.health;
    this.maxHealth = this.def.health;
    this.state = 'idle'; // idle, wander, flee, chase, attack
    this.wanderTimer = 0;
    this.wanderDir = new THREE.Vector3();
    this.attackCooldown = 0;
    this.hitFlash = 0;

    this.createMesh();
  }

  createMesh() {
    this.mesh = new THREE.Group();
    const s = this.def.bodyScale;
    const color = this.def.color;

    // Simple body
    const bodyGeo = new THREE.BoxGeometry(0.5 * s, 0.4 * s, 0.8 * s);
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.y = 0.5 * s;
    this.bodyMesh.castShadow = true;
    this.mesh.add(this.bodyMesh);

    // Head
    const headGeo = new THREE.BoxGeometry(0.3 * s, 0.3 * s, 0.3 * s);
    const headMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
    this.headMesh = new THREE.Mesh(headGeo, headMat);
    this.headMesh.position.set(0, 0.6 * s, 0.5 * s);
    this.headMesh.castShadow = true;
    this.mesh.add(this.headMesh);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.03 * s, 6, 6);
    const eyeColor = this.def.hostile ? 0xff3333 : 0x222222;
    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
    [-0.1, 0.1].forEach(x => {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(x * s, 0.65 * s, 0.65 * s);
      this.mesh.add(eye);
    });

    // Legs
    const legGeo = new THREE.BoxGeometry(0.1 * s, 0.35 * s, 0.1 * s);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    this.legs = [];
    [[-0.15, 0.3], [0.15, 0.3], [-0.15, -0.3], [0.15, -0.3]].forEach(([x, z]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x * s, 0.17 * s, z * s);
      leg.castShadow = true;
      this.mesh.add(leg);
      this.legs.push(leg);
    });

    // Tail (for some animals)
    if (this.type === 'wolf' || this.type === 'deer') {
      const tailGeo = new THREE.BoxGeometry(0.08 * s, 0.08 * s, 0.3 * s);
      const tailMat = new THREE.MeshStandardMaterial({ color });
      const tail = new THREE.Mesh(tailGeo, tailMat);
      tail.position.set(0, 0.55 * s, -0.55 * s);
      tail.rotation.x = 0.5;
      this.mesh.add(tail);
    }

    // Antlers for deer
    if (this.type === 'deer') {
      const antlerGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.4, 4);
      const antlerMat = new THREE.MeshStandardMaterial({ color: 0x8B6914 });
      [-0.1, 0.1].forEach(x => {
        const antler = new THREE.Mesh(antlerGeo, antlerMat);
        antler.position.set(x * s, 0.85 * s, 0.4 * s);
        antler.rotation.z = x > 0 ? -0.3 : 0.3;
        this.mesh.add(antler);
      });
    }

    // Health bar
    const hbBg = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6 * s, 0.06),
      new THREE.MeshBasicMaterial({ color: 0x333333 })
    );
    hbBg.position.y = 1.0 * s;
    this.mesh.add(hbBg);

    this.healthBarFill = new THREE.Mesh(
      new THREE.PlaneGeometry(0.56 * s, 0.04),
      new THREE.MeshBasicMaterial({ color: this.def.hostile ? 0xff3333 : 0x33ff33 })
    );
    this.healthBarFill.position.y = 1.0 * s;
    this.healthBarFill.position.z = 0.01;
    this.mesh.add(this.healthBarFill);

    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }

  update(deltaTime, playerPos, worldGenerator) {
    if (!this.alive) return;

    const distToPlayer = distance2D(this.position.x, this.position.z, playerPos.x, playerPos.z);
    const time = performance.now() / 1000;

    // State machine
    if (this.def.hostile) {
      if (distToPlayer < (this.def.attackRange || 2)) {
        this.state = 'attack';
      } else if (distToPlayer < (this.def.alertRange || 15)) {
        this.state = 'chase';
      } else {
        this.state = 'wander';
      }
    } else {
      if (this.state === 'flee') {
        if (distToPlayer > (this.def.fleeRange || 15)) {
          this.state = 'wander';
        }
      } else if (distToPlayer < (this.def.fleeRange || 8) * 0.5) {
        this.state = 'flee';
      } else {
        this.state = 'wander';
      }
    }

    switch (this.state) {
      case 'chase': {
        const dir = new THREE.Vector3(
          playerPos.x - this.position.x, 0, playerPos.z - this.position.z
        ).normalize();
        this.velocity.x = dir.x * this.def.speed;
        this.velocity.z = dir.z * this.def.speed;
        this.mesh.rotation.y = Math.atan2(dir.x, dir.z);

        const ws = 8;
        this.legs.forEach((leg, i) => {
          leg.rotation.x = Math.sin(time * ws + i * Math.PI * 0.5) * 0.6;
        });
        break;
      }
      case 'attack': {
        this.velocity.x = 0;
        this.velocity.z = 0;
        const dir = new THREE.Vector3(
          playerPos.x - this.position.x, 0, playerPos.z - this.position.z
        ).normalize();
        this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
        break;
      }
      case 'flee': {
        const dir = new THREE.Vector3(
          this.position.x - playerPos.x, 0, this.position.z - playerPos.z
        ).normalize();
        this.velocity.x = dir.x * this.def.speed * 1.5;
        this.velocity.z = dir.z * this.def.speed * 1.5;
        this.mesh.rotation.y = Math.atan2(dir.x, dir.z);

        this.legs.forEach((leg, i) => {
          leg.rotation.x = Math.sin(time * 12 + i * Math.PI * 0.5) * 0.8;
        });
        break;
      }
      case 'wander': {
        this.wanderTimer -= deltaTime;
        if (this.wanderTimer <= 0) {
          this.wanderTimer = 2 + Math.random() * 4;
          const angle = Math.random() * Math.PI * 2;
          this.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
        }
        this.velocity.x = this.wanderDir.x * this.def.speed * 0.2;
        this.velocity.z = this.wanderDir.z * this.def.speed * 0.2;
        this.mesh.rotation.y = Math.atan2(this.wanderDir.x, this.wanderDir.z);

        this.legs.forEach((leg, i) => {
          leg.rotation.x = Math.sin(time * 3 + i * Math.PI * 0.5) * 0.2;
        });
        break;
      }
    }

    // Apply movement
    this.position.x += this.velocity.x * deltaTime;
    this.position.z += this.velocity.z * deltaTime;

    // Terrain
    const h = worldGenerator.getHeightAt(this.position.x, this.position.z);
    if (h < worldGenerator.waterLevel) {
      this.position.x -= this.velocity.x * deltaTime * 2;
      this.position.z -= this.velocity.z * deltaTime * 2;
      this.wanderTimer = 0;
    } else {
      this.position.y = h;
    }

    // World bounds
    const bound = worldGenerator.worldSize * 0.85;
    this.position.x = clamp(this.position.x, -bound, bound);
    this.position.z = clamp(this.position.z, -bound, bound);

    this.mesh.position.copy(this.position);

    // Attack cooldown
    if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;

    // Hit flash
    if (this.hitFlash > 0) {
      this.hitFlash -= deltaTime;
      const emissive = this.hitFlash > 0 ? 0xff0000 : 0x000000;
      this.bodyMesh.material.emissive.setHex(emissive);
      this.headMesh.material.emissive.setHex(emissive);
    }

    // Health bar
    const hpRatio = this.health / this.maxHealth;
    this.healthBarFill.scale.x = hpRatio;
    this.healthBarFill.position.x = -(1 - hpRatio) * 0.28 * this.def.bodyScale;

    // Face health bar to camera
    this.healthBarFill.parent.children.forEach(c => {
      if (c.geometry && c.geometry.type === 'PlaneGeometry') {
        c.lookAt(playerPos.x, c.getWorldPosition(new THREE.Vector3()).y, playerPos.z);
      }
    });
  }

  canAttack() {
    return this.def.hostile && this.state === 'attack' && this.attackCooldown <= 0 && this.alive;
  }

  performAttack() {
    this.attackCooldown = this.def.attackInterval || 1.5;
    return this.def.damage || 5;
  }

  takeDamage(amount) {
    this.health -= amount;
    this.hitFlash = 0.15;
    if (!this.def.hostile) {
      this.state = 'flee';
    }
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.alive = false;
    const fallAnim = () => {
      if (this.mesh.rotation.x > -Math.PI / 2) {
        this.mesh.rotation.x -= 0.15;
        requestAnimationFrame(fallAnim);
      } else {
        setTimeout(() => { this.scene.remove(this.mesh); }, 3000);
      }
    };
    fallAnim();
  }

  getDrops() {
    const drops = [];
    if (this.def.drops) {
      this.def.drops.forEach(d => {
        if (Math.random() < d.chance) {
          drops.push({ item: d.item, amount: d.amount });
        }
      });
    }
    return drops;
  }
}

// ===== NPC MANAGER =====
export class NPCManager {
  constructor(scene, worldGenerator) {
    this.scene = scene;
    this.world = worldGenerator;
    this.npcs = [];
    this.animals = [];
    this.maxAnimals = 30;
  }

  spawnInitialNPCs() {
    // Spawn traders in village market area
    const villageX = 60, villageZ = 60;
    const traderPositions = [
      new THREE.Vector3(villageX - 4, 0, villageZ - 5),
      new THREE.Vector3(villageX + 4, 0, villageZ - 5),
    ];

    traderPositions.forEach(pos => {
      const h = this.world.getHeightAt(pos.x, pos.z);
      if (h > this.world.waterLevel + 1) {
        pos.y = h;
        this.npcs.push(new NPC(this.scene, pos, 'trader'));
      }
    });

    // Spawn villagers around village
    const villagerPositions = [
      new THREE.Vector3(villageX - 15, 0, villageZ - 10),
      new THREE.Vector3(villageX + 15, 0, villageZ + 10),
      new THREE.Vector3(villageX - 8, 0, villageZ + 8),
      new THREE.Vector3(villageX + 8, 0, villageZ - 8),
    ];

    villagerPositions.forEach(pos => {
      const h = this.world.getHeightAt(pos.x, pos.z);
      if (h > this.world.waterLevel + 1) {
        pos.y = h;
        this.npcs.push(new NPC(this.scene, pos, 'villager'));
      }
    });
  }

  spawnAnimals() {
    const types = ['chicken', 'cow', 'wolf', 'bear', 'deer'];
    const counts = { chicken: 12, cow: 8, deer: 10, wolf: 6, bear: 3 };

    types.forEach(type => {
      const count = counts[type] || 3;
      for (let i = 0; i < count; i++) {
        const x = randomRange(-this.world.worldSize * 0.7, this.world.worldSize * 0.7);
        const z = randomRange(-this.world.worldSize * 0.7, this.world.worldSize * 0.7);
        const h = this.world.getHeightAt(x, z);

        if (h < this.world.waterLevel + 1 || h > 20) continue;

        // Bears and wolves spawn farther from center
        const distFromCenter = Math.sqrt(x * x + z * z);
        if ((type === 'bear' || type === 'wolf') && distFromCenter < 40) continue;

        const animal = new Animal(this.scene, new THREE.Vector3(x, h, z), type);
        this.animals.push(animal);
      }
    });
  }

  update(deltaTime, playerPos, worldGenerator) {
    this.npcs.forEach(npc => npc.update(deltaTime, playerPos, worldGenerator));
    this.animals.forEach(animal => animal.update(deltaTime, playerPos, worldGenerator));
  }

  getAliveAnimals() {
    return this.animals.filter(a => a.alive);
  }

  getHostileAnimals() {
    return this.animals.filter(a => a.alive && a.def.hostile);
  }

  getNearbyNPC(playerPos, range = 4) {
    let closest = null;
    let closestDist = range;

    for (const npc of this.npcs) {
      if (!npc.alive) continue;
      const dist = distance2D(playerPos.x, playerPos.z, npc.position.x, npc.position.z);
      if (dist < closestDist) {
        closestDist = dist;
        closest = npc;
      }
    }
    return closest;
  }

  reset() {
    this.npcs.forEach(npc => { if (npc.mesh.parent) this.scene.remove(npc.mesh); });
    this.animals.forEach(animal => { if (animal.mesh.parent) this.scene.remove(animal.mesh); });
    this.npcs = [];
    this.animals = [];
  }
}
