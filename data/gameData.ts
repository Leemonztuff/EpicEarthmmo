import { JobClass, PlayerStats, InventoryItem, EnemyState } from '@/types/game';

export const INITIAL_PLAYER = {
  name: 'Player', baseLevel: 1, jobLevel: 1, baseExp: 0, jobExp: 0,
  hp: 50, maxHp: 50, sp: 10, maxSp: 10, zeny: 0,
  jobClass: 'Novice' as JobClass, 
  stats: { str: 5, agi: 5, vit: 5, int: 5, dex: 5, luk: 5, statPoints: 0 } as PlayerStats,
  skillPoints: 5, unlockedSkills: [],
  inventory: [
    { id: 'red_potion', name: 'Red Potion', type: 'usable', amount: 10, description: 'Restores 30 HP.' },
    { id: 'jellopy', name: 'Jellopy', type: 'misc', amount: 5, description: 'A gelatinous substance dropped by Porings.' }
  ] as InventoryItem[],
};

export const INITIAL_ENEMIES: Record<string, EnemyState> = {
  'enemy_1': { id: 'enemy_1', name: 'Poring', hp: 20, maxHp: 20, level: 1, position: { x: 3, y: 0.5, z: -3 }, isDead: false },
  'enemy_2': { id: 'enemy_2', name: 'Fabre', hp: 35, maxHp: 35, level: 2, position: { x: -4, y: 0.5, z: 2 }, isDead: false },
  'enemy_3': { id: 'enemy_3', name: 'Pupa', hp: 50, maxHp: 50, level: 3, position: { x: 1, y: 0.5, z: -6 }, isDead: false },
};

export const SKILL_TREE = [
  { id: 'basic_attack', name: 'Ataque Básico', req: [], cost: 0, desc: 'Ataque cuerpo a cuerpo.' },
  { id: 'bash', name: 'Golpe Fuerte (Bash)', req: ['basic_attack'], cost: 1, desc: 'Golpe poderoso. (-5 SP)' },
  { id: 'provoke', name: 'Provocar', req: ['basic_attack'], cost: 1, desc: 'Atrae la atención del enemigo.' },
  { id: 'magnum_break', name: 'Magnum Break', req: ['bash', 'provoke'], cost: 2, desc: 'Ataque de área de fuego.' },
];
