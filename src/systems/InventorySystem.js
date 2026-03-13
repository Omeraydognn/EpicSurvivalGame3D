// ===== GELİŞMİŞ ENVANTER & CRAFTING SİSTEMİ =====

// Item definitions
export const ITEMS = {
  // === RESOURCES ===
  wood: { name: 'Odun', icon: '🪵', stackable: true, maxStack: 64, type: 'resource' },
  stone: { name: 'Taş', icon: '🪨', stackable: true, maxStack: 64, type: 'resource' },
  iron_ore: { name: 'Demir Cevheri', icon: '⛰️', stackable: true, maxStack: 32, type: 'resource' },
  gold_ore: { name: 'Altın Cevheri', icon: '✦', stackable: true, maxStack: 16, type: 'resource' },
  iron_ingot: { name: 'Demir Külçe', icon: '🔩', stackable: true, maxStack: 32, type: 'resource' },
  gold_ingot: { name: 'Altın Külçe', icon: '🥇', stackable: true, maxStack: 16, type: 'resource' },
  leather: { name: 'Deri', icon: '🧶', stackable: true, maxStack: 32, type: 'resource' },
  fiber: { name: 'Lif', icon: '🌿', stackable: true, maxStack: 64, type: 'resource' },
  cloth: { name: 'Kumaş', icon: '🧵', stackable: true, maxStack: 32, type: 'resource' },
  fuel: { name: 'Yakıt', icon: '⛽', stackable: true, maxStack: 16, type: 'resource' },

  // === FOOD & DRINK ===
  berry: { name: 'Çilek', icon: '🫐', stackable: true, maxStack: 32, type: 'food', hunger: 8, health: 2 },
  meat: { name: 'Et', icon: '🥩', stackable: true, maxStack: 16, type: 'food', hunger: 15 },
  cooked_meat: { name: 'Pişmiş Et', icon: '🍖', stackable: true, maxStack: 16, type: 'food', hunger: 35, health: 10 },
  mushroom: { name: 'Mantar', icon: '🍄', stackable: true, maxStack: 32, type: 'food', hunger: 12 },
  fish: { name: 'Balık', icon: '🐟', stackable: true, maxStack: 16, type: 'food', hunger: 20, health: 5 },
  apple: { name: 'Elma', icon: '🍎', stackable: true, maxStack: 32, type: 'food', hunger: 12, health: 3 },
  bread: { name: 'Ekmek', icon: '🍞', stackable: true, maxStack: 16, type: 'food', hunger: 30 },
  water_bottle: { name: 'Su Şişesi', icon: '🧴', stackable: true, maxStack: 8, type: 'drink', thirst: 30 },
  herbal_tea: { name: 'Bitki Çayı', icon: '🍵', stackable: true, maxStack: 8, type: 'drink', thirst: 40, health: 10 },

  // === WEAPONS ===
  wooden_sword: { name: 'Tahta Kılıç', icon: '🗡️', stackable: false, type: 'weapon', damage: 15, tier: 0 },
  stone_sword: { name: 'Taş Kılıç', icon: '⚔️', stackable: false, type: 'weapon', damage: 25, tier: 0 },
  iron_sword: { name: 'Demir Kılıç', icon: '🔪', stackable: false, type: 'weapon', damage: 45, tier: 1 },
  gold_sword: { name: 'Altın Kılıç', icon: '✨', stackable: false, type: 'weapon', damage: 65, tier: 2 },
  sword_epic: { name: 'Epic NFT Kılıcı', icon: '🔥', stackable: false, type: 'weapon', damage: 100, tier: 3 },
  bow: { name: 'Yay', icon: '🏹', stackable: false, type: 'weapon', damage: 30, tier: 1, ranged: true },
  spear: { name: 'Mızrak', icon: '🔱', stackable: false, type: 'weapon', damage: 35, tier: 1 },

  // === TOOLS ===
  wooden_pickaxe: { name: 'Tahta Kazma', icon: '⛏️', stackable: false, type: 'tool', efficiency: 1.5, tier: 0 },
  stone_pickaxe: { name: 'Taş Kazma', icon: '🔨', stackable: false, type: 'tool', efficiency: 2.5, tier: 0 },
  iron_pickaxe: { name: 'Demir Kazma', icon: '⚒️', stackable: false, type: 'tool', efficiency: 4, tier: 1 },
  fishing_rod: { name: 'Olta', icon: '🎣', stackable: false, type: 'tool', tier: 0 },

  // === ARMOR ===
  leather_armor: { name: 'Deri Zırh', icon: '🦺', stackable: false, type: 'armor', defense: 10, tier: 1 },
  iron_armor: { name: 'Demir Zırh', icon: '🛡️', stackable: false, type: 'armor', defense: 25, tier: 2 },
  gold_armor: { name: 'Altın Zırh', icon: '👑', stackable: false, type: 'armor', defense: 40, tier: 3 },

  // === HEALING ===
  bandage: { name: 'Bandaj', icon: '🩹', stackable: true, maxStack: 10, type: 'healing', health: 25 },
  medkit: { name: 'İlk Yardım', icon: '💊', stackable: true, maxStack: 8, type: 'healing', health: 50 },

  // === BUILDINGS ===
  wall: { name: 'Duvar', icon: '🧱', stackable: true, maxStack: 16, type: 'building', buildType: 'wall' },
  floor: { name: 'Zemin', icon: '🟫', stackable: true, maxStack: 16, type: 'building', buildType: 'floor' },
  campfire: { name: 'Kamp Ateşi', icon: '🔥', stackable: true, maxStack: 4, type: 'building', buildType: 'campfire' },
  door: { name: 'Kapı', icon: '🚪', stackable: true, maxStack: 8, type: 'building', buildType: 'door' },
  roof: { name: 'Çatı', icon: '🏠', stackable: true, maxStack: 16, type: 'building', buildType: 'roof' },
  stairs: { name: 'Merdiven', icon: '🪜', stackable: true, maxStack: 8, type: 'building', buildType: 'stairs' },
  window_item: { name: 'Pencere', icon: '🪟', stackable: true, maxStack: 8, type: 'building', buildType: 'window' },
  chest: { name: 'Sandık', icon: '📦', stackable: true, maxStack: 4, type: 'building', buildType: 'chest' },
  workbench: { name: 'Tezgah', icon: '🔧', stackable: true, maxStack: 2, type: 'building', buildType: 'workbench' },
  bed: { name: 'Yatak', icon: '🛏️', stackable: true, maxStack: 2, type: 'building', buildType: 'bed' },
  torch: { name: 'Meşale', icon: '🕯️', stackable: true, maxStack: 16, type: 'building', buildType: 'torch' },
  fence: { name: 'Çit', icon: '🏗️', stackable: true, maxStack: 16, type: 'building', buildType: 'fence' },

  // === SPECIAL ===
  raft_kit: { name: 'Sal Kiti', icon: '🛶', stackable: false, type: 'special' },
};

