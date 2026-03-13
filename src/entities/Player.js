import * as THREE from 'three';
import { clamp } from '../utils/math.js';

export class Player {
  constructor(camera, scene, worldGenerator) {
    this.camera = camera;
    this.scene = scene;
    this.world = worldGenerator;

    // Position & movement
    this.position = new THREE.Vector3(0, 5, 0);
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.moveSpeed = 6;
    this.sprintSpeed = 12;
    this.jumpForce = 8;
    this.gravity = -20;
    this.isGrounded = false;
    this.isSprinting = false;
    this.height = 1.7;

    // Look
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.mouseSensitivity = 0.002;

    // Stats
    this.health = 100;
    this.maxHealth = 100;
    this.hunger = 100;
    this.maxHunger = 100;
    this.thirst = 100;
    this.maxThirst = 100;
    this.stamina = 100;
    this.maxStamina = 100;
    this.score = 0;
    this.alive = true;

    // Combat
    this.attackCooldown = 0;
    this.attackRange = 3;
    this.attackDamage = 25;
    this.isAttacking = false;
    this.attackTimer = 0;

    // Interaction
    this.interactionRange = 4;

    // Oxygen / Breath system
    this.oxygen = 100;
    this.maxOxygen = 100;
    this.isUnderwater = false;
    this.isSwimming = false;

    // Vehicle
    this.isInVehicle = false;
    this.currentVehicle = null;

    // Input
    this.keys = {};
    this.mouseDown = false;

    // Footstep timer
    this.footstepTimer = 0;
    this.footstepInterval = 0.4;

    // Weapon arm
    this.createArm();

    this.setupInput();
  }

