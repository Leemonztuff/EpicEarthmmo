import { JobClass } from '../schemas/jobs';

export interface PassiveEffect {
  type: 'damage_bonus_pct' | 'sp_regen_pct' | 'attack_range_bonus' | 'double_attack_chance' | 'heal_effect_pct' | 'zeny_drop_pct' | 'buy_discount_pct';
  value: number;
}

export function getPassiveEffects(jobClass: string, jobs: JobClass[]): PassiveEffect[] {
  const job = jobs.find(j => j.id === jobClass);
  if (!job?.passiveEffects) return [];
  return job.passiveEffects as PassiveEffect[];
}

export function getPassiveValue(jobClass: string, jobs: JobClass[], effectType: PassiveEffect['type']): number {
  const effects = getPassiveEffects(jobClass, jobs);
  const effect = effects.find(e => e.type === effectType);
  return effect?.value ?? 0;
}

export function getLevelUpBonuses(jobClass: string, jobs: JobClass[]): { hpPerLevel: number; spPerLevel: number; statPointsPerLevel: number } {
  const job = jobs.find(j => j.id === jobClass);
  if (job?.levelUpBonuses) {
    return job.levelUpBonuses;
  }
  return { hpPerLevel: 4, spPerLevel: 2, statPointsPerLevel: 3 };
}

export function applyDamagePassive(rawDamage: number, jobClass: string, jobs: JobClass[]): number {
  const bonus = getPassiveValue(jobClass, jobs, 'damage_bonus_pct');
  if (bonus <= 0) return rawDamage;
  return Math.floor(rawDamage * (1 + bonus / 100));
}

export function applySpRegenPassive(baseRegen: number, jobClass: string, jobs: JobClass[]): number {
  const bonus = getPassiveValue(jobClass, jobs, 'sp_regen_pct');
  if (bonus <= 0) return baseRegen;
  return Math.floor(baseRegen * (1 + bonus / 100));
}

export function getAttackRange(baseRange: number, jobClass: string, jobs: JobClass[]): number {
  const bonus = getPassiveValue(jobClass, jobs, 'attack_range_bonus');
  return baseRange + bonus;
}

export function shouldTriggerDoubleAttack(jobClass: string, jobs: JobClass[]): boolean {
  const chance = getPassiveValue(jobClass, jobs, 'double_attack_chance');
  if (chance <= 0) return false;
  return Math.random() * 100 < chance;
}

export function applyHealPassive(baseHeal: number, jobClass: string, jobs: JobClass[]): number {
  const bonus = getPassiveValue(jobClass, jobs, 'heal_effect_pct');
  if (bonus <= 0) return baseHeal;
  return Math.floor(baseHeal * (1 + bonus / 100));
}

export function applyZenyDropPassive(baseZeny: number, jobClass: string, jobs: JobClass[]): number {
  const bonus = getPassiveValue(jobClass, jobs, 'zeny_drop_pct');
  if (bonus <= 0) return baseZeny;
  return Math.floor(baseZeny * (1 + bonus / 100));
}

export function applyBuyDiscount(price: number, jobClass: string, jobs: JobClass[]): number {
  const discount = getPassiveValue(jobClass, jobs, 'buy_discount_pct');
  if (discount <= 0) return price;
  return Math.max(1, Math.floor(price * (1 - discount / 100)));
}
