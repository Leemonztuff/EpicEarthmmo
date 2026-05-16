export interface PeerPlayerState {
  x: number;
  y: number;
  z: number;
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
  items: Array<{ id: string; name: string; type: string; amount: number; description: string }>;
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
