import { ITEMS, RECIPES } from '../systems/InventorySystem.js';

export class UIManager {
  constructor() {
    this.elements = {};
    this.cacheElements();
  }

  cacheElements() {
    const ids = [
      'loading-screen', 'main-menu', 'game-hud', 'inventory-panel',
      'death-screen', 'pause-menu', 'health-bar', 'hunger-bar', 'thirst-bar',
      'health-text', 'hunger-text', 'thirst-text', 'day-icon', 'day-text',
      'score-value', 'interaction-text', 'damage-overlay', 'build-mode',
      'inventory-grid', 'crafting-recipes', 'death-score', 'death-days',
      'controls-panel', 'minimap',
      // New elements
      'xp-bar', 'level-text', 'stamina-bar', 'stamina-text',
      'weather-icon', 'temp-text', 'vehicle-hud', 'vehicle-speed',
      'vehicle-fuel', 'skill-panel', 'xp-popup', 'armor-text',
      'oxygen-bar', 'oxygen-text', 'oxygen-bar-container',
      'village-indicator', 'village-distance',
    ];
    ids.forEach(id => {
      this.elements[id] = document.getElementById(id);
    });
  }

  show(id) {
    const el = this.elements[id] || document.getElementById(id);
    if (el) el.style.display = '';
  }

  hide(id) {
    const el = this.elements[id] || document.getElementById(id);
    if (el) el.style.display = 'none';
  }

  showLoading() {
    this.show('loading-screen');
    this.hide('main-menu');
    this.hide('game-hud');
  }

  showMenu() {
    this.hide('loading-screen');
    this.show('main-menu');
    this.hide('game-hud');
    this.hide('death-screen');
    this.hide('pause-menu');
    this.hide('inventory-panel');
    this.hide('skill-panel');
    document.body.style.cursor = 'auto';
  }

  showGame() {
    this.hide('loading-screen');
    this.hide('main-menu');
    this.show('game-hud');
    this.hide('death-screen');
    this.hide('pause-menu');
    this.hide('inventory-panel');
    this.hide('skill-panel');
    document.body.style.cursor = 'none';
  }

  showDeath(score, days, level) {
    this.show('death-screen');
    this.hide('game-hud');
    if (this.elements['death-score']) this.elements['death-score'].textContent = `Puan: ${score}`;
    if (this.elements['death-days']) this.elements['death-days'].textContent = `Hayatta kalınan gün: ${days}`;
    const deathLevel = document.getElementById('death-level');
    if (deathLevel) deathLevel.textContent = `Seviye: ${level || 1}`;
    document.body.style.cursor = 'auto';
  }

  showPause() {
    this.show('pause-menu');
    document.body.style.cursor = 'auto';
  }

  hidePause() {
    this.hide('pause-menu');
    document.body.style.cursor = 'none';
  }

  toggleInventory(inventory) {
    const panel = this.elements['inventory-panel'];
    if (!panel) return false;
    const visible = panel.style.display !== 'none';
    if (visible) {
      this.hide('inventory-panel');
      document.body.style.cursor = 'none';
      return false;
    } else {
      this.show('inventory-panel');
      document.body.style.cursor = 'auto';
      this.updateInventoryUI(inventory);
      return true;
    }
  }

  isInventoryOpen() {
    const panel = this.elements['inventory-panel'];
    return panel && panel.style.display !== 'none';
  }

