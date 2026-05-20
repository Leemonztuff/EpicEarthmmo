import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { loadGameData } from '../shared/loader/serverLoader';
import { calculateDamage, calculateExpReward, getSkillSpCost, getSkillMultiplier } from '../shared/loader/formulaEngine';
import { MapManager, type RuntimeEnemy } from './MapManager';
import type { ServerPlayer } from './types';
import type { PlayerInput, WorldSnapshot, SnapshotPlayer, MapChangeData, SkillCastRequest } from '../shared/types/network';
import { SkillEngine } from './SkillEngine';
import type { BuffableEntity } from './BuffManager';
import type { GroundEffectTarget } from './GroundEffectManager';
import type { SpatialEntity } from '@/lib/spatialQuery';
import type {
  SkillDefinition, EffectDefinition, EffectFormula,
  GroundEffectDefinition, BuffDefinition,
} from '@/shared/schemas';

// ── Load all game data from JSON files (validated with Zod) ──
const gameData = loadGameData();
const { balance, enemies: enemyData, skills, jobs, items, maps: mapConfigs } = gameData;

const GAME_PORT = parseInt(process.env.PORT || '3001', 10);

// ── Initialize MapManager ──
const mapManager = new MapManager();
for (const template of enemyData.templates) {
  mapManager.registerEnemyTemplate(template);
}
for (const mapConfig of mapConfigs) {
  mapManager.loadMap(mapConfig);
}

// ── Initialize SkillEngine ──
const skillEngine = new SkillEngine();
for (const skillDef of skills) {
  skillEngine.registerSkill(skillDef);
}

// Register ground effect definitions
const fireWallGe: GroundEffectDefinition = {
  id: 'fire_wall_ge',
  name: 'Fire Wall',
  durationMs: 10000,
  radius: 3,
  tickIntervalMs: 1000,
  effects: [{
    type: 'aoe_damage',
    formula: { type: 'stat_based', stat: 'int', baseValue: 15, multiplier: 1.0, variance: 5, critChance: 0.05, critMultiplier: 1.5 },
    applyToSelf: false,
  }],
  targetAllies: false,
  targetEnemies: true,
  shape: 'circle',
  color: '#ff4400',
  opacity: 0.5,
  vfxId: 'fire_wall_ground',
};
skillEngine.registerGroundEffect(fireWallGe);

const safetyWallGe: GroundEffectDefinition = {
  id: 'safety_wall_ge',
  name: 'Safety Wall',
  durationMs: 8000,
  radius: 4,
  tickIntervalMs: 2000,
  effects: [{
    type: 'heal',
    formula: { type: 'stat_based', stat: 'int', baseValue: 20, multiplier: 0.5, variance: 5, critChance: 0, critMultiplier: 1.5 },
    applyToSelf: false,
  }],
  targetAllies: true,
  targetEnemies: false,
  shape: 'circle',
  color: '#44aaff',
  opacity: 0.4,
  vfxId: 'safety_wall_ground',
};
skillEngine.registerGroundEffect(safetyWallGe);

const buffTaunt: BuffDefinition = {
  id: 'taunt',
  name: 'Taunt',
  isDebuff: true,
  durationMs: 5000,
  stackLimit: 1,
  stackRule: 'refresh',
  diminishingReturns: false,
  drReductionPerStack: 0,
  behaviorModifiers: [{ type: 'taunt', durationMs: 5000 }],
  color: '#ff8800',
};
skillEngine.registerBuff(buffTaunt);

const buffStun: BuffDefinition = {
  id: 'stun',
  name: 'Stun',
  isDebuff: true,
  durationMs: 2000,
  stackLimit: 1,
  stackRule: 'refresh',
  diminishingReturns: false,
  drReductionPerStack: 0,
  behaviorModifiers: [{ type: 'stun', durationMs: 2000 }],
  color: '#ffff00',
};
skillEngine.registerBuff(buffStun);

const buffFreeze: BuffDefinition = {
  id: 'freeze',
  name: 'Freeze',
  isDebuff: true,
  durationMs: 3000,
  stackLimit: 1,
  stackRule: 'refresh',
  diminishingReturns: false,
  drReductionPerStack: 0,
  behaviorModifiers: [{ type: 'freeze', durationMs: 3000 }],
  color: '#88ccff',
};
skillEngine.registerBuff(buffFreeze);

const buffSilence: BuffDefinition = {
  id: 'silence',
  name: 'Silence',
  isDebuff: true,
  durationMs: 4000,
  stackLimit: 1,
  stackRule: 'refresh',
  diminishingReturns: false,
  drReductionPerStack: 0,
  behaviorModifiers: [{ type: 'silence', durationMs: 4000 }],
  color: '#aa44ff',
};
skillEngine.registerBuff(buffSilence);

const buffRoot: BuffDefinition = {
  id: 'root',
  name: 'Root',
  isDebuff: true,
  durationMs: 3000,
  stackLimit: 1,
  stackRule: 'refresh',
  diminishingReturns: false,
  drReductionPerStack: 0,
  behaviorModifiers: [{ type: 'root', durationMs: 3000 }],
  color: '#884400',
};
skillEngine.registerBuff(buffRoot);

const buffDotBasic: BuffDefinition = {
  id: 'dot_basic',
  name: 'Poison',
  isDebuff: true,
  durationMs: 10000,
  stackLimit: 3,
  stackRule: 'stack',
  diminishingReturns: false,
  drReductionPerStack: 0,
  onTick: [{
    type: 'damage',
    formula: { type: 'flat', baseValue: 10, multiplier: 1.0, variance: 3, critChance: 0, critMultiplier: 1.5 },
    applyToSelf: false,
  }],
  color: '#44aa44',
};
skillEngine.registerBuff(buffDotBasic);

const buffStr: BuffDefinition = {
  id: 'buff_str',
  name: 'Strength Buff',
  isDebuff: false,
  durationMs: 60000,
  stackLimit: 1,
  stackRule: 'refresh',
  diminishingReturns: false,
  drReductionPerStack: 0,
  statModifiers: [{ stat: 'str', flat: 0, percent: 20 }],
  color: '#ff4444',
};
skillEngine.registerBuff(buffStr);

