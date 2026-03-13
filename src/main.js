import * as THREE from 'three';
import './style.css';

import { WorldGenerator } from './world/WorldGenerator.js';
import { DayNightCycle } from './world/DayNightCycle.js';
import { ParticleSystem } from './world/ParticleSystem.js';
import { Player } from './entities/Player.js';
import { EnemyManager } from './entities/Enemy.js';
import { NPCManager } from './entities/NPC.js';
import { InventorySystem, ITEMS } from './systems/InventorySystem.js';
import { BuildSystem } from './systems/BuildSystem.js';
import { LevelSystem } from './systems/LevelSystem.js';
import { WeatherSystem } from './systems/WeatherSystem.js';
import { VehicleManager } from './systems/VehicleSystem.js';
import { Web3Manager } from './systems/Web3Manager.js';
import { AudioManager } from './audio/AudioManager.js';
import { UIManager } from './ui/UIManager.js';
import { distance2D } from './utils/math.js';

// ===== GAME CLASS =====
class Game {
  constructor() {
    this.state = 'loading'; // loading, menu, playing, paused, dead, inventory, skills
    this.clock = new THREE.Clock();
    this.ui = new UIManager();
    this.audio = new AudioManager();
    this.web3 = new Web3Manager();
    this.keys = {};

    this.initRenderer();
    this.initScene();
    this.initSystems();
    this.setupEventListeners();

    // Start loading
    this.load();
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.VSMShadowMap; // Better shadows than PCFSoft
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0; // Slightly darker/cinematic
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    document.body.appendChild(this.renderer.domElement);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x88bbee, 0.0015);
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1500);
    this.camera.position.set(0, 5, 0);
    this.scene.add(this.camera);
  }

  initSystems() {
    this.world = new WorldGenerator(this.scene);
    this.dayNight = new DayNightCycle(this.scene);
    this.particles = new ParticleSystem(this.scene);
    this.player = new Player(this.camera, this.scene, this.world);
    this.enemies = new EnemyManager(this.scene, this.world);
    this.npcManager = new NPCManager(this.scene, this.world);
    this.inventory = new InventorySystem(32);
    this.buildSystem = new BuildSystem(this.scene, this.camera, this.world, this.inventory);
    this.levelSystem = new LevelSystem();
    this.weatherSystem = new WeatherSystem(this.scene);
    this.vehicleManager = new VehicleManager(this.scene, this.world);
  }

  async load() {
    this.ui.showLoading();

    // Generate world
    await new Promise(resolve => {
      setTimeout(() => {
        this.world.generate();
        resolve();
      }, 100);
    });

    // Spawn entities
    this.npcManager.spawnInitialNPCs();
    this.npcManager.spawnAnimals();
    this.vehicleManager.spawnInitialVehicles();

    // Finish loading
    setTimeout(() => {
      this.state = 'menu';
      this.ui.showMenu();
    }, 2800);

    // Start game loop
    this.animate();
  }

  setupEventListeners() {
    // Window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Menu buttons
    document.getElementById('btn-play')?.addEventListener('click', () => {
      this.audio.init();
      this.audio.playButtonClick();
      this.startGame();
    });

    document.getElementById('btn-connect-wallet')?.addEventListener('click', async () => {
      this.audio.init();
      this.audio.playButtonClick();
      try {
        const address = await this.web3.connect();
        this.ui.updateWalletStatus(this.web3.formatAddress(address));
      } catch (e) {
        console.error("Wallet connection failed", e);
      }
    });

    document.getElementById('btn-controls')?.addEventListener('click', () => {
      this.audio.init();
      this.audio.playButtonClick();
      const panel = document.getElementById('controls-panel');
      if (panel) panel.style.display = panel.style.display === 'none' ? '' : 'none';
    });

    document.getElementById('btn-mint-nft')?.addEventListener('click', async () => {
      if (!this.web3.account) {
        this.ui.showInteraction("Once ana menuden Web3 Cuzdaninizi baglayin!");
        return;
      }
      
      // Check inventory resources (need 5 wood and 5 stone for the Epic Sword NFT)
      if (this.inventory.countItem('wood') >= 5 && this.inventory.countItem('stone') >= 5) {
        try {
          const btn = document.getElementById('btn-mint-nft');
          const status = document.getElementById('mint-status');
          
          btn.disabled = true;
          btn.textContent = "Onay Bekleniyor (Cuzdan)...";
          status.textContent = "Lutfen Cuzdaninizdan islemi onaylayin.";

          // Remove items before opening transaction to prevent double spending
          this.inventory.removeItem('wood', 5);
          this.inventory.removeItem('stone', 5);
          this.ui.updateInventory(this.inventory);

          // Mint the item via Web3Manager
          const txHash = await this.web3.mintNFT('Epic NFT Kilic');
          
          btn.textContent = "NFT MINTLENDI!";
          btn.style.background = "#4CAF50";
          status.innerHTML = `<a href="https://testnet.snowtrace.io/tx/${txHash}" target="_blank" style="color:#aaddff;">Islemi Snowtrace'te Gor (Fuji)</a>`;
          
          // Add the epic sword to the local game inventory
          this.inventory.addItem('sword_epic', 1);
          this.ui.updateInventory(this.inventory);
          this.ui.showInteraction("Epic KILIC NFT basariyla mintlendi!");
          this.particles.emitCollect(this.player.position);
          this.audio.playCraft();

        } catch (error) {
          // If transaction fails or rejected, return items
          this.inventory.addItem('wood', 5);
          this.inventory.addItem('stone', 5);
          this.ui.updateInventory(this.inventory);
          
          document.getElementById('btn-mint-nft').disabled = false;
          document.getElementById('btn-mint-nft').textContent = "NFT Mintle (5 Odun, 5 Tas)";
          document.getElementById('mint-status').textContent = "Islem iptal edildi veya basarisiz oldu.";
        }
      } else {
        this.ui.showInteraction("Yetersiz Kaynak! 5 Odun ve 5 Tas gerekli.");
      }
    });

    document.getElementById('btn-respawn')?.addEventListener('click', () => {
      this.audio.playButtonClick();
      this.respawn();
    });

    document.getElementById('btn-resume')?.addEventListener('click', () => {
      this.audio.playButtonClick();
      this.resumeGame();
    });

    document.getElementById('btn-quit')?.addEventListener('click', () => {
      this.audio.playButtonClick();
      this.quitToMenu();
    });

    document.getElementById('close-inventory')?.addEventListener('click', () => {
      this.audio.playButtonClick();
      this.toggleInventory();
    });

    document.getElementById('close-skills')?.addEventListener('click', () => {
      this.audio.playButtonClick();
      this.toggleSkills();
    });

    // Pointer lock
    this.renderer.domElement.addEventListener('click', () => {
      if (this.state === 'playing') {
        this.renderer.domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      if (!document.pointerLockElement && this.state === 'playing') {
        this.pauseGame();
      }
    });

    // Mouse move
    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement && this.state === 'playing') {
        this.player.onMouseMove(e);
      }
    });

    // Key tracking for vehicle controls
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      this.handleKeyDown(e);
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse buttons for build mode and attack
    document.addEventListener('mousedown', (e) => {
      if (this.state !== 'playing') return;

      if (e.button === 0) {
        if (this.buildSystem.active) {
          if (this.buildSystem.place(this.audio)) {
            this.particles.emitCollect(this.buildSystem.preview?.position || this.player.position);
            this.gainXp('build_structure');
          }
        }
      } else if (e.button === 2) {
        if (this.buildSystem.active) {
          this.buildSystem.deactivate();
          this.ui.showBuildMode(false);
        }
      }
    });

    // Scroll for build rotation
    document.addEventListener('wheel', (e) => {
      if (this.state === 'playing' && this.buildSystem.active) {
        this.buildSystem.rotate(e.deltaY > 0 ? 1 : -1);
      }
    });

    // Prevent context menu
    document.addEventListener('contextmenu', e => e.preventDefault());
  }

  handleKeyDown(e) {
    if (this.state !== 'playing' && this.state !== 'inventory' && this.state !== 'skills') return;

    switch (e.code) {
      case 'Escape':
        if (this.state === 'inventory') {
          this.toggleInventory();
        } else if (this.state === 'skills') {
          this.toggleSkills();
        } else if (this.buildSystem.active) {
          this.buildSystem.deactivate();
          this.ui.showBuildMode(false);
        } else {
          this.pauseGame();
        }
        break;

      case 'Tab':
        e.preventDefault();
        if (this.state === 'skills') this.toggleSkills();
        this.toggleInventory();
        break;

      case 'KeyK':
        e.preventDefault();
        if (this.state === 'inventory') this.toggleInventory();
        this.toggleSkills();
        break;

      case 'KeyE':
        if (this.state === 'playing') this.interact();
        break;

      case 'KeyF':
        if (this.state === 'playing') this.attack();
        break;

      case 'KeyQ':
        if (this.state === 'playing') {
          const active = this.buildSystem.toggle();
          this.ui.showBuildMode(active);
        }
        break;

      case 'KeyR':
        if (this.state === 'playing') {
          // Use active item (eat, drink, heal)
          if (this.inventory.useActiveItem(this.player)) {
            this.audio.playEat();
          }
        }
        break;

      case 'Digit1': case 'Digit2': case 'Digit3':
      case 'Digit4': case 'Digit5':
        this.inventory.activeSlot = parseInt(e.code.replace('Digit', '')) - 1;
        if (this.buildSystem.active) this.buildSystem.updateBuildType();
        break;
    }
  }

  startGame() {
    this.state = 'playing';
    this.ui.showGame();
    this.inventory.reset();
    this.player.reset();
    this.enemies.reset();
    this.levelSystem.reset();
    this.dayNight.timeOfDay = 0.25;
    this.dayNight.dayCount = 1;
    this.audio.playAmbient();

    // Re-spawn entities
    this.npcManager.reset();
    this.vehicleManager.reset();
    this.npcManager.spawnInitialNPCs();
    this.npcManager.spawnAnimals();
    this.vehicleManager.spawnInitialVehicles();

    // Request pointer lock
    this.renderer.domElement.requestPointerLock();
  }

  pauseGame() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.ui.showPause();
    document.exitPointerLock();
  }

  resumeGame() {
    this.state = 'playing';
    this.ui.hidePause();
    this.renderer.domElement.requestPointerLock();
  }

  quitToMenu() {
    this.state = 'menu';
    this.ui.showMenu();
    this.audio.stopAmbient();
    document.exitPointerLock();
  }

  respawn() {
    this.player.reset();
    this.inventory.reset();
    this.enemies.reset();
    this.levelSystem.reset();
    this.npcManager.reset();
    this.vehicleManager.reset();
    this.npcManager.spawnInitialNPCs();
    this.npcManager.spawnAnimals();
    this.vehicleManager.spawnInitialVehicles();
    this.dayNight.timeOfDay = 0.25;
    this.dayNight.dayCount = 1;
    this.state = 'playing';
    this.ui.showGame();
    this.renderer.domElement.requestPointerLock();
  }

  toggleInventory() {
    if (this.state === 'inventory') {
      this.state = 'playing';
      this.ui.hide('inventory-panel');
      document.body.style.cursor = 'none';
      this.renderer.domElement.requestPointerLock();
    } else if (this.state === 'playing') {
      this.state = 'inventory';
      this.ui.toggleInventory(this.inventory);
      document.exitPointerLock();
    }
  }

  toggleSkills() {
    if (this.state === 'skills') {
      this.state = 'playing';
      this.ui.hide('skill-panel');
      document.body.style.cursor = 'none';
      this.renderer.domElement.requestPointerLock();
    } else if (this.state === 'playing') {
      this.state = 'skills';
      this.ui.updateSkillPanel(this.levelSystem);
      this.ui.show('skill-panel');
      document.exitPointerLock();
    }
  }

  // ===== XP SYSTEM HELPER =====
  gainXp(action) {
    const result = this.levelSystem.addXpForAction(action);
    if (result.xp > 0) {
      this.ui.showXpPopup(result.xp, result.levelsGained > 0);
      if (result.levelsGained > 0) {
        this.player.applyLevelBonuses(this.levelSystem);
        this.particles.emitLevelUp(this.player.position.clone().add(new THREE.Vector3(0, 1, 0)));
      }
    }
  }

  // ===== INTERACT =====
  interact() {
    const playerPos = this.player.position;

    // Check if in/near vehicle
    if (this.player.isInVehicle) {
      // Exit vehicle
      this.player.isInVehicle = false;
      if (this.player.currentVehicle) {
        this.player.currentVehicle.exit();
        this.player.currentVehicle = null;
      }
      this.ui.hideVehicleHUD();
      return;
    }

    // Check for nearby vehicle to enter
    const nearVehicle = this.vehicleManager.getNearbyVehicle(playerPos, 5);
    if (nearVehicle && !nearVehicle.occupied) {
      nearVehicle.enter(this.player);
      this.player.isInVehicle = true;
      this.player.currentVehicle = nearVehicle;
      this.ui.showVehicleHUD(nearVehicle);
      return;
    }

    // Check for nearby NPC (trade)
    const nearNPC = this.npcManager.getNearbyNPC(playerPos, 4);
    if (nearNPC && nearNPC.def.trades) {
      // Cycle through available trades
      if (!this._tradeIndex) this._tradeIndex = 0;
      
      // Find a trade the player can afford
      let traded = false;
      for (let attempts = 0; attempts < nearNPC.def.trades.length; attempts++) {
        const trade = nearNPC.def.trades[this._tradeIndex % nearNPC.def.trades.length];
        this._tradeIndex++;
        
        const hasItems = this.inventory.getItemCount(trade.give) >= trade.giveAmount;
        if (hasItems) {
          this.inventory.removeItem(trade.give, trade.giveAmount);
          this.inventory.addItem(trade.receive, trade.receiveAmount);
          this.audio.playCollect();
          this.gainXp('craft_item');
          
          const giveItem = ITEMS[trade.give];
          const receiveItem = ITEMS[trade.receive];
          const giveName = giveItem ? giveItem.name : trade.give;
          const receiveName = receiveItem ? receiveItem.name : trade.receive;
          this.ui.showInteraction(`✅ ${trade.giveAmount}x ${giveName} → ${trade.receiveAmount}x ${receiveName}`);
          traded = true;
          break;
        }
      }
      
      if (!traded) {
        this.ui.showInteraction('❌ Ticaret için yeterli malzeme yok!');
      }
      return;
    }

    // Check for nearby treasure chest
    let closestChest = null;
    let closestChestDist = 4;
    for (const chest of this.world.treasureChests) {
      if (chest.opened) continue;
      const dist = distance2D(playerPos.x, playerPos.z, chest.position.x, chest.position.z);
      if (dist < closestChestDist) {
        closestChestDist = dist;
        closestChest = chest;
      }
    }

    if (closestChest) {
      // Open chest
      closestChest.opened = true;
      if (closestChest.loot) {
        closestChest.loot.forEach(loot => {
          this.inventory.addItem(loot.item, loot.amount);
        });
      }
      this.audio.playCollect();
      this.gainXp('open_treasure');
      // Visual feedback - change chest color
      if (closestChest.mesh) {
        closestChest.mesh.traverse(child => {
          if (child.isMesh) child.material.color.setHex(0x555555);
        });
      }
      return;
    }

    // Check for resources
    let closestResource = null;
    let closestDist = this.player.interactionRange;

    for (const resource of this.world.resources) {
      const dist = distance2D(
        playerPos.x, playerPos.z,
        resource.position.x, resource.position.z
      );
      if (dist < closestDist) {
        closestDist = dist;
        closestResource = resource;
      }
    }

    if (closestResource) {
      // Gather resource with level bonus
      const gatherBonus = this.levelSystem.getGatherBonus();
      const amount = closestResource.amount + gatherBonus;
      const added = this.inventory.addItem(closestResource.resource, amount);
      if (added > 0) {
        this.audio.playCollect();
        this.player.addScore(10);
        this.gainXp('gather_resource');

        // Particles
        if (closestResource.type === 'tree') {
          this.particles.emitWoodChips(closestResource.position);
        } else if (closestResource.type === 'rock') {
          this.particles.emitStoneChips(closestResource.position);
        } else {
          this.particles.emitCollect(closestResource.position);
        }

        closestResource.health--;
        if (closestResource.health <= 0) {
          this.world.removeResource(closestResource);
        }
      }
      return;
    }

    // Check for water (drink)
    const terrainH = this.world.getHeightAt(playerPos.x, playerPos.z);
    if (terrainH < this.world.waterLevel + 1) {
      this.player.drink(20);
      this.audio.playWaterSplash();
    }
  }

  // ===== ATTACK =====
  attack() {
    if (this.player.isInVehicle) return;
    if (!this.player.attack()) return;
    this.audio.playHit();

    const playerPos = this.player.position;
    const forward = this.player.getForward();

    // Get weapon damage with level bonus
    const activeItem = this.inventory.getActiveItemDef();
    const baseDamage = (activeItem && activeItem.type === 'weapon') ? activeItem.damage : this.player.attackDamage;
    const damage = baseDamage + this.levelSystem.getDamageBonus();

    // Check for enemies in range
    for (const enemy of this.enemies.getAliveEnemies()) {
      const dist = distance2D(playerPos.x, playerPos.z, enemy.position.x, enemy.position.z);
      if (dist > this.player.attackRange) continue;

      const toEnemy = new THREE.Vector3(
        enemy.position.x - playerPos.x, 0,
        enemy.position.z - playerPos.z
      ).normalize();
      const dot = forward.x * toEnemy.x + forward.z * toEnemy.z;
      if (dot < 0.3) continue;

      enemy.takeDamage(damage);
      this.particles.emitBlood(enemy.position.clone().add(new THREE.Vector3(0, 1, 0)));

      if (!enemy.alive) {
        this.audio.playEnemyDeath();
        this.player.addScore(50);
        // XP for kill
        if (enemy.type === 'skeleton') this.gainXp('kill_skeleton');
        else this.gainXp('kill_zombie');
        // Drop loot
        const loot = Math.random();
        if (loot < 0.3) this.inventory.addItem('meat', 1);
        else if (loot < 0.5) this.inventory.addItem('berry', 2);

        this.particles.emitLevelUp(enemy.position.clone().add(new THREE.Vector3(0, 1, 0)));
      }
      break;
    }

    // Check for animals in range
    for (const animal of this.npcManager.getAliveAnimals()) {
      const dist = distance2D(playerPos.x, playerPos.z, animal.position.x, animal.position.z);
      if (dist > this.player.attackRange) continue;

      const toAnimal = new THREE.Vector3(
        animal.position.x - playerPos.x, 0,
        animal.position.z - playerPos.z
      ).normalize();
      const dot = forward.x * toAnimal.x + forward.z * toAnimal.z;
      if (dot < 0.3) continue;

      animal.takeDamage(damage);
      this.particles.emitBlood(animal.position.clone().add(new THREE.Vector3(0, 0.5, 0)));

      if (!animal.alive) {
        this.player.addScore(30);
        // XP for animal kill
        if (animal.type === 'wolf') this.gainXp('kill_wolf');
        else if (animal.type === 'bear') this.gainXp('kill_bear');
        else this.gainXp('kill_zombie'); // generic xp

        // Drop loot
        if (animal.def.drops) {
          animal.def.drops.forEach(drop => {
            if (Math.random() < drop.chance) {
              this.inventory.addItem(drop.item, drop.amount);
            }
          });
        }
      }
      break;
    }

    // Also gather from resources by attacking
    for (const resource of this.world.resources) {
      const dist = distance2D(playerPos.x, playerPos.z, resource.position.x, resource.position.z);
      if (dist > this.player.attackRange) continue;

      const toResource = new THREE.Vector3(
        resource.position.x - playerPos.x, 0,
        resource.position.z - playerPos.z
      ).normalize();
      const dot = forward.x * toResource.x + forward.z * toResource.z;
      if (dot < 0.3) continue;

      const efficiency = (activeItem && activeItem.type === 'tool') ? activeItem.efficiency : 1;
      const amount = Math.ceil(resource.amount * (efficiency > 1 ? 0.5 : 0.3));
      const added = this.inventory.addItem(resource.resource, amount);

      if (added > 0) {
        this.player.addScore(5);
        this.gainXp('gather_resource');
        if (resource.type === 'tree') this.particles.emitWoodChips(resource.position);
        else if (resource.type === 'rock') this.particles.emitStoneChips(resource.position);
        else this.particles.emitCollect(resource.position);

        resource.health -= efficiency;
        if (resource.health <= 0) {
          this.world.removeResource(resource);
        }
      }
      break;
    }
  }

  // ===== INTERACTION HINTS =====
  updateInteractionHint() {
    const playerPos = this.player.position;

    // Vehicle hint
    if (this.player.isInVehicle) {
      this.ui.showInteraction('[E] Araçtan in');
      return;
    }

    const nearVehicle = this.vehicleManager.getNearbyVehicle(playerPos, 5);
    if (nearVehicle && !nearVehicle.occupied) {
      this.ui.showInteraction(`[E] ${nearVehicle.def.name} - Bin ${nearVehicle.def.icon}`);
      return;
    }

    // NPC hint
    const nearNPC = this.npcManager.getNearbyNPC(playerPos, 4);
    if (nearNPC) {
      let tradeInfo = '';
      if (nearNPC.def.trades && nearNPC.def.trades.length > 0) {
        const trade = nearNPC.def.trades[0];
        const giveItem = ITEMS[trade.give];
        const receiveItem = ITEMS[trade.receive];
        const giveName = giveItem ? giveItem.name : trade.give;
        const receiveName = receiveItem ? receiveItem.name : trade.receive;
        tradeInfo = ` | ${trade.giveAmount}x${giveName} → ${trade.receiveAmount}x${receiveName}`;
      }
      this.ui.showInteraction(`[E] ${nearNPC.def.name} ile Ticaret ${nearNPC.def.icon}${tradeInfo}`);
      return;
    }

    // Treasure chest hint
    for (const chest of this.world.treasureChests) {
      if (chest.opened) continue;
      const dist = distance2D(playerPos.x, playerPos.z, chest.position.x, chest.position.z);
      if (dist < 4) {
        this.ui.showInteraction('[E] Hazine Sandığı Aç 📦');
        return;
      }
    }

    // Resource hint
    let closestResource = null;
    let closestDist = this.player.interactionRange;

    for (const resource of this.world.resources) {
      const dist = distance2D(
        playerPos.x, playerPos.z,
        resource.position.x, resource.position.z
      );
      if (dist < closestDist) {
        closestDist = dist;
        closestResource = resource;
      }
    }

    if (closestResource) {
      const def = ITEMS[closestResource.resource];
      const name = def ? def.name : closestResource.resource;
      this.ui.showInteraction(`[E] ${name} topla | [F] Saldır`);
      return;
    }

    // Water proximity
    const terrainH = this.world.getHeightAt(playerPos.x, playerPos.z);
    if (terrainH < this.world.waterLevel + 1) {
      if (this.player.isUnderwater) {
        this.ui.showInteraction(`💨 Nefes: ${Math.ceil(this.player.oxygen)}% | [SPACE] Yüzeye çık`);
      } else {
        this.ui.showInteraction('[E] Su iç 💧');
      }
      return;
    }

    this.ui.hideInteraction();
  }

  // ===== GAME LOOP =====
  animate() {
    requestAnimationFrame(() => this.animate());

    const deltaTime = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.elapsedTime;

    if (this.state === 'playing') {
      // Armor defense
      const armorDefense = this.inventory.getArmorDefense();

      // Update player with new params
      this.player.update(deltaTime, this.audio, this.levelSystem, armorDefense);

      // Update game systems
      this.enemies.update(deltaTime, this.player.position, this.world, this.dayNight);
      this.npcManager.update(deltaTime, this.player.position, this.world);
      this.dayNight.update(deltaTime);

      // Shadow camera follows player for better shadow quality
      if (this.dayNight.sun && this.dayNight.sun.target) {
        this.dayNight.sun.target.position.set(
          this.player.position.x, 0, this.player.position.z
        );
        this.dayNight.sun.target.updateMatrixWorld();
      }

      this.world.update(elapsedTime);
      this.particles.update(deltaTime);
      this.buildSystem.update();
      this.weatherSystem.update(deltaTime, this.player.position, this.dayNight);
      this.vehicleManager.update(deltaTime, this.keys, this.world);

      // Weather position follow player
      if (this.weatherSystem.rainParticles) {
        this.weatherSystem.rainParticles.position.x = this.player.position.x;
        this.weatherSystem.rainParticles.position.z = this.player.position.z;
      }
      if (this.weatherSystem.snowParticles) {
        this.weatherSystem.snowParticles.position.x = this.player.position.x;
        this.weatherSystem.snowParticles.position.z = this.player.position.z;
      }

      // Temperature damage from weather
      const tempEffect = this.weatherSystem.getTemperatureEffect();
      if (tempEffect < -0.3) {
        // Freezing damage
        this.player.takeDamage(Math.abs(tempEffect) * deltaTime * 2, armorDefense);
      } else if (tempEffect > 0.3) {
        // Heat damage - drain thirst faster
        this.player.thirst -= tempEffect * deltaTime * 3;
      }

      // Enemy attacks on player
      for (const enemy of this.enemies.getAliveEnemies()) {
        if (enemy.canAttack()) {
          const dist = distance2D(
            this.player.position.x, this.player.position.z,
            enemy.position.x, enemy.position.z
          );
          if (dist < enemy.attackRange) {
            const dmg = enemy.performAttack();
            this.player.takeDamage(dmg, armorDefense);
            this.audio.playDamage();
            this.particles.emitBlood(this.player.position.clone());
          }
        }
      }

      // Hostile animal attacks on player
      for (const animal of this.npcManager.getHostileAnimals()) {
        if (!animal.alive) continue;
        const dist = distance2D(
          this.player.position.x, this.player.position.z,
          animal.position.x, animal.position.z
        );
        if (dist < 2.5 && animal.state === 'attack') {
          if (!animal._lastAttack || (Date.now() - animal._lastAttack > 1500)) {
            animal._lastAttack = Date.now();
            const dmg = animal.type === 'bear' ? 20 : 10;
            this.player.takeDamage(dmg, armorDefense);
            this.audio.playDamage();
            this.particles.emitBlood(this.player.position.clone());
          }
        }
      }

      // Campfire healing
      for (const building of this.world.buildings) {
        if (building.type === 'campfire') {
          const dist = distance2D(
            this.player.position.x, this.player.position.z,
            building.position.x, building.position.z
          );
          if (dist < 3) {
            this.player.heal(deltaTime * 2);
            if (Math.random() < 0.3) {
              this.particles.emitFire(building.position.clone());
            }
          }
        }
      }

      // Night survival XP
      if (this.dayNight.timeOfDay > 0.75 || this.dayNight.timeOfDay < 0.2) {
        if (!this._nightXpTimer) this._nightXpTimer = 0;
        this._nightXpTimer += deltaTime;
        if (this._nightXpTimer > 60) { // her 60 saniyede bir
          this._nightXpTimer = 0;
          this.gainXp('survive_night');
        }
      }

      // Check death
      if (!this.player.alive) {
        this.state = 'dead';
        this.ui.showDeath(this.player.score, this.dayNight.getDayCount(), this.levelSystem.level);
        document.exitPointerLock();
      }

      // Update UI with new params
      this.ui.updateHUD(this.player, this.dayNight, this.inventory, this.levelSystem, this.weatherSystem);
      
      // Village distance indicator
      const villageX = 60, villageZ = 60;
      const distToVillage = Math.sqrt(
        (this.player.position.x - villageX) ** 2 + 
        (this.player.position.z - villageZ) ** 2
      );
      const villageIndicator = document.getElementById('village-indicator');
      const villageDistance = document.getElementById('village-distance');
      if (villageIndicator && villageDistance) {
        if (distToVillage > 15) {
          villageIndicator.style.display = '';
          villageDistance.textContent = `${Math.round(distToVillage)}m`;
        } else {
          villageIndicator.style.display = 'none';
        }
      }

      this.updateInteractionHint();
      this.ui.updateMinimap(
        this.player.position,
        this.enemies.getAliveEnemies(),
        this.world.resources,
        this.world.worldSize,
        this.npcManager.getAliveAnimals(),
        this.npcManager.npcs,
        this.vehicleManager.vehicles
      );

      // Vehicle HUD update
      if (this.player.isInVehicle && this.player.currentVehicle) {
        this.ui.showVehicleHUD(this.player.currentVehicle);
      }
    }

    // Always render
    this.renderer.render(this.scene, this.camera);
  }
}

// ===== START GAME =====
const game = new Game();
