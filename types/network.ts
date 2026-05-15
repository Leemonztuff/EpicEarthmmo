import { InventoryItem } from './game';
import { Vector3State } from './game';

export interface PeerPlayerState extends Vector3State {
  name: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface TradeOffer {
  zeny: number;
  items: InventoryItem[];
  locked: boolean;
  accepted: boolean;
}

export interface PlayerInput {
  dirX: number;
  dirZ: number;
  seq: number;
}

export interface SnapshotPlayer {
  x: number; y: number; z: number;
  hp: number; maxHp: number;
  sp: number; maxSp: number;
  lastProcessedSeq?: number;
}

export interface SnapshotEnemy {
  hp: number;
  isDead: boolean;
  position: { x: number; y: number; z: number };
}

export interface WorldSnapshot {
  tick: number;
  players: Record<string, SnapshotPlayer>;
  enemies: Record<string, SnapshotEnemy>;
}
