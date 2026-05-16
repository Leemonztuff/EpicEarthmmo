import { BalanceConfig } from '../schemas';

export function calculateDamage(
  statValue: number,
  skillMultiplier: number,
  balance: BalanceConfig,
): number {
  const { statMultiplier, randomVariance } = balance.combat.baseDamageFormula;
  const baseDamage = statValue * statMultiplier + Math.floor(Math.random() * randomVariance);
  return Math.floor(baseDamage * skillMultiplier);
}

export function calculateExpReward(
  enemyLevel: number,
  balance: BalanceConfig,
): { baseExp: number; jobExp: number } {
  return {
    baseExp: enemyLevel * balance.progression.baseExpFormula.multiplier,
    jobExp: enemyLevel * balance.progression.jobExpFormula.multiplier,
  };
}

export function calculateLevelUpThresholds(
  currentBaseLevel: number,
  currentJobLevel: number,
  balance: BalanceConfig,
): { baseExpNeeded: number; jobExpNeeded: number } {
  return {
    baseExpNeeded: currentBaseLevel * balance.progression.baseLevelUpThreshold.multiplier,
    jobExpNeeded: currentJobLevel * balance.progression.jobLevelUpThreshold.multiplier,
  };
}

export function processLevelUp(
  baseExp: number,
  jobExp: number,
  baseLevel: number,
  jobLevel: number,
  balance: BalanceConfig,
): {
  baseExp: number;
  jobExp: number;
  baseLevel: number;
  jobLevel: number;
  hpGain: number;
  spGain: number;
  statPointsGain: number;
  skillPointsGain: number;
  leveledUp: boolean;
} {
  let totalHpGain = 0;
  let totalSpGain = 0;
  let totalStatPoints = 0;
  let totalSkillPoints = 0;
  let leveledUp = false;
  const { progression } = balance;

  while (baseExp >= baseLevel * progression.baseLevelUpThreshold.multiplier) {
    baseExp -= baseLevel * progression.baseLevelUpThreshold.multiplier;
    baseLevel += 1;
    totalHpGain += progression.levelUpGains.hpPerLevel;
    totalSpGain += progression.levelUpGains.spPerLevel;
    const { divisor, base } = progression.levelUpGains.statPointsFormula;
    totalStatPoints += Math.floor((baseLevel - 1) / divisor) + base;
    leveledUp = true;
  }

  const maxJobLevel = progression.jobLevelUpThreshold.maxLevel;
  while (jobExp >= jobLevel * progression.jobLevelUpThreshold.multiplier && jobLevel < maxJobLevel) {
    jobExp -= jobLevel * progression.jobLevelUpThreshold.multiplier;
    jobLevel += 1;
    totalSkillPoints += progression.levelUpGains.jobSkillPointsPerLevel;
    leveledUp = true;
  }

  return {
    baseExp,
    jobExp,
    baseLevel,
    jobLevel,
    hpGain: totalHpGain,
    spGain: totalSpGain,
    statPointsGain: totalStatPoints,
    skillPointsGain: totalSkillPoints,
    leveledUp,
  };
}

export function getSkillSpCost(skills: import('../schemas').SkillTree, skillId: string): number {
  const skill = skills.find(s => s.id === skillId);
  return skill?.spCost ?? 0;
}

export function getSkillMultiplier(skills: import('../schemas').SkillTree, skillId: string): number {
  const skill = skills.find(s => s.id === skillId);
  if (!skill) return 1.0;
  if (skill.effect.type === 'damage' || skill.effect.type === 'aoe_damage') {
    return skill.effect.statMultiplier ?? 1.0;
  }
  return 1.0;
}