  createArm() {
    // Simple arm/weapon model
    const armGroup = new THREE.Group();

    // Arm
    const armGeo = new THREE.BoxGeometry(0.12, 0.12, 0.5);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xddaa77, roughness: 0.8 });
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(0, -0.05, -0.25);
    armGroup.add(arm);

    // Tool/weapon head
    const toolGeo = new THREE.BoxGeometry(0.2, 0.25, 0.08);
    const toolMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.6 });
    const tool = new THREE.Mesh(toolGeo, toolMat);
    tool.position.set(0, 0.08, -0.48);
    armGroup.add(tool);

    armGroup.position.set(0.35, -0.35, -0.5);
    this.arm = armGroup;
    this.camera.add(armGroup);
    this.armDefaultPos = armGroup.position.clone();
  }

  setupInput() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });
    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
    document.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouseDown = true;
    });
    document.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseDown = false;
    });
  }

  onMouseMove(e) {
    if (this.isInVehicle) return; // Vehicle handles rotation differently
    this.euler.setFromQuaternion(this.camera.quaternion);
    this.euler.y -= e.movementX * this.mouseSensitivity;
    this.euler.x -= e.movementY * this.mouseSensitivity;
    this.euler.x = clamp(this.euler.x, -Math.PI / 2.2, Math.PI / 2.2);
    this.camera.quaternion.setFromEuler(this.euler);
  }

  applyLevelBonuses(levelSystem) {
    this.maxHealth = 100 + levelSystem.getMaxHealthBonus();
    this.maxHunger = 100 + levelSystem.getMaxHungerBonus();
    this.maxThirst = 100 + levelSystem.getMaxThirstBonus();
    this.moveSpeed = 6 + levelSystem.getSpeedBonus();
    this.sprintSpeed = 12 + levelSystem.getSpeedBonus();
  }

  update(deltaTime, audioManager, levelSystem, armorDefense = 0) {
    if (!this.alive) return;

    // If in vehicle, skip normal movement
    if (this.isInVehicle && this.currentVehicle) {
      this.position.copy(this.currentVehicle.position);
      this.position.y += 1.5;
      this.camera.position.copy(this.position);
      // Hide arm
      this.arm.visible = false;
      return;
    }

    this.arm.visible = true;

    // Apply level bonuses
    if (levelSystem) {
      this.applyLevelBonuses(levelSystem);
    }

    // Movement
    const speed = this.isSprinting ? this.sprintSpeed : this.moveSpeed;
    this.isSprinting = this.keys['ShiftLeft'] || this.keys['ShiftRight'];

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    this.direction.set(0, 0, 0);
    if (this.keys['KeyW']) this.direction.add(forward);
    if (this.keys['KeyS']) this.direction.sub(forward);
    if (this.keys['KeyA']) this.direction.sub(right);
    if (this.keys['KeyD']) this.direction.add(right);

    if (this.direction.length() > 0) {
      this.direction.normalize();
      this.velocity.x = this.direction.x * speed;
      this.velocity.z = this.direction.z * speed;

      // Footsteps
      this.footstepTimer += deltaTime;
      if (this.footstepTimer >= (this.isSprinting ? 0.25 : this.footstepInterval) && this.isGrounded) {
        this.footstepTimer = 0;
        if (audioManager) audioManager.playFootstep();
      }

      // Sprint uses hunger and stamina
      if (this.isSprinting) {
        this.hunger -= deltaTime * 0.5;
        this.stamina -= deltaTime * 15;
        if (this.stamina <= 0) {
          this.isSprinting = false;
          this.stamina = 0;
        }
      }
    } else {
      this.velocity.x *= 0.85;
      this.velocity.z *= 0.85;
    }

    // Stamina recovery
    if (!this.isSprinting) {
      this.stamina = Math.min(this.maxStamina, this.stamina + deltaTime * 20);
    }

    // Jump
    if ((this.keys['Space']) && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
      if (audioManager) audioManager.playJump();
    }

    // Gravity
    this.velocity.y += this.gravity * deltaTime;

    // Apply velocity
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;

    // Terrain collision
    const terrainH = this.world.getHeightAt(this.position.x, this.position.z);
    if (this.position.y <= terrainH + this.height) {
      this.position.y = terrainH + this.height;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // Water / Swimming / Breath system
    const waterSurface = this.world.waterLevel + 0.3;
    this.isSwimming = this.position.y - this.height < waterSurface + 0.5 && 
                      this.position.y - this.height > this.world.waterLevel - 2;
    this.isUnderwater = this.position.y - this.height < this.world.waterLevel - 0.5;

    if (this.isUnderwater) {
      // Underwater - drain oxygen
      this.oxygen -= deltaTime * 8; // ~12.5 saniye nefes
      if (this.oxygen <= 0) {
        this.oxygen = 0;
        // No breath = take damage
        this.takeDamage(deltaTime * 10, armorDefense);
      }
      // Slow movement underwater
      this.velocity.x *= 0.7;
      this.velocity.z *= 0.7;
    } else if (this.isSwimming) {
      // Swimming on surface - recover oxygen, no damage
      this.oxygen = Math.min(this.maxOxygen, this.oxygen + deltaTime * 25);
      // Swimming movement
      this.velocity.y = Math.max(this.velocity.y, -2); // Don't sink fast
      if (this.keys['Space']) {
        this.velocity.y = 3; // Swim up
      }
    } else {
      // On land - full oxygen recovery
      this.oxygen = Math.min(this.maxOxygen, this.oxygen + deltaTime * 40);
    }

    // World bounds
    const bound = this.world.worldSize * 0.95;
    this.position.x = clamp(this.position.x, -bound, bound);
    this.position.z = clamp(this.position.z, -bound, bound);

    // Update camera
    this.camera.position.copy(this.position);

    // Head bob when moving
    if (this.direction.length() > 0 && this.isGrounded) {
      const bobSpeed = this.isSprinting ? 12 : 8;
      const bobAmount = this.isSprinting ? 0.06 : 0.03;
      this.camera.position.y += Math.sin(performance.now() / 1000 * bobSpeed) * bobAmount;
    }

    // Attack cooldown
    if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;

    // Attack animation
    if (this.isAttacking) {
      this.attackTimer += deltaTime * 8;
      const swingAngle = Math.sin(this.attackTimer * Math.PI) * 0.8;
      this.arm.rotation.x = -swingAngle;
      this.arm.position.z = this.armDefaultPos.z - Math.sin(this.attackTimer * Math.PI) * 0.2;

      if (this.attackTimer >= 1) {
        this.isAttacking = false;
        this.attackTimer = 0;
        this.arm.rotation.x = 0;
        this.arm.position.copy(this.armDefaultPos);
      }
    } else {
      // Idle arm sway
      const t = performance.now() / 1000;
      this.arm.position.y = this.armDefaultPos.y + Math.sin(t * 2) * 0.01;
    }

    // Survival stats drain (modified by level)
    const drainMult = levelSystem ? levelSystem.getHungerDrainMult() : 1;
    this.hunger -= deltaTime * 0.15 * drainMult;
    this.thirst -= deltaTime * 0.2 * drainMult;

    if (this.hunger <= 0) {
      this.hunger = 0;
      this.takeDamage(deltaTime * 3, armorDefense);
    }
    if (this.thirst <= 0) {
      this.thirst = 0;
      this.takeDamage(deltaTime * 4, armorDefense);
    }

    // Clamp stats
    this.health = clamp(this.health, 0, this.maxHealth);
    this.hunger = clamp(this.hunger, 0, this.maxHunger);
    this.thirst = clamp(this.thirst, 0, this.maxThirst);
    this.stamina = clamp(this.stamina, 0, this.maxStamina);

    if (this.health <= 0 && this.alive) {
      this.die(audioManager);
    }
  }

  attack() {
    if (this.attackCooldown > 0 || this.isAttacking || this.isInVehicle) return false;
    this.isAttacking = true;
    this.attackTimer = 0;
    this.attackCooldown = 0.5;
    return true;
  }

  takeDamage(amount, armorDefense = 0) {
    // Armor reduces damage
    const reduction = armorDefense / 100;
    const finalDamage = amount * (1 - reduction);
    this.health -= finalDamage;

    // Flash damage overlay
    const overlay = document.getElementById('damage-overlay');
    if (overlay) {
      overlay.classList.add('active');
      setTimeout(() => overlay.classList.remove('active'), 150);
    }
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  eat(amount) {
    this.hunger = Math.min(this.maxHunger, this.hunger + amount);
  }

  drink(amount) {
    this.thirst = Math.min(this.maxThirst, this.thirst + amount);
  }

  addScore(points) {
    this.score += points;
  }

  die(audioManager) {
    this.alive = false;
    if (audioManager) audioManager.playDeath();
  }

  reset() {
    this.position.set(0, 5, 0);
    this.velocity.set(0, 0, 0);
    this.health = this.maxHealth;
    this.hunger = this.maxHunger;
    this.thirst = this.maxThirst;
    this.stamina = this.maxStamina;
    this.oxygen = this.maxOxygen;
    this.isUnderwater = false;
    this.isSwimming = false;
    this.score = 0;
    this.alive = true;
    this.attackCooldown = 0;
    this.isAttacking = false;
    this.isInVehicle = false;
    this.currentVehicle = null;
  }

  getForward() {
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    return forward;
  }

  getRaycast() {
    return new THREE.Raycaster(this.camera.position.clone(), this.getForward(), 0, this.interactionRange);
  }
}
