import { create } from 'zustand';
import { gameData } from '@/shared/loader';
import { supabase } from '@/lib/supabase';
import { PlayerState, PlayerStats, DamageText, EnemyState, GameUIState } from '@/types/game';
import { processLevelUp } from '@/shared/loader/formulaEngine';
import { hotReloadData } from '@/shared/loader/clientLoader';
import { showToast } from '@/components/ui';

const { balance, items, skills, enemies: enemyTemplates } = gameData;

const INITIAL_PLAYER_STATE: PlayerState = {
  name: 'Novice',
  baseLevel: 1,
  jobLevel: 1,
  baseExp: 0,
  jobExp: 0,
  hp: 50,
  maxHp: 50,
  sp: 10,
  maxSp: 10,
  zeny: 0,
  jobClass: 'Novice',
  stats: { str: 5, agi: 5, vit: 5, int: 5, dex: 5, luk: 5, statPoints: 0 },
  skillPoints: 5,
  unlockedSkills: ['basic_attack'],
  inventory: [
    { id: 'red_potion', name: 'Red Potion', type: 'usable', amount: 10, description: 'Restores 30 HP.' },
  ],
  equippedItems: {},
};

function buildInitialEnemies(): Record<string, EnemyState> {
  const result: Record<string, EnemyState> = {};
  if (enemyTemplates?.spawns) {
    enemyTemplates.spawns.forEach(s => {
      const template = enemyTemplates.templates.find(t => t.id === s.enemyId);
      if (template) {
        result[s.spawnId] = {
          id: s.spawnId,
          enemyId: s.enemyId,
          name: template.name,
          level: template.level,
          hp: template.hp,
          maxHp: template.hp,
          position: s.position,
          isDead: false,
        };
      }
    });
  }
  return result;
}

interface GameStore {
  player: PlayerState;
  position: { x: number; y: number; z: number };
  inputDirection: { x: number; z: number };
  currentMapId: string;
  currentMapName: string;
  currentMapType: string;
  targetPosition: { x: number; z: number } | null;
  selectedTargetId: string | null;
  activeSkill: string | null;
  enemies: Record<string, EnemyState>;
  damages: DamageText[];
  combatLog: string[];
  ui: GameUIState;

  setMap: (mapId: string, mapName: string, mapType: string) => void;
  setTargetPosition: (pos: { x: number; z: number } | null) => void;
  setPosition: (pos: { x: number; y: number; z: number }) => void;
  setInputDirection: (dir: { x: number; z: number }) => void;
  setSelectedTargetId: (id: string | null) => void;
  setActiveSkill: (skillId: string | null) => void;
  updateEnemyState: (id: string, state: Partial<EnemyState>) => void;
  updatePlayerHp: (hp: number) => void;
  setSp: (sp: number) => void;
  addCombatLog: (msg: string) => void;
  toggleUI: (key: keyof GameUIState) => void;
  consumeItem: (itemId: string) => void;
  allocateStat: (stat: keyof PlayerStats) => void;
  unlockSkill: (skillId: string, cost: number) => void;
  addDamageText: (amount: number, pos: { x: number, y: number, z: number }, color?: string) => void;
  gainExp: (base: number, job: number) => void;
  gainLoot: (items: any[]) => void;
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
  loadCharacter: (state: any) => void;
  equipItem: (itemId: string, slot: string) => void;
  unequipItem: (slot: string) => void;
  getEquippedStats: () => PlayerStats;
  changeJob: (jobId: string) => void;
  reloadData: () => Promise<void>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  player: INITIAL_PLAYER_STATE,
  position: { x: 0, y: 0.5, z: 8 },
  inputDirection: { x: 0, z: 0 },
  currentMapId: 'prontera',
  currentMapName: 'Prontera City',
  currentMapType: 'town',
  targetPosition: null,
  selectedTargetId: null,
  activeSkill: null,
  enemies: buildInitialEnemies(),
  damages: [],
  combatLog: [],
  ui: { isSkillsOpen: false, isStatsOpen: false, isInventoryOpen: false },

  setMap: (mapId, mapName, mapType) => set({ currentMapId: mapId, currentMapName: mapName, currentMapType: mapType }),
  setTargetPosition: (pos) => set({ targetPosition: pos }),
  setPosition: (pos) => set({ position: pos }),
  setInputDirection: (dir) => set({ inputDirection: dir }),
  setSelectedTargetId: (id) => set({ selectedTargetId: id }),
  setActiveSkill: (skillId) => set({ activeSkill: skillId }),
  updateEnemyState: (id, state) => set((s) => ({
    enemies: { ...s.enemies, [id]: { ...s.enemies[id], ...state } }
  })),
  updatePlayerHp: (hp) => set((s) => ({ player: { ...s.player, hp: Math.max(0, Math.min(s.player.maxHp, hp)) } })),
  setSp: (sp) => set((s) => ({ player: { ...s.player, sp: Math.max(0, Math.min(s.player.maxSp, sp)) } })),
  addCombatLog: (msg) => set((s) => ({ combatLog: [...s.combatLog, msg].slice(-30) })),
  toggleUI: (key) => set((s) => ({ ui: { ...s.ui, [key]: !s.ui[key] } })),

