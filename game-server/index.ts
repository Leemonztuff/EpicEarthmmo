import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { INITIAL_ENEMIES, SKILL_TREE } from '../data/gameData';
import type { JobClass, PlayerStats } from '../types/game';
import type { PlayerInput, WorldSnapshot, SnapshotPlayer } from '../types/network';

const GAME_PORT = parseInt(process.env.PORT || '3001', 10);
const TICK_RATE_MS = 50;
const MAX_FRAME_DELTA_MS = 100;
const PLAYER_SPEED = 8;
const ATTACK_RANGE_SQ = 9.0;
const ATTACK_COOLDOWN_MS = 250;
const PLAYER_NAME_MAX_LENGTH = 20;
const CHAT_MAX_LENGTH = 500;
const REGEN_AMOUNT = 1;
const RESPAWN_MS = 5000;
const RESPAWN_GRACE_MS = 200;
const STAT_CAP = 99;
const FULL_SNAPSHOT_INTERVAL = 10;
const INTEREST_RANGE = 30;

const SKILL_SP_COST: Record<string, number> = {
  bash: 5,
  provoke: 3,
  magnum_break: 10,
};

interface ServerPlayer {
  id: string;
  x: number; y: number; z: number;
  name: string;
  stats: PlayerStats;
  hp: number; maxHp: number;
  sp: number; maxSp: number;
  baseLevel: number; jobLevel: number;
  jobClass: JobClass;
  jobExp: number;
  unlockedSkills: string[];
  skillPoints: number;
  lastAttackTime: number;
  inputQueue: PlayerInput[];
  lastProcessedSeq: number;
  lastSentSnapshot: SnapshotPlayer | null;
}