  updateHUD(player, dayNight, inventory, levelSystem, weatherSystem) {
    // Status bars
    if (this.elements['health-bar']) {
      this.elements['health-bar'].style.width = `${(player.health / player.maxHealth) * 100}%`;
    }
    if (this.elements['hunger-bar']) {
      this.elements['hunger-bar'].style.width = `${(player.hunger / player.maxHunger) * 100}%`;
    }
    if (this.elements['thirst-bar']) {
      this.elements['thirst-bar'].style.width = `${(player.thirst / player.maxThirst) * 100}%`;
    }
    if (this.elements['stamina-bar']) {
      this.elements['stamina-bar'].style.width = `${(player.stamina / player.maxStamina) * 100}%`;
    }
    if (this.elements['health-text']) {
      this.elements['health-text'].textContent = Math.ceil(player.health);
    }
    if (this.elements['hunger-text']) {
      this.elements['hunger-text'].textContent = Math.ceil(player.hunger);
    }
    if (this.elements['thirst-text']) {
      this.elements['thirst-text'].textContent = Math.ceil(player.thirst);
    }
    if (this.elements['stamina-text']) {
      this.elements['stamina-text'].textContent = Math.ceil(player.stamina);
    }

    // Oxygen bar (only show when underwater or recovering)
    if (this.elements['oxygen-bar-container']) {
      if (player.oxygen < player.maxOxygen) {
        this.elements['oxygen-bar-container'].style.display = '';
        if (this.elements['oxygen-bar']) {
          this.elements['oxygen-bar'].style.width = `${(player.oxygen / player.maxOxygen) * 100}%`;
        }
        if (this.elements['oxygen-text']) {
          this.elements['oxygen-text'].textContent = Math.ceil(player.oxygen);
        }
      } else {
        this.elements['oxygen-bar-container'].style.display = 'none';
      }
    }

    // Armor display
    if (this.elements['armor-text']) {
      const defense = inventory.getArmorDefense();
      this.elements['armor-text'].textContent = defense > 0 ? `🛡️ ${defense}` : '';
    }

    // Day/Night
    if (dayNight) {
      if (this.elements['day-icon']) {
        this.elements['day-icon'].textContent = dayNight.isNight ? '🌙' : '☀️';
      }
      if (this.elements['day-text']) {
        this.elements['day-text'].textContent = `Gün ${dayNight.getDayCount()} - ${dayNight.getTimeString()}`;
      }
    }

    // Weather
    if (weatherSystem) {
      if (this.elements['weather-icon']) {
        this.elements['weather-icon'].textContent = weatherSystem.getWeatherIcon();
      }
      if (this.elements['temp-text']) {
        this.elements['temp-text'].textContent = weatherSystem.getTemperatureString();
      }
    }

    // XP / Level
    if (levelSystem) {
      if (this.elements['xp-bar']) {
        this.elements['xp-bar'].style.width = `${levelSystem.getXpProgress() * 100}%`;
      }
      if (this.elements['level-text']) {
        this.elements['level-text'].textContent = `Lv.${levelSystem.level}`;
      }
    }

    // Score
    if (this.elements['score-value']) {
      this.elements['score-value'].textContent = player.score;
    }

    // Vehicle HUD
    if (player.isInVehicle && player.currentVehicle) {
      this.showVehicleHUD(player.currentVehicle);
    } else {
      this.hideVehicleHUD();
    }

    // Quick slots
    this.updateQuickSlots(inventory);
  }

  showVehicleHUD(vehicle) {
    const hud = this.elements['vehicle-hud'];
    if (hud) hud.style.display = '';
    if (this.elements['vehicle-speed']) {
      this.elements['vehicle-speed'].textContent = `${Math.abs(Math.round(vehicle.speed))} km/h`;
    }
    if (this.elements['vehicle-fuel']) {
      const fuelText = vehicle.fuel === Infinity ? '∞' : `${Math.round(vehicle.fuel)}%`;
      this.elements['vehicle-fuel'].textContent = fuelText;
    }
  }

  hideVehicleHUD() {
    const hud = this.elements['vehicle-hud'];
    if (hud) hud.style.display = 'none';
  }

  showXpPopup(xp, levelUp = false) {
    const popup = this.elements['xp-popup'];
    if (!popup) return;

    popup.textContent = levelUp ? `⬆️ SEVİYE ATLADI! +${xp} XP` : `+${xp} XP`;
    popup.className = 'xp-popup show' + (levelUp ? ' level-up' : '');

    setTimeout(() => {
      popup.className = 'xp-popup';
    }, levelUp ? 2000 : 1000);
  }

  updateQuickSlots(inventory) {
    const slots = document.querySelectorAll('.quick-slot');
    slots.forEach((slot, i) => {
      const item = inventory.slots[i];
      const itemEl = slot.querySelector('.slot-item');
      const countEl = slot.querySelector('.slot-count');

      slot.classList.toggle('active', i === inventory.activeSlot);

      if (item && ITEMS[item.id]) {
        if (itemEl) itemEl.textContent = ITEMS[item.id].icon;
        if (countEl) countEl.textContent = item.count > 1 ? item.count : '';
      } else {
        if (itemEl) itemEl.textContent = '';
        if (countEl) countEl.textContent = '';
      }
    });
  }

