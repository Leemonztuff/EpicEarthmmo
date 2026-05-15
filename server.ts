import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import next from 'next';
import { parse } from 'url';

import { INITIAL_ENEMIES, SKILL_TREE } from './data/gameData';
import type { JobClass, PlayerStats } from './types/game';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// ── Constants ──────────────────────────────────────────────
const ATTACK_RANGE_SQ = 9.0;
const ATTACK_COOLDOWN_MS = 250;
const MOVE_RATE_LIMIT_MS = 66;
const MAX_MOVE_DIST_SQ = 100;
const PLAYER_NAME_MAX_LENGTH = 20;
const CHAT_MAX_LENGTH = 500;
const STAT_CAP = 99;
const REGEN_AMOUNT = 1;
const REGEN_INTERVAL_MS = 5000;
const RESPAWN_GRACE_MS = 200;

interface ServerPlayer {
  id: string;
  x: number; y: number; z: number;
  name: string;
  stats: PlayerStats;
  hp: number;
  maxHp: number;
  sp: number;
  maxSp: number;
  baseLevel: number;
  jobLevel: number;
  jobClass: JobClass;
  unlockedSkills: string[];
  skillPoints: number;
  lastAttackTime: number;
  lastMoveTime: number;
}

function createDefaultPlayer(id: string, name: string): ServerPlayer {
  return {
    id,
    x: 0, y: 0.5, z: 0,
    name: (name || 'Player').slice(0, PLAYER_NAME_MAX_LENGTH),
    stats: { str: 5, agi: 5, vit: 5, int: 5, dex: 5, luk: 5, statPoints: 0 },
    hp: 50, maxHp: 50, sp: 10, maxSp: 10,
    baseLevel: 1, jobLevel: 1,
    jobClass: 'Novice',
    unlockedSkills: [],
    skillPoints: 5,
    lastAttackTime: 0,
    lastMoveTime: 0,
  };
}

function isSkillUnlocked(player: ServerPlayer, skillId: string): boolean {
  if (skillId === 'basic_attack') return true;
  return player.unlockedSkills.includes(skillId);
}