const buffAgi: BuffDefinition = {
  id: 'buff_agi',
  name: 'Agility Buff',
  isDebuff: false,
  durationMs: 60000,
  stackLimit: 1,
  stackRule: 'refresh',
  diminishingReturns: false,
  drReductionPerStack: 0,
  statModifiers: [{ stat: 'agi', flat: 0, percent: 20 }, { stat: 'moveSpeed', flat: 0, percent: 15 }],
  color: '#44ff44',
};
skillEngine.registerBuff(buffAgi);

const buffShield: BuffDefinition = {
  id: 'shield',
  name: 'Shield',
  isDebuff: false,
  durationMs: 10000,
  stackLimit: 1,
  stackRule: 'replace',
  diminishingReturns: false,
  drReductionPerStack: 0,
  color: '#8888ff',
};
skillEngine.registerBuff(buffShield);

// Build lookup maps
const jobMap = new Map(jobs.map(j => [j.id, j]));
const validJobIds = new Set(jobs.map(j => j.id));

function createDefaultPlayer(id: string, name: string): ServerPlayer {
  const { defaultPlayer } = balance;
  return {
    id,
    x: defaultPlayer.spawnPosition.x,
    y: defaultPlayer.spawnPosition.y,
    z: defaultPlayer.spawnPosition.z,
    name: (name || 'Player').slice(0, balance.limits.playerNameMaxLength),
    stats: {
      str: defaultPlayer.baseStats.str,
      agi: defaultPlayer.baseStats.agi,
      vit: defaultPlayer.baseStats.vit,
      int: defaultPlayer.baseStats.int,
      dex: defaultPlayer.baseStats.dex,
      luk: defaultPlayer.baseStats.luk,
      statPoints: 0,
    },
    hp: defaultPlayer.hp,
    maxHp: defaultPlayer.hp,
    sp: defaultPlayer.sp,
    maxSp: defaultPlayer.sp,
    baseLevel: 1,
    jobLevel: 1,
    jobExp: 0,
    jobClass: 'novice',
    unlockedSkills: [],
    skillPoints: defaultPlayer.skillPoints,
    lastAttackTime: 0,
    inputQueue: [],
    lastProcessedSeq: 0,
    lastSentSnapshot: null,
    currentMapId: 'prontera',
    warpCooldownUntil: 0,
    equippedItems: {},
  };
}

function isSkillUnlocked(player: ServerPlayer, skillId: string): boolean {
  if (skillId === 'basic_attack') return true;
  return player.unlockedSkills.includes(skillId);
}

function distSq(a: { x: number; z: number }, b: { x: number; z: number }): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
}

function snapshotPlayerChanged(a: SnapshotPlayer, b: SnapshotPlayer): boolean {
  return a.x !== b.x || a.z !== b.z || a.hp !== b.hp || a.sp !== b.sp;
}

// ── Express & Socket.io setup ──
const app = express();
const httpServer = createServer(app);
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || '*';
const io = new SocketIOServer(httpServer, { cors: { origin: allowedOrigins } });

app.get('/health', (_req, res) => {
  let totalPlayers = 0;
  for (const instance of mapManager.getAllMaps().values()) {
    totalPlayers += instance.players.size;
  }
  res.json({ ok: true, players: totalPlayers, maps: mapManager.getAllMaps().size, tick: tickNum });
});

// ── Game state ──
const savedData = new Map<string, any>();
let tickNum = 0;

