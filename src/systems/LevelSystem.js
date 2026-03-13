// ===== LEVEL & XP SİSTEMİ =====
export class LevelSystem {
  constructor() {
    this.level = 1;
    this.xp = 0;
    this.totalXp = 0;
    this.skillPoints = 0;

    // XP thresholds (each level needs more XP)
    this.baseXp = 100;
    this.xpMultiplier = 1.4;

    // Skills
    this.skills = {
      vitality: 0,     // +10 max HP per point
      endurance: 0,    // +10 max hunger/thirst per point, slower drain
      strength: 0,     // +5 attack damage per point
      agility: 0,      // +0.5 move speed per point
      harvesting: 0,   // +1 resource gather per point
      crafting: 0,     // unlock advanced recipes
      building: 0,     // unlock advanced buildings
      survival: 0,     // slower stat drain, resist disease
    };

    this.maxLevel = 50;
    this.maxSkillPoints = 5; // max per skill

    // XP sources
    this.xpValues = {
      kill_zombie: 30,
      kill_skeleton: 50,
      kill_wolf: 40,
      kill_bear: 80,
      gather_resource: 5,
      craft_item: 15,
      build_structure: 20,
      explore_biome: 100,
      survive_night: 40,
      discover_cave: 150,
      open_treasure: 200,
    };
  }

  getXpForLevel(level) {
    return Math.floor(this.baseXp * Math.pow(this.xpMultiplier, level - 1));
  }

  getXpNeeded() {
    return this.getXpForLevel(this.level);
  }

  getXpProgress() {
    return this.xp / this.getXpNeeded();
  }

  addXp(amount, source = null) {
    this.xp += amount;
    this.totalXp += amount;

    let levelsGained = 0;

    while (this.xp >= this.getXpNeeded() && this.level < this.maxLevel) {
      this.xp -= this.getXpNeeded();
      this.level++;
      this.skillPoints++;
      levelsGained++;
    }

    return levelsGained;
  }

  addXpForAction(action) {
    const amount = this.xpValues[action] || 0;
    if (amount > 0) {
      return { xp: amount, levelsGained: this.addXp(amount, action) };
    }
    return { xp: 0, levelsGained: 0 };
  }

  upgradeSkill(skillName) {
    if (this.skillPoints <= 0) return false;
    if (!this.skills.hasOwnProperty(skillName)) return false;
    if (this.skills[skillName] >= this.maxSkillPoints) return false;

    this.skills[skillName]++;
    this.skillPoints--;
    return true;
  }

  // Stat bonuses from skills
  getMaxHealthBonus() { return this.skills.vitality * 10; }
  getMaxHungerBonus() { return this.skills.endurance * 10; }
  getMaxThirstBonus() { return this.skills.endurance * 10; }
  getDamageBonus() { return this.skills.strength * 5; }
  getSpeedBonus() { return this.skills.agility * 0.5; }
  getGatherBonus() { return this.skills.harvesting; }
  getHungerDrainMult() { return 1 - this.skills.endurance * 0.08; }
  getThirstDrainMult() { return 1 - this.skills.endurance * 0.08; }

  canCraftAdvanced(tier) {
    return this.skills.crafting >= tier;
  }

  canBuildAdvanced(tier) {
    return this.skills.building >= tier;
  }

  reset() {
    this.level = 1;
    this.xp = 0;
    this.totalXp = 0;
    this.skillPoints = 0;
    Object.keys(this.skills).forEach(k => this.skills[k] = 0);
  }
}
