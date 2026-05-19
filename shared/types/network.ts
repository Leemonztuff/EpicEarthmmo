export interface PeerPlayerState {
  x: number;
  y: number;
  z: number;
  name: string;
  direction?: string;
  animState?: string;
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
  direction?: string;
  animState?: string;
}

export interface SnapshotEnemy {
  hp: number;
  maxHp: number;
  isDead: boolean;
  position: { x: number; y: number; z: number };
  name?: string;
  level?: number;
}

export interface WorldSnapshot {
  tick: number;
  players: Record<string, SnapshotPlayer>;
  enemies: Record<string, SnapshotEnemy>;
}

export interface WarpInfo {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  targetMapName: string;
  visual: string;
}

export interface MapInitData {
  mapId: string;
  mapName: string;
  mapType: string;
  dimensions: { width: number; height: number };
  spawnPoints: Array<{ id: string; position: { x: number; y: number; z: number }; label?: string }>;
  warps: WarpInfo[];
  safeZones: Array<{ id: string; center: { x: number; z: number }; radius: number; name?: string }>;
  decorations: Array<{ position: [number, number, number]; type: string; scale: number }>;
  grassTuftCount: number;
  grassTexture: { baseColor: string; repeatX: number; repeatY: number };
  floorColor: string;
}

export interface MapChangeData {
  mapId: string;
  mapName: string;
  mapType: string;
  spawnPosition: { x: number; y: number; z: number };
  initData: MapInitData;
  enemies: Record<string, { id: string; name: string; hp: number; maxHp: number; level: number; position: { x: number; y: number; z: number }; isDead: boolean }>;
  players: Record<string, { id: string; x: number; y: number; z: number; name: string }>;
}
