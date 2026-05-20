import type {
  SkillDefinition, EffectDefinition, EffectFormula,
  GroundEffectDefinition, BuffDefinition,
} from '@/shared/schemas';
import { BuffManager, type BuffableEntity } from './BuffManager';
import { GroundEffectManager, type GroundEffectTarget } from './GroundEffectManager';
import { GridSpatialIndex, type SpatialEntity } from '@/lib/spatialQuery';

export interface SkillCastRequest {
  skillId: string;
  targetId?: string;
  targetX?: number;
  targetZ?: number;
  directionX?: number;
  directionZ?: number;
  casterId: string;
  casterPosition: { x: number; y: number; z: number };
  casterStats: Record<string, number>;
  casterLevel: number;
  sp: number;
  hp: number;
}

export interface SkillCastResult {
  success: boolean;
  error?: string;
  damage?: number;
  heal?: number;
  isCritical?: boolean;
  targetsHit?: string[];
  targetDamages?: Record<string, number>;
  targetHeals?: Record<string, number>;
  targetPositions?: Record<string, { x: number; z: number }>;
  groundEffectId?: string;
  buffApplied?: string[];
  newSp?: number;
  newHp?: number;
  cooldownMs?: number;
  castTimeMs?: number;
  animationId?: string;
  vfxId?: string;
  soundId?: string;
}

export interface ActiveCast {
  casterId: string;
  skillId: string;
  targetId?: string;
  targetX?: number;
  targetZ?: number;
  directionX?: number;
  directionZ?: number;
  casterPosition: { x: number; y: number; z: number };
  casterStats: Record<string, number>;
  casterLevel: number;
  startedAt: number;
  castTimeMs: number;
  channelTimeMs: number;
  castType: 'cast' | 'channel';
}

export class SkillEngine {
  private skillDefs = new Map<string, SkillDefinition>();
  private groundEffectDefs = new Map<string, GroundEffectDefinition>();
  private buffManager = new BuffManager();
  private groundEffectManager = new GroundEffectManager();
  private spatialIndex = new GridSpatialIndex(5);
  private activeCasts = new Map<string, ActiveCast>();
  private cooldowns = new Map<string, Map<string, number>>();
  private now = 0;

  registerSkill(def: SkillDefinition): void {
    this.skillDefs.set(def.id, def);
  }

  registerGroundEffect(def: GroundEffectDefinition): void {
    this.groundEffectDefs.set(def.id, def);
  }

  registerBuff(def: BuffDefinition): void {
    this.buffManager.registerDefinition(def);
  }

  getBuffManager(): BuffManager {
    return this.buffManager;
  }

  getGroundEffectManager(): GroundEffectManager {
    return this.groundEffectManager;
  }

  rebuildSpatialIndex(entities: SpatialEntity[]): void {
    this.spatialIndex.rebuild(entities);
  }

  tick(now: number, entities: Map<string, BuffableEntity>, onEffect: (targetId: string, effect: EffectDefinition, sourceId: string) => void): void {
    this.now = now;
    this.buffManager.tick(now, entities, onEffect);

    for (const [casterId, cast] of this.activeCasts) {
      if (cast.castType === 'cast') {
        if (now >= cast.startedAt + cast.castTimeMs) {
          this.activeCasts.delete(casterId);
        }
      }
    }

    this.groundEffectManager.tick(now, this.getGroundTargets(entities), onEffect);
  }

  validateCast(request: SkillCastRequest): SkillCastResult {
    const skill = this.skillDefs.get(request.skillId);
    if (!skill) return { success: false, error: 'Skill not found' };

    if (request.sp < skill.spCost) return { success: false, error: 'Not enough SP' };
    if (request.hp < skill.hpCost) return { success: false, error: 'Not enough HP' };

    if (skill.castType === 'cast' && skill.castTimeMs > 0) {
      const existingCast = this.activeCasts.get(request.casterId);
      if (existingCast) return { success: false, error: 'Already casting' };
    }

    const casterCooldowns = this.cooldowns.get(request.casterId);
    if (casterCooldowns) {
      const remaining = casterCooldowns.get(skill.id);
      if (remaining && remaining > this.now) {
        return { success: false, error: 'Skill on cooldown' };
      }
    }

    if (this.buffManager.hasBehavior(request.casterId, 'silence')) {
      return { success: false, error: 'Silenced' };
    }

    if (skill.targetType !== 'self' && skill.targetType !== 'aoe_ally' && skill.targetType !== 'ground_target') {
      if (this.buffManager.hasBehavior(request.casterId, 'root')) {
        return { success: false, error: 'Rooted' };
      }
    }

    return { success: true };
  }