// Crafting recipes
export const RECIPES = [
  // === BASIC ===
  { name: 'Tahta Kılıç', result: 'wooden_sword', amount: 1, tier: 0,
    ingredients: [{ item: 'wood', amount: 5 }] },
  { name: 'Taş Kılıç', result: 'stone_sword', amount: 1, tier: 0,
    ingredients: [{ item: 'wood', amount: 3 }, { item: 'stone', amount: 5 }] },
  { name: 'Tahta Kazma', result: 'wooden_pickaxe', amount: 1, tier: 0,
    ingredients: [{ item: 'wood', amount: 4 }] },
  { name: 'Taş Kazma', result: 'stone_pickaxe', amount: 1, tier: 0,
    ingredients: [{ item: 'wood', amount: 2 }, { item: 'stone', amount: 4 }] },
  { name: 'Bandaj', result: 'bandage', amount: 2, tier: 0,
    ingredients: [{ item: 'berry', amount: 3 }] },
  { name: 'Su Şişesi', result: 'water_bottle', amount: 1, tier: 0,
    ingredients: [{ item: 'stone', amount: 2 }] },

  // === BUILDINGS BASIC ===
  { name: 'Duvar', result: 'wall', amount: 2, tier: 0,
    ingredients: [{ item: 'wood', amount: 4 }] },
  { name: 'Zemin', result: 'floor', amount: 2, tier: 0,
    ingredients: [{ item: 'wood', amount: 3 }] },
  { name: 'Kamp Ateşi', result: 'campfire', amount: 1, tier: 0,
    ingredients: [{ item: 'wood', amount: 5 }, { item: 'stone', amount: 3 }] },
  { name: 'Kapı', result: 'door', amount: 1, tier: 0,
    ingredients: [{ item: 'wood', amount: 4 }, { item: 'stone', amount: 1 }] },
  { name: 'Çit', result: 'fence', amount: 4, tier: 0,
    ingredients: [{ item: 'wood', amount: 3 }] },
  { name: 'Meşale', result: 'torch', amount: 3, tier: 0,
    ingredients: [{ item: 'wood', amount: 2 }, { item: 'stone', amount: 1 }] },

  // === ADVANCED (tier 1 - need crafting skill) ===
  { name: 'Demir Külçe', result: 'iron_ingot', amount: 1, tier: 1,
    ingredients: [{ item: 'iron_ore', amount: 3 }, { item: 'wood', amount: 2 }] },
  { name: 'Demir Kılıç', result: 'iron_sword', amount: 1, tier: 1,
    ingredients: [{ item: 'iron_ingot', amount: 3 }, { item: 'wood', amount: 2 }] },
  { name: 'Demir Kazma', result: 'iron_pickaxe', amount: 1, tier: 1,
    ingredients: [{ item: 'iron_ingot', amount: 2 }, { item: 'wood', amount: 3 }] },
  { name: 'Demir Zırh', result: 'iron_armor', amount: 1, tier: 2,
    ingredients: [{ item: 'iron_ingot', amount: 5 }, { item: 'leather', amount: 3 }] },
  { name: 'Mızrak', result: 'spear', amount: 1, tier: 1,
    ingredients: [{ item: 'wood', amount: 4 }, { item: 'iron_ingot', amount: 2 }] },
  { name: 'Yay', result: 'bow', amount: 1, tier: 1,
    ingredients: [{ item: 'wood', amount: 5 }, { item: 'fiber', amount: 3 }] },
  { name: 'Deri Zırh', result: 'leather_armor', amount: 1, tier: 1,
    ingredients: [{ item: 'leather', amount: 5 }] },
  { name: 'Olta', result: 'fishing_rod', amount: 1, tier: 0,
    ingredients: [{ item: 'wood', amount: 3 }, { item: 'fiber', amount: 2 }] },
  { name: 'Kumaş', result: 'cloth', amount: 2, tier: 0,
    ingredients: [{ item: 'fiber', amount: 4 }] },
  { name: 'Pişmiş Et', result: 'cooked_meat', amount: 1, tier: 0,
    ingredients: [{ item: 'meat', amount: 1 }, { item: 'wood', amount: 1 }] },
  { name: 'Bitki Çayı', result: 'herbal_tea', amount: 1, tier: 0,
    ingredients: [{ item: 'mushroom', amount: 2 }, { item: 'water_bottle', amount: 1 }] },
  { name: 'İlk Yardım', result: 'medkit', amount: 1, tier: 1,
    ingredients: [{ item: 'bandage', amount: 3 }, { item: 'berry', amount: 5 }] },

  // === BUILDINGS ADVANCED ===
  { name: 'Çatı', result: 'roof', amount: 2, tier: 1,
    ingredients: [{ item: 'wood', amount: 5 }, { item: 'stone', amount: 2 }] },
  { name: 'Merdiven', result: 'stairs', amount: 1, tier: 1,
    ingredients: [{ item: 'wood', amount: 6 }] },
  { name: 'Pencere', result: 'window_item', amount: 1, tier: 1,
    ingredients: [{ item: 'wood', amount: 3 }, { item: 'stone', amount: 2 }] },
  { name: 'Sandık', result: 'chest', amount: 1, tier: 1,
    ingredients: [{ item: 'wood', amount: 8 }, { item: 'iron_ingot', amount: 1 }] },
  { name: 'Tezgah', result: 'workbench', amount: 1, tier: 1,
    ingredients: [{ item: 'wood', amount: 10 }, { item: 'stone', amount: 5 }] },
  { name: 'Yatak', result: 'bed', amount: 1, tier: 1,
    ingredients: [{ item: 'wood', amount: 6 }, { item: 'cloth', amount: 3 }] },

  // === TIER 2 ===
  { name: 'Altın Külçe', result: 'gold_ingot', amount: 1, tier: 2,
    ingredients: [{ item: 'gold_ore', amount: 3 }, { item: 'wood', amount: 3 }] },
  { name: 'Altın Kılıç', result: 'gold_sword', amount: 1, tier: 2,
    ingredients: [{ item: 'gold_ingot', amount: 3 }, { item: 'iron_ingot', amount: 2 }] },
  { name: 'Altın Zırh', result: 'gold_armor', amount: 1, tier: 3,
    ingredients: [{ item: 'gold_ingot', amount: 5 }, { item: 'iron_ingot', amount: 3 }, { item: 'leather', amount: 3 }] },

  // === SPECIAL ===
  { name: 'Sal Kiti', result: 'raft_kit', amount: 1, tier: 1,
    ingredients: [{ item: 'wood', amount: 20 }, { item: 'fiber', amount: 10 }] },
];

