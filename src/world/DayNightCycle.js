import * as THREE from 'three';

export class DayNightCycle {
  constructor(scene) {
    this.scene = scene;
    this.timeOfDay = 0.25; // Start at morning
    this.dayDuration = 600; // 10 minutes per day
    this.dayCount = 1;
    this.isNight = false;

    this.setupLighting();
    this.setupSky();
  }

  setupLighting() {
    // Ambient light
    this.ambient = new THREE.AmbientLight(0x6688cc, 0.4);
    this.scene.add(this.ambient);

    // Sun (directional light)
    this.sun = new THREE.DirectionalLight(0xffeedd, 1.2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.width = 4096;
    this.sun.shadow.mapSize.height = 4096;
    this.sun.shadow.camera.near = 0.5;
    this.sun.shadow.camera.far = 500;
    this.sun.shadow.camera.left = -120;
    this.sun.shadow.camera.right = 120;
    this.sun.shadow.camera.top = 120;
    this.sun.shadow.camera.bottom = -120;
    this.sun.shadow.bias = -0.0005;
    this.sun.shadow.normalBias = 0.02;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    // Moon
    this.moon = new THREE.DirectionalLight(0x4466aa, 0);
    this.scene.add(this.moon);

    // Hemisphere light
    this.hemi = new THREE.HemisphereLight(0x87ceeb, 0x362907, 0.3);
    this.scene.add(this.hemi);
  }

  setupSky() {
    // Create a simple gradient sky
    const skyGeo = new THREE.SphereGeometry(800, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x0077ff) },
        bottomColor: { value: new THREE.Color(0xaaccff) },
        sunColor: { value: new THREE.Color(0xffaa44) },
        sunDir: { value: new THREE.Vector3(0, 1, 0) },
        offset: { value: 10 },
        exponent: { value: 0.6 },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform vec3 sunColor;
        uniform vec3 sunDir;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPos;
        void main() {
          float h = normalize(vWorldPos + offset).y;
          float t = max(pow(max(h, 0.0), exponent), 0.0);
          vec3 color = mix(bottomColor, topColor, t);

          // Sun glow
          vec3 dir = normalize(vWorldPos);
          float sunDot = max(dot(dir, normalize(sunDir)), 0.0);
          color += sunColor * pow(sunDot, 64.0) * 0.5;
          color += sunColor * pow(sunDot, 8.0) * 0.15;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide,
    });

    this.sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.sky);

    // Stars
    const starsGeo = new THREE.BufferGeometry();
    const starVerts = [];
    for (let i = 0; i < 2000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 450;
      starVerts.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    }
    starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, transparent: true, opacity: 0 });
    this.stars = new THREE.Points(starsGeo, starsMat);
    this.scene.add(this.stars);
  }

  update(deltaTime) {
    this.timeOfDay += deltaTime / this.dayDuration;
    if (this.timeOfDay >= 1) {
      this.timeOfDay -= 1;
      this.dayCount++;
    }

    const t = this.timeOfDay;
    const sunAngle = t * Math.PI * 2 - Math.PI / 2;

    // Sun position
    const sunX = Math.cos(sunAngle) * 100;
    const sunY = Math.sin(sunAngle) * 100;
    this.sun.position.set(sunX, sunY, 50);
    this.sun.target.position.set(0, 0, 0);

    // Moon opposite to sun
    this.moon.position.set(-sunX, -sunY, -50);

    // Calculate light intensity based on time
    const dayFactor = Math.max(0, Math.sin(sunAngle + Math.PI / 2));
    const nightFactor = 1 - dayFactor;
    this.isNight = dayFactor < 0.2;

    // Sun intensity
    this.sun.intensity = dayFactor * 1.5;
    this.sun.color.setHSL(0.1, 0.5 + dayFactor * 0.3, 0.5 + dayFactor * 0.3);

    // Moon intensity
    this.moon.intensity = nightFactor * 0.3;

    // Ambient
    this.ambient.intensity = 0.15 + dayFactor * 0.4;
    this.ambient.color.lerpColors(
      new THREE.Color(0x112244),
      new THREE.Color(0x8899bb),
      dayFactor
    );

    // Hemisphere
    this.hemi.intensity = 0.1 + dayFactor * 0.3;

    // Sunset factor (used by sky and fog)
    const sunsetFactor = Math.max(0, 1 - Math.abs(t - 0.75) * 8) + Math.max(0, 1 - Math.abs(t - 0.25) * 8);

    // Sky colors
    if (this.sky) {
      const skyUniforms = this.sky.material.uniforms;

      skyUniforms.topColor.value.lerpColors(
        new THREE.Color(0x000011),
        new THREE.Color(0x0055cc),
        dayFactor
      );
      if (sunsetFactor > 0) {
        skyUniforms.topColor.value.lerp(new THREE.Color(0xff4400), sunsetFactor * 0.3);
      }

      skyUniforms.bottomColor.value.lerpColors(
        new THREE.Color(0x000008),
        new THREE.Color(0xaaddff),
        dayFactor
      );
      if (sunsetFactor > 0) {
        skyUniforms.bottomColor.value.lerp(new THREE.Color(0xff6633), sunsetFactor * 0.5);
      }

      skyUniforms.sunDir.value.set(sunX, sunY, 50).normalize();

      const sunColorIntensity = dayFactor > 0.1 ? 1 : 0;
      skyUniforms.sunColor.value.setHSL(0.08, 0.8, 0.6 * sunColorIntensity);
    }

    // Stars
    if (this.stars) {
      this.stars.material.opacity = Math.max(0, nightFactor - 0.3) * 1.5;
    }

    // Fog
    if (this.scene.fog) {
      this.scene.fog.color.lerpColors(
        new THREE.Color(0x050510),
        new THREE.Color(0x88bbee),
        dayFactor
      );
      // Adjust fog density based on time - thicker at dawn/dusk
      const baseDensity = 0.0015;
      const sunsetBonus = sunsetFactor * 0.001;
      const nightBonus = nightFactor * 0.0005;
      this.scene.fog.density = baseDensity + sunsetBonus + nightBonus;
    }
  }

  getDayCount() { return this.dayCount; }
  getTimeString() {
    const hours = Math.floor(this.timeOfDay * 24);
    const minutes = Math.floor((this.timeOfDay * 24 - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}