// ── Socket.io handlers ──
io.on('connection', (socket) => {
  let player: ServerPlayer | null = null;

  socket.on('join', (data: { name?: string; stats?: any; unlockedSkills?: string[]; equippedItems?: any }) => {
    player = createDefaultPlayer(socket.id, data.name || 'Player');
    if (data.stats) player.stats = data.stats;
    if (data.unlockedSkills) player.unlockedSkills = data.unlockedSkills;
    if (data.equippedItems) player.equippedItems = data.equippedItems;

    const defaultMapId = 'prontera';
    mapManager.addPlayerToMap(socket.id, player, defaultMapId);

    const initData = mapManager.getMapInitData(defaultMapId);
    const enemies = mapManager.getMapEnemies(defaultMapId);
    const players = mapManager.getMapPlayers(defaultMapId);

    socket.emit('init', {
      id: socket.id,
      mapId: defaultMapId,
      mapName: initData?.mapName,
      mapType: initData?.mapType,
      players,
      enemies,
      initData,
    });

    socket.broadcast.to(defaultMapId).emit('playerJoined', {
      id: socket.id,
      x: player.x,
      y: player.y,
      z: player.z,
      name: player.name,
    });

    socket.join(defaultMapId);
  });

  socket.on('input', (input: PlayerInput) => {
    if (!player) return;
    const dirX = Math.max(-1, Math.min(1, input.dirX || 0));
    const dirZ = Math.max(-1, Math.min(1, input.dirZ || 0));
    player.inputQueue.push({ dirX, dirZ, seq: input.seq || 0 });
  });

  socket.on('attack', (data: {
    targetId: string;
    skillId: string | null;
    sp: number;
    position: { x: number; y: number; z: number };
  }) => {
    if (!player) return;

    if (mapManager.isInSafeZone(player.currentMapId, player.x, player.z)) {
      socket.emit('attackResult', { targetId: data.targetId, damage: 0, usedSkill: false, newSp: player.sp, hp: 0, isDead: false, error: 'Cannot attack in safe zone' });
      return;
    }

    const enemy = mapManager.getEnemy(player.currentMapId, data.targetId);
    if (!enemy || enemy.isDead) {
      console.log(`[Attack] Enemy not found or dead: ${data.targetId}`);
      return;
    }

    if (enemy.respawnTime && Date.now() - enemy.respawnTime < balance.enemy.respawnGraceMs) return;

    const now = Date.now();
    mapManager.provokeEnemy(enemy, socket.id, now);
    if (now - player.lastAttackTime < balance.combat.attackCooldownMs) return;
    player.lastAttackTime = now;

    const dist = Math.sqrt(distSq(player, enemy.position));
    if (distSq(player, enemy.position) > balance.combat.attackRange * balance.combat.attackRange) {
      console.log(`[Attack] Out of range: dist=${dist.toFixed(1)}, range=${balance.combat.attackRange}, player=(${player.x.toFixed(1)},${player.z.toFixed(1)}), enemy=(${enemy.position.x.toFixed(1)},${enemy.position.z.toFixed(1)})`);
      return;
    }

    let usedSkill = false;
    let skillSpCost = 0;
    if (data.skillId) {
      if (!isSkillUnlocked(player, data.skillId)) {
        console.log(`[Attack] Skill not unlocked: ${data.skillId}`);
        return;
      }
      skillSpCost = getSkillSpCost(skills, data.skillId);
    }
    if (player.sp < skillSpCost) {
      console.log(`[Attack] Not enough SP: ${player.sp} < ${skillSpCost}`);
      return;
    }
    player.sp -= skillSpCost;
    if (skillSpCost > 0) usedSkill = true;

    const skillMultiplier = getSkillMultiplier(skills, data.skillId || 'basic_attack');
    let statValue = player.stats.str ?? balance.defaultPlayer.baseStats.str;

    if (player.equippedItems) {
      for (const itemId of Object.values(player.equippedItems)) {
        const itemDef = items.find(i => i.id === itemId);
        if (itemDef?.equipStats?.str) {
          statValue += itemDef.equipStats.str;
        }
      }
    }

    const damage = calculateDamage(statValue, skillMultiplier, balance);
    console.log(`[Attack] Hit ${enemy.name} for ${damage} damage (str=${statValue}, mult=${skillMultiplier}, skill=${data.skillId || 'basic'})`);

    enemy.hp = Math.max(0, enemy.hp - damage);

    if (enemy.hp === 0) {
      enemy.isDead = true;
      enemy.deathTime = Date.now();

      const { baseExp: expBase, jobExp: expJob } = calculateExpReward(enemy.level, balance);

      const drops = mapManager.getEnemyDrops(enemy.templateId);
      const loot: any[] = [];
      for (const drop of drops) {
        if (Math.random() <= drop.chance) {
          const amount = drop.minAmount + Math.floor(Math.random() * (drop.maxAmount - drop.minAmount + 1));
          const itemDef = items.find(i => i.id === drop.itemId);
          loot.push({
            id: drop.itemId,
            name: itemDef?.name ?? drop.itemId,
            type: itemDef?.type ?? 'misc',
            amount,
            description: itemDef?.description ?? '',
          });
        }
      }

      socket.emit('enemyKilled', {
        targetId: data.targetId, expBase, expJob, loot,
        newSp: player.sp, damage, usedSkill,
        hp: 0, isDead: true,
      });
    } else {
      socket.emit('attackResult', {
        targetId: data.targetId, damage, usedSkill,
        newSp: player.sp, hp: enemy.hp, isDead: false,
      });
    }

    io.to(player.currentMapId).emit('enemyDamaged', {
      targetId: data.targetId, damage, usedSkill,
      attackerId: socket.id, hp: enemy.hp, isDead: enemy.isDead,
    });
  });

  socket.on('skillCast', (data: SkillCastRequest, callback?: (res: any) => void) => {
    if (!player) return;

    if (mapManager.isInSafeZone(player.currentMapId, player.x, player.z)) {
      callback?.({ success: false, error: 'Cannot use skills in safe zone' });
      return;
    }

    const instance = mapManager.getMap(player.currentMapId);
    if (!instance) return;

    const casterStats: Record<string, number> = {
      str: player.stats.str,
      agi: player.stats.agi,
      vit: player.stats.vit,
      int: player.stats.int,
      dex: player.stats.dex,
      luk: player.stats.luk,
      maxHp: player.maxHp,
    };

    const request: any = {
      skillId: data.skillId,
      targetId: data.targetId,
      targetX: data.targetX,
      targetZ: data.targetZ,
      directionX: data.directionX,
      directionZ: data.directionZ,
      casterId: player.id,
      casterPosition: { x: player.x, y: player.y, z: player.z },
      casterStats,
      casterLevel: player.baseLevel,
      sp: player.sp,
      hp: player.hp,
    };

    if (skillEngine.isCasting(player.id)) {
      callback?.({ success: false, error: 'Already casting' });
      return;
    }

    const result = skillEngine.executeCast(request);

    if (!result.success) {
      callback?.({ success: false, error: result.error });
      return;
    }

    if (result.castTimeMs) {
      player.isCasting = true;
      player.castingSkillId = data.skillId;
      callback?.({ success: true, castTimeMs: result.castTimeMs, animationId: result.animationId });
      return;
    }

    player.sp = result.newSp ?? player.sp;
    player.hp = result.newHp ?? player.hp;

    if (result.damage) {
      for (const targetId of result.targetsHit ?? []) {
        const enemy = mapManager.getEnemy(player.currentMapId, targetId);
        const perTargetDamage = result.targetDamages?.[targetId] ?? result.damage;
        if (enemy && !enemy.isDead) {
          enemy.hp = Math.max(0, enemy.hp - perTargetDamage);
          if (enemy.hp === 0) {
            enemy.isDead = true;
            enemy.deathTime = Date.now();
            const { baseExp: expBase, jobExp: expJob } = calculateExpReward(enemy.level, balance);
            const drops = mapManager.getEnemyDrops(enemy.templateId);
            const loot: any[] = [];
            for (const drop of drops) {
              if (Math.random() <= drop.chance) {
                const amount = drop.minAmount + Math.floor(Math.random() * (drop.maxAmount - drop.minAmount + 1));
                const itemDef = items.find(i => i.id === drop.itemId);
                loot.push({ id: drop.itemId, name: itemDef?.name ?? drop.itemId, type: itemDef?.type ?? 'misc', amount, description: itemDef?.description ?? '' });
              }
            }
            socket.emit('enemyKilled', { targetId, expBase, expJob, loot, newSp: player.sp, damage: perTargetDamage, usedSkill: true, hp: 0, isDead: true });
          }
        }
      }
    }

    if (result.groundEffectId) {
      const ge = skillEngine.getGroundEffectManager().getEffectById(result.groundEffectId);
      if (ge) {
        io.to(player.currentMapId).emit('groundEffectCreated', {
          id: ge.id,
          definitionId: ge.definitionId,
          casterId: ge.casterId,
          x: ge.x,
          z: ge.z,
          createdAt: ge.createdAt,
          expiresAt: ge.expiresAt,
          angle: ge.angle,
          length: ge.length,
        });
      }
    }

    callback?.({
      success: true,
      damage: result.damage,
      heal: result.heal,
      isCritical: result.isCritical,
      targetsHit: result.targetsHit,
      targetDamages: result.targetDamages,
      targetHeals: result.targetHeals,
      targetPositions: result.targetPositions,
      newSp: result.newSp,
      newHp: result.newHp,
      cooldownMs: result.cooldownMs,
      animationId: result.animationId,
      vfxId: result.vfxId,
      soundId: result.soundId,
    });

    io.to(player.currentMapId).emit('skillCastResult', {
      casterId: player.id,
      skillId: data.skillId,
      damage: result.damage,
      heal: result.heal,
      isCritical: result.isCritical,
      targetsHit: result.targetsHit,
      targetDamages: result.targetDamages,
      targetHeals: result.targetHeals,
      targetPositions: result.targetPositions,
      animationId: result.animationId,
      vfxId: result.vfxId,
      soundId: result.soundId,
    });
  });

  socket.on('skillCastComplete', (data: { skillId: string }, callback?: (res: any) => void) => {
    if (!player) return;

    const instance = mapManager.getMap(player.currentMapId);
    if (!instance) return;

    const casterStats: Record<string, number> = {
      str: player.stats.str,
      agi: player.stats.agi,
      vit: player.stats.vit,
      int: player.stats.int,
      dex: player.stats.dex,
      luk: player.stats.luk,
      maxHp: player.maxHp,
    };

    const request: any = {
      skillId: data.skillId,
      casterId: player.id,
      casterPosition: { x: player.x, y: player.y, z: player.z },
      casterStats,
      casterLevel: player.baseLevel,
      sp: player.sp,
      hp: player.hp,
    };

    const result = skillEngine.completeCast(player.id, request);

    player.isCasting = false;
    player.castingSkillId = undefined;
    player.sp = result.newSp ?? player.sp;
    player.hp = result.newHp ?? player.hp;

    if (result.damage) {
      for (const targetId of result.targetsHit ?? []) {
        const enemy = mapManager.getEnemy(player.currentMapId, targetId);
        const perTargetDamage = result.targetDamages?.[targetId] ?? result.damage;
        if (enemy && !enemy.isDead) {
          enemy.hp = Math.max(0, enemy.hp - perTargetDamage);
          if (enemy.hp === 0) {
            enemy.isDead = true;
            enemy.deathTime = Date.now();
            const { baseExp: expBase, jobExp: expJob } = calculateExpReward(enemy.level, balance);
            socket.emit('enemyKilled', { targetId, expBase, expJob, loot: [], newSp: player.sp, damage: perTargetDamage, usedSkill: true, hp: 0, isDead: true });
          }
        }
      }
    }

    if (result.groundEffectId) {
      const ge = skillEngine.getGroundEffectManager().getEffectById(result.groundEffectId);
      if (ge) {
        io.to(player.currentMapId).emit('groundEffectCreated', {
          id: ge.id, definitionId: ge.definitionId, casterId: ge.casterId,
          x: ge.x, z: ge.z, createdAt: ge.createdAt, expiresAt: ge.expiresAt,
          angle: ge.angle, length: ge.length,
        });
      }
    }

    callback?.({
      success: true,
      damage: result.damage,
      heal: result.heal,
      isCritical: result.isCritical,
      targetsHit: result.targetsHit,
      targetDamages: result.targetDamages,
      targetHeals: result.targetHeals,
      targetPositions: result.targetPositions,
      newSp: result.newSp,
      newHp: result.newHp,
      cooldownMs: result.cooldownMs,
      animationId: result.animationId,
      vfxId: result.vfxId,
      soundId: result.soundId,
    });

    io.to(player.currentMapId).emit('skillCastResult', {
      casterId: player.id,
      skillId: data.skillId,
      damage: result.damage,
      heal: result.heal,
      isCritical: result.isCritical,
      targetsHit: result.targetsHit,
      targetDamages: result.targetDamages,
      targetHeals: result.targetHeals,
      targetPositions: result.targetPositions,
      animationId: result.animationId,
      vfxId: result.vfxId,
      soundId: result.soundId,
    });
  });

  socket.on('skillCastInterrupt', () => {
    if (!player) return;
    skillEngine.interruptCast(player.id);
    player.isCasting = false;
    player.castingSkillId = undefined;
  });

  socket.on('requestWarp', (data: { warpId: string }, callback?: (res: { success: boolean; error?: string }) => void) => {
    if (!player) return;

    const now = Date.now();
    if (now < player.warpCooldownUntil) {
      callback?.({ success: false, error: 'Warp cooldown active' });
      return;
    }

    const warp = mapManager.findWarpByProximity(player.currentMapId, player.x, player.z);
    if (!warp) {
      callback?.({ success: false, error: 'No warp nearby' });
      return;
    }

    if (warp.id !== data.warpId) {
      callback?.({ success: false, error: 'Warp mismatch' });
      return;
    }

    const targetMap = mapManager.getMap(warp.targetMapId);
    if (!targetMap) {
      callback?.({ success: false, error: 'Target map not found' });
      return;
    }

    if (warp.requirements) {
      if (player.baseLevel < warp.requirements.minLevel) {
        callback?.({ success: false, error: `Requires level ${warp.requirements.minLevel}` });
        return;
      }
    }

    performMapChange(player, socket, warp.targetMapId, warp.targetSpawnId);
    callback?.({ success: true });
  });

  socket.on('changeJob', (data: { newJob: string }, callback?: (res: { success: boolean; error?: string }) => void) => {
    if (!player) return;

    const jobDef = jobMap.get(data.newJob);
    if (!jobDef || !validJobIds.has(data.newJob)) {
      callback?.({ success: false, error: 'Invalid job class.' });
      return;
    }

    const req = jobDef.requirements;
    if (req) {
      if (player.jobClass !== req.fromJob) {
        callback?.({ success: false, error: `Can only change from ${req.fromJob}.` });
        return;
      }
      if (player.jobLevel < req.minJobLevel) {
        callback?.({ success: false, error: `Need job level ${req.minJobLevel}.` });
        return;
      }
    }

    player.jobClass = data.newJob;
    player.jobLevel = 1;
    player.jobExp = 0;
    player.unlockedSkills = [];
    player.skillPoints += jobDef.bonusSkillPoints;

    player.stats.str += jobDef.baseStatModifiers.str;
    player.stats.agi += jobDef.baseStatModifiers.agi;
    player.stats.vit += jobDef.baseStatModifiers.vit;
    player.stats.int += jobDef.baseStatModifiers.int;
    player.stats.dex += jobDef.baseStatModifiers.dex;
    player.stats.luk += jobDef.baseStatModifiers.luk;

    callback?.({ success: true });
  });

  socket.on('allocateStat', (data: { stat: string; statPoints?: number }, callback?: (res: { success: boolean; stats?: any; error?: string }) => void) => {
    if (!player) return;
    if (data.stat === 'statPoints') { callback?.({ success: false, error: 'Cannot allocate statPoints directly.' }); return; }

    if (data.statPoints !== undefined) player.stats.statPoints = Math.max(0, data.statPoints);
    if (player.stats.statPoints <= 0) { callback?.({ success: false, error: 'No stat points available.' }); return; }
    if (player.stats[data.stat as keyof typeof player.stats] >= balance.stats.cap) { callback?.({ success: false, error: `Stat ${data.stat} is at max (${balance.stats.cap}).` }); return; }

    const statKey = data.stat as keyof typeof player.stats;
    if (statKey !== 'statPoints') {
      (player.stats[statKey] as number) += 1;
    }
    player.stats.statPoints -= 1;
    callback?.({ success: true, stats: { ...player.stats } });
  });

  socket.on('unlockSkill', (data: { skillId: string; skillPoints?: number }, callback?: (res: { success: boolean; unlockedSkills?: string[]; skillPoints?: number; error?: string }) => void) => {
    if (!player) return;

    const skill = skills.find(s => s.id === data.skillId);
    if (!skill) { callback?.({ success: false, error: 'Skill not found.' }); return; }
    if (player.unlockedSkills.includes(data.skillId)) { callback?.({ success: false, error: 'Skill already unlocked.' }); return; }

    if (data.skillPoints !== undefined) player.skillPoints = Math.max(0, data.skillPoints);
    if (player.skillPoints < skill.skillPointCost) { callback?.({ success: false, error: 'Not enough skill points.' }); return; }

    for (const req of skill.requirements) {
      if (!isSkillUnlocked(player, req)) { callback?.({ success: false, error: `Requires ${req}.` }); return; }
    }

    player.unlockedSkills.push(data.skillId);
    player.skillPoints -= skill.skillPointCost;
    callback?.({ success: true, unlockedSkills: [...player.unlockedSkills], skillPoints: player.skillPoints });
  });

  type TradeSession = {
    initiatorId: string;
    peerId: string;
    initiatorOffer: { zeny: number; locked: boolean; accepted: boolean };
    peerOffer: { zeny: number; locked: boolean; accepted: boolean };
  };
  const tradeSessions = new Map<string, TradeSession>();

  function getTradeSession(socketId: string): TradeSession | undefined {
    for (const ts of tradeSessions.values()) {
      if (ts.initiatorId === socketId || ts.peerId === socketId) return ts;
    }
    return undefined;
  }

  function otherPlayerId(ts: TradeSession, socketId: string): string {
    return ts.initiatorId === socketId ? ts.peerId : ts.initiatorId;
  }

  socket.on('requestTrade', (data: { targetSocketId: string }) => {
    if (!player) return;
    if (data.targetSocketId === socket.id) return;
    if (getTradeSession(socket.id)) return;
    if (getTradeSession(data.targetSocketId)) return;

    const session: TradeSession = {
      initiatorId: socket.id,
      peerId: data.targetSocketId,
      initiatorOffer: { zeny: 0, locked: false, accepted: false },
      peerOffer: { zeny: 0, locked: false, accepted: false },
    };
    tradeSessions.set(`${socket.id}-${data.targetSocketId}`, session);
    io.to(data.targetSocketId).emit('tradeRequested', { from: socket.id, name: player.name });
  });

  socket.on('acceptTradeRequest', () => {
    if (!player) return;
    for (const [key, ts] of tradeSessions) {
      if (ts.peerId === socket.id) {
        const initiatorName = mapManager.getMapPlayers(player.currentMapId)[ts.initiatorId]?.name;
        io.to(ts.initiatorId).emit('tradeAccepted', { peerId: ts.peerId, name: player.name });
        socket.emit('tradeAccepted', { peerId: ts.initiatorId, name: initiatorName });
        return;
      }
    }
  });

  socket.on('declineTradeRequest', () => {
    if (!player) return;
    for (const [key, ts] of tradeSessions) {
      if (ts.peerId === socket.id) {
        io.to(ts.initiatorId).emit('tradeDeclined', { name: player.name });
        tradeSessions.delete(key);
        return;
      }
    }
  });

  socket.on('updateTradeOffer', (data: { zeny?: number }) => {
    if (!player) return;
    const ts = getTradeSession(socket.id);
    if (!ts) return;
    const offer = ts.initiatorId === socket.id ? ts.initiatorOffer : ts.peerOffer;
    if (offer.locked) return;
    if (data.zeny !== undefined) offer.zeny = Math.max(0, Math.min(999999999, data.zeny));

    const peerId = otherPlayerId(ts, socket.id);
    io.to(peerId).emit('tradeOfferUpdated', { from: socket.id, offer: { zeny: offer.zeny, locked: offer.locked } });
  });

  socket.on('lockTrade', () => {
    if (!player) return;
    const ts = getTradeSession(socket.id);
    if (!ts) return;
    const offer = ts.initiatorId === socket.id ? ts.initiatorOffer : ts.peerOffer;
    offer.locked = true;
    const peerId = otherPlayerId(ts, socket.id);
    io.to(peerId).emit('tradeOfferUpdated', { from: socket.id, offer: { zeny: offer.zeny, locked: offer.locked } });
    socket.emit('tradeOfferUpdated', { from: socket.id, offer: { zeny: offer.zeny, locked: offer.locked } });
    if (ts.initiatorOffer.locked && ts.peerOffer.locked) {
      io.to(ts.initiatorId).emit('tradeReady');
      io.to(ts.peerId).emit('tradeReady');
    }
  });

  socket.on('acceptTrade', () => {
    if (!player) return;
    const ts = getTradeSession(socket.id);
    if (!ts) return;
    if (!ts.initiatorOffer.locked || !ts.peerOffer.locked) return;
    const myOffer = ts.initiatorId === socket.id ? ts.initiatorOffer : ts.peerOffer;
    if (myOffer.accepted) return;
    myOffer.accepted = true;

    const initiator = mapManager.getMapPlayers(player.currentMapId)[ts.initiatorId];
    const peer = mapManager.getMapPlayers(player.currentMapId)[ts.peerId];
    if (initiator && peer && ts.initiatorOffer.accepted && ts.peerOffer.accepted) {
      io.to(ts.initiatorId).emit('tradeCompleted', { receivedZeny: ts.peerOffer.zeny, sentZeny: ts.initiatorOffer.zeny });
      io.to(ts.peerId).emit('tradeCompleted', { receivedZeny: ts.initiatorOffer.zeny, sentZeny: ts.peerOffer.zeny });
      for (const [k] of tradeSessions) {
        if (k.startsWith(ts.initiatorId) || k.endsWith(ts.initiatorId)) { tradeSessions.delete(k); break; }
      }
    }
  });

  socket.on('cancelTrade', () => {
    if (!player) return;
    for (const [key, ts] of tradeSessions) {
      if (ts.initiatorId === socket.id || ts.peerId === socket.id) {
        io.to(otherPlayerId(ts, socket.id)).emit('tradeCancelled', { name: player.name });
        tradeSessions.delete(key);
        break;
      }
    }
  });

  socket.on('useItem', (data: { itemId: string }, callback?: (res: { success: boolean; error?: string }) => void) => {
    if (!player) return;
    const itemDef = items.find(i => i.id === data.itemId);
    if (!itemDef || itemDef.type !== 'usable') {
      callback?.({ success: false, error: 'Item not usable' });
      return;
    }
    const effect = itemDef.effect;
    if (effect) {
      switch (effect.type) {
        case 'restore_hp':
          player.hp = Math.min(player.maxHp, player.hp + (effect.value ?? 0));
          break;
        case 'restore_sp':
          player.sp = Math.min(player.maxSp, player.sp + (effect.value ?? 0));
          break;
        case 'restore_hp_percent':
          player.hp = Math.min(player.maxHp, player.hp + Math.floor(player.maxHp * (effect.percent ?? 0) / 100));
          break;
        case 'restore_sp_percent':
          player.sp = Math.min(player.maxSp, player.sp + Math.floor(player.maxSp * (effect.percent ?? 0) / 100));
          break;
      }
    }
    callback?.({ success: true });
  });

  socket.on('chat', (msg: string) => {
    if (!player) return;
    const text = (typeof msg === 'string' ? msg : '').slice(0, balance.limits.chatMaxLength);
    if (!text.trim()) return;
    io.to(player.currentMapId).emit('chatMessage', {
      id: Date.now().toString() + Math.random().toString(),
      sender: player.name,
      text,
      timestamp: Date.now(),
    });
  });

  socket.on('saveProgress', (playerData: any) => {
    if (player && playerData) savedData.set(socket.id, playerData);
    socket.emit('progressSaved', { success: true });
  });

  socket.on('loadProgress', (callback?: (data: any) => void) => {
    const data = savedData.get(socket.id);
    if (callback) callback(data || null);
  });

  socket.on('disconnect', () => {
    if (player) {
      const result = mapManager.removePlayerFromMap(socket.id);
      if (result) {
        socket.leave(result.mapId);
        io.to(result.mapId).emit('playerLeft', socket.id);
      }
    }

    for (const [key, ts] of tradeSessions) {
      if (ts.initiatorId === socket.id || ts.peerId === socket.id) {
        const otherId = ts.initiatorId === socket.id ? ts.peerId : ts.initiatorId;
        io.to(otherId).emit('tradeCancelled', { name: player?.name || 'Disconnected player' });
        tradeSessions.delete(key);
        break;
      }
    }
  });
});