  changeJob: (jobId) => {
    const jobDef = gameData.jobs.find(j => j.id === jobId);
    if (!jobDef) return;

    import('./useNetworkStore').then(({ useNetworkStore }) => {
      const socket = useNetworkStore.getState().socket;
      if (socket?.connected) {
        socket.emit('changeJob', { jobId }, (res: { success: boolean, error?: string }) => {
          if (res.success) {
            set((s) => ({
              player: {
                ...s.player,
                jobClass: jobDef.name,
                stats: {
                  ...s.player.stats,
                  str: s.player.stats.str + (jobDef.baseStatModifiers?.str || 0),
                  agi: s.player.stats.agi + (jobDef.baseStatModifiers?.agi || 0),
                  vit: s.player.stats.vit + (jobDef.baseStatModifiers?.vit || 0),
                  int: s.player.stats.int + (jobDef.baseStatModifiers?.int || 0),
                  dex: s.player.stats.dex + (jobDef.baseStatModifiers?.dex || 0),
                  luk: s.player.stats.luk + (jobDef.baseStatModifiers?.luk || 0),
                },
              }
            }));
          }
        });
      }
    });
  },

  consumeItem: (itemId) => {
    import('./useNetworkStore').then(({ useNetworkStore }) => {
      const socket = useNetworkStore.getState().socket;
      if (socket?.connected) {
        socket.emit('useItem', { itemId });
      }
    });
  },

  allocateStat: (stat) => {
    const state = get();
    if (state.player.stats.statPoints <= 0) return;
    set((s) => ({
      player: {
        ...s.player,
        stats: {
          ...s.player.stats,
          [stat]: (s.player.stats[stat] || 0) + 1,
          statPoints: s.player.stats.statPoints - 1
        }
      }
    }));
  },

  unlockSkill: (skillId, cost) => {
    const state = get();
    if (state.player.skillPoints < cost) return;
    set((s) => ({
      player: {
        ...s.player,
        skillPoints: s.player.skillPoints - cost,
        unlockedSkills: [...(s.player.unlockedSkills || []), skillId]
      }
    }));
  },

  addDamageText: (amount, pos, color = 'white') => set((state) => {
    const id = Date.now() + Math.random().toString();
    const newDamage = { id, amount, position: pos, timestamp: Date.now(), color };
    return { damages: [...state.damages, newDamage].filter(d => Date.now() - d.timestamp < 2000) };
  }),

  gainExp: (base, job) => set((state) => {
    let { baseExp, jobExp, baseLevel, jobLevel, stats, hp, maxHp, sp, maxSp, skillPoints } = state.player;
    baseExp += base;
    jobExp += job;
    const result = processLevelUp(baseExp, jobExp, baseLevel, jobLevel, balance);
    if (result.leveledUp) {
      maxHp += result.hpGain;
      maxSp += result.spGain;
      stats.statPoints += result.statPointsGain;
      skillPoints += result.skillPointsGain;
      hp = maxHp;
      sp = maxSp;
    }
    return {
      player: {
        ...state.player,
        baseLevel: result.baseLevel,
        jobLevel: result.jobLevel,
        baseExp: result.baseExp,
        jobExp: result.jobExp,
        skillPoints,
        hp, maxHp, sp, maxSp,
        stats
      }
    };
  }),

  gainLoot: (newItems) => set((state) => {
    const newInventory = [...(state.player.inventory || [])];
    newItems.forEach(newItem => {
      const existing = newInventory.find(i => i.id === newItem.id);
      if (existing) existing.amount += newItem.amount;
      else newInventory.push(newItem);
    });
    return { player: { ...state.player, inventory: newInventory } };
  }),

  saveProgress: async () => { console.log('Saving...'); },
  loadProgress: async () => { console.log('Loading...'); },
  loadCharacter: (characterState) => set((s) => ({
    player: {
      ...INITIAL_PLAYER_STATE,
      ...characterState,
      stats: { ...INITIAL_PLAYER_STATE.stats, ...(characterState?.stats || {}) },
      inventory: characterState?.inventory || INITIAL_PLAYER_STATE.inventory,
      unlockedSkills: characterState?.unlockedSkills || INITIAL_PLAYER_STATE.unlockedSkills,
      equippedItems: characterState?.equippedItems || INITIAL_PLAYER_STATE.equippedItems,
    }
  })),

  equipItem: (itemId, slot) => set((s) => s),
  unequipItem: (slot) => set((s) => s),
  getEquippedStats: () => get().player.stats,

  reloadData: async () => {
    showToast('Reloading core systems...', 'info');
    const newData = await hotReloadData();
    if (newData) {
      showToast('Game Data Hot-Reloaded!', 'success');
    }
  }
}));
