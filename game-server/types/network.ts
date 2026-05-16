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