export class InventorySystem {
  constructor(slotCount = 32) {
    this.slots = new Array(slotCount).fill(null);
    this.activeSlot = 0;
    this.equippedArmor = null;
  }

  addItem(itemId, amount = 1) {
    const itemDef = ITEMS[itemId];
    if (!itemDef) return 0;

    let remaining = amount;

    // First try to stack with existing
    if (itemDef.stackable) {
      for (let i = 0; i < this.slots.length && remaining > 0; i++) {
        const slot = this.slots[i];
        if (slot && slot.id === itemId && slot.count < itemDef.maxStack) {
          const canAdd = Math.min(remaining, itemDef.maxStack - slot.count);
          slot.count += canAdd;
          remaining -= canAdd;
        }
      }
    }

    // Then find empty slots
    while (remaining > 0) {
      const emptyIdx = this.slots.findIndex(s => s === null);
      if (emptyIdx === -1) break;

      const stackSize = itemDef.stackable ? Math.min(remaining, itemDef.maxStack) : 1;
      this.slots[emptyIdx] = { id: itemId, count: stackSize };
      remaining -= stackSize;
    }

    return amount - remaining;
  }

  removeItem(itemId, amount = 1) {
    let remaining = amount;

    for (let i = this.slots.length - 1; i >= 0 && remaining > 0; i--) {
      const slot = this.slots[i];
      if (slot && slot.id === itemId) {
        const canRemove = Math.min(remaining, slot.count);
        slot.count -= canRemove;
        remaining -= canRemove;
        if (slot.count <= 0) {
          this.slots[i] = null;
        }
      }
    }

    return remaining === 0;
  }