// ── Map change helper ──
function performMapChange(player: ServerPlayer, socket: any, targetMapId: string, targetSpawnId: string) {
  const oldMapId = player.currentMapId;
  const oldInstance = mapManager.getMap(oldMapId);

  if (oldInstance) {
    oldInstance.players.delete(player.id);
    socket.leave(oldMapId);
    io.to(oldMapId).emit('playerLeft', player.id);
  }

  mapManager.addPlayerToMap(player.id, player, targetMapId, targetSpawnId);
  socket.join(targetMapId);

  const initData = mapManager.getMapInitData(targetMapId);
  const enemies = mapManager.getMapEnemies(targetMapId);
  const players = mapManager.getMapPlayers(targetMapId);

  const mapChangeData: MapChangeData = {
    mapId: targetMapId,
    mapName: initData?.mapName ?? targetMapId,
    mapType: initData?.mapType ?? 'field',
    spawnPosition: { x: player.x, y: player.y, z: player.z },
    initData: initData!,
    enemies,
    players,
  };

  socket.emit('mapChange', mapChangeData);

  io.to(targetMapId).emit('playerJoined', {
    id: player.id,
    x: player.x,
    y: player.y,
    z: player.z,
    name: player.name,
  });

  player.warpCooldownUntil = Date.now() + 2000;
}

