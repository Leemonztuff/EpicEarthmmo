export const INITIAL_ENEMIES: Record<string, { id: string; name: string; hp: number; maxHp: number; level: number; position: { x: number; y: number; z: number }; isDead: boolean }> = {
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
