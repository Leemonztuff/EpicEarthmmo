import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { loadGameData } from '../shared/loader/serverLoader';
import { calculateDamage, calculateExpReward, getSkillSpCost, getSkillMultiplier } from '../shared/loader/formulaEngine';
import type { BalanceConfig, SkillTree, EnemyData, JobDatabase, EnemyTemplate } from '../shared/schemas';
import type { PlayerStats } from '../shared/schemas/gameState';
import type { PlayerInput, WorldSnapshot, SnapshotPlayer } from '../shared/types/network';

// ── Load all game data from JSON files (validated with Zod) ──
const gameData = loadGameData();
const { balance, enemies: enemyData, skills, jobs, items } = gameData;

const GAME_PORT = parseInt(process.env.PORT || '3001', 10);

// Build lookup maps from loaded data
const enemyTemplates = new Map<string, EnemyTemplate>(
  enemyData.templates.map(t => [t.id, t])
);
const jobMap = new Map(jobs.map(j => [j.id, j]));
const validJobIds = new Set(jobs.map(j => j.id));

interface ServerPlayer {
  id: string;
  x: number; y: number; z: number;
  name: string;
  stats: PlayerStats;
  hp: number; maxHp: number;
  sp: number; maxSp: number;
  baseLevel: number; jobLevel: number;
  jobClass: string;
  jobExp: number;
  unlockedSkills: string[];
  skillPoints: number;
  lastAttackTime: number;
  inputQueue: PlayerInput[];
  lastProcessedSeq: number;
  lastSentSnapshot: SnapshotPlayer | null;
}

interface RuntimeEnemy {
  id: string;
  spawnId: string;
  name: string;
  hp: number;
  maxHp: number;
  level: number;
  position: { x: number; y: number; z: number };
  isDead: boolean;
  deathTime?: number;
  respawnTime?: number;
  templateId: string;
}

function createDefaultPlayer(id: string, name: string): ServerPlayer {
  const { defaultPlayer, stats } = balance;
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
  };
}

