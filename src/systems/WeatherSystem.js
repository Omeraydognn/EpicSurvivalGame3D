// ===== HAVA DURUMU & SICAKLIK SİSTEMİ =====
import * as THREE from 'three';

export class WeatherSystem {
  constructor(scene) {
    this.scene = scene;
    this.currentWeather = 'clear'; // clear, rain, snow, storm, fog
    this.weatherTimer = 0;
    this.weatherDuration = 120; // seconds
    this.temperature = 20; // celsius
    this.baseTemperature = 20;
    this.windSpeed = 0;
    this.windDirection = new THREE.Vector2(1, 0);

    // Rain particles
    this.rainParticles = null;
    this.snowParticles = null;
    this.rainCount = 3000;
    this.snowCount = 1500;

    // Lightning
    this.lightningTimer = 0;
    this.lightningFlash = null;

    // Weather transition
    this.transitionProgress = 1;
    this.nextWeather = null;

    this.createRainSystem();
    this.createSnowSystem();
    this.createLightning();
  }

  createRainSystem() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.rainCount * 3);
    const velocities = new Float32Array(this.rainCount);

    for (let i = 0; i < this.rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = Math.random() * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      velocities[i] = 15 + Math.random() * 10;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.rainVelocities = velocities;

    const mat = new THREE.PointsMaterial({
      color: 0x8899cc,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });

    this.rainParticles = new THREE.Points(geo, mat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  createSnowSystem() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.snowCount * 3);
    const velocities = new Float32Array(this.snowCount * 3);

    for (let i = 0; i < this.snowCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = Math.random() * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      velocities[i * 3] = (Math.random() - 0.5) * 2;
      velocities[i * 3 + 1] = 1 + Math.random() * 2;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.snowVelocities = velocities;

    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.25,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });

    this.snowParticles = new THREE.Points(geo, mat);
    this.snowParticles.visible = false;
    this.scene.add(this.snowParticles);
  }

  createLightning() {
    this.lightningFlash = new THREE.AmbientLight(0xccccff, 0);
    this.scene.add(this.lightningFlash);
  }

  setWeather(weather) {
    if (weather === this.currentWeather) return;
    this.nextWeather = weather;
    this.transitionProgress = 0;
  }

  getRandomWeather(biome = 'forest', isNight = false) {
    const weights = {
      forest: { clear: 0.5, rain: 0.25, storm: 0.1, fog: 0.15 },
      desert: { clear: 0.8, storm: 0.1, fog: 0.1 },
      snow: { clear: 0.3, snow: 0.5, fog: 0.2 },
      swamp: { clear: 0.2, rain: 0.35, fog: 0.35, storm: 0.1 },
    };

    const w = weights[biome] || weights.forest;
    let r = Math.random();
    for (const [weather, prob] of Object.entries(w)) {
      r -= prob;
      if (r <= 0) return weather;
    }
    return 'clear';
  }

  update(deltaTime, playerPos, dayNight) {
    // Weather timer
    this.weatherTimer += deltaTime;
    if (this.weatherTimer >= this.weatherDuration) {
      this.weatherTimer = 0;
      this.weatherDuration = 60 + Math.random() * 180;
      const newWeather = this.getRandomWeather('forest', dayNight?.isNight);
      this.setWeather(newWeather);
    }

    // Transition
    if (this.nextWeather && this.transitionProgress < 1) {
      this.transitionProgress += deltaTime * 0.2;
      if (this.transitionProgress >= 1) {
        this.transitionProgress = 1;
        this.currentWeather = this.nextWeather;
        this.nextWeather = null;
      }
    }

    // Update temperature based on weather and time
    let targetTemp = this.baseTemperature;
    if (dayNight) {
      targetTemp += dayNight.isNight ? -8 : 5;
    }
    switch (this.currentWeather) {
      case 'rain': targetTemp -= 5; break;
      case 'snow': targetTemp = -5; break;
      case 'storm': targetTemp -= 10; break;
      case 'fog': targetTemp -= 2; break;
    }
    this.temperature += (targetTemp - this.temperature) * deltaTime * 0.1;

    // Wind
    this.windSpeed = this.currentWeather === 'storm' ? 15 : this.currentWeather === 'rain' ? 5 : 1;

    // Update particles
    this.updateRain(deltaTime, playerPos);
    this.updateSnow(deltaTime, playerPos);
    this.updateLightning(deltaTime);

    // Visibility
    const isRaining = this.currentWeather === 'rain' || this.currentWeather === 'storm';
    const isSnowing = this.currentWeather === 'snow';
    this.rainParticles.visible = isRaining;
    this.snowParticles.visible = isSnowing;
  }

  updateRain(deltaTime, playerPos) {
    if (!this.rainParticles.visible) return;

    const positions = this.rainParticles.geometry.attributes.position.array;
    for (let i = 0; i < this.rainCount; i++) {
      positions[i * 3 + 1] -= this.rainVelocities[i] * deltaTime;
      positions[i * 3] += this.windSpeed * 0.3 * deltaTime;

      if (positions[i * 3 + 1] < -2) {
        positions[i * 3] = playerPos.x + (Math.random() - 0.5) * 100;
        positions[i * 3 + 1] = 30 + Math.random() * 20;
        positions[i * 3 + 2] = playerPos.z + (Math.random() - 0.5) * 100;
      }
    }
    this.rainParticles.geometry.attributes.position.needsUpdate = true;
  }

  updateSnow(deltaTime, playerPos) {
    if (!this.snowParticles.visible) return;

    const positions = this.snowParticles.geometry.attributes.position.array;
    for (let i = 0; i < this.snowCount; i++) {
      positions[i * 3] += this.snowVelocities[i * 3] * deltaTime;
      positions[i * 3 + 1] -= this.snowVelocities[i * 3 + 1] * deltaTime;
      positions[i * 3 + 2] += this.snowVelocities[i * 3 + 2] * deltaTime;

      // Drift
      positions[i * 3] += Math.sin(performance.now() * 0.001 + i) * 0.02;

      if (positions[i * 3 + 1] < -1) {
        positions[i * 3] = playerPos.x + (Math.random() - 0.5) * 100;
        positions[i * 3 + 1] = 25 + Math.random() * 15;
        positions[i * 3 + 2] = playerPos.z + (Math.random() - 0.5) * 100;
      }
    }
    this.snowParticles.geometry.attributes.position.needsUpdate = true;
  }

  updateLightning(deltaTime) {
    if (this.currentWeather !== 'storm') {
      this.lightningFlash.intensity = 0;
      return;
    }

    this.lightningTimer -= deltaTime;
    if (this.lightningTimer <= 0) {
      this.lightningTimer = 3 + Math.random() * 10;
      this.lightningFlash.intensity = 3;
      setTimeout(() => { this.lightningFlash.intensity = 0; }, 100);
      setTimeout(() => { this.lightningFlash.intensity = 2; }, 200);
      setTimeout(() => { this.lightningFlash.intensity = 0; }, 250);
    }
  }

  getTemperatureEffect() {
    // Returns damage rate from extreme temperatures
    if (this.temperature < -10) return { type: 'cold', rate: 3 };
    if (this.temperature < 0) return { type: 'cold', rate: 1 };
    if (this.temperature > 40) return { type: 'heat', rate: 2 };
    if (this.temperature > 35) return { type: 'heat', rate: 0.5 };
    return { type: 'normal', rate: 0 };
  }

  getWeatherIcon() {
    switch (this.currentWeather) {
      case 'clear': return '☀️';
      case 'rain': return '🌧️';
      case 'snow': return '🌨️';
      case 'storm': return '⛈️';
      case 'fog': return '🌫️';
      default: return '☀️';
    }
  }

  getTemperatureString() {
    return `${Math.round(this.temperature)}°C`;
  }
}