// ── Game Loop ─────────────────────────────────────────────
let ticking = false;
const tickTimeSec = balance.server.tickRateMs / 1000;
const regenIntervalTicks = balance.regen.intervalTicks;

function tick() {
  tickNum++;
  const now = Date.now();

  for (const [mapId, instance] of mapManager.getAllMaps()) {
    // ── Build spatial entities for SkillEngine ──
    const spatialEntities: SpatialEntity[] = [];
    for (const [id, p] of instance.players) {
      spatialEntities.push({ id, x: p.x, z: p.z });
    }
    for (const [id, e] of instance.enemies) {
      if (!e.isDead) {
        spatialEntities.push({ id, x: e.position.x, z: e.position.z });
      }
    }
    skillEngine.rebuildSpatialIndex(spatialEntities);

    // ── Build buffable entities ──
    const buffableEntities = new Map<string, BuffableEntity>();
    for (const [id, p] of instance.players) {
      buffableEntities.set(id, {
        id,
        position: { x: p.x, y: p.y, z: p.z },
        isAlive: p.hp > 0,
      });
    }
    for (const [id, e] of instance.enemies) {
      if (!e.isDead) {
        buffableEntities.set(id, {
          id,
          position: { x: e.position.x, y: e.position.y, z: e.position.z },
          isAlive: true,
        });
      }
    }

    // ── Tick SkillEngine (buffs, ground effects) ──
    skillEngine.tick(now, buffableEntities, (targetId, effect, sourceId) => {
      const casterPlayer = instance.players.get(sourceId);
      const casterStats: Record<string, number> = casterPlayer ? {
        str: casterPlayer.stats.str,
        agi: casterPlayer.stats.agi,
        vit: casterPlayer.stats.vit,
        int: casterPlayer.stats.int,
        dex: casterPlayer.stats.dex,
        luk: casterPlayer.stats.luk,
        maxHp: casterPlayer.maxHp,
      } : {};

      const formulaRequest: any = {
        casterStats,
        casterLevel: casterPlayer?.baseLevel ?? 1,
        sp: casterPlayer?.sp ?? 0,
        hp: casterPlayer?.hp ?? 0,
        casterPosition: { x: 0, y: 0, z: 0 },
        casterId: sourceId,
        skillId: '',
      };

      if (effect.type === 'damage' || effect.type === 'aoe_damage') {
        const calcDmg = effect.formula ? skillEngine.calculateFormula(effect.formula, formulaRequest) : 10;
        const enemy = mapManager.getEnemy(mapId, targetId);
        if (enemy && !enemy.isDead) {
          enemy.hp = Math.max(0, enemy.hp - calcDmg);
          if (enemy.hp === 0) {
            enemy.isDead = true;
            enemy.deathTime = now;
          }
        }
        const player = instance.players.get(targetId);
        if (player) {
          player.hp = Math.max(0, player.hp - calcDmg);
          if (player.hp === 0) {
            const halfW = instance.config.dimensions.width / 4;
            const halfH = instance.config.dimensions.height / 4;
            const spawnPoint = instance.config.spawnPoints[0];
            if (spawnPoint) {
              player.x = spawnPoint.position.x;
              player.y = spawnPoint.position.y;
              player.z = spawnPoint.position.z;
            } else {
              player.x = (Math.random() - 0.5) * halfW;
              player.z = (Math.random() - 0.5) * halfH;
            }
            player.hp = player.maxHp;
            player.sp = player.maxSp;
            io.to(targetId).emit('playerDied', { respawnPosition: { x: player.x, y: player.y, z: player.z } });
          }
        }
      } else if (effect.type === 'heal' || effect.type === 'aoe_heal' || effect.type === 'hot') {
        const healAmt = effect.formula ? skillEngine.calculateFormula(effect.formula, formulaRequest) : 10;
        const player = instance.players.get(targetId);
        if (player) {
          player.hp = Math.min(player.maxHp, player.hp + healAmt);
        }
      }
    });

    // ── Process input queues ──
    for (const p of instance.players.values()) {
      let dx = 0, dz = 0;
      while (p.inputQueue.length > 0) {
        const input = p.inputQueue.shift()!;
        p.lastProcessedSeq = input.seq;
        if (input.dirX !== 0 || input.dirZ !== 0) {
          dx = input.dirX;
          dz = input.dirZ;
        }
      }
      if (dx !== 0 || dz !== 0) {
        const len = Math.sqrt(dx * dx + dz * dz);
        if (len > 1.0) { dx /= len; dz /= len; }

        const newX = p.x + dx * balance.movement.playerSpeed * tickTimeSec;
        const newZ = p.z + dz * balance.movement.playerSpeed * tickTimeSec;

        if (instance.navGrid) {
          const cell = instance.navGrid.cells;
          const cols = instance.navGrid.cols;
          const cellSize = instance.navGrid.cellSize;
          const halfW = (cols * cellSize) / 2;
          const halfH = (instance.navGrid.rows * cellSize) / 2;
          const gx = Math.floor((newX + halfW) / cellSize);
          const gz = Math.floor((newZ + halfH) / cellSize);
          if (gx >= 0 && gx < cols && gz >= 0 && gz < instance.navGrid.rows) {
            const cellData = cell[gz * cols + gx];
            if (cellData && cellData.walkable) {
              p.x = newX;
              p.z = newZ;
            }
          }
        } else {
          p.x = newX;
          p.z = newZ;
        }

        // Clamp to map bounds
        const halfW = instance.config.dimensions.width / 2;
        const halfH = instance.config.dimensions.height / 2;
        p.x = Math.max(-halfW, Math.min(halfW, p.x));
        p.z = Math.max(-halfH, Math.min(halfH, p.z));
      }

      // Regen
      if (tickNum % regenIntervalTicks === 0) {
        if (mapManager.isInSafeZone(mapId, p.x, p.z)) {
          if (p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + balance.regen.amountPerTick * 3);
          if (p.sp < p.maxSp) p.sp = Math.min(p.maxSp, p.sp + balance.regen.amountPerTick * 3);
        } else {
          if (p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + balance.regen.amountPerTick);
          if (p.sp < p.maxSp) p.sp = Math.min(p.maxSp, p.sp + balance.regen.amountPerTick);
        }
      }
    }

    // ── Enemy respawn ──
    mapManager.tickEnemies(mapId, now, (enemy) => {
      io.to(mapId).emit('enemyRespawned', {
        id: enemy.id,
        name: enemy.name,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        level: enemy.level,
        position: enemy.position,
        isDead: false,
      });
    });

    // ── Mob AI ──
    mapManager.tickMobAI(mapId, now, tickTimeSec, (enemy, playerSocketId) => {
      const targetPlayer = instance.players.get(playerSocketId);
      if (!targetPlayer) return;

      const vitReduction = Math.floor((targetPlayer.stats.vit ?? 5) * 0.3);
      const damage = Math.max(1, enemy.attackDamage - vitReduction + Math.floor(Math.random() * 3) - 1);

      targetPlayer.hp = Math.max(0, targetPlayer.hp - damage);

      io.to(playerSocketId).emit('playerDamaged', {
        enemyId: enemy.id,
        enemyName: enemy.name,
        damage,
        hp: targetPlayer.hp,
        maxHp: targetPlayer.maxHp,
        isDead: targetPlayer.hp === 0,
      });

      if (targetPlayer.hp === 0) {
        const halfW = instance.config.dimensions.width / 4;
        const halfH = instance.config.dimensions.height / 4;
        const spawnPoint = instance.config.spawnPoints[0];
        if (spawnPoint) {
          targetPlayer.x = spawnPoint.position.x;
          targetPlayer.y = spawnPoint.position.y;
          targetPlayer.z = spawnPoint.position.z;
        } else {
          targetPlayer.x = (Math.random() - 0.5) * halfW;
          targetPlayer.z = (Math.random() - 0.5) * halfH;
        }
        targetPlayer.hp = targetPlayer.maxHp;
        targetPlayer.sp = targetPlayer.maxSp;

        io.to(playerSocketId).emit('playerDied', {
          respawnPosition: { x: targetPlayer.x, y: targetPlayer.y, z: targetPlayer.z },
        });

        enemy.aiState = 'return';
        enemy.targetPlayerId = null;
      }
    });

    // ── Build snapshots ──
    const isFullTick = tickNum % balance.server.fullSnapshotInterval === 0;

    // Emit ground effect updates
    const activeGroundEffects = skillEngine.getGroundEffectManager().getActiveEffects();
    if (activeGroundEffects.length > 0 || isFullTick) {
      io.to(mapId).emit('groundEffectsUpdate', activeGroundEffects.map(ge => ({
        id: ge.id,
        definitionId: ge.definitionId,
        casterId: ge.casterId,
        x: ge.x,
        z: ge.z,
        createdAt: ge.createdAt,
        expiresAt: ge.expiresAt,
        angle: ge.angle,
        length: ge.length,
      })));
    }

    // Emit buff updates for players
    for (const [socketId, p] of instance.players) {
      const buffs = skillEngine.getBuffManager().getBuffsByTarget(socketId);
      if (buffs.length > 0 || isFullTick) {
        io.to(socketId).emit('buffsUpdate', buffs.map(b => ({
          id: b.id,
          buffId: b.buffId,
          stacks: b.stacks,
          expiresAt: b.expiresAt,
          isDebuff: b.isDebuff,
          icon: b.icon,
          color: b.color,
        })));
      }
    }

    if (isFullTick) {
      const full: WorldSnapshot = { tick: tickNum, players: {}, enemies: {} };
      for (const [id, p] of instance.players) {
        const snap: SnapshotPlayer = { x: p.x, y: p.y, z: p.z, hp: p.hp, maxHp: p.maxHp, sp: p.sp, maxSp: p.maxSp, lastProcessedSeq: p.lastProcessedSeq };
        full.players[id] = snap;
        p.lastSentSnapshot = snap;
      }
      for (const [id, e] of instance.enemies) {
        full.enemies[id] = { hp: e.hp, maxHp: e.maxHp, isDead: e.isDead, position: { x: e.position.x, y: e.position.y, z: e.position.z }, name: e.name, level: e.level };
      }
      io.to(mapId).emit('worldSnapshot', full);
    } else {
      for (const [socketId, p] of instance.players) {
        const snap: WorldSnapshot = { tick: tickNum, players: {}, enemies: {} };

        const selfSnap: SnapshotPlayer = { x: p.x, y: p.y, z: p.z, hp: p.hp, maxHp: p.maxHp, sp: p.sp, maxSp: p.maxSp, lastProcessedSeq: p.lastProcessedSeq };
        snap.players[socketId] = selfSnap;
        p.lastSentSnapshot = selfSnap;

        for (const [otherId, other] of instance.players) {
          if (otherId === socketId) continue;
          if (distSq(p, other) > balance.network.interestRange * balance.network.interestRange) continue;
          const otherSnap: SnapshotPlayer = { x: other.x, y: other.y, z: other.z, hp: other.hp, maxHp: other.maxHp, sp: other.sp, maxSp: other.maxSp };
          if (!other.lastSentSnapshot || snapshotPlayerChanged(other.lastSentSnapshot, otherSnap)) {
            snap.players[otherId] = otherSnap;
          }
          other.lastSentSnapshot = otherSnap;
        }

        for (const [id, e] of instance.enemies) {
          if (e.isDead) continue;
          if (distSq(p, e.position) > balance.network.interestRange * balance.network.interestRange) continue;
          snap.enemies[id] = { hp: e.hp, maxHp: e.maxHp, isDead: e.isDead, position: { x: e.position.x, y: e.position.y, z: e.position.z }, name: e.name, level: e.level };
        }

        io.to(socketId).emit('worldSnapshot', snap);
      }
    }
  }
}

setInterval(() => {
  if (ticking) return;
  ticking = true;
  try { tick(); } finally { ticking = false; }
}, balance.server.tickRateMs);

httpServer.listen(GAME_PORT, () => {
  console.log(`[GameServer] listening on port ${GAME_PORT} | ${1000 / balance.server.tickRateMs} tps`);
  console.log(`[GameServer] Maps loaded: ${mapManager.getAllMaps().size}`);
  for (const [id, instance] of mapManager.getAllMaps()) {
    console.log(`  - ${instance.config.name} (${id}) [${instance.config.type}]`);
  }
  console.log(`[GameServer] Data: ${enemyData.templates.length} enemy templates, ${skills.length} skills, ${items.length} items, ${jobs.length} jobs`);
});