  updateInventoryUI(inventory, levelSystem) {
    const grid = this.elements['inventory-grid'];
    const recipesDiv = this.elements['crafting-recipes'];
    if (!grid || !recipesDiv) return;

    // Inventory grid
    grid.innerHTML = '';
    for (let i = 0; i < inventory.slots.length; i++) {
      const slot = inventory.slots[i];
      const div = document.createElement('div');
      div.className = 'inv-slot';

      if (slot && ITEMS[slot.id]) {
        const def = ITEMS[slot.id];
        div.innerHTML = `
          <span class="item-icon">${def.icon}</span>
          <span class="item-count">${slot.count > 1 ? slot.count : ''}</span>
        `;
        div.title = `${def.name} (${slot.count})`;

        // Equip armor on click
        if (def.type === 'armor') {
          div.style.cursor = 'pointer';
          div.addEventListener('click', () => {
            inventory.equipArmor(i);
            this.updateInventoryUI(inventory, levelSystem);
          });
        }
      }
      grid.appendChild(div);
    }

    // Equipped armor display
    const armorInfo = document.getElementById('equipped-armor');
    if (armorInfo) {
      if (inventory.equippedArmor) {
        armorInfo.textContent = `Zırh: ${inventory.equippedArmor.def.icon} ${ITEMS[inventory.equippedArmor.id]?.name || ''} (${inventory.equippedArmor.def.defense} savunma)`;
      } else {
        armorInfo.textContent = 'Zırh: Yok';
      }
    }

    // Crafting recipes
    recipesDiv.innerHTML = '';
    RECIPES.forEach(recipe => {
      const btn = document.createElement('button');
      btn.className = 'recipe-btn';
      const canCraft = inventory.canCraft(recipe);

      // Check tier requirement
      const tierOk = !levelSystem || !recipe.tier || levelSystem.canCraftAdvanced(recipe.tier);
      btn.disabled = !canCraft || !tierOk;

      const resultDef = ITEMS[recipe.result];
      const ingredientText = recipe.ingredients
        .map(ing => `${ITEMS[ing.item]?.icon || '?'}×${ing.amount}`)
        .join(' + ');

      let label = `${resultDef ? resultDef.icon : ''} ${recipe.name} (${ingredientText})`;
      if (recipe.tier && !tierOk) {
        label += ` [Tier ${recipe.tier}]`;
      }

      btn.innerHTML = label;
      btn.onclick = () => {
        if (inventory.craft(recipe)) {
          this.updateInventoryUI(inventory, levelSystem);
        }
      };
      recipesDiv.appendChild(btn);
    });
  }

  showInteraction(text) {
    const el = this.elements['interaction-text'];
    if (el) {
      el.textContent = text;
      el.style.display = '';
    }
  }

  hideInteraction() {
    const el = this.elements['interaction-text'];
    if (el) el.style.display = 'none';
  }

  showBuildMode(show) {
    if (show) this.show('build-mode');
    else this.hide('build-mode');
  }