  executeCast(request: SkillCastRequest): SkillCastResult {
    const skill = this.skillDefs.get(request.skillId);
    if (!skill) return { success: false, error: 'Skill not found' };

    const validation = this.validateCast(request);
    if (!validation.success) return validation;

    const now = Date.now();
    this.now = now;

    if (skill.castType === 'cast' && skill.castTimeMs > 0) {
      this.activeCasts.set(request.casterId, {
        casterId: request.casterId,
        skillId: skill.id,
        targetId: request.targetId,
        targetX: request.targetX,
        targetZ: request.targetZ,
        directionX: request.directionX,
        directionZ: request.directionZ,
        casterPosition: { ...request.casterPosition },
        casterStats: { ...request.casterStats },
        casterLevel: request.casterLevel,
        startedAt: now,
        castTimeMs: skill.castTimeMs,
        channelTimeMs: skill.channelTimeMs,
        castType: 'cast',
      });

      return {
        success: true,
        castTimeMs: skill.castTimeMs,
        animationId: skill.animationId,
        vfxId: skill.vfxId,
        soundId: skill.soundId,
      };
    }

    return this.resolveSkill(skill, request);
  }

  completeCast(casterId: string, request: SkillCastRequest): SkillCastResult {
    const cast = this.activeCasts.get(casterId);
    if (!cast) return { success: false, error: 'No active cast' };

    const skill = this.skillDefs.get(cast.skillId);
    if (!skill) return { success: false, error: 'Skill not found' };

    this.activeCasts.delete(casterId);

    return this.resolveSkill(skill, {
      ...request,
      casterPosition: cast.casterPosition,
      casterStats: cast.casterStats,
      casterLevel: cast.casterLevel,
      targetId: cast.targetId,
      targetX: cast.targetX,
      targetZ: cast.targetZ,
      directionX: cast.directionX,
      directionZ: cast.directionZ,
    });
  }

  interruptCast(casterId: string): void {
    this.activeCasts.delete(casterId);
  }

  isCasting(casterId: string): boolean {
    return this.activeCasts.has(casterId);
  }

  getCastingSkill(casterId: string): string | undefined {
    return this.activeCasts.get(casterId)?.skillId;
  }

  private resolveSkill(skill: SkillDefinition, request: SkillCastRequest): SkillCastResult {
    const now = Date.now();
    this.now = now;

    const targets = this.resolveTargets(skill, request);
    const result: SkillCastResult = { success: true, targetsHit: [], buffApplied: [] };
    const targetDamages: Record<string, number> = {};
    const targetHeals: Record<string, number> = {};
    const targetPositions: Record<string, { x: number; z: number }> = {};

    let totalDamage = 0;
    let totalHeal = 0;
    let isCritical = false;

    for (const target of targets) {
      let perTargetDamage = 0;
      let perTargetHeal = 0;

      for (const effect of skill.effects) {
        const effectResult = this.applyEffect(effect, request, target);

        if (effectResult.damage) {
          perTargetDamage += effectResult.damage;
          if (effectResult.isCritical) isCritical = true;
        }
        if (effectResult.heal) perTargetHeal += effectResult.heal;
        if (effectResult.buffApplied) result.buffApplied!.push(effectResult.buffApplied);
        if (effectResult.groundEffectId) result.groundEffectId = effectResult.groundEffectId;
      }

      totalDamage += perTargetDamage;
      totalHeal += perTargetHeal;
      if (perTargetDamage > 0) targetDamages[target.id] = perTargetDamage;
      if (perTargetHeal > 0) targetHeals[target.id] = perTargetHeal;
      targetPositions[target.id] = { x: target.x, z: target.z };

      result.targetsHit!.push(target.id);
    }

    if (totalDamage > 0) result.damage = totalDamage;
    if (totalHeal > 0) result.heal = totalHeal;
    if (Object.keys(targetDamages).length > 0) result.targetDamages = targetDamages;
    if (Object.keys(targetHeals).length > 0) result.targetHeals = targetHeals;
    if (Object.keys(targetPositions).length > 0) result.targetPositions = targetPositions;
    if (isCritical) result.isCritical = true;

    const newSp = request.sp - skill.spCost;
    const newHp = request.hp - skill.hpCost;
    result.newSp = newSp;
    result.newHp = newHp;

    const cooldown = skill.cooldownMs;
    if (cooldown > 0) {
      if (!this.cooldowns.has(request.casterId)) {
        this.cooldowns.set(request.casterId, new Map());
      }
      this.cooldowns.get(request.casterId)!.set(skill.id, now + cooldown);
    }
    result.cooldownMs = cooldown;

    result.animationId = skill.animationId;
    result.vfxId = skill.vfxId;
    result.soundId = skill.soundId;

    return result;
  }

