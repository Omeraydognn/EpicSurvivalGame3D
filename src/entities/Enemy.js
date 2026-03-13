import * as THREE from 'three';
import { randomRange, distance2D, clamp } from '../utils/math.js';

export class Enemy {
  constructor(scene, position, type = 'zombie') {
    this.scene = scene;
    this.type = type;
    this.position = position.clone();
    this.velocity = new THREE.Vector3();
    this.alive = true;
    this.alertRange = type === 'skeleton' ? 25 : 18;
    this.attackRange = 2.5;
    this.speed = type === 'skeleton' ? 4 : 3;
    this.damage = type === 'skeleton' ? 12 : 8;
    this.health = type === 'skeleton' ? 40 : 60;
    this.maxHealth = this.health;
    this.attackCooldown = 0;
    this.attackInterval = type === 'skeleton' ? 1.2 : 1.5;
    this.state = 'idle'; // idle, chase, attack, wander
    this.wanderTimer = 0;
    this.wanderDir = new THREE.Vector3();
    this.hitFlash = 0;

    this.createMesh();
  }

  createMesh() {
    this.mesh = new THREE.Group();

    const bodyColor = this.type === 'skeleton' ? 0xccccaa : 0x4a7a3a;
    const eyeColor = this.type === 'skeleton' ? 0xff4444 : 0xff0000;

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.6, 1.0, 0.4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.8 });
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.y = 1.0;
    this.bodyMesh.castShadow = true;
    this.mesh.add(this.bodyMesh);

    // Head
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.7 });
    this.headMesh = new THREE.Mesh(headGeo, headMat);
    this.headMesh.position.y = 1.8;
    this.headMesh.castShadow = true;
    this.mesh.add(this.headMesh);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.1, 0.08, 0.05);
    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.12, 1.82, 0.26);
    this.mesh.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.12, 1.82, 0.26);
    this.mesh.add(rightEye);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    const armMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.8 });

    this.leftArm = new THREE.Mesh(armGeo, armMat);
    this.leftArm.position.set(-0.5, 1.0, 0);
    this.leftArm.castShadow = true;
    this.mesh.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, armMat);
    this.rightArm.position.set(0.5, 1.0, 0);
    this.rightArm.castShadow = true;
    this.mesh.add(this.rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.22, 0.6, 0.22);
    const legMat = new THREE.MeshStandardMaterial({
      color: this.type === 'skeleton' ? 0xaaaaaa : 0x3a5a2a,
      roughness: 0.8,
    });

    this.leftLeg = new THREE.Mesh(legGeo, legMat);
    this.leftLeg.position.set(-0.18, 0.3, 0);
    this.leftLeg.castShadow = true;
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, legMat);
    this.rightLeg.position.set(0.18, 0.3, 0);
    this.rightLeg.castShadow = true;
    this.mesh.add(this.rightLeg);

    // Health bar
    const hbBg = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x333333 })
    );
    hbBg.position.y = 2.3;
    this.mesh.add(hbBg);

    this.healthBarFill = new THREE.Mesh(
      new THREE.PlaneGeometry(0.76, 0.06),
      new THREE.MeshBasicMaterial({ color: 0xff3333 })
    );
    this.healthBarFill.position.y = 2.3;
    this.healthBarFill.position.z = 0.01;
    this.mesh.add(this.healthBarFill);

    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }

  update(deltaTime, playerPos, worldGenerator) {
    if (!this.alive) return;

    const distToPlayer = distance2D(
      this.position.x, this.position.z,
      playerPos.x, playerPos.z
    );

    // State machine
    if (distToPlayer < this.attackRange) {
      this.state = 'attack';
    } else if (distToPlayer < this.alertRange) {
      this.state = 'chase';
    } else {
      this.state = 'wander';
    }

    // Behavior
    const time = performance.now() / 1000;

    switch (this.state) {
      case 'chase': {
        const dir = new THREE.Vector3(
          playerPos.x - this.position.x,
          0,
          playerPos.z - this.position.z
        ).normalize();
        this.velocity.x = dir.x * this.speed;
        this.velocity.z = dir.z * this.speed;

        // Face player
        this.mesh.rotation.y = Math.atan2(dir.x, dir.z);

        // Walking animation
        const walkSpeed = 8;
        this.leftArm.rotation.x = Math.sin(time * walkSpeed) * 0.8;
        this.rightArm.rotation.x = -Math.sin(time * walkSpeed) * 0.8;
        this.leftLeg.rotation.x = -Math.sin(time * walkSpeed) * 0.6;
        this.rightLeg.rotation.x = Math.sin(time * walkSpeed) * 0.6;
        break;
      }
      case 'attack': {
        this.velocity.x = 0;
        this.velocity.z = 0;
        const dir = new THREE.Vector3(
          playerPos.x - this.position.x, 0,
          playerPos.z - this.position.z
        ).normalize();
        this.mesh.rotation.y = Math.atan2(dir.x, dir.z);

        // Attack animation
        this.leftArm.rotation.x = -Math.PI / 3 + Math.sin(time * 10) * 0.3;
        this.rightArm.rotation.x = -Math.PI / 3 + Math.sin(time * 10 + 1) * 0.3;
        break;
      }
      case 'wander': {
        this.wanderTimer -= deltaTime;
        if (this.wanderTimer <= 0) {
          this.wanderTimer = 2 + Math.random() * 3;
          const angle = Math.random() * Math.PI * 2;
          this.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
        }
        this.velocity.x = this.wanderDir.x * this.speed * 0.3;
        this.velocity.z = this.wanderDir.z * this.speed * 0.3;
        this.mesh.rotation.y = Math.atan2(this.wanderDir.x, this.wanderDir.z);

        // Slow walk
        this.leftArm.rotation.x = Math.sin(time * 3) * 0.3;
        this.rightArm.rotation.x = -Math.sin(time * 3) * 0.3;
        this.leftLeg.rotation.x = -Math.sin(time * 3) * 0.2;
        this.rightLeg.rotation.x = Math.sin(time * 3) * 0.2;
        break;
      }
    }

    // Apply movement
    this.position.x += this.velocity.x * deltaTime;
    this.position.z += this.velocity.z * deltaTime;

    // Terrain following
    const h = worldGenerator.getHeightAt(this.position.x, this.position.z);
    if (h < worldGenerator.waterLevel) {
      // Don't go into water, turn around
      this.position.x -= this.velocity.x * deltaTime * 2;
      this.position.z -= this.velocity.z * deltaTime * 2;
      this.wanderTimer = 0;
    } else {
      this.position.y = h;
    }

    // World bounds
    const bound = worldGenerator.worldSize * 0.9;
    this.position.x = clamp(this.position.x, -bound, bound);
    this.position.z = clamp(this.position.z, -bound, bound);

    this.mesh.position.copy(this.position);

    // Attack cooldown
    this.attackCooldown -= deltaTime;

    // Hit flash / Damage impact
    if (this.hitFlash > 0) {
      this.hitFlash -= deltaTime;
      const flashColor = this.hitFlash > 0 ? 0xcc0000 : 0x000000;
      this.bodyMesh.material.emissive.setHex(flashColor);
      this.headMesh.material.emissive.setHex(flashColor);
      this.leftArm.material.emissive.setHex(flashColor);
      this.rightArm.material.emissive.setHex(flashColor);
      this.leftLeg.material.emissive.setHex(flashColor);
      this.rightLeg.material.emissive.setHex(flashColor);

      // Knockback / Stagger visual
      this.mesh.rotation.z = Math.sin(this.hitFlash * 20) * 0.1;
    } else {
      this.mesh.rotation.z = 0;
    }

    // Health bar
    const hpRatio = this.health / this.maxHealth;
    this.healthBarFill.scale.x = hpRatio;
    this.healthBarFill.position.x = -(1 - hpRatio) * 0.38;

    // Health bar face camera
    this.healthBarFill.parent.children.forEach(c => {
      if (c.geometry && c.geometry.type === 'PlaneGeometry') {
        c.lookAt(playerPos.x, c.getWorldPosition(new THREE.Vector3()).y, playerPos.z);
      }
    });
  }

  canAttack() {
    return this.state === 'attack' && this.attackCooldown <= 0 && this.alive;
  }

  performAttack() {
    this.attackCooldown = this.attackInterval;
    return this.damage;
  }

  takeDamage(amount) {
    this.health -= amount;
    this.hitFlash = 0.15;
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.alive = false;
    // Death animation - fall over
    const fallAnim = () => {
      if (this.mesh.rotation.x > -Math.PI / 2) {
        this.mesh.rotation.x -= 0.1;
        requestAnimationFrame(fallAnim);
      } else {
        setTimeout(() => {
          this.scene.remove(this.mesh);
        }, 2000);
      }
    };
    fallAnim();
  }
}

