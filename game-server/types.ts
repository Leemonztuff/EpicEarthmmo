import type { PlayerStats } from '../shared/schemas/gameState';
import type { PlayerInput } from '../shared/types/network';

export interface SnapshotPlayer {
  x: number; y: number; z: number;
  hp: number; maxHp: number;
  sp: number; maxSp: number;
  lastProcessedSeq?: number;
}

export interface ServerPlayer {
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
  currentMapId: string;
  warpCooldownUntil: number;
}