  private resolveTargets(skill: SkillDefinition, request: SkillCastRequest): Array<{ id: string; x: number; z: number; isAlly: boolean }> {
    const targets: Array<{ id: string; x: number; z: number; isAlly: boolean }> = [];

    switch (skill.targetType) {
      case 'single_enemy':
      case 'single_ally': {
        if (request.targetId) {
          const nearby = this.spatialIndex.circle(request.casterPosition.x, request.casterPosition.z, skill.range);
          const target = nearby.find(e => e.id === request.targetId);
          if (target) {
            targets.push({ id: target.id, x: target.x, z: target.z, isAlly: skill.targetType === 'single_ally' });
          }
        }
        break;
      }
      case 'self': {
        targets.push({ id: request.casterId, x: request.casterPosition.x, z: request.casterPosition.z, isAlly: true });
        break;
      }
      case 'aoe_enemy':
      case 'aoe_ally': {
        const centerX = request.targetX ?? request.casterPosition.x;
        const centerZ = request.targetZ ?? request.casterPosition.z;
        const radius = skill.effects.find((e: EffectDefinition) => e.radius)?.radius ?? skill.range;
        const nearby = this.spatialIndex.circle(centerX, centerZ, radius);
        for (const e of nearby) {
          if (e.id === request.casterId && skill.targetType === 'aoe_enemy') continue;
          targets.push({ id: e.id, x: e.x, z: e.z, isAlly: skill.targetType === 'aoe_ally' });
        }
        break;
      }
      case 'ground_target': {
        break;
      }
      case 'directional': {
        const dirX = request.directionX ?? 0;
        const dirZ = request.directionZ ?? 1;
        const angle = Math.atan2(dirX, dirZ);
        const range = skill.range;
        const nearby = this.spatialIndex.cone(
          request.casterPosition.x, request.casterPosition.z,
          dirX, dirZ, Math.PI / 4, range,
        );
        for (const e of nearby) {
          targets.push({ id: e.id, x: e.x, z: e.z, isAlly: false });
        }
        break;
      }
      case 'chain': {
        if (request.targetId) {
          targets.push({ id: request.targetId, x: request.targetX ?? 0, z: request.targetZ ?? 0, isAlly: false });
          const chainCount = skill.effects.find((e: EffectDefinition) => e.chainCount)?.chainCount ?? 1;
          const chainRange = skill.effects.find((e: EffectDefinition) => e.chainRange)?.chainRange ?? 5;
          let lastTarget = targets[0];
          for (let i = 0; i < chainCount - 1; i++) {
            const nearby = this.spatialIndex.circle(lastTarget.x, lastTarget.z, chainRange);
            const next = nearby.find((e: SpatialEntity) => !targets.some(t => t.id === e.id) && e.id !== request.casterId);
            if (next) {
              targets.push({ id: next.id, x: next.x, z: next.z, isAlly: false });
              lastTarget = targets[targets.length - 1];
            } else break;
          }
        }
        break;
      }
      case 'cone': {
        const dirX = request.directionX ?? 0;
        const dirZ = request.directionZ ?? 1;
        const radius = skill.effects.find((e: EffectDefinition) => e.radius)?.radius ?? skill.range;
        const nearby = this.spatialIndex.cone(
          request.casterPosition.x, request.casterPosition.z,
          dirX, dirZ, Math.PI / 3, radius,
        );
        for (const e of nearby) {
          targets.push({ id: e.id, x: e.x, z: e.z, isAlly: false });
        }
        break;
      }
      case 'line': {
        const dirX = request.directionX ?? 0;
        const dirZ = request.directionZ ?? 1;
        const range = skill.range;
        const width = skill.effects.find((e: EffectDefinition) => e.radius)?.radius ?? 1.5;
        const endX = request.casterPosition.x + dirX * range;
        const endZ = request.casterPosition.z + dirZ * range;
        const nearby = this.spatialIndex.line(
          request.casterPosition.x, request.casterPosition.z,
          endX, endZ, width,
        );
        for (const e of nearby) {
          targets.push({ id: e.id, x: e.x, z: e.z, isAlly: false });
        }
        break;
      }
    }

    return targets;
  }

