// ===== GELİŞMİŞ DÜNYA ÜRETECİ =====
import * as THREE from 'three';
import { SimplexNoise, randomRange } from '../utils/math.js';

export class WorldGenerator {
  constructor(scene) {
    this.scene = scene;
    this.noise = new SimplexNoise(42);
    this.biomeNoise = new SimplexNoise(123);
    this.chunkSize = 100;
    this.worldSize = 500;
    this.trees = [];
    this.rocks = [];
    this.resources = [];
    this.waterLevel = -1;
    this.buildings = [];
    this.treasureChests = [];
    this.ironDeposits = [];
    this.goldDeposits = [];
    this.villageCenter = new THREE.Vector3(60, 0, 60);
  }

  generate() {
    this.createTerrain();
    this.createWater();
    this.createTrees();
    this.createRocks();
    this.createBerryBushes();
    this.createGrass();
    this.createFlowers();
    this.createIronDeposits();
    this.createGoldDeposits();
    this.createMushroomPatches();
    this.createAppleTrees();
    this.createFiberPlants();
    this.createTreasureChests();
    this.createRuins();
    this.createVillage();
  }

  getBiome(x, z) {
    const val = this.biomeNoise.fbm(x * 0.003, z * 0.003, 3, 2, 0.5);
    if (val < -0.3) return 'desert';
    if (val < 0.0) return 'plains';
    if (val < 0.3) return 'forest';
    if (val < 0.5) return 'swamp';
    return 'snow';
  }

  getHeightAt(x, z) {
    const scale = 0.005;
    let h = this.noise.fbm(x * scale, z * scale, 4, 2, 0.45) * 15;
    // Add gentle rolling hills with large-scale noise
    h += this.noise.fbm(x * 0.002, z * 0.002, 2, 2, 0.5) * 5;
    // Flatten center area for spawn
    const distFromCenter = Math.sqrt(x * x + z * z);
    if (distFromCenter < 40) {
      h *= distFromCenter / 40;
    }
    // Flatten village area
    const distFromVillage = Math.sqrt((x - 60) * (x - 60) + (z - 60) * (z - 60));
    if (distFromVillage < 35) {
      const flatFactor = Math.max(0.1, distFromVillage / 35);
      h = h * flatFactor + 2 * (1 - flatFactor);
    }
    return h;
  }

  createTerrain() {
    const size = this.worldSize;
    const segments = 300;
    const geo = new THREE.PlaneGeometry(size * 2, size * 2, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = this.getHeightAt(x, z);
      pos.setY(i, h);

      const biome = this.getBiome(x, z);
      let r, g, b;

      if (h < this.waterLevel + 0.5) {
        r = 0.76; g = 0.7; b = 0.5; // Sand
      } else if (biome === 'desert') {
        r = 0.85 + Math.random() * 0.05; g = 0.75; b = 0.45;
      } else if (biome === 'snow') {
        if (h > 5) { r = 0.9; g = 0.92; b = 0.95; }
        else { r = 0.7; g = 0.75; b = 0.7; }
      } else if (biome === 'swamp') {
        r = 0.2; g = 0.35 + Math.random() * 0.05; b = 0.15;
      } else if (biome === 'forest') {
        if (h < 5) { r = 0.15; g = 0.5 + Math.random() * 0.1; b = 0.12; }
        else if (h < 15) { r = 0.12; g = 0.42 + Math.random() * 0.05; b = 0.1; }
        else { r = 0.4; g = 0.35; b = 0.3; }
      } else {
        // plains
        if (h < 5) { r = 0.25; g = 0.6 + Math.random() * 0.1; b = 0.18; }
        else if (h < 15) { r = 0.2; g = 0.5; b = 0.15; }
        else if (h < 22) { r = 0.4; g = 0.35; b = 0.3; }
        else { r = 0.85; g = 0.85; b = 0.9; }
      }

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.0,
      flatShading: false,
    });