const SKILL_SP_COST: Record<string, number> = {
  bash: 5,
  provoke: 3,
  magnum_break: 10,
};

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*' }
  });

  // ── State ──────────────────────────────────────────────
  const players = new Map<string, ServerPlayer>();
  const enemies = JSON.parse(JSON.stringify(INITIAL_ENEMIES)) as Record<string, any>;

  // ── Server Ticks ──────────────────────────────────────
  setInterval(() => {
    const now = Date.now();

    // Respawn
    for (const enemy of Object.values(enemies)) {
      if (enemy.isDead) {
        if (!enemy.deathTime) {
          enemy.deathTime = now;
        } else if (now - enemy.deathTime > 5000) {
          enemy.hp = enemy.maxHp;
          enemy.isDead = false;
          enemy.respawnTime = now;
          delete enemy.deathTime;
          io.emit('enemyRespawned', enemy);
        }
      }
    }

    // Regen
    for (const p of players.values()) {
      if (p.hp < p.maxHp) {
        p.hp = Math.min(p.maxHp, p.hp + REGEN_AMOUNT);
      }
      if (p.sp < p.maxSp) {
        p.sp = Math.min(p.maxSp, p.sp + REGEN_AMOUNT);
      }
    }
  }, REGEN_INTERVAL_MS);

  // ── Socket Events ─────────────────────────────────────
  io.on('connection', (socket) => {
    let player: ServerPlayer | null = null;

    // ── Join ──────────────────────────────────────────
    socket.on('join', (data: { name?: string; stats?: PlayerStats; unlockedSkills?: string[] }) => {
      player = createDefaultPlayer(socket.id, data.name || 'Player');
      if (data.stats) player.stats = data.stats;
      if (data.unlockedSkills) player.unlockedSkills = data.unlockedSkills;
      players.set(socket.id, player);

      const raw: Record<string, any> = {};
      for (const [id, p] of players) {
        raw[id] = { id: p.id, x: p.x, y: p.y, z: p.z, name: p.name };
      }

      socket.emit('init', { id: socket.id, players: raw, enemies });
      socket.broadcast.emit('playerJoined', { id: socket.id, x: player.x, y: player.y, z: player.z, name: player.name });
    });

    // ── Move ──────────────────────────────────────────
    socket.on('move', (pos: { x: number; y: number; z: number }) => {
      if (!player) return;

      const dx = player.x - pos.x;
      const dz = player.z - pos.z;
      const dy = player.y - pos.y;
      const distSq = dx * dx + dz * dz + dy * dy;

      if (distSq > MAX_MOVE_DIST_SQ) return;
      if (Date.now() - player.lastMoveTime < MOVE_RATE_LIMIT_MS) return;

      player.x = pos.x;
      player.y = pos.y;
      player.z = pos.z;
      player.lastMoveTime = Date.now();

      socket.broadcast.emit('playerMoved', { id: socket.id, ...pos });
    });

    // ── Attack ────────────────────────────────────────
    socket.on('attack', (data: {
      targetId: string;
      skillId: string | null;
      sp: number;
      position: { x: number; y: number; z: number };
    }) => {
      if (!player) return;

      const enemy = enemies[data.targetId];
      if (!enemy || enemy.isDead) return;

      // Respawn grace window (reject stale packets targeting freshly respawned enemies)
      if (enemy.respawnTime && Date.now() - enemy.respawnTime < RESPAWN_GRACE_MS) return;

      // Cooldown check
      const now = Date.now();
      if (now - player.lastAttackTime < ATTACK_COOLDOWN_MS) return;
      player.lastAttackTime = now;

      // Distance check (including Y axis)
      const dx = data.position.x - enemy.position.x;
      const dz = data.position.z - enemy.position.z;
      const dy = data.position.y - enemy.position.y;
      const distSq = dx * dx + dz * dz + dy * dy;
      if (distSq > ATTACK_RANGE_SQ) return;

      // Skill validation
      let usedSkill = false;
      let skillSpCost = 0;
      if (data.skillId) {
        if (!isSkillUnlocked(player, data.skillId)) return;
        skillSpCost = SKILL_SP_COST[data.skillId] || 0;
      }
      if (player.sp < skillSpCost) return;
      player.sp -= skillSpCost;
      if (skillSpCost > 0) usedSkill = true;

      // Damage calculation (server-authoritative)
      let damage = (player.stats.str ?? 5) * 2 + Math.floor(Math.random() * 5);
      if (data.skillId === 'bash') {
        damage = Math.floor(damage * 2.5);
      }
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
          targetId: data.targetId,
          expBase, expJob, loot,
          newSp: player.sp,
          damage, usedSkill,
          hp: 0, isDead: true,
        });
      } else {
        socket.emit('attackResult', {
          targetId: data.targetId,
          damage, usedSkill,
          newSp: player.sp,
          hp: enemy.hp, isDead: false,
        });
      }

      io.emit('enemyDamaged', {
        targetId: data.targetId,
        damage, usedSkill,
        attackerId: socket.id,
        hp: enemy.hp,
        isDead: enemy.isDead,
      });
    });

    // ── Change Job ─────────────────────────────────────
    socket.on('changeJob', (data: { newJob: JobClass }, callback?: (res: { success: boolean; error?: string }) => void) => {
      if (!player) return;

      const validJobs: JobClass[] = ['Swordsman', 'Mage', 'Archer'];
      if (!validJobs.includes(data.newJob)) {
        callback?.({ success: false, error: 'Invalid job class.' });
        return;
      }
      if (player.jobClass !== 'Novice') {
        callback?.({ success: false, error: 'Can only change from Novice.' });
        return;
      }
      if (player.jobLevel < 10) {
        callback?.({ success: false, error: 'Need job level 10.' });
        return;
      }

      player.jobClass = data.newJob;
      player.jobLevel = 1;
      player.jobExp = 0;
      player.unlockedSkills = [];
      player.skillPoints += 1;

      callback?.({ success: true });
    });

    // ── Allocate Stat ──────────────────────────────────
    socket.on('allocateStat', (data: { stat: keyof PlayerStats }, callback?: (res: { success: boolean; error?: string }) => void) => {
      if (!player) return;
      if (data.stat === 'statPoints') {
        callback?.({ success: false, error: 'Cannot allocate statPoints directly.' });
        return;
      }
      if (player.stats.statPoints <= 0) {
        callback?.({ success: false, error: 'No stat points available.' });
        return;
      }
      if (player.stats[data.stat] >= STAT_CAP) {
        callback?.({ success: false, error: `Stat ${data.stat} is at max (${STAT_CAP}).` });
        return;
      }

      player.stats[data.stat] += 1;
      player.stats.statPoints -= 1;

      callback?.({ success: true, stats: { ...player.stats } });
    });

    // ── Unlock Skill ───────────────────────────────────
    socket.on('unlockSkill', (data: { skillId: string }, callback?: (res: { success: boolean; error?: string }) => void) => {
      if (!player) return;

      const skill = SKILL_TREE.find(s => s.id === data.skillId);
      if (!skill) {
        callback?.({ success: false, error: 'Skill not found.' });
        return;
      }
      if (player.unlockedSkills.includes(data.skillId)) {
        callback?.({ success: false, error: 'Skill already unlocked.' });
        return;
      }
      if (player.skillPoints < skill.cost) {
        callback?.({ success: false, error: 'Not enough skill points.' });
        return;
      }

      // Check prerequisites
      for (const req of skill.req) {
        if (!isSkillUnlocked(player, req)) {
          callback?.({ success: false, error: `Requires ${req}.` });
          return;
        }
      }

      player.unlockedSkills.push(data.skillId);
      player.skillPoints -= skill.cost;

      callback?.({ success: true, unlockedSkills: [...player.unlockedSkills], skillPoints: player.skillPoints });
    });

    // ── Trade System ──────────────────────────────────
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

    function otherPlayerId(session: TradeSession, socketId: string): string {
      return session.initiatorId === socketId ? session.peerId : session.initiatorId;
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
          io.to(ts.initiatorId).emit('tradeAccepted', { peerId: ts.peerId, name: ts.initiatorId === socket.id ? player.name : players.get(ts.initiatorId)?.name });
          socket.emit('tradeAccepted', { peerId: ts.initiatorId, name: players.get(ts.initiatorId)?.name });
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
      io.to(peerId).emit('tradeOfferUpdated', {
        from: socket.id,
        offer: { zeny: offer.zeny, locked: offer.locked },
      });
    });

    socket.on('lockTrade', () => {
      if (!player) return;
      const ts = getTradeSession(socket.id);
      if (!ts) return;

      const offer = ts.initiatorId === socket.id ? ts.initiatorOffer : ts.peerOffer;
      offer.locked = true;

      const peerId = otherPlayerId(ts, socket.id);
      io.to(peerId).emit('tradeOfferUpdated', {
        from: socket.id,
        offer: { zeny: offer.zeny, locked: offer.locked },
      });
      socket.emit('tradeOfferUpdated', {
        from: socket.id,
        offer: { zeny: offer.zeny, locked: offer.locked },
      });

      // If both locked, notify ready
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

      // Both accepted → complete the trade
      const initiator = players.get(ts.initiatorId);
      const peer = players.get(ts.peerId);
      if (initiator && peer && ts.initiatorOffer.accepted && ts.peerOffer.accepted) {
        io.to(ts.initiatorId).emit('tradeCompleted', {
          receivedZeny: ts.peerOffer.zeny,
          sentZeny: ts.initiatorOffer.zeny,
        });
        io.to(ts.peerId).emit('tradeCompleted', {
          receivedZeny: ts.initiatorOffer.zeny,
          sentZeny: ts.peerOffer.zeny,
        });
        // Remove session after completion
        for (const [k] of tradeSessions) {
          if (k.startsWith(ts.initiatorId) || k.endsWith(ts.initiatorId)) {
            tradeSessions.delete(k);
            break;
          }
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

    // ── Chat ───────────────────────────────────────────
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

    // ── Save Progress (proxy to DB) ────────────────────
    socket.on('saveProgress', async (playerData: any) => {
      socket.emit('progressSaved', { success: true });
    });

    // ── Disconnect ─────────────────────────────────────
    socket.on('disconnect', () => {
      if (player) players.delete(socket.id);
      io.emit('playerLeft', socket.id);
    });
  });

  server.all(/.*/, (req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  httpServer.listen(port, () => {
    console.log(`> MMO Server listening on http://localhost:${port}`);
  });
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