  private applyEffect(
    effect: EffectDefinition,
    request: SkillCastRequest,
    target: { id: string; x: number; z: number; isAlly: boolean },
  ): { damage?: number; heal?: number; isCritical?: boolean; buffApplied?: string; groundEffectId?: string } {
    const result: { damage?: number; heal?: number; isCritical?: boolean; buffApplied?: string; groundEffectId?: string } = {};

    switch (effect.type) {
      case 'damage':
      case 'aoe_damage': {
        if (effect.formula) {
          const value = this.calculateFormula(effect.formula, request);
          const critChance = effect.formula.critChance + (request.casterStats.luk ?? 0) * 0.005;
          const isCrit = Math.random() < critChance;
          const finalDamage = isCrit ? Math.floor(value * effect.formula.critMultiplier) : Math.floor(value);
          result.damage = Math.max(1, finalDamage);
          result.isCritical = isCrit;
        }
        break;
      }
      case 'heal':
      case 'aoe_heal':
      case 'hot': {
        if (effect.formula) {
          result.heal = Math.floor(this.calculateFormula(effect.formula, request));
        }
        break;
      }
      case 'buff':
      case 'debuff': {
        for (const mod of effect.statModifiers ?? []) {
          const buffId = `${effect.type}_${mod.stat}`;
          this.buffManager.applyBuff(target.id, buffId, request.casterId, effect.durationMs);
          result.buffApplied = buffId;
        }
        for (const mod of effect.behaviorModifiers ?? []) {
          const buffId = `behavior_${mod.type}`;
          this.buffManager.applyBuff(target.id, buffId, request.casterId, mod.durationMs);
          result.buffApplied = buffId;
        }
        break;
      }
      case 'taunt': {
        this.buffManager.applyBuff(target.id, 'taunt', request.casterId, effect.durationMs);
        result.buffApplied = 'taunt';
        break;
      }
      case 'knockback': {
        break;
      }
      case 'ground_effect': {
        if (effect.groundEffectId) {
          const angle = request.directionX !== undefined && request.directionZ !== undefined
            ? Math.atan2(request.directionX, request.directionZ)
            : undefined;
          const ge = this.groundEffectManager.createGroundEffect(
            effect.groundEffectId,
            request.casterId,
            request.targetX ?? request.casterPosition.x,
            request.targetZ ?? request.casterPosition.z,
            angle,
            effect.formula?.baseValue,
          );
          if (ge) result.groundEffectId = ge.id;
        }
        break;
      }
      case 'dot': {
        if (effect.formula) {
          const dotBuffId = `dot_${request.skillId}`;
          this.buffManager.applyBuff(target.id, dotBuffId, request.casterId, effect.durationMs);
          result.buffApplied = dotBuffId;
        }
        break;
      }
      case 'stun':
      case 'silence':
      case 'root':
      case 'sleep':
      case 'blind':
      case 'freeze': {
        const buffId = effect.type;
        this.buffManager.applyBuff(target.id, buffId, request.casterId, effect.durationMs);
        result.buffApplied = buffId;
        break;
      }
      case 'shield': {
        if (effect.shieldAmount) {
          this.buffManager.applyBuff(target.id, 'shield', request.casterId, effect.durationMs);
          result.buffApplied = 'shield';
        }
        break;
      }
      case 'reflect': {
        if (effect.reflectChance !== undefined) {
          this.buffManager.applyBuff(target.id, 'reflect', request.casterId, effect.durationMs);
          result.buffApplied = 'reflect';
        }
        break;
      }
    }

    return result;
  }

  calculateFormula(formula: EffectFormula, request: SkillCastRequest): number {
    let baseValue = formula.baseValue;

    switch (formula.type) {
      case 'stat_based': {
        const statValue = request.casterStats[formula.stat ?? 'str'] ?? 0;
        baseValue = statValue * formula.multiplier;
        break;
      }
      case 'flat': {
        baseValue = formula.baseValue;
        break;
      }
      case 'percent_hp': {
        baseValue = request.hp * (formula.multiplier / 100);
        break;
      }
      case 'percent_missing_hp': {
        const missingHp = request.casterStats.maxHp ? request.casterStats.maxHp - request.hp : 0;
        baseValue = missingHp * (formula.multiplier / 100);
        break;
      }
      case 'caster_level': {
        baseValue = request.casterLevel * formula.multiplier;
        break;
      }
      case 'fixed': {
        baseValue = formula.baseValue;
        break;
      }
    }

    if (formula.variance > 0) {
      baseValue += Math.random() * formula.variance;
    }

    return Math.max(1, Math.floor(baseValue));
  }

  private getGroundTargets(entities: Map<string, BuffableEntity>): GroundEffectTarget[] {
    const targets: GroundEffectTarget[] = [];
    for (const [id, entity] of entities) {
      targets.push({
        id,
        x: entity.position.x,
        z: entity.position.z,
        isAlly: false,
      });
    }
    return targets;
  }

  getCooldownRemaining(casterId: string, skillId: string): number {
    const casterCooldowns = this.cooldowns.get(casterId);
    if (!casterCooldowns) return 0;
    const expiresAt = casterCooldowns.get(skillId);
    if (!expiresAt) return 0;
    return Math.max(0, expiresAt - (this.now || Date.now()));
  }

  clearCooldowns(casterId: string): void {
    this.cooldowns.delete(casterId);
  }

  clearAll(): void {
    this.activeCasts.clear();
    this.cooldowns.clear();
    this.buffManager.clearAll();
    this.groundEffectManager.clear();
  }
}
