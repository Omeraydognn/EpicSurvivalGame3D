// ===== ARAÇ SİSTEMİ =====
import * as THREE from 'three';
import { clamp } from '../utils/math.js';

// Vehicle definitions
const VEHICLE_DEFS = {
  car: {
    name: 'Arazi Aracı',
    speed: 25,
    turnSpeed: 2.5,
    health: 200,
    fuel: 100,
    fuelConsumption: 2, // per second
    seats: 2,
    icon: '🚗',
  },
  boat: {
    name: 'Motor Tekne',
    speed: 15,
    turnSpeed: 1.8,
    health: 150,
    fuel: 80,
    fuelConsumption: 1.5,
    seats: 3,
    icon: '🚤',
  },
  raft: {
    name: 'Sal',
    speed: 6,
    turnSpeed: 1.2,
    health: 80,
    fuel: Infinity,
    fuelConsumption: 0,
    seats: 2,
    icon: '🛶',
  },
};

export { VEHICLE_DEFS };

export class Vehicle {
  constructor(scene, position, type = 'car') {
    this.scene = scene;
    this.type = type;
    this.def = VEHICLE_DEFS[type];
    this.position = position.clone();
    this.rotation = 0;
    this.velocity = new THREE.Vector3();
    this.speed = 0;
    this.health = this.def.health;
    this.maxHealth = this.def.health;
    this.fuel = this.def.fuel;
    this.maxFuel = this.def.fuel;
    this.occupied = false;
    this.driver = null;

    this.createMesh();
  }

  createMesh() {
    this.mesh = new THREE.Group();

    if (this.type === 'car') {
      this.createCarMesh();
    } else if (this.type === 'boat') {
      this.createBoatMesh();
    } else if (this.type === 'raft') {
      this.createRaftMesh();
    }

    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }

  createCarMesh() {
    // Body
    const bodyGeo = new THREE.BoxGeometry(2, 0.8, 4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.3, metalness: 0.6 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    body.castShadow = true;
    this.mesh.add(body);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.8, 0.7, 2);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.2, metalness: 0.4, transparent: true, opacity: 0.7 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.35, -0.3);
    cabin.castShadow = true;
    this.mesh.add(cabin);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });

    const wheelPositions = [
      [-1.1, 0.35, 1.3], [1.1, 0.35, 1.3],
      [-1.1, 0.35, -1.3], [1.1, 0.35, -1.3],
    ];

    this.wheels = [];
    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(...pos);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      this.mesh.add(wheel);
      this.wheels.push(wheel);
    });

    // Headlights
    const lightGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
    [-0.7, 0.7].forEach(x => {
      const light = new THREE.Mesh(lightGeo, lightMat);
      light.position.set(x, 0.7, 2.05);
      this.mesh.add(light);
    });

    // Headlight beams
    this.headlight = new THREE.SpotLight(0xffffcc, 2, 30, Math.PI / 6, 0.5);
    this.headlight.position.set(0, 0.8, 2.1);
    this.headlight.target.position.set(0, 0, 12);
    this.mesh.add(this.headlight);
    this.mesh.add(this.headlight.target);
  }

  createBoatMesh() {
    // Hull
    const hullShape = new THREE.Shape();
    hullShape.moveTo(-1.2, 0);
    hullShape.lineTo(-1, -0.6);
    hullShape.lineTo(1, -0.6);
    hullShape.lineTo(1.2, 0);
    hullShape.lineTo(1, 0.2);
    hullShape.lineTo(-1, 0.2);
    hullShape.closePath();

    const hullGeo = new THREE.BoxGeometry(2.4, 0.8, 5);
    const hullMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.4, metalness: 0.3 });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 0.2;
    hull.castShadow = true;
    this.mesh.add(hull);

    // Bow (pointed front)
    const bowGeo = new THREE.ConeGeometry(1.2, 1.5, 4);
    const bow = new THREE.Mesh(bowGeo, hullMat);
    bow.rotation.x = -Math.PI / 2;
    bow.position.set(0, 0.2, 3.2);
    bow.castShadow = true;
    this.mesh.add(bow);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.8, 1.2, 1.5);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x2244aa, roughness: 0.5 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.0, -0.5);
    cabin.castShadow = true;
    this.mesh.add(cabin);

    // Motor
    const motorGeo = new THREE.BoxGeometry(0.6, 0.4, 0.8);
    const motorMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 });
    const motor = new THREE.Mesh(motorGeo, motorMat);
    motor.position.set(0, 0.3, -2.8);
    this.mesh.add(motor);
  }

  createRaftMesh() {
    // Logs
    const logGeo = new THREE.CylinderGeometry(0.18, 0.2, 4, 8);
    const logMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });

    for (let i = -2; i <= 2; i++) {
      const log = new THREE.Mesh(logGeo, logMat);
      log.rotation.z = Math.PI / 2;
      log.position.set(i * 0.45, 0.1, 0);
      log.castShadow = true;
      this.mesh.add(log);
    }

    // Cross planks
    const plankGeo = new THREE.BoxGeometry(2.5, 0.08, 0.3);
    const plankMat = new THREE.MeshStandardMaterial({ color: 0x9B7653, roughness: 0.85 });
    [-1.5, 0, 1.5].forEach(z => {
      const plank = new THREE.Mesh(plankGeo, plankMat);
      plank.position.set(0, 0.3, z);
      this.mesh.add(plank);
    });

    // Sail mast
    const mastGeo = new THREE.CylinderGeometry(0.05, 0.06, 3, 6);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1a });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(0, 1.7, 0);
    this.mesh.add(mast);

    // Sail
    const sailGeo = new THREE.PlaneGeometry(1.5, 2);
    const sailMat = new THREE.MeshStandardMaterial({ color: 0xeeeecc, side: THREE.DoubleSide, roughness: 0.9 });
    const sail = new THREE.Mesh(sailGeo, sailMat);
    sail.position.set(0.8, 2.2, 0);
    sail.rotation.y = Math.PI / 4;
    this.mesh.add(sail);
    this.sail = sail;
  }

  enter(player) {
    this.occupied = true;
    this.driver = player;
    player.isInVehicle = true;
    player.currentVehicle = this;
  }

  exit(player) {
    this.occupied = false;
    this.driver = null;
    this.speed = 0;
    if (player) {
      player.isInVehicle = false;
      player.currentVehicle = null;
      // Position player beside vehicle
      const sideOffset = new THREE.Vector3(2.5, 0, 0);
      sideOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation);
      player.position.copy(this.position).add(sideOffset);
      player.position.y += 2;
    }
  }

  update(deltaTime, keys, worldGenerator) {
    if (!this.occupied) {
      // Bobbing animation for water vehicles
      if (this.type !== 'car') {
        this.mesh.position.y = this.position.y + Math.sin(performance.now() * 0.002) * 0.15;
        this.mesh.rotation.z = Math.sin(performance.now() * 0.001) * 0.03;
      }
      return;
    }

    // Fuel consumption
    if (this.fuel !== Infinity && Math.abs(this.speed) > 0.1) {
      this.fuel -= this.def.fuelConsumption * deltaTime;
      if (this.fuel <= 0) {
        this.fuel = 0;
        this.speed *= 0.95;
      }
    }

    // Controls
    const maxSpeed = this.def.speed;
    const accel = this.type === 'car' ? 12 : 6;
    const decel = this.type === 'car' ? 8 : 3;

    if (keys['KeyW']) {
      this.speed = Math.min(this.speed + accel * deltaTime, maxSpeed);
    } else if (keys['KeyS']) {
      this.speed = Math.max(this.speed - accel * deltaTime, -maxSpeed * 0.3);
    } else {
      // Friction
      if (Math.abs(this.speed) > 0.1) {
        this.speed -= Math.sign(this.speed) * decel * deltaTime;
      } else {
        this.speed = 0;
      }
    }

    // Turning
    if (Math.abs(this.speed) > 0.5) {
      const turnFactor = this.def.turnSpeed * (this.speed > 0 ? 1 : -1);
      if (keys['KeyA']) this.rotation += turnFactor * deltaTime;
      if (keys['KeyD']) this.rotation -= turnFactor * deltaTime;
    }

    // Apply movement
    const forward = new THREE.Vector3(
      -Math.sin(this.rotation),
      0,
      -Math.cos(this.rotation)
    );

    this.position.x += forward.x * this.speed * deltaTime;
    this.position.z += forward.z * this.speed * deltaTime;

    // Terrain/water handling
    const h = worldGenerator.getHeightAt(this.position.x, this.position.z);

    if (this.type === 'car') {
      // Car stays on land
      if (h < worldGenerator.waterLevel) {
        this.speed *= 0.5;
        this.position.x -= forward.x * this.speed * deltaTime;
        this.position.z -= forward.z * this.speed * deltaTime;
      }
      this.position.y = Math.max(h, worldGenerator.waterLevel) + 0.35;
    } else {
      // Boats stay on water
      if (h > worldGenerator.waterLevel + 0.5 && this.type === 'boat') {
        this.speed *= 0.3;
        this.position.x -= forward.x * this.speed * deltaTime;
        this.position.z -= forward.z * this.speed * deltaTime;
      }
      this.position.y = worldGenerator.waterLevel + 0.2;
    }

    // World bounds
    const bound = worldGenerator.worldSize * 0.95;
    this.position.x = clamp(this.position.x, -bound, bound);
    this.position.z = clamp(this.position.z, -bound, bound);

    // Update mesh
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;

    // Wheel rotation for car
    if (this.type === 'car' && this.wheels) {
      this.wheels.forEach(w => {
        w.rotation.x += this.speed * deltaTime * 2;
      });
    }

    // Bobbing for boats
    if (this.type !== 'car') {
      this.mesh.position.y += Math.sin(performance.now() * 0.003) * 0.1;
      this.mesh.rotation.z = Math.sin(performance.now() * 0.002) * 0.04;
      this.mesh.rotation.x = Math.sin(performance.now() * 0.0015) * 0.02;
    }

    // Sail animation for raft
    if (this.type === 'raft' && this.sail) {
      this.sail.rotation.y = Math.PI / 4 + Math.sin(performance.now() * 0.001) * 0.2;
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.destroy();
    }
  }

  destroy() {
    if (this.driver) {
      this.exit(this.driver);
    }
    this.scene.remove(this.mesh);
  }

  refuel(amount) {
    if (this.fuel === Infinity) return;
    this.fuel = Math.min(this.maxFuel, this.fuel + amount);
  }
}