  hasItem(itemId, amount = 1) {
    let total = 0;
    for (const slot of this.slots) {
      if (slot && slot.id === itemId) {
        total += slot.count;
      }
    }
    return total >= amount;
  }

  countItem(itemId) {
    let total = 0;
    for (const slot of this.slots) {
      if (slot && slot.id === itemId) {
        total += slot.count;
      }
    }
    return total;
  }

  getActiveItem() {
    return this.slots[this.activeSlot];
  }

  getActiveItemDef() {
    const item = this.getActiveItem();
    if (!item) return null;
    return ITEMS[item.id];
  }

  canCraft(recipe) {
    return recipe.ingredients.every(
      ing => this.hasItem(ing.item, ing.amount)
    );
  }

  craft(recipe) {
    if (!this.canCraft(recipe)) return false;

    // Remove ingredients
    for (const ing of recipe.ingredients) {
      this.removeItem(ing.item, ing.amount);
    }

    // Add result
    const added = this.addItem(recipe.result, recipe.amount);
    return added > 0;
  }

  equipArmor(slotIndex) {
    const item = this.slots[slotIndex];
    if (!item) return false;
    const def = ITEMS[item.id];
    if (!def || def.type !== 'armor') return false;

    // Swap with current armor
    if (this.equippedArmor) {
      this.slots[slotIndex] = { id: this.equippedArmor.id, count: 1 };
    } else {
      item.count--;
      if (item.count <= 0) this.slots[slotIndex] = null;
    }

    this.equippedArmor = { id: item.id, def };
    return true;
  }

  getArmorDefense() {
    if (!this.equippedArmor) return 0;
    return this.equippedArmor.def.defense || 0;
  }

  useActiveItem(player) {
    const item = this.getActiveItem();
    if (!item) return false;
    const def = ITEMS[item.id];
    if (!def) return false;

    if (def.type === 'food') {
      if (player.hunger < player.maxHunger || (def.health && player.health < player.maxHealth)) {
        if (def.hunger) player.eat(def.hunger);
        if (def.health) player.heal(def.health);
        item.count--;
        if (item.count <= 0) this.slots[this.activeSlot] = null;
        return true;
      }
    } else if (def.type === 'drink') {
      if (player.thirst < player.maxThirst) {
        if (def.thirst) player.drink(def.thirst);
        if (def.health) player.heal(def.health);
        item.count--;
        if (item.count <= 0) this.slots[this.activeSlot] = null;
        return true;
      }
    } else if (def.type === 'healing') {
      if (player.health < player.maxHealth) {
        if (def.health) player.heal(def.health);
        item.count--;
        if (item.count <= 0) this.slots[this.activeSlot] = null;
        return true;
      }
    }

    return false;
  }

  reset() {
    this.slots.fill(null);
    this.activeSlot = 0;
    this.equippedArmor = null;
    // Give starter items
    this.addItem('wood', 5);
    this.addItem('stone', 3);
    this.addItem('berry', 5);
  }
}