  updateSkillPanel(levelSystem) {
    const panel = document.getElementById('skill-panel');
    if (!panel) return;

    const content = document.getElementById('skill-content');
    if (!content) return;

    content.innerHTML = `
      <p class="skill-points">Yetenek Puanı: <b>${levelSystem.skillPoints}</b></p>
      ${Object.entries(levelSystem.skills).map(([name, level]) => {
        const labels = {
          vitality: '❤️ Dayanıklılık',
          endurance: '🏃 Kondisyon',
          strength: '💪 Güç',
          agility: '⚡ Çeviklik',
          harvesting: '⛏️ Toplama',
          crafting: '🔧 Üretim',
          building: '🏗️ İnşaat',
          survival: '🌿 Hayatta Kalma',
        };
        const maxed = level >= levelSystem.maxSkillPoints;
        return `
          <div class="skill-row">
            <span class="skill-name">${labels[name] || name}</span>
            <span class="skill-level">${level}/${levelSystem.maxSkillPoints}</span>
            <button class="skill-btn" ${maxed || levelSystem.skillPoints <= 0 ? 'disabled' : ''} data-skill="${name}">+</button>
          </div>
        `;
      }).join('')}
    `;

    // Bind buttons
    content.querySelectorAll('.skill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const skill = btn.dataset.skill;
        if (levelSystem.upgradeSkill(skill)) {
          this.updateSkillPanel(levelSystem);
        }
      });
    });
  }

  updateMinimap(playerPos, enemies, resources, worldSize, animals, npcs, vehicles) {
    const canvas = this.elements['minimap'];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const scale = w / (worldSize * 0.4);
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = 'rgba(0, 30, 0, 0.7)';
    ctx.beginPath();
    ctx.arc(cx, cy, cx, 0, Math.PI * 2);
    ctx.fill();

    // Resources (small dots)
    ctx.fillStyle = '#4a4';
    resources.forEach(r => {
      const rx = cx + (r.position.x - playerPos.x) * scale;
      const ry = cy + (r.position.z - playerPos.z) * scale;
      if (Math.sqrt((rx - cx) ** 2 + (ry - cy) ** 2) < cx - 5) {
        ctx.fillRect(rx - 1, ry - 1, 2, 2);
      }
    });

    // NPCs (blue dots)
    if (npcs) {
      ctx.fillStyle = '#44f';
      npcs.forEach(n => {
        if (!n.alive) return;
        const nx = cx + (n.position.x - playerPos.x) * scale;
        const ny = cy + (n.position.z - playerPos.z) * scale;
        if (Math.sqrt((nx - cx) ** 2 + (ny - cy) ** 2) < cx - 5) {
          ctx.beginPath();
          ctx.arc(nx, ny, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // Animals (yellow dots for hostile, green for passive)
    if (animals) {
      animals.forEach(a => {
        if (!a.alive) return;
        ctx.fillStyle = a.def.hostile ? '#fa0' : '#4f4';
        const ax = cx + (a.position.x - playerPos.x) * scale;
        const ay = cy + (a.position.z - playerPos.z) * scale;
        if (Math.sqrt((ax - cx) ** 2 + (ay - cy) ** 2) < cx - 5) {
          ctx.beginPath();
          ctx.arc(ax, ay, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // Vehicles (cyan squares)
    if (vehicles) {
      ctx.fillStyle = '#0ff';
      vehicles.forEach(v => {
        if (v.health <= 0) return;
        const vx = cx + (v.position.x - playerPos.x) * scale;
        const vy = cy + (v.position.z - playerPos.z) * scale;
        if (Math.sqrt((vx - cx) ** 2 + (vy - cy) ** 2) < cx - 5) {
          ctx.fillRect(vx - 3, vy - 3, 6, 6);
        }
      });
    }

    // Enemies (red dots)
    ctx.fillStyle = '#f44';
    enemies.forEach(e => {
      if (!e.alive) return;
      const ex = cx + (e.position.x - playerPos.x) * scale;
      const ey = cy + (e.position.z - playerPos.z) * scale;
      if (Math.sqrt((ex - cx) ** 2 + (ey - cy) ** 2) < cx - 5) {
        ctx.beginPath();
        ctx.arc(ex, ey, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Village marker (gold house icon)
    const villageX = 60, villageZ = 60;
    const vx = cx + (villageX - playerPos.x) * scale;
    const vy = cy + (villageZ - playerPos.z) * scale;
    if (Math.sqrt((vx - cx) ** 2 + (vy - cy) ** 2) < cx - 5) {
      // Village area circle
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(vx, vy, 8, 0, Math.PI * 2);
      ctx.stroke();
      // House icon
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.moveTo(vx, vy - 5);
      ctx.lineTo(vx + 4, vy - 1);
      ctx.lineTo(vx + 3, vy + 3);
      ctx.lineTo(vx - 3, vy + 3);
      ctx.lineTo(vx - 4, vy - 1);
      ctx.closePath();
      ctx.fill();
    }

    // Player (center, white)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 1, 0, Math.PI * 2);
    ctx.stroke();
  }
}