function initializeEnemies(): Record<string, RuntimeEnemy> {
  const result: Record<string, RuntimeEnemy> = {};
  for (const spawn of enemyData.spawns) {
    const template = enemyTemplates.get(spawn.enemyId);
    if (!template) {
      console.warn(`[GameServer] Enemy template "${spawn.enemyId}" not found for spawn "${spawn.spawnId}"`);
      continue;
    }
    result[spawn.spawnId] = {
      id: spawn.spawnId,
      spawnId: spawn.spawnId,
      name: template.name,
      hp: template.hp,
      maxHp: template.hp,
      level: template.level,
      position: { ...spawn.position },
      isDead: false,
      templateId: template.id,
    };
  }
  return result;
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

function getEnemyDrops(templateId: string): import('../shared/schemas').DropEntry[] {
  const template = enemyTemplates.get(templateId);
  return template?.drops ?? [];
}

// ── Express & Socket.io setup ──
const app = express();
const httpServer = createServer(app);
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || '*';
const io = new SocketIOServer(httpServer, { cors: { origin: allowedOrigins } });

app.get('/health', (_req, res) => {
  res.json({ ok: true, players: players.size, tick: tickNum, dataLoaded: true });
});

// ── Game state ──
const players = new Map<string, ServerPlayer>();
const savedData = new Map<string, any>();
const enemies = initializeEnemies();
let tickNum = 0;

// ── Socket.io handlers ──
io.on('connection', (socket) => {
  let player: ServerPlayer | null = null;

  socket.on('join', (data: { name?: string; stats?: PlayerStats; unlockedSkills?: string[] }) => {
    player = createDefaultPlayer(socket.id, data.name || 'Player');
    if (data.stats) player.stats = data.stats;
    if (data.unlockedSkills) player.unlockedSkills = data.unlockedSkills;
    players.set(socket.id, player);

    const raw: Record<string, { id: string; x: number; y: number; z: number; name: string }> = {};
    for (const [id, p] of players) {
      raw[id] = { id, x: p.x, y: p.y, z: p.z, name: p.name };
    }

    // Send enemy runtime state to client
    const enemyState: Record<string, any> = {};
    for (const [id, e] of Object.entries(enemies)) {
      enemyState[id] = {
        id: e.id,
        name: e.name,
        hp: e.hp,
        maxHp: e.maxHp,
        level: e.level,
        position: e.position,
        isDead: e.isDead,
      };
    }

    socket.emit('init', { id: socket.id, players: raw, enemies: enemyState });
    socket.broadcast.emit('playerJoined', { id: socket.id, x: player.x, y: player.y, z: player.z, name: player.name });
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

    const enemy = enemies[data.targetId];
    if (!enemy || enemy.isDead) return;

    if (enemy.respawnTime && Date.now() - enemy.respawnTime < balance.enemy.respawnGraceMs) return;

    const now = Date.now();
    if (now - player.lastAttackTime < balance.combat.attackCooldownMs) return;
    player.lastAttackTime = now;

    if (distSq(player, enemy.position) > balance.combat.attackRange * balance.combat.attackRange) return;

    let usedSkill = false;
    let skillSpCost = 0;
    if (data.skillId) {
      if (!isSkillUnlocked(player, data.skillId)) return;
      skillSpCost = getSkillSpCost(skills, data.skillId);
    }
    if (player.sp < skillSpCost) return;
    player.sp -= skillSpCost;
    if (skillSpCost > 0) usedSkill = true;

    const skillMultiplier = getSkillMultiplier(skills, data.skillId || 'basic_attack');
    const statValue = player.stats.str ?? balance.defaultPlayer.baseStats.str;
    const damage = calculateDamage(statValue, skillMultiplier, balance);

    enemy.hp = Math.max(0, enemy.hp - damage);

    if (enemy.hp === 0) {
      enemy.isDead = true;
      enemy.deathTime = Date.now();

      const { baseExp: expBase, jobExp: expJob } = calculateExpReward(enemy.level, balance);

      // Generate loot from enemy template drops
      const drops = getEnemyDrops(enemy.templateId);
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

    io.emit('enemyDamaged', {
      targetId: data.targetId, damage, usedSkill,
      attackerId: socket.id, hp: enemy.hp, isDead: enemy.isDead,
    });
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

    // Apply base stat modifiers
    player.stats.str += jobDef.baseStatModifiers.str;
    player.stats.agi += jobDef.baseStatModifiers.agi;
    player.stats.vit += jobDef.baseStatModifiers.vit;
    player.stats.int += jobDef.baseStatModifiers.int;
    player.stats.dex += jobDef.baseStatModifiers.dex;
    player.stats.luk += jobDef.baseStatModifiers.luk;

    callback?.({ success: true });
  });

  socket.on('allocateStat', (data: { stat: keyof PlayerStats; statPoints?: number }, callback?: (res: { success: boolean; stats?: PlayerStats; error?: string }) => void) => {
    if (!player) return;
    if (data.stat === 'statPoints') { callback?.({ success: false, error: 'Cannot allocate statPoints directly.' }); return; }

    if (data.statPoints !== undefined) player.stats.statPoints = Math.max(0, data.statPoints);
    if (player.stats.statPoints <= 0) { callback?.({ success: false, error: 'No stat points available.' }); return; }
    if (player.stats[data.stat] >= balance.stats.cap) { callback?.({ success: false, error: `Stat ${data.stat} is at max (${balance.stats.cap}).` }); return; }

    player.stats[data.stat] += 1;
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
        const initiatorName = players.get(ts.initiatorId)?.name;
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

    const initiator = players.get(ts.initiatorId);
    const peer = players.get(ts.peerId);
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

  socket.on('chat', (msg: string) => {
    if (!player) return;
    const text = (typeof msg === 'string' ? msg : '').slice(0, balance.limits.chatMaxLength);
    if (!text.trim()) return;
    io.emit('chatMessage', {
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
    if (player) players.delete(socket.id);

    for (const [key, ts] of tradeSessions) {
      if (ts.initiatorId === socket.id || ts.peerId === socket.id) {
        const otherId = ts.initiatorId === socket.id ? ts.peerId : ts.initiatorId;
        io.to(otherId).emit('tradeCancelled', { name: player?.name || 'Disconnected player' });
        tradeSessions.delete(key);
        break;
      }
    }

    io.emit('playerLeft', socket.id);
  });
});

// ── Game Loop ─────────────────────────────────────────────
let ticking = false;
const tickTimeSec = balance.server.tickRateMs / 1000;
const regenIntervalTicks = balance.regen.intervalTicks;

function tick() {
  tickNum++;

  // ── Process input queues ────────────────────────────
  for (const p of players.values()) {
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
      p.x += dx * balance.movement.playerSpeed * tickTimeSec;
      p.z += dz * balance.movement.playerSpeed * tickTimeSec;
    }

    // Regen
    if (tickNum % regenIntervalTicks === 0) {
      if (p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + balance.regen.amountPerTick);
      if (p.sp < p.maxSp) p.sp = Math.min(p.maxSp, p.sp + balance.regen.amountPerTick);
    }
  }

  // ── Enemy respawn ───────────────────────────────────
  for (const enemy of Object.values(enemies)) {
    if (enemy.isDead && enemy.deathTime) {
      if (Date.now() - enemy.deathTime > balance.enemy.respawnMs) {
        const template = enemyTemplates.get(enemy.templateId);
        if (template) {
          enemy.hp = template.hp;
          enemy.maxHp = template.hp;
        }
        enemy.isDead = false;
        enemy.respawnTime = Date.now();
        delete enemy.deathTime;
        io.emit('enemyRespawned', {
          id: enemy.id,
          name: enemy.name,
          hp: enemy.hp,
          maxHp: enemy.maxHp,
          level: enemy.level,
          position: enemy.position,
          isDead: false,
        });
      }
    }
  }

  // ── Build snapshots ─────────────────────────────────
  const isFullTick = tickNum % balance.server.fullSnapshotInterval === 0;

  if (isFullTick) {
    const full: WorldSnapshot = { tick: tickNum, players: {}, enemies: {} };
    for (const [id, p] of players) {
      const snap: SnapshotPlayer = { x: p.x, y: p.y, z: p.z, hp: p.hp, maxHp: p.maxHp, sp: p.sp, maxSp: p.maxSp, lastProcessedSeq: p.lastProcessedSeq };
      full.players[id] = snap;
      p.lastSentSnapshot = snap;
    }
    for (const [id, e] of Object.entries(enemies)) {
      full.enemies[id] = { hp: e.hp, isDead: e.isDead, position: { x: e.position.x, y: e.position.y, z: e.position.z } };
    }
    io.emit('worldSnapshot', full);
  } else {
    for (const [socketId, p] of players) {
      const snap: WorldSnapshot = { tick: tickNum, players: {}, enemies: {} };

      const selfSnap: SnapshotPlayer = { x: p.x, y: p.y, z: p.z, hp: p.hp, maxHp: p.maxHp, sp: p.sp, maxSp: p.maxSp, lastProcessedSeq: p.lastProcessedSeq };
      snap.players[socketId] = selfSnap;
      p.lastSentSnapshot = selfSnap;

      for (const [otherId, other] of players) {
        if (otherId === socketId) continue;
        if (distSq(p, other) > balance.network.interestRange * balance.network.interestRange) continue;
        const otherSnap: SnapshotPlayer = { x: other.x, y: other.y, z: other.z, hp: other.hp, maxHp: other.maxHp, sp: other.sp, maxSp: other.maxSp };
        if (!other.lastSentSnapshot || snapshotPlayerChanged(other.lastSentSnapshot, otherSnap)) {
          snap.players[otherId] = otherSnap;
        }
        other.lastSentSnapshot = otherSnap;
      }

      for (const [id, e] of Object.entries(enemies)) {
        if (e.isDead) continue;
        if (distSq(p, e.position) > balance.network.interestRange * balance.network.interestRange) continue;
        snap.enemies[id] = { hp: e.hp, isDead: e.isDead, position: { x: e.position.x, y: e.position.y, z: e.position.z } };
      }

      io.to(socketId).emit('worldSnapshot', snap);
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
  console.log(`[GameServer] Data-driven: ${enemyData.templates.length} enemies, ${skills.length} skills, ${items.length} items, ${jobs.length} jobs`);
});
