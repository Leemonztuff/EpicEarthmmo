import { create } from 'zustand';
import { gameData } from '@/shared/loader';
import { PlayerState, PlayerStats, DamageText, EnemyState, GameUIState } from '@/types/game';
import { InteractionTarget } from '@/lib/interactionManager';
import { Dialog } from '@/shared/schemas';
import { processLevelUp } from '@/shared/loader/formulaEngine';
import { hotReloadData } from '@/shared/loader/clientLoader';
import { showToast } from '@/components/ui';

const { balance, enemies: enemyTemplates } = gameData;

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

interface DialogState {
  isOpen: boolean;
  dialog: Dialog | null;
  currentLineIndex: number;
  selectedResponse: string | null;
}

interface GameStore {
  player: PlayerState;
  position: { x: number; y: number; z: number };
  inputDirection: { x: number; z: number };
  currentMapId: string;
  currentMapName: string;
  currentMapType: string;
  targetPosition: { x: number; z: number } | null;
  path: Array<{ x: number; z: number }> | null;
  pathIndex: number;
  selectedTargetId: string | null;
  activeSkill: string | null;
  skillCooldowns: Record<string, number>;
  interactionTarget: InteractionTarget | null;
  dialogState: DialogState;
  shopNpcId: string | null;
  enemies: Record<string, EnemyState>;
  damages: DamageText[];
  combatLog: string[];
  ui: GameUIState;

  // Derived state getters
  getCombatStats: () => { atk: number; matk: number; def: number; mdef: number; hit: number; flee: number; attackSpeed: number; critChance: number; critDamage: number };

  setMap: (mapId: string, mapName: string, mapType: string) => void;
  setTargetPosition: (pos: { x: number; z: number } | null) => void;
  setPath: (path: Array<{ x: number; z: number }> | null) => void;
  setPathIndex: (index: number) => void;
  setPosition: (pos: { x: number; y: number; z: number }) => void;
  setInputDirection: (dir: { x: number; z: number }) => void;
  setSelectedTargetId: (id: string | null) => void;
  setInteractionTarget: (target: InteractionTarget | null) => void;
  setDialogState: (state: Partial<DialogState>) => void;
  setActiveSkill: (skillId: string | null) => void;
  setSkillCooldown: (skillId: string, durationMs: number) => void;
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
  buyFromShop: (itemId: string) => void;
  sellToShop: (itemId: string) => void;
  setZeny: (zeny: number) => void;
  setShopNpcId: (npcId: string | null) => void;
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
  path: null,
  pathIndex: 0,
  selectedTargetId: null,
  activeSkill: null,
  skillCooldowns: {},
  interactionTarget: null,
  dialogState: { isOpen: false, dialog: null, currentLineIndex: 0, selectedResponse: null },
  shopNpcId: null,
  enemies: buildInitialEnemies(),
  damages: [],
  combatLog: [],
  ui: { isSkillsOpen: false, isStatsOpen: false, isInventoryOpen: false },

  getCombatStats: () => {
    const p = get().player;
    const stats = p.stats;
    return {
      atk: (stats?.str || 0) * 3 + (p.baseLevel || 1) * 1.5 + 5,
      matk: (stats?.int || 0) * 3.5 + (p.baseLevel || 1) * 1.2 + 3,
      def: (stats?.vit || 0) * 1.5,
      mdef: (stats?.int || 0) * 0.5,
      hit: 50 + (stats?.dex || 0) * 2.5 + (p.baseLevel || 1) * 0.5,
      flee: 80 + (stats?.agi || 0) * 2 + (p.baseLevel || 1) * 0.5,
      attackSpeed: Math.max(200, 800 - (stats?.agi || 0) * 4),
      critChance: 0.02 + (stats?.luk || 0) * 0.003 + (p.baseLevel || 1) * 0.001,
      critDamage: 1.5 + (stats?.luk || 0) * 0.005,
    };
  },

  setMap: (mapId, mapName, mapType) => set({ currentMapId: mapId, currentMapName: mapName, currentMapType: mapType }),
  setTargetPosition: (pos) => set({ targetPosition: pos }),
  setPath: (path) => set({ path, pathIndex: 0 }),
  setPathIndex: (index) => set({ pathIndex: index }),
  setPosition: (pos) => set({ position: pos }),
  setInputDirection: (dir) => set({ inputDirection: dir }),
  setSelectedTargetId: (id) => set((s) => ({
    selectedTargetId: id,
    path: null,
    pathIndex: 0,
    interactionTarget: id ? { type: 'enemy', id, position: s.enemies[id] ? { x: s.enemies[id].position.x, z: s.enemies[id].position.z } : { x: 0, z: 0 } } : null,
  })),
  setInteractionTarget: (target) => set({ interactionTarget: target }),
  setDialogState: (state) => set((s) => ({ dialogState: { ...s.dialogState, ...state } })),
  setActiveSkill: (skillId) => set({ activeSkill: skillId }),
  setSkillCooldown: (skillId, durationMs) => set((s) => ({
    skillCooldowns: { ...s.skillCooldowns, [skillId]: Date.now() + durationMs },
  })),
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

  setZeny: (zeny) => set((s) => ({ player: { ...s.player, zeny } })),
  setShopNpcId: (npcId) => set({ shopNpcId: npcId }),

  buyFromShop: (itemId) => {
    import('./useNetworkStore').then(({ useNetworkStore }) => {
      useNetworkStore.getState().socket?.emit('npcBuy', { itemId }, (res: any) => {
        if (res.success) {
          const gs = get();
          gs.setZeny(res.newZeny);
          gs.gainLoot([{ id: itemId, name: res.itemName, type: res.itemType || 'equip', amount: 1, description: res.itemDesc || '' }]);
        } else {
          showToast(res.error || 'Purchase failed', 'error');
        }
      });
    });
  },

  sellToShop: (itemId) => {
    import('./useNetworkStore').then(({ useNetworkStore }) => {
      useNetworkStore.getState().socket?.emit('npcSell', { itemId }, (res: any) => {
        if (res.success) {
          const gs = get();
          gs.setZeny(res.newZeny);
          const newInventory = [...gs.player.inventory];
          const slot = newInventory.find(i => i.id === itemId);
          if (slot) {
            slot.amount -= 1;
            if (slot.amount <= 0) {
              const idx = newInventory.indexOf(slot);
              if (idx !== -1) newInventory.splice(idx, 1);
            }
          }
          set({ player: { ...gs.player, inventory: newInventory } });
        }
      });
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
    const baseStats = { str: stats.str ?? 5, agi: stats.agi ?? 5, vit: stats.vit ?? 5, int: stats.int ?? 5, dex: stats.dex ?? 5, luk: stats.luk ?? 5 };
    const result = processLevelUp(baseExp, jobExp, baseLevel, jobLevel, baseStats, balance);
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