export class EnemyManager {
  constructor(scene, worldGenerator) {
    this.scene = scene;
    this.world = worldGenerator;
    this.enemies = [];
    this.maxEnemies = 25;
    this.spawnTimer = 0;
    this.spawnInterval = 8;
    this.waveMultiplier = 1;
  }

  spawnEnemy(playerPos, dayNight) {
    if (this.enemies.filter(e => e.alive).length >= this.maxEnemies) return;

    // Spawn at distance from player
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 40;
    const x = playerPos.x + Math.cos(angle) * dist;
    const z = playerPos.z + Math.sin(angle) * dist;
    const h = this.world.getHeightAt(x, z);

    if (h < this.world.waterLevel + 1) return;

    // Don't spawn enemies near village
    const villageX = 60, villageZ = 60;
    const distToVillage = Math.sqrt((x - villageX) ** 2 + (z - villageZ) ** 2);
    if (distToVillage < 40) return;

    // More skeletons at night
    const isNight = dayNight && dayNight.isNight;
    const type = isNight ? (Math.random() < 0.5 ? 'skeleton' : 'zombie') : 'zombie';

    const enemy = new Enemy(this.scene, new THREE.Vector3(x, h, z), type);
    this.enemies.push(enemy);
  }

  update(deltaTime, playerPos, worldGenerator, dayNight) {
    // Spawn timer
    this.spawnTimer += deltaTime;
    const interval = dayNight && dayNight.isNight ? this.spawnInterval * 0.4 : this.spawnInterval;

    if (this.spawnTimer >= interval) {
      this.spawnTimer = 0;
      this.spawnEnemy(playerPos, dayNight);
      // Spawn extra at night
      if (dayNight && dayNight.isNight) {
        this.spawnEnemy(playerPos, dayNight);
      }
    }

    // Update enemies
    this.enemies.forEach(e => e.update(deltaTime, playerPos, worldGenerator));

    // Clean up dead enemies after a while
    this.enemies = this.enemies.filter(e => e.alive || e.mesh.parent);
  }

  getAliveEnemies() {
    return this.enemies.filter(e => e.alive);
  }

  reset() {
    this.enemies.forEach(e => {
      if (e.mesh.parent) this.scene.remove(e.mesh);
    });
    this.enemies = [];
    this.spawnTimer = 0;
  }
}
