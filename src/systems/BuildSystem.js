// ===== GELİŞMİŞ İNŞA SİSTEMİ =====
import * as THREE from 'three';
import { ITEMS } from './InventorySystem.js';

export class BuildSystem {
  constructor(scene, camera, worldGenerator, inventory) {
    this.scene = scene;
    this.camera = camera;
    this.world = worldGenerator;
    this.inventory = inventory;
    this.active = false;
    this.preview = null;
    this.previewRotation = 0;
    this.currentBuildType = null;
  }

  toggle() {
    this.active = !this.active;
    if (this.active) {
      this.updateBuildType();
    } else {
      this.removePreview();
    }
    return this.active;
  }

  updateBuildType() {
    const item = this.inventory.getActiveItem();
    if (!item) {
      this.active = false;
      this.removePreview();
      return;
    }

    const def = ITEMS[item.id];
    if (!def || def.type !== 'building') {
      this.active = false;
      this.removePreview();
      return;
    }

    this.currentBuildType = def.buildType;
    this.createPreview(def.buildType);
  }

  createPreview(type) {
    this.removePreview();

    let geo, mat;
    const previewColor = 0x88aa66;
    const previewMat = () => new THREE.MeshStandardMaterial({
      color: previewColor, transparent: true, opacity: 0.5,
    });

    switch (type) {
      case 'wall':
        geo = new THREE.BoxGeometry(2, 2.5, 0.3);
        mat = previewMat();
        break;
      case 'floor':
        geo = new THREE.BoxGeometry(2, 0.2, 2);
        mat = previewMat();
        break;
      case 'campfire':
        geo = new THREE.CylinderGeometry(0.5, 0.6, 0.3, 8);
        mat = new THREE.MeshStandardMaterial({ color: 0xffaa44, transparent: true, opacity: 0.5 });
        break;
      case 'door':
        geo = new THREE.BoxGeometry(1, 2.3, 0.15);
        mat = new THREE.MeshStandardMaterial({ color: 0x8B6914, transparent: true, opacity: 0.5 });
        break;
      case 'roof':
        geo = new THREE.BoxGeometry(2.2, 0.15, 2.2);
        mat = previewMat();
        break;
      case 'stairs':
        geo = new THREE.BoxGeometry(1.5, 0.2, 2.5);
        mat = previewMat();
        break;
      case 'window':
        geo = new THREE.BoxGeometry(1, 1, 0.1);
        mat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.4 });
        break;
      case 'chest':
        geo = new THREE.BoxGeometry(0.8, 0.6, 0.5);
        mat = new THREE.MeshStandardMaterial({ color: 0xaa8844, transparent: true, opacity: 0.5 });
        break;
      case 'workbench':
        geo = new THREE.BoxGeometry(1.5, 0.9, 1);
        mat = new THREE.MeshStandardMaterial({ color: 0x9B7653, transparent: true, opacity: 0.5 });
        break;
      case 'bed':
        geo = new THREE.BoxGeometry(1.2, 0.5, 2);
        mat = new THREE.MeshStandardMaterial({ color: 0xcc4444, transparent: true, opacity: 0.5 });
        break;
      case 'torch':
        geo = new THREE.CylinderGeometry(0.05, 0.07, 1, 6);
        mat = new THREE.MeshStandardMaterial({ color: 0xffaa22, transparent: true, opacity: 0.5 });
        break;
      case 'fence':
        geo = new THREE.BoxGeometry(2, 1.2, 0.15);
        mat = previewMat();
        break;
      default:
        geo = new THREE.BoxGeometry(1, 1, 1);
        mat = previewMat();
    }

    if (geo && mat) {
      this.preview = new THREE.Mesh(geo, mat);
      this.scene.add(this.preview);
    }
  }

  removePreview() {
    if (this.preview) {
      this.scene.remove(this.preview);
      this.preview.geometry.dispose();
      this.preview.material.dispose();
      this.preview = null;
    }
  }

  rotate(delta) {
    this.previewRotation += delta * 0.3;
  }

  update() {
    if (!this.active || !this.preview) return;

    // Position preview in front of camera
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const pos = this.camera.position.clone().add(forward.multiplyScalar(4));
    const h = this.world.getHeightAt(pos.x, pos.z);

    // Adjust height based on build type
    switch (this.currentBuildType) {
      case 'wall': pos.y = h + 1.25; break;
      case 'floor': pos.y = h + 0.1; break;
      case 'door': pos.y = h + 1.15; break;
      case 'roof': pos.y = h + 2.6; break;
      case 'stairs': pos.y = h + 0.5; break;
      case 'window': pos.y = h + 1.5; break;
      case 'chest': pos.y = h + 0.3; break;
      case 'workbench': pos.y = h + 0.45; break;
      case 'bed': pos.y = h + 0.25; break;
      case 'torch': pos.y = h + 0.5; break;
      case 'fence': pos.y = h + 0.6; break;
      default: pos.y = h; break;
    }

    // Snap to grid
    pos.x = Math.round(pos.x);
    pos.z = Math.round(pos.z);

    this.preview.position.copy(pos);
    this.preview.rotation.y = this.previewRotation;
  }

  place(audioManager) {
    if (!this.active || !this.preview || !this.currentBuildType) return false;

    const item = this.inventory.getActiveItem();
    if (!item) return false;
    const def = ITEMS[item.id];
    if (!def || def.type !== 'building') return false;

    // Place the building
    const buildPos = this.preview.position.clone();
    buildPos.y = this.world.getHeightAt(buildPos.x, buildPos.z);

    const mesh = this.world.addBuilding(buildPos, this.currentBuildType);
    if (mesh) {
      mesh.rotation.y = this.previewRotation;
      // Remove from inventory
      item.count--;
      if (item.count <= 0) {
        this.inventory.slots[this.inventory.activeSlot] = null;
        this.active = false;
        this.removePreview();
      }
      if (audioManager) audioManager.playBuild();
      return true;
    }
    return false;
  }

  deactivate() {
    this.active = false;
    this.removePreview();
  }
}