export class VehicleManager {
  constructor(scene, worldGenerator) {
    this.scene = scene;
    this.world = worldGenerator;
    this.vehicles = [];
  }

  spawnVehicle(position, type) {
    const vehicle = new Vehicle(this.scene, position, type);
    this.vehicles.push(vehicle);
    return vehicle;
  }

  spawnInitialVehicles() {
    // Spawn vehicles around the larger world
    const carPositions = [
      new THREE.Vector3(40, 0, 30),
      new THREE.Vector3(-80, 0, 100),
      new THREE.Vector3(120, 0, -60),
      new THREE.Vector3(-120, 0, -100),
      new THREE.Vector3(80, 0, 80),
    ];

    carPositions.forEach(pos => {
      const h = this.world.getHeightAt(pos.x, pos.z);
      if (h > this.world.waterLevel + 1) {
        pos.y = h + 0.5;
        this.spawnVehicle(pos, 'car');
      }
    });

    // Spawn boats near water
    const boatPositions = [
      new THREE.Vector3(30, 0, -120),
      new THREE.Vector3(-90, 0, -80),
      new THREE.Vector3(-150, 0, 50),
    ];

    boatPositions.forEach(pos => {
      const h = this.world.getHeightAt(pos.x, pos.z);
      if (h < this.world.waterLevel + 2) {
        pos.y = this.world.waterLevel + 0.3;
        this.spawnVehicle(pos, 'boat');
      }
    });

    // Spawn rafts
    const raftPositions = [
      new THREE.Vector3(-40, this.world.waterLevel + 0.2, -70),
      new THREE.Vector3(60, this.world.waterLevel + 0.2, -100),
    ];
    raftPositions.forEach(pos => {
      this.spawnVehicle(pos, 'raft');
    });
  }

  getNearbyVehicle(playerPos, range = 5) {
    let closest = null;
    let closestDist = range;

    for (const v of this.vehicles) {
      if (v.health <= 0) continue;
      const dist = playerPos.distanceTo(v.position);
      if (dist < closestDist) {
        closestDist = dist;
        closest = v;
      }
    }

    return closest;
  }

  update(deltaTime, keys, worldGenerator) {
    for (const v of this.vehicles) {
      v.update(deltaTime, keys, worldGenerator);
    }
  }

  reset() {
    this.vehicles.forEach(v => {
      if (v.mesh.parent) this.scene.remove(v.mesh);
    });
    this.vehicles = [];
  }
}