function createDefaultPlayer(id: string, name: string): ServerPlayer {
  return {
    id,
    x: 0, y: 0.5, z: 0,
    name: (name || 'Player').slice(0, PLAYER_NAME_MAX_LENGTH),
    stats: { str: 5, agi: 5, vit: 5, int: 5, dex: 5, luk: 5, statPoints: 0 },
    hp: 50, maxHp: 50, sp: 10, maxSp: 10,
    baseLevel: 1, jobLevel: 1, jobExp: 0,
    jobClass: 'Novice',
    unlockedSkills: [],
    skillPoints: 5,
    lastAttackTime: 0,
    inputQueue: [],
    lastProcessedSeq: 0,
    lastSentSnapshot: null,
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

const app = express();
const httpServer = createServer(app);
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || '*';
const io = new SocketIOServer(httpServer, { cors: { origin: allowedOrigins } });

app.get('/health', (_req, res) => {
  res.json({ ok: true, players: players.size, tick: tickNum });
});

const players = new Map<string, ServerPlayer>();
const savedData = new Map<string, any>();
const enemies = JSON.parse(JSON.stringify(INITIAL_ENEMIES)) as Record<string, any>;
let tickNum = 0;

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

    socket.emit('init', { id: socket.id, players: raw, enemies });
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

    if (enemy.respawnTime && Date.now() - enemy.respawnTime < RESPAWN_GRACE_MS) return;

    const now = Date.now();
    if (now - player.lastAttackTime < ATTACK_COOLDOWN_MS) return;
    player.lastAttackTime = now;

    if (distSq(player, enemy.position) > ATTACK_RANGE_SQ) return;

    let usedSkill = false;
    let skillSpCost = 0;
    if (data.skillId) {
      if (!isSkillUnlocked(player, data.skillId)) return;
      skillSpCost = SKILL_SP_COST[data.skillId] || 0;
    }
    if (player.sp < skillSpCost) return;
    player.sp -= skillSpCost;
    if (skillSpCost > 0) usedSkill = true;

    let damage = (player.stats.str ?? 5) * 2 + Math.floor(Math.random() * 5);
    if (data.skillId === 'bash') damage = Math.floor(damage * 2.5);
    damage = Math.floor(damage);

    enemy.hp = Math.max(0, enemy.hp - damage);

    if (enemy.hp === 0) {
      enemy.isDead = true;
      enemy.deathTime = Date.now();

      const expBase = enemy.level * 10;
      const expJob = enemy.level * 5;
      const loot: any[] = [];
      if (Math.random() > 0.5) {
        loot.push({
          id: 'jellopy', name: 'Jellopy', type: 'misc',
          amount: 1,
          description: 'A gelatinous substance dropped by Porings.',
        });
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

  socket.on('changeJob', (data: { newJob: JobClass }, callback?: (res: { success: boolean; error?: string }) => void) => {
    if (!player) return;

    const validJobs: JobClass[] = ['Swordsman', 'Mage', 'Archer'];
    if (!validJobs.includes(data.newJob)) { callback?.({ success: false, error: 'Invalid job class.' }); return; }
    if (player.jobClass !== 'Novice') { callback?.({ success: false, error: 'Can only change from Novice.' }); return; }
    if (player.jobLevel < 10) { callback?.({ success: false, error: 'Need job level 10.' }); return; }

    player.jobClass = data.newJob;
    player.jobLevel = 1;
    player.jobExp = 0;
    player.unlockedSkills = [];
    player.skillPoints += 1;
    callback?.({ success: true });
  });

  socket.on('allocateStat', (data: { stat: keyof PlayerStats; statPoints?: number }, callback?: (res: { success: boolean; stats?: PlayerStats; error?: string }) => void) => {
    if (!player) return;
    if (data.stat === 'statPoints') { callback?.({ success: false, error: 'Cannot allocate statPoints directly.' }); return; }

    if (data.statPoints !== undefined) player.stats.statPoints = Math.max(0, data.statPoints);
    if (player.stats.statPoints <= 0) { callback?.({ success: false, error: 'No stat points available.' }); return; }
    if (player.stats[data.stat] >= STAT_CAP) { callback?.({ success: false, error: `Stat ${data.stat} is at max (${STAT_CAP}).` }); return; }

    player.stats[data.stat] += 1;
    player.stats.statPoints -= 1;
    callback?.({ success: true, stats: { ...player.stats } });
  });

  socket.on('unlockSkill', (data: { skillId: string; skillPoints?: number }, callback?: (res: { success: boolean; unlockedSkills?: string[]; skillPoints?: number; error?: string }) => void) => {
    if (!player) return;

    const skill = SKILL_TREE.find(s => s.id === data.skillId);
    if (!skill) { callback?.({ success: false, error: 'Skill not found.' }); return; }
    if (player.unlockedSkills.includes(data.skillId)) { callback?.({ success: false, error: 'Skill already unlocked.' }); return; }

    if (data.skillPoints !== undefined) player.skillPoints = Math.max(0, data.skillPoints);
    if (player.skillPoints < skill.cost) { callback?.({ success: false, error: 'Not enough skill points.' }); return; }

    for (const req of skill.req) {
      if (!isSkillUnlocked(player, req)) { callback?.({ success: false, error: `Requires ${req}.` }); return; }
    }

    player.unlockedSkills.push(data.skillId);
    player.skillPoints -= skill.cost;
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
    const text = (typeof msg === 'string' ? msg : '').slice(0, CHAT_MAX_LENGTH);
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
const tickTimeSec = TICK_RATE_MS / 1000;

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
      p.x += dx * PLAYER_SPEED * tickTimeSec;
      p.z += dz * PLAYER_SPEED * tickTimeSec;
    }

    // Regen
    if (tickNum % Math.round(5000 / TICK_RATE_MS) === 0) {
      if (p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + REGEN_AMOUNT);
      if (p.sp < p.maxSp) p.sp = Math.min(p.maxSp, p.sp + REGEN_AMOUNT);
    }
  }

  // ── Enemy respawn ───────────────────────────────────
  for (const enemy of Object.values(enemies) as any[]) {
    if (enemy.isDead && enemy.deathTime) {
      if (Date.now() - enemy.deathTime > RESPAWN_MS) {
        enemy.hp = enemy.maxHp;
        enemy.isDead = false;
        enemy.respawnTime = Date.now();
        delete enemy.deathTime;
        io.emit('enemyRespawned', enemy);
      }
    }
  }

  // ── Build snapshots ─────────────────────────────────
  const isFullTick = tickNum % FULL_SNAPSHOT_INTERVAL === 0;

  if (isFullTick) {
    // Full snapshot broadcast
    const full: WorldSnapshot = { tick: tickNum, players: {}, enemies: {} };
    for (const [id, p] of players) {
      const snap: SnapshotPlayer = { x: p.x, y: p.y, z: p.z, hp: p.hp, maxHp: p.maxHp, sp: p.sp, maxSp: p.maxSp, lastProcessedSeq: p.lastProcessedSeq };
      full.players[id] = snap;
      p.lastSentSnapshot = snap;
    }
    for (const [id, e] of Object.entries(enemies) as [string, any][]) {
      full.enemies[id] = { hp: e.hp, isDead: e.isDead, position: { x: e.position.x, y: e.position.y, z: e.position.z } };
    }
    io.emit('worldSnapshot', full);
  } else {
    // Differential: for each player, compute changed entities in interest range
    for (const [socketId, p] of players) {
      const snap: WorldSnapshot = { tick: tickNum, players: {}, enemies: {} };

      // Self snapshot (for client reconciliation)
      const selfSnap: SnapshotPlayer = { x: p.x, y: p.y, z: p.z, hp: p.hp, maxHp: p.maxHp, sp: p.sp, maxSp: p.maxSp, lastProcessedSeq: p.lastProcessedSeq };
      snap.players[socketId] = selfSnap;
      p.lastSentSnapshot = selfSnap;

      // Nearby changed players
      for (const [otherId, other] of players) {
        if (otherId === socketId) continue;
        if (distSq(p, other) > INTEREST_RANGE * INTEREST_RANGE) continue;
        const otherSnap: SnapshotPlayer = { x: other.x, y: other.y, z: other.z, hp: other.hp, maxHp: other.maxHp, sp: other.sp, maxSp: other.maxSp };
        if (!other.lastSentSnapshot || snapshotPlayerChanged(other.lastSentSnapshot, otherSnap)) {
          snap.players[otherId] = otherSnap;
        }
        other.lastSentSnapshot = otherSnap;
      }

      // Nearby alive enemies
      for (const [id, e] of Object.entries(enemies) as [string, any][]) {
        if (e.isDead) continue;
        if (distSq(p, e.position) > INTEREST_RANGE * INTEREST_RANGE) continue;
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
}, TICK_RATE_MS);

httpServer.listen(GAME_PORT, () => {
  console.log(`[GameServer] listening on port ${GAME_PORT} | ${1000 / TICK_RATE_MS} tps`);
});
