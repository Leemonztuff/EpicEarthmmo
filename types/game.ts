export type JobClass = 'Novice' | 'Swordsman' | 'Mage' | 'Archer';

export interface PlayerStats { str: number; agi: number; vit: number; int: number; dex: number; luk: number; statPoints: number; }

export type ItemType = 'usable' | 'equip' | 'misc';

export interface InventoryItem {
  id: string;
  name: string;
  type: ItemType;
  amount: number;
  description: string;
}

export interface DamageText {
  id: string;
  amount: number;
  position: { x: number; y: number; z: number };
  timestamp: number;
  color: string;
}

export interface PlayerState {
  name: string; baseLevel: number; jobLevel: number; baseExp: number; jobExp: number;
  hp: number; maxHp: number; sp: number; maxSp: number; zeny: number;
  jobClass: JobClass; stats: PlayerStats; skillPoints: number; unlockedSkills: string[];
  inventory: InventoryItem[];
}

export interface EnemyState {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  level: number;
  position: { x: number; y: number; z: number };
  isDead: boolean;
}

export interface Vector3State { x: number; y: number; z: number; }

export interface GameUIState { isSkillsOpen: boolean; isStatsOpen: boolean; isInventoryOpen: boolean; }