    this.terrain = new THREE.Mesh(geo, mat);
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);
  }

  createWater() {
    const geo = new THREE.PlaneGeometry(this.worldSize * 3, this.worldSize * 3, 80, 80);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1a7fbd,
      transparent: true,
      opacity: 0.65,
      roughness: 0.05,
      metalness: 0.2,
    });
    this.water = new THREE.Mesh(geo, mat);
    this.water.position.y = this.waterLevel;
    this.water.receiveShadow = true;
    this.scene.add(this.water);
  }

  createTrees() {
    const treeCount = 500;
    for (let i = 0; i < treeCount; i++) {
      const x = randomRange(-this.worldSize, this.worldSize);
      const z = randomRange(-this.worldSize, this.worldSize);
      const h = this.getHeightAt(x, z);
      const biome = this.getBiome(x, z);

      if (h < 1 || h > 18) continue;
      if (biome === 'desert') continue; // No trees in desert

      const tree = this.createTree(biome);
      tree.position.set(x, h, z);
      this.scene.add(tree);

      this.trees.push({
        mesh: tree,
        position: new THREE.Vector3(x, h, z),
        type: 'tree',
        health: 3,
        resource: 'wood',
        amount: 3,
      });

      this.resources.push(this.trees[this.trees.length - 1]);
    }
  }

  createTree(biome = 'forest') {
    const group = new THREE.Group();
    const trunkH = 2 + Math.random() * 2;
    const trunkR = 0.2 + Math.random() * 0.15;

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(trunkR * 0.6, trunkR, trunkH, 8);
    const trunkColor = biome === 'snow' ? 0x9B8B75 : 0x8B4513;
    const trunkMat = new THREE.MeshStandardMaterial({ color: trunkColor, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = trunkH / 2;
    trunk.castShadow = true;
    group.add(trunk);

    // Leaves
    const leafColors = biome === 'snow'
      ? [0x4a6a4a, 0x3a5a3a]
      : biome === 'swamp'
        ? [0x1a4a1a, 0x2a5a2a]
        : [0x228B22, 0x2E8B57, 0x006400, 0x32CD32];

    const layers = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < layers; i++) {
      const leafR = 1.5 + Math.random() * 1 - i * 0.3;
      const leafH = 1.5 + Math.random();
      const leafGeo = new THREE.ConeGeometry(leafR, leafH, 8);
      const leafMat = new THREE.MeshStandardMaterial({
        color: leafColors[Math.floor(Math.random() * leafColors.length)],
        roughness: 0.8,
      });
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.y = trunkH + i * 1.0 + 0.5;
      leaf.castShadow = true;
      group.add(leaf);
    }

    return group;
  }

  createRocks() {
    const rockCount = 250;
    for (let i = 0; i < rockCount; i++) {
      const x = randomRange(-this.worldSize, this.worldSize);
      const z = randomRange(-this.worldSize, this.worldSize);
      const h = this.getHeightAt(x, z);

      if (h < 0.5) continue;

      const rock = this.createRock();
      rock.position.set(x, h, z);
      this.scene.add(rock);

      this.rocks.push({
        mesh: rock,
        position: new THREE.Vector3(x, h, z),
        type: 'rock',
        health: 4,
        resource: 'stone',
        amount: 2,
      });

      this.resources.push(this.rocks[this.rocks.length - 1]);
    }
  }

  createRock() {
    const scale = 0.5 + Math.random() * 1.5;
    const geo = new THREE.DodecahedronGeometry(scale, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * 0.3);
      pos.setY(i, pos.getY(i) * (0.5 + Math.random() * 0.5));
      pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * 0.3);
    }
    geo.computeVertexNormals();

    const grayVal = 0.4 + Math.random() * 0.2;
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(grayVal, grayVal, grayVal * 0.95),
      roughness: 0.95, metalness: 0.05, flatShading: true,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    return mesh;
  }

  createBerryBushes() {
    const count = 130;
    for (let i = 0; i < count; i++) {
      const x = randomRange(-this.worldSize, this.worldSize);
      const z = randomRange(-this.worldSize, this.worldSize);
      const h = this.getHeightAt(x, z);
      if (h < 1 || h > 12) continue;

      const bush = this.createBerryBush();
      bush.position.set(x, h, z);
      this.scene.add(bush);

      this.resources.push({
        mesh: bush,
        position: new THREE.Vector3(x, h, z),
        type: 'berry_bush',
        health: 1,
        resource: 'berry',
        amount: 3,
      });
    }
  }

  createBerryBush() {
    const group = new THREE.Group();
    const bushGeo = new THREE.SphereGeometry(0.6, 8, 6);
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.9 });
    const bush = new THREE.Mesh(bushGeo, bushMat);
    bush.position.y = 0.4;
    bush.scale.y = 0.7;
    bush.castShadow = true;
    group.add(bush);

    for (let i = 0; i < 8; i++) {
      const berryGeo = new THREE.SphereGeometry(0.06, 6, 6);
      const berryMat = new THREE.MeshStandardMaterial({ color: 0xff2255, emissive: 0x330011 });
      const berry = new THREE.Mesh(berryGeo, berryMat);
      const angle = Math.random() * Math.PI * 2;
      const r = 0.3 + Math.random() * 0.25;
      berry.position.set(Math.cos(angle) * r, 0.3 + Math.random() * 0.3, Math.sin(angle) * r);
      group.add(berry);
    }
    return group;
  }

  createIronDeposits() {
    const count = 60;
    for (let i = 0; i < count; i++) {
      const x = randomRange(-this.worldSize * 0.8, this.worldSize * 0.8);
      const z = randomRange(-this.worldSize * 0.8, this.worldSize * 0.8);
      const h = this.getHeightAt(x, z);

      if (h < 3 || h > 18) continue; // Iron in elevated areas

      const deposit = this.createOreDeposit(0x884444, 0.8);
      deposit.position.set(x, h, z);
      this.scene.add(deposit);

      const resource = {
        mesh: deposit,
        position: new THREE.Vector3(x, h, z),
        type: 'iron_deposit',
        health: 5,
        resource: 'iron_ore',
        amount: 2,
      };
      this.ironDeposits.push(resource);
      this.resources.push(resource);
    }
  }

  createGoldDeposits() {
    const count = 25;
    for (let i = 0; i < count; i++) {
      const x = randomRange(-this.worldSize * 0.9, this.worldSize * 0.9);
      const z = randomRange(-this.worldSize * 0.9, this.worldSize * 0.9);
      const h = this.getHeightAt(x, z);

      if (h < 6) continue; // Gold only in higher terrain

      const deposit = this.createOreDeposit(0xccaa22, 0.6);
      deposit.position.set(x, h, z);
      this.scene.add(deposit);

      const resource = {
        mesh: deposit,
        position: new THREE.Vector3(x, h, z),
        type: 'gold_deposit',
        health: 7,
        resource: 'gold_ore',
        amount: 1,
      };
      this.goldDeposits.push(resource);
      this.resources.push(resource);
    }
  }

  createOreDeposit(color, scale) {
    const group = new THREE.Group();
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const geo = new THREE.DodecahedronGeometry(scale * (0.3 + Math.random() * 0.4), 0);
      const mat = new THREE.MeshStandardMaterial({
        color, roughness: 0.6, metalness: 0.4, flatShading: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * scale,
        Math.random() * scale * 0.3,
        (Math.random() - 0.5) * scale
      );
      mesh.castShadow = true;
      group.add(mesh);
    }

    // Sparkle particles
    const sparkGeo = new THREE.SphereGeometry(0.05, 4, 4);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
    for (let i = 0; i < 3; i++) {
      const spark = new THREE.Mesh(sparkGeo, sparkMat);
      spark.position.set(
        (Math.random() - 0.5) * scale,
        0.2 + Math.random() * 0.4,
        (Math.random() - 0.5) * scale
      );
      group.add(spark);
    }

    return group;
  }

  createMushroomPatches() {
    const count = 100;
    for (let i = 0; i < count; i++) {
      const x = randomRange(-this.worldSize * 0.7, this.worldSize * 0.7);
      const z = randomRange(-this.worldSize * 0.7, this.worldSize * 0.7);
      const h = this.getHeightAt(x, z);
      const biome = this.getBiome(x, z);

      if (h < 1 || h > 10) continue;
      if (biome === 'desert') continue;

      const mushroom = this.createMushroom();
      mushroom.position.set(x, h, z);
      this.scene.add(mushroom);

      this.resources.push({
        mesh: mushroom,
        position: new THREE.Vector3(x, h, z),
        type: 'mushroom_patch',
        health: 1,
        resource: 'mushroom',
        amount: 2,
      });
    }
  }

  createMushroom() {
    const group = new THREE.Group();
    const colors = [0xff4444, 0xcc8822, 0xeeddaa, 0xaa44cc];

    for (let i = 0; i < 3; i++) {
      const stemGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.2, 6);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0xeeeecc });
      const stem = new THREE.Mesh(stemGeo, stemMat);

      const capGeo = new THREE.SphereGeometry(0.12, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
      const capMat = new THREE.MeshStandardMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        roughness: 0.7,
      });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 0.1;

      const m = new THREE.Group();
      m.add(stem);
      m.add(cap);
      m.position.set(
        (Math.random() - 0.5) * 0.5,
        0,
        (Math.random() - 0.5) * 0.5
      );
      m.scale.setScalar(0.5 + Math.random() * 0.5);
      group.add(m);
    }
    return group;
  }

  createAppleTrees() {
    const count = 50;
    for (let i = 0; i < count; i++) {
      const x = randomRange(-this.worldSize * 0.6, this.worldSize * 0.6);
      const z = randomRange(-this.worldSize * 0.6, this.worldSize * 0.6);
      const h = this.getHeightAt(x, z);

      if (h < 2 || h > 10) continue;

      const tree = this.createTree('forest');

      // Add apples
      for (let j = 0; j < 5; j++) {
        const appleGeo = new THREE.SphereGeometry(0.08, 6, 6);
        const appleMat = new THREE.MeshStandardMaterial({ color: 0xff3322, emissive: 0x220000 });
        const apple = new THREE.Mesh(appleGeo, appleMat);
        apple.position.set(
          (Math.random() - 0.5) * 1.5,
          2.5 + Math.random() * 1.5,
          (Math.random() - 0.5) * 1.5
        );
        tree.add(apple);
      }

      tree.position.set(x, h, z);
      this.scene.add(tree);

      this.resources.push({
        mesh: tree,
        position: new THREE.Vector3(x, h, z),
        type: 'apple_tree',
        health: 2,
        resource: 'apple',
        amount: 3,
      });
    }
  }

  createFiberPlants() {
    const count = 160;
    for (let i = 0; i < count; i++) {
      const x = randomRange(-this.worldSize * 0.8, this.worldSize * 0.8);
      const z = randomRange(-this.worldSize * 0.8, this.worldSize * 0.8);
      const h = this.getHeightAt(x, z);

      if (h < 1 || h > 8) continue;

      const plant = new THREE.Group();
      for (let j = 0; j < 4; j++) {
        const bladeGeo = new THREE.PlaneGeometry(0.1, 0.6);
        const bladeMat = new THREE.MeshStandardMaterial({
          color: 0x88aa44, side: THREE.DoubleSide, roughness: 0.8,
        });
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.set(
          (Math.random() - 0.5) * 0.3,
          0.3,
          (Math.random() - 0.5) * 0.3
        );
        blade.rotation.y = Math.random() * Math.PI;
        blade.rotation.z = (Math.random() - 0.5) * 0.3;
        plant.add(blade);
      }
      plant.position.set(x, h, z);
      this.scene.add(plant);

      this.resources.push({
        mesh: plant,
        position: new THREE.Vector3(x, h, z),
        type: 'fiber_plant',
        health: 1,
        resource: 'fiber',
        amount: 2,
      });
    }
  }

  createTreasureChests() {
    const count = 15;
    for (let i = 0; i < count; i++) {
      const x = randomRange(-this.worldSize * 0.8, this.worldSize * 0.8);
      const z = randomRange(-this.worldSize * 0.8, this.worldSize * 0.8);
      const h = this.getHeightAt(x, z);

      if (h < 3 || h > 20) continue;
      const distFromCenter = Math.sqrt(x * x + z * z);
      if (distFromCenter < 50) continue; // Not too close to spawn

      const chest = this.createTreasureChestMesh();
      chest.position.set(x, h, z);
      this.scene.add(chest);

      this.treasureChests.push({
        mesh: chest,
        position: new THREE.Vector3(x, h, z),
        opened: false,
        loot: this.generateTreasureLoot(),
      });
    }
  }

  createTreasureChestMesh() {
    const group = new THREE.Group();

    // Base
    const baseGeo = new THREE.BoxGeometry(0.6, 0.35, 0.4);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.7 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.175;
    base.castShadow = true;
    group.add(base);

    // Lid
    const lidGeo = new THREE.BoxGeometry(0.62, 0.15, 0.42);
    const lidMat = new THREE.MeshStandardMaterial({ color: 0x9B7924 });
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.y = 0.425;
    lid.castShadow = true;
    group.add(lid);

    // Metal band
    const bandGeo = new THREE.BoxGeometry(0.65, 0.04, 0.02);
    const bandMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8 });
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.position.set(0, 0.35, 0.22);
    group.add(band);

    // Lock
    const lockGeo = new THREE.BoxGeometry(0.08, 0.1, 0.06);
    const lock = new THREE.Mesh(lockGeo, bandMat);
    lock.position.set(0, 0.3, 0.22);
    group.add(lock);

    // Glow effect
    const glowGeo = new THREE.SphereGeometry(0.5, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffd700, transparent: true, opacity: 0.15,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.y = 0.3;
    group.add(glow);

    return group;
  }

  generateTreasureLoot() {
    const lootTable = [
      { item: 'iron_ingot', amount: 3, weight: 30 },
      { item: 'gold_ingot', amount: 1, weight: 10 },
      { item: 'iron_sword', amount: 1, weight: 15 },
      { item: 'iron_armor', amount: 1, weight: 8 },
      { item: 'medkit', amount: 2, weight: 20 },
      { item: 'bandage', amount: 5, weight: 25 },
      { item: 'cooked_meat', amount: 5, weight: 20 },
      { item: 'fuel', amount: 3, weight: 15 },
    ];

    const loot = [];
    const numItems = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numItems; i++) {
      const totalWeight = lootTable.reduce((sum, l) => sum + l.weight, 0);
      let r = Math.random() * totalWeight;
      for (const l of lootTable) {
        r -= l.weight;
        if (r <= 0) {
          loot.push({ item: l.item, amount: l.amount });
          break;
        }
      }
    }
    return loot;
  }

  createVillage() {
    const cx = this.villageCenter.x;
    const cz = this.villageCenter.z;
    const baseH = this.getHeightAt(cx, cz);
    this.villageCenter.y = baseH;

    // === VILLAGE PATHS (stone paths connecting buildings) ===
    const pathMat = new THREE.MeshStandardMaterial({ color: 0x998877, roughness: 0.95 });
    // Main path through village
    for (let i = -25; i <= 25; i += 1.5) {
      const pathGeo = new THREE.BoxGeometry(2, 0.05, 1.5);
      const path = new THREE.Mesh(pathGeo, pathMat);
      const px = cx + i;
      const pz = cz;
      const ph = this.getHeightAt(px, pz);
      path.position.set(px, ph + 0.02, pz);
      path.receiveShadow = true;
      this.scene.add(path);
    }
    // Cross path
    for (let i = -15; i <= 15; i += 1.5) {
      const pathGeo = new THREE.BoxGeometry(1.5, 0.05, 2);
      const path = new THREE.Mesh(pathGeo, pathMat);
      const px = cx;
      const pz = cz + i;
      const ph = this.getHeightAt(px, pz);
      path.position.set(px, ph + 0.02, pz);
      path.receiveShadow = true;
      this.scene.add(path);
    }

    // === VILLAGE HOUSES ===
    const housePositions = [
      { x: cx - 15, z: cz - 10, rot: 0 },
      { x: cx + 15, z: cz - 10, rot: Math.PI },
      { x: cx - 15, z: cz + 10, rot: 0 },
      { x: cx + 15, z: cz + 10, rot: Math.PI },
      { x: cx - 8, z: cz - 15, rot: Math.PI / 2 },
      { x: cx + 8, z: cz - 15, rot: -Math.PI / 2 },
    ];

    housePositions.forEach((hp, idx) => {
      const h = this.getHeightAt(hp.x, hp.z);
      this.createVillageHouse(hp.x, h, hp.z, hp.rot, idx);
    });

    // === MARKET AREA (center) ===
    this.createMarketArea(cx, baseH, cz);

    // === WELL (village center) ===
    this.createWell(cx, baseH, cz + 5);

    // === VILLAGE FENCE ===
    this.createVillageFence(cx, cz);

    // === VILLAGE DECORATIONS ===
    // Lantern posts
    const lanternPositions = [
      { x: cx - 10, z: cz }, { x: cx + 10, z: cz },
      { x: cx, z: cz - 10 }, { x: cx, z: cz + 10 },
    ];
    lanternPositions.forEach(lp => {
      const lh = this.getHeightAt(lp.x, lp.z);
      this.createLanternPost(lp.x, lh, lp.z);
    });
  }

  createVillageHouse(x, y, z, rotation, variant) {
    const group = new THREE.Group();

    // House colors vary
    const wallColors = [0xddcc99, 0xccbb88, 0xeedd99, 0xbbaa77, 0xddbb88, 0xccaa77];
    const roofColors = [0x8B4513, 0x6B3410, 0x7B4413, 0x5B2800, 0x9B5523, 0x8B3510];
    const wallColor = wallColors[variant % wallColors.length];
    const roofColor = roofColors[variant % roofColors.length];

    const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.85 });
    const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.9 });

    // Main walls
    const wallW = 5, wallH = 3, wallD = 4;
    // Front wall
    const frontGeo = new THREE.BoxGeometry(wallW, wallH, 0.2);
    const front = new THREE.Mesh(frontGeo, wallMat);
    front.position.set(0, wallH / 2, wallD / 2);
    front.castShadow = true;
    front.receiveShadow = true;
    group.add(front);

    // Back wall
    const back = new THREE.Mesh(frontGeo, wallMat);
    back.position.set(0, wallH / 2, -wallD / 2);
    back.castShadow = true;
    group.add(back);

    // Side walls
    const sideGeo = new THREE.BoxGeometry(0.2, wallH, wallD);
    const left = new THREE.Mesh(sideGeo, wallMat);
    left.position.set(-wallW / 2, wallH / 2, 0);
    left.castShadow = true;
    group.add(left);

    const right = new THREE.Mesh(sideGeo, wallMat);
    right.position.set(wallW / 2, wallH / 2, 0);
    right.castShadow = true;
    group.add(right);

    // Floor
    const floorGeo = new THREE.BoxGeometry(wallW, 0.15, wallD);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x9B8B75, roughness: 0.9 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = 0.075;
    floor.receiveShadow = true;
    group.add(floor);

    // Roof (triangular prism shape)
    const roofGeo = new THREE.BoxGeometry(wallW + 0.6, 0.15, wallD + 0.6);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = wallH + 0.8;
    roof.castShadow = true;
    group.add(roof);

    // Roof slopes
    const slopeGeo = new THREE.BoxGeometry(wallW + 0.5, 0.12, wallD / 2 + 0.5);
    const slopeLeft = new THREE.Mesh(slopeGeo, roofMat);
    slopeLeft.position.set(0, wallH + 0.4, -wallD / 4);
    slopeLeft.rotation.x = 0.4;
    slopeLeft.castShadow = true;
    group.add(slopeLeft);

    const slopeRight = new THREE.Mesh(slopeGeo, roofMat);
    slopeRight.position.set(0, wallH + 0.4, wallD / 4);
    slopeRight.rotation.x = -0.4;
    slopeRight.castShadow = true;
    group.add(slopeRight);

    // Door
    const doorGeo = new THREE.BoxGeometry(0.9, 2, 0.1);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x6B4914, roughness: 0.8 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 1, wallD / 2 + 0.12);
    group.add(door);

    // Windows
    const winGeo = new THREE.BoxGeometry(0.7, 0.7, 0.1);
    const winMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff, transparent: true, opacity: 0.5, roughness: 0.1,
    });
    [-1.5, 1.5].forEach(wx => {
      const win = new THREE.Mesh(winGeo, winMat);
      win.position.set(wx, 1.8, wallD / 2 + 0.12);
      group.add(win);
    });

    // Window on back
    const winBack = new THREE.Mesh(winGeo, winMat);
    winBack.position.set(0, 1.8, -wallD / 2 - 0.12);
    group.add(winBack);

    // Interior light
    const light = new THREE.PointLight(0xffaa55, 0.8, 8);
    light.position.set(0, 2, 0);
    group.add(light);

    // Chimney
    if (variant % 2 === 0) {
      const chimGeo = new THREE.BoxGeometry(0.5, 1.5, 0.5);
      const chimMat = new THREE.MeshStandardMaterial({ color: 0x666655, roughness: 0.95 });
      const chimney = new THREE.Mesh(chimGeo, chimMat);
      chimney.position.set(wallW / 2 - 0.5, wallH + 1.2, 0);
      chimney.castShadow = true;
      group.add(chimney);
    }

    group.position.set(x, y, z);
    group.rotation.y = rotation;
    this.scene.add(group);
  }

  createMarketArea(x, y, z) {
    const group = new THREE.Group();

    // Market stalls
    const stallColors = [0xcc8844, 0xaa6633, 0xbb7744];
    for (let i = 0; i < 3; i++) {
      const stallGroup = new THREE.Group();

      // Table
      const tableGeo = new THREE.BoxGeometry(2, 0.1, 1.2);
      const tableMat = new THREE.MeshStandardMaterial({ color: stallColors[i], roughness: 0.85 });
      const table = new THREE.Mesh(tableGeo, tableMat);
      table.position.y = 0.9;
      table.castShadow = true;
      stallGroup.add(table);

      // Legs
      [[-0.8, -0.5], [0.8, -0.5], [-0.8, 0.5], [0.8, 0.5]].forEach(([lx, lz]) => {
        const legGeo = new THREE.BoxGeometry(0.08, 0.85, 0.08);
        const leg = new THREE.Mesh(legGeo, tableMat);
        leg.position.set(lx, 0.425, lz);
        stallGroup.add(leg);
      });

      // Canopy
      const canopyGeo = new THREE.BoxGeometry(2.4, 0.05, 1.6);
      const canopyColors = [0xff4444, 0x44aa44, 0x4444ff];
      const canopyMat = new THREE.MeshStandardMaterial({ color: canopyColors[i], roughness: 0.7 });
      const canopy = new THREE.Mesh(canopyGeo, canopyMat);
      canopy.position.y = 2.2;
      canopy.castShadow = true;
      stallGroup.add(canopy);

      // Canopy poles
      [[-1, -0.7], [1, -0.7], [-1, 0.7], [1, 0.7]].forEach(([px, pz]) => {
        const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1a });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(px, 1.1, pz);
        stallGroup.add(pole);
      });

      // Items on table
      for (let j = 0; j < 4; j++) {
        const itemGeo = new THREE.BoxGeometry(0.2, 0.15, 0.2);
        const itemColors = [0xff6633, 0x33cc33, 0xffcc00, 0xcc33ff];
        const itemMat = new THREE.MeshStandardMaterial({ color: itemColors[j] });
        const item = new THREE.Mesh(itemGeo, itemMat);
        item.position.set(-0.6 + j * 0.4, 1.02, 0);
        stallGroup.add(item);
      }

      stallGroup.position.set((i - 1) * 4, 0, -5);
      group.add(stallGroup);
    }

    // Market sign
    const signGroup = new THREE.Group();
    const signPostGeo = new THREE.CylinderGeometry(0.06, 0.06, 3, 6);
    const signPostMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1a });
    const signPost = new THREE.Mesh(signPostGeo, signPostMat);
    signPost.position.y = 1.5;
    signGroup.add(signPost);

    const signBoardGeo = new THREE.BoxGeometry(2, 0.6, 0.08);
    const signBoardMat = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.8 });
    const signBoard = new THREE.Mesh(signBoardGeo, signBoardMat);
    signBoard.position.y = 2.8;
    signGroup.add(signBoard);

    // Sign text
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAZAR', 128, 44);
    const texture = new THREE.CanvasTexture(canvas);
    const textMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const textSprite = new THREE.Sprite(textMat);
    textSprite.position.y = 2.8;
    textSprite.scale.set(2, 0.5, 1);
    signGroup.add(textSprite);

    signGroup.position.set(0, 0, -8);
    group.add(signGroup);

    group.position.set(x, y, z);
    this.scene.add(group);
  }

  createWell(x, y, z) {
    const group = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.95 });

    // Well base (cylinder)
    const baseGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.8, 12);
    const base = new THREE.Mesh(baseGeo, stoneMat);
    base.position.y = 0.4;
    base.castShadow = true;
    group.add(base);

    // Water inside
    const waterGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.1, 12);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x2244aa, transparent: true, opacity: 0.7, roughness: 0.1,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.y = 0.3;
    group.add(water);

    // Roof posts
    const postMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1a });
    [-0.7, 0.7].forEach(px => {
      const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 2, 6);
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(px, 1.4, 0);
      post.castShadow = true;
      group.add(post);
    });

    // Roof beam
    const beamGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6);
    const beam = new THREE.Mesh(beamGeo, postMat);
    beam.position.y = 2.4;
    beam.rotation.z = Math.PI / 2;
    group.add(beam);

    // Small roof
    const roofGeo = new THREE.BoxGeometry(1.4, 0.08, 1);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 2.5;
    roof.castShadow = true;
    group.add(roof);

    // Bucket
    const bucketGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.2, 8);
    const bucketMat = new THREE.MeshStandardMaterial({ color: 0x8B6914 });
    const bucket = new THREE.Mesh(bucketGeo, bucketMat);
    bucket.position.set(0, 1.5, 0);
    group.add(bucket);

    group.position.set(x, y, z);
    this.scene.add(group);
  }

  createVillageFence(cx, cz) {
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.9 });
    const radius = 30;
    const segments = 36;

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const nextAngle = ((i + 1) / segments) * Math.PI * 2;

      // Skip gate area (front entrance)
      if (angle > 1.4 && angle < 1.74) continue;

      const fx = cx + Math.cos(angle) * radius;
      const fz = cz + Math.sin(angle) * radius;
      const fh = this.getHeightAt(fx, fz);

      // Fence post
      const postGeo = new THREE.CylinderGeometry(0.06, 0.08, 1.5, 6);
      const post = new THREE.Mesh(postGeo, fenceMat);
      post.position.set(fx, fh + 0.75, fz);
      post.castShadow = true;
      this.scene.add(post);

      // Fence rail
      const nx = cx + Math.cos(nextAngle) * radius;
      const nz = cz + Math.sin(nextAngle) * radius;
      const midX = (fx + nx) / 2;
      const midZ = (fz + nz) / 2;
      const midH = this.getHeightAt(midX, midZ);
      const len = Math.sqrt((nx - fx) ** 2 + (nz - fz) ** 2);

      const railGeo = new THREE.BoxGeometry(len, 0.08, 0.06);
      const rail = new THREE.Mesh(railGeo, fenceMat);
      rail.position.set(midX, midH + 0.8, midZ);
      rail.rotation.y = Math.atan2(nz - fz, nx - fx);
      this.scene.add(rail);

      // Lower rail
      const rail2 = new THREE.Mesh(railGeo, fenceMat);
      rail2.position.set(midX, midH + 0.4, midZ);
      rail2.rotation.y = Math.atan2(nz - fz, nx - fx);
      this.scene.add(rail2);
    }
  }

  createLanternPost(x, y, z) {
    const group = new THREE.Group();

    // Post
    const postGeo = new THREE.CylinderGeometry(0.05, 0.07, 2.5, 6);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5 });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.y = 1.25;
    post.castShadow = true;
    group.add(post);

    // Arm
    const armGeo = new THREE.BoxGeometry(0.5, 0.04, 0.04);
    const arm = new THREE.Mesh(armGeo, postMat);
    arm.position.set(0.25, 2.4, 0);
    group.add(arm);

    // Lantern
    const lanternGeo = new THREE.BoxGeometry(0.2, 0.3, 0.2);
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xffaa44, transparent: true, opacity: 0.8, emissive: 0xff6600, emissiveIntensity: 0.3,
    });
    const lantern = new THREE.Mesh(lanternGeo, lanternMat);
    lantern.position.set(0.5, 2.25, 0);
    group.add(lantern);

    // Light
    const light = new THREE.PointLight(0xffaa44, 1.2, 12);
    light.position.set(0.5, 2.25, 0);
    group.add(light);

    group.position.set(x, y, z);
    this.scene.add(group);
  }

  createRuins() {
    // Create abandoned structures for exploration
    const ruinCount = 8;
    for (let i = 0; i < ruinCount; i++) {
      const x = randomRange(-this.worldSize * 0.7, this.worldSize * 0.7);
      const z = randomRange(-this.worldSize * 0.7, this.worldSize * 0.7);
      const h = this.getHeightAt(x, z);

      if (h < 2 || h > 15) continue;
      const distFromCenter = Math.sqrt(x * x + z * z);
      if (distFromCenter < 40) continue;

      this.createRuin(x, h, z);
    }
  }

  createRuin(x, y, z) {
    const group = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x666655, roughness: 0.95 });

    // Broken walls
    for (let i = 0; i < 3; i++) {
      const wallGeo = new THREE.BoxGeometry(3, 1.5 + Math.random() * 1.5, 0.3);
      const wall = new THREE.Mesh(wallGeo, wallMat);
      const angle = (i / 3) * Math.PI * 2;
      wall.position.set(
        Math.cos(angle) * 3,
        0.75 + Math.random() * 0.5,
        Math.sin(angle) * 3
      );
      wall.rotation.y = angle + Math.PI / 2;
      wall.castShadow = true;
      group.add(wall);
    }

    // Some rubble
    for (let i = 0; i < 5; i++) {
      const rubbleGeo = new THREE.BoxGeometry(
        0.3 + Math.random() * 0.5,
        0.2 + Math.random() * 0.3,
        0.3 + Math.random() * 0.5
      );
      const rubble = new THREE.Mesh(rubbleGeo, wallMat);
      rubble.position.set(
        (Math.random() - 0.5) * 6,
        0.15,
        (Math.random() - 0.5) * 6
      );
      rubble.rotation.y = Math.random() * Math.PI;
      group.add(rubble);
    }

    group.position.set(x, y, z);
    this.scene.add(group);
  }

  createGrass() {
    const grassCount = 4000;
    const geo = new THREE.PlaneGeometry(0.15, 0.5);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x44aa33,
      side: THREE.DoubleSide,
      alphaTest: 0.5,
    });

    const instancedMesh = new THREE.InstancedMesh(geo, mat, grassCount);
    const dummy = new THREE.Object3D();
    let idx = 0;

    for (let i = 0; i < grassCount; i++) {
      const x = randomRange(-this.worldSize * 0.8, this.worldSize * 0.8);
      const z = randomRange(-this.worldSize * 0.8, this.worldSize * 0.8);
      const h = this.getHeightAt(x, z);
      if (h < 0.5 || h > 15) continue;
      const biome = this.getBiome(x, z);
      if (biome === 'desert') continue;

      dummy.position.set(x, h + 0.2, z);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(idx, dummy.matrix);
      idx++;
      if (idx >= grassCount) break;
    }

    instancedMesh.count = idx;
    instancedMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(instancedMesh);
  }

  createFlowers() {
    const flowerCount = 350;
    const colors = [0xff6b9d, 0xffd93d, 0xff6b35, 0xc44dff, 0x4dc9f6];

    for (let i = 0; i < flowerCount; i++) {
      const x = randomRange(-this.worldSize * 0.7, this.worldSize * 0.7);
      const z = randomRange(-this.worldSize * 0.7, this.worldSize * 0.7);
      const h = this.getHeightAt(x, z);
      if (h < 1 || h > 10) continue;

      const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x228822 });
      const stem = new THREE.Mesh(stemGeo, stemMat);

      const petalGeo = new THREE.SphereGeometry(0.08, 6, 6);
      const petalMat = new THREE.MeshStandardMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        emissive: 0x111111,
      });
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.y = 0.18;

      const flower = new THREE.Group();
      flower.add(stem);
      flower.add(petal);
      flower.position.set(x, h, z);
      this.scene.add(flower);
    }
  }

  addBuilding(position, type = 'wall') {
    let mesh;
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.9 });

    switch (type) {
      case 'wall': {
        const geo = new THREE.BoxGeometry(2, 2.5, 0.3);
        mesh = new THREE.Mesh(geo, woodMat);
        mesh.position.copy(position);
        mesh.position.y += 1.25;
        break;
      }
      case 'floor': {
        const geo = new THREE.BoxGeometry(2, 0.2, 2);
        const mat = new THREE.MeshStandardMaterial({ color: 0x9B8B75, roughness: 0.85 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(position);
        mesh.position.y += 0.1;
        break;
      }
      case 'campfire': {
        mesh = this.createCampfire();
        mesh.position.copy(position);
        break;
      }
      case 'door': {
        const geo = new THREE.BoxGeometry(1, 2.3, 0.12);
        const mat = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.8 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(position);
        mesh.position.y += 1.15;
        break;
      }
      case 'roof': {
        const geo = new THREE.BoxGeometry(2.2, 0.15, 2.2);
        const mat = new THREE.MeshStandardMaterial({ color: 0x7B5B3B, roughness: 0.85 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(position);
        mesh.position.y += 2.6;
        break;
      }
      case 'stairs': {
        mesh = this.createStairs();
        mesh.position.copy(position);
        break;
      }
      case 'window': {
        const geo = new THREE.BoxGeometry(1, 1, 0.08);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x88ccff, transparent: true, opacity: 0.4, roughness: 0.1,
        });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(position);
        mesh.position.y += 1.5;
        break;
      }
      case 'chest': {
        mesh = this.createChestMesh();
        mesh.position.copy(position);
        mesh.position.y += 0.2;
        break;
      }
      case 'workbench': {
        mesh = this.createWorkbench();
        mesh.position.copy(position);
        break;
      }
      case 'bed': {
        mesh = this.createBed();
        mesh.position.copy(position);
        break;
      }
      case 'torch': {
        mesh = this.createTorchMesh();
        mesh.position.copy(position);
        break;
      }
      case 'fence': {
        const geo = new THREE.BoxGeometry(2, 1.2, 0.12);
        mesh = new THREE.Mesh(geo, woodMat);
        mesh.position.copy(position);
        mesh.position.y += 0.6;
        break;
      }
      default: {
        const geo = new THREE.BoxGeometry(1, 1, 1);
        mesh = new THREE.Mesh(geo, woodMat);
        mesh.position.copy(position);
      }
    }

    if (mesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.buildings.push({ mesh, position: position.clone(), type });
      return mesh;
    }
    return null;
  }

  createStairs() {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.9 });

    for (let i = 0; i < 5; i++) {
      const stepGeo = new THREE.BoxGeometry(1.5, 0.15, 0.5);
      const step = new THREE.Mesh(stepGeo, mat);
      step.position.set(0, i * 0.3 + 0.075, i * 0.5 - 1);
      step.castShadow = true;
      group.add(step);
    }
    return group;
  }

  createChestMesh() {
    const group = new THREE.Group();
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.7 });

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.45), baseMat);
    base.position.y = 0.2;
    base.castShadow = true;
    group.add(base);

    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 0.47), baseMat);
    lid.position.y = 0.46;
    group.add(lid);

    const bandMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7 });
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.03, 0.02), bandMat);
    band.position.set(0, 0.4, 0.24);
    group.add(band);

    return group;
  }

  createWorkbench() {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x9B7653, roughness: 0.85 });

    // Table top
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 1), woodMat);
    top.position.y = 0.9;
    top.castShadow = true;
    group.add(top);

    // Legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x7B5633 });
    [[-0.6, -0.4], [0.6, -0.4], [-0.6, 0.4], [0.6, 0.4]].forEach(([x, z]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.85, 0.1), legMat);
      leg.position.set(x, 0.425, z);
      group.add(leg);
    });

    // Tools on top
    const toolMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6 });
    const tool = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.1), toolMat);
    tool.position.set(0.3, 0.98, 0);
    group.add(tool);

    return group;
  }

  createBed() {
    const group = new THREE.Group();

    // Frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 2), frameMat);
    frame.position.y = 0.25;
    frame.castShadow = true;
    group.add(frame);

    // Mattress
    const mattMat = new THREE.MeshStandardMaterial({ color: 0xcc4444, roughness: 0.9 });
    const matt = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 1.8), mattMat);
    matt.position.y = 0.44;
    group.add(matt);

    // Pillow
    const pillowMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.35), pillowMat);
    pillow.position.set(0, 0.5, 0.75);
    group.add(pillow);

    // Headboard
    const hb = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.1), frameMat);
    hb.position.set(0, 0.55, 1.0);
    group.add(hb);

    return group;
  }

  createTorchMesh() {
    const group = new THREE.Group();

    // Stick
    const stickGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.8, 6);
    const stickMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1a });
    const stick = new THREE.Mesh(stickGeo, stickMat);
    stick.position.y = 0.4;
    group.add(stick);

    // Flame glow
    const glowGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.8 });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.y = 0.85;
    group.add(glow);

    // Light
    const light = new THREE.PointLight(0xff6600, 1.5, 10);
    light.position.y = 0.9;
    group.add(light);

    group.userData.torchLight = light;
    group.userData.torchGlow = glow;

    return group;
  }

  createCampfire() {
    const group = new THREE.Group();

    // Stones around
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const stoneGeo = new THREE.SphereGeometry(0.15, 6, 4);
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.position.set(Math.cos(angle) * 0.5, 0.1, Math.sin(angle) * 0.5);
      stone.scale.y = 0.6;
      group.add(stone);
    }

    // Logs
    for (let i = 0; i < 3; i++) {
      const logGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.6, 6);
      const logMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1a });
      const log = new THREE.Mesh(logGeo, logMat);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = (i / 3) * Math.PI;
      log.position.y = 0.15;
      group.add(log);
    }

    // Fire light
    const fireLight = new THREE.PointLight(0xff6600, 2, 15);
    fireLight.position.y = 0.5;
    group.add(fireLight);

    // Fire glow sphere
    const glowGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff4400, transparent: true, opacity: 0.6,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.y = 0.4;
    group.add(glow);

    group.userData.fireLight = fireLight;
    group.userData.fireGlow = glow;
    group.userData.isCampfire = true;

    return group;
  }

  getNearbyTreasureChest(playerPos, range = 3) {
    for (const chest of this.treasureChests) {
      if (chest.opened) continue;
      const dist = playerPos.distanceTo(chest.position);
      if (dist < range) return chest;
    }
    return null;
  }

  openTreasureChest(chest) {
    if (chest.opened) return [];
    chest.opened = true;
    // Animate lid opening
    if (chest.mesh.children[1]) {
      chest.mesh.children[1].rotation.x = -Math.PI / 3;
      chest.mesh.children[1].position.y += 0.1;
      chest.mesh.children[1].position.z -= 0.15;
    }
    return chest.loot;
  }

  removeResource(resource) {
    const idx = this.resources.indexOf(resource);
    if (idx !== -1) {
      this.resources.splice(idx, 1);
    }
    if (resource.mesh) {
      this.scene.remove(resource.mesh);
    }
  }

  update(time) {
    // Animate water with wave effect
    if (this.water) {
      this.water.position.y = this.waterLevel + Math.sin(time * 0.5) * 0.08;
      // Gentle wave movement on water vertices
      const pos = this.water.geometry.attributes.position;
      if (pos) {
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const z = pos.getZ(i);
          const wave = Math.sin(x * 0.03 + time * 0.8) * 0.15 + 
                       Math.cos(z * 0.04 + time * 0.6) * 0.1;
          pos.setY(i, wave);
        }
        pos.needsUpdate = true;
      }
      // Subtle color shift
      this.water.material.opacity = 0.6 + Math.sin(time * 0.3) * 0.05;
    }

    // Animate campfires and torches
    this.buildings.forEach(b => {
      if (b.type === 'campfire' && b.mesh.userData.fireLight) {
        b.mesh.userData.fireLight.intensity = 1.5 + Math.sin(time * 5) * 0.5 + Math.random() * 0.3;
        if (b.mesh.userData.fireGlow) {
          b.mesh.userData.fireGlow.scale.setScalar(0.8 + Math.sin(time * 8) * 0.2);
        }
      }
      if (b.type === 'torch' && b.mesh.userData.torchLight) {
        b.mesh.userData.torchLight.intensity = 1.2 + Math.sin(time * 6) * 0.3 + Math.random() * 0.2;
        if (b.mesh.userData.torchGlow) {
          b.mesh.userData.torchGlow.scale.setScalar(0.8 + Math.sin(time * 10) * 0.15);
        }
      }
    });

    // Animate treasure chest glow
    this.treasureChests.forEach(c => {
      if (!c.opened && c.mesh.children.length > 4) {
        const glow = c.mesh.children[c.mesh.children.length - 1];
        if (glow && glow.material && glow.material.opacity !== undefined) {
          glow.material.opacity = 0.1 + Math.sin(time * 2) * 0.08;
        }
      }
    });
  }
}
