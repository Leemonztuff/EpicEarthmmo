import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { gameData, applyItemEffect, findItemById, processLevelUp } from '@/shared/loader';
import type { PlayerStats, InventoryItem, PlayerState, EnemyState, Vector3State, GameUIState } from '@/shared/schemas/gameState';

const { balance, enemies: enemyData, skills, items, jobs } = gameData;

function buildInitialPlayer(): PlayerState {
  const { defaultPlayer } = balance;
  return {
    name: 'Player',
    baseLevel: 1,
    jobLevel: 1,
    baseExp: 0,
    jobExp: 0,
    hp: defaultPlayer.hp,
    maxHp: defaultPlayer.hp,
    sp: defaultPlayer.sp,
    maxSp: defaultPlayer.sp,
    zeny: 0,
    jobClass: 'novice',
    stats: {
      str: defaultPlayer.baseStats.str,
      agi: defaultPlayer.baseStats.agi,
      vit: defaultPlayer.baseStats.vit,
      int: defaultPlayer.baseStats.int,
      dex: defaultPlayer.baseStats.dex,
      luk: defaultPlayer.baseStats.luk,
      statPoints: 0,
    },
    skillPoints: defaultPlayer.skillPoints,
    unlockedSkills: [],
    inventory: [
      { id: 'red_potion', name: 'Red Potion', type: 'usable', amount: 10, description: 'Restores 30 HP.' },
      { id: 'jellopy', name: 'Jellopy', type: 'misc', amount: 5, description: 'A gelatinous substance dropped by Porings.' },
    ],
  };
}

function buildInitialEnemies(): Record<string, EnemyState> {
  const result: Record<string, EnemyState> = {};
  for (const spawn of enemyData.spawns) {
    const template = enemyData.templates.find(t => t.id === spawn.enemyId);
    if (!template) continue;
    result[spawn.spawnId] = {
      id: spawn.spawnId,
      name: template.name,
      hp: template.hp,
      maxHp: template.hp,
      level: template.level,
      position: { ...spawn.position },
      isDead: false,
    };
  }
  return result;
}

interface GameStore {
  player: PlayerState;
  currentMapId: string;
  currentMapName: string;
  currentMapType: string;
  position: Vector3State;
  inputDirection: Vector3State;
  targetPosition: Vector3State | null;
  selectedTargetId: string | null;
  activeSkill: string | null;
  enemies: Record<string, EnemyState>;
  damages: Array<{ id: string; amount: number; position: Vector3State; timestamp: number; color: string }>;
  ui: GameUIState;
  setMap: (mapId: string, mapName: string, mapType: string) => void;
  setTargetPosition: (pos: Vector3State | null) => void;
  setPosition: (pos: Vector3State) => void;
  setInputDirection: (dir: Vector3State) => void;
  setSelectedTargetId: (id: string | null) => void;
  toggleUI: (window: keyof GameUIState) => void;
  allocateStat: (stat: keyof PlayerStats) => void;
  unlockSkill: (skillId: string, cost: number) => void;
  updateEnemyState: (id: string, partialState: Partial<EnemyState>) => void;
  setEnemies: (enemies: Record<string, EnemyState>) => void;
  addDamageText: (amount: number, pos: Vector3State, color?: string) => void;
  gainExp: (base: number, job: number) => void;
  gainLoot: (newItems: InventoryItem[]) => void;
  consumeItem: (itemId: string) => void;
  changeJob: (newJob: string) => void;
  setActiveSkill: (skillId: string | null) => void;
  setSp: (sp: number) => void;
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
}

export const useGameStore = create<GameStore>()((set, get) => ({
  player: buildInitialPlayer(),
  currentMapId: 'prontera',
  currentMapName: 'Prontera',
  currentMapType: 'town',
  position: { x: balance.defaultPlayer.spawnPosition.x, y: balance.defaultPlayer.spawnPosition.y, z: balance.defaultPlayer.spawnPosition.z },
  inputDirection: { x: 0, y: 0, z: 0 },
  targetPosition: null,
  selectedTargetId: null,
  activeSkill: null,
  enemies: buildInitialEnemies(),
  damages: [],
  ui: { isSkillsOpen: false, isStatsOpen: false, isInventoryOpen: false },
  setMap: (mapId, mapName, mapType) => set({ currentMapId: mapId, currentMapName: mapName, currentMapType: mapType }),
  setTargetPosition: (pos) => set({ targetPosition: pos }),
  setPosition: (pos) => set({ position: pos }),
  setInputDirection: (dir) => set({ inputDirection: dir }),
  setSelectedTargetId: (id) => set({ selectedTargetId: id }),
  setActiveSkill: (skillId) => set({ activeSkill: skillId }),
  setSp: (sp) => set(s => ({ player: { ...s.player, sp } })),
  toggleUI: (window) => set((state) => ({ ui: { ...state.ui, [window]: !state.ui[window] } })),
  updateEnemyState: (id, partialState) => set((state) => {
    const enemy = state.enemies[id];
    if (!enemy) return state;
    return {
      enemies: {
        ...state.enemies,
        [id]: { ...enemy, ...partialState }
      }
    };
  }),
  setEnemies: (enemies) => set({ enemies }),
  consumeItem: (itemId) => set((state) => {
    const itemIndex = state.player.inventory.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return state;

    const item = state.player.inventory[itemIndex];
    if (item.type !== 'usable' || item.amount <= 0) return state;

    const itemDef = findItemById(items, itemId);
    if (!itemDef || !itemDef.effect) return state;

    const result = applyItemEffect(itemDef.effect, state.player, itemDef);
    if (!result.success) return state;

    let { hp, sp } = state.player;
    if (result.hp !== undefined) hp = result.hp;
    if (result.sp !== undefined) sp = result.sp;

    const newInventory = [...state.player.inventory];
    if (item.amount > 1) {
      newInventory[itemIndex] = { ...item, amount: item.amount - 1 };
    } else {
      newInventory.splice(itemIndex, 1);
    }

    return { player: { ...state.player, hp, sp, inventory: newInventory } };
  }),
  changeJob: async (newJob) => {
    const state = get();
    const jobDef = jobs.find(j => j.id === newJob);
    if (!jobDef) return;

    const req = jobDef.requirements;
    if (req && (state.player.jobClass !== req.fromJob || state.player.jobLevel < req.minJobLevel)) return;

    const networkStore = (await import('./useNetworkStore')).useNetworkStore;
    const socket = networkStore.getState().socket;
    if (socket?.connected) {
      socket.emit('changeJob', { newJob }, (res: { success: boolean; error?: string }) => {
        if (res.success) {
          set((s) => ({
            player: {
              ...s.player,
              jobClass: newJob,
              jobLevel: 1,
              jobExp: 0,
              unlockedSkills: [],
              skillPoints: s.player.skillPoints + jobDef.bonusSkillPoints,
              stats: {
                ...s.player.stats,
                str: s.player.stats.str + jobDef.baseStatModifiers.str,
                agi: s.player.stats.agi + jobDef.baseStatModifiers.agi,
                vit: s.player.stats.vit + jobDef.baseStatModifiers.vit,
                int: s.player.stats.int + jobDef.baseStatModifiers.int,
                dex: s.player.stats.dex + jobDef.baseStatModifiers.dex,
                luk: s.player.stats.luk + jobDef.baseStatModifiers.luk,
              },
            }
          }));
        } else {
          console.warn('Server rejected job change:', res.error);
        }
      });
    }
  },
  allocateStat: (stat) => {
    const state = get();
    if (stat === 'statPoints') return;
    if (state.player.stats.statPoints <= 0) return;
    if (state.player.stats[stat] >= balance.stats.cap) return;

    const currentStatPoints = state.player.stats.statPoints;

    set((s) => ({
      player: { ...s.player, stats: { ...s.player.stats, [stat]: s.player.stats[stat] + 1, statPoints: s.player.stats.statPoints - 1 } }
    }));

    import('./useNetworkStore').then(({ useNetworkStore }) => {
      const socket = useNetworkStore.getState().socket;
      if (socket?.connected) {
        socket.emit('allocateStat', { stat, statPoints: currentStatPoints }, (res: { success: boolean; stats?: PlayerStats; error?: string }) => {
          if (!res.success) {
            set((s) => ({
              player: { ...s.player, stats: { ...s.player.stats, [stat]: s.player.stats[stat] - 1, statPoints: s.player.stats.statPoints + 1 } }
            }));
            console.warn('Server rejected stat allocation:', res.error);
          }
        });
      }
    });
  },
  unlockSkill: (skillId, cost) => {
    const state = get();
    const skillDef = skills.find(s => s.id === skillId);
    if (!skillDef) return;
    if (state.player.skillPoints < skillDef.skillPointCost || state.player.unlockedSkills.includes(skillId)) return;

    const currentSkillPoints = state.player.skillPoints;

    set((s) => ({
      player: {
        ...s.player,
        skillPoints: s.player.skillPoints - skillDef.skillPointCost,
        unlockedSkills: [...s.player.unlockedSkills, skillId]
      }
    }));

    import('./useNetworkStore').then(({ useNetworkStore }) => {
      const socket = useNetworkStore.getState().socket;
      if (socket?.connected) {
        socket.emit('unlockSkill', { skillId, skillPoints: currentSkillPoints }, (res: { success: boolean; error?: string }) => {
          if (!res.success) {
            set((s) => ({
              player: {
                ...s.player,
                skillPoints: s.player.skillPoints + skillDef.skillPointCost,
                unlockedSkills: s.player.unlockedSkills.filter((s: string) => s !== skillId)
              }
            }));
            console.warn('Server rejected skill unlock:', res.error);
          }
        });
      }
    });
  },
  addDamageText: (amount, pos, color = 'white') => set((state) => {
    const id = Date.now() + Math.random().toString();
    const newDamage = { id, amount, position: pos, timestamp: Date.now(), color };
    const now = Date.now();
    const damages = state.damages.filter(d => now - d.timestamp < 2000);
    return { damages: [...damages, newDamage] };
  }),
  gainExp: (base, job) => set((state) => {
    let { baseExp, jobExp, baseLevel, jobLevel, stats, hp, maxHp, sp, maxSp, skillPoints } = state.player;
    baseExp += Math.max(0, base);
    jobExp += Math.max(0, job);

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
        stats: { ...stats }
      }
    };
  }),
  gainLoot: (newItems) => set((state) => {
    const MAX_STACK = balance.limits.itemMaxStack;
    const newInventory = [...state.player.inventory];

    newItems.forEach(newItem => {
      const existingItemIndex = newInventory.findIndex(i => i.id === newItem.id);
      if (existingItemIndex > -1) {
        newInventory[existingItemIndex] = {
           ...newInventory[existingItemIndex],
           amount: Math.min(MAX_STACK, newInventory[existingItemIndex].amount + newItem.amount)
        };
      } else {
        newInventory.push({ ...newItem, amount: Math.min(MAX_STACK, newItem.amount) });
      }
    });

    return { player: { ...state.player, inventory: newInventory } };
  }),
  saveProgress: async () => {
    const { player } = get();
    if (!supabase) {
      const networkStore = (await import('./useNetworkStore')).useNetworkStore;
      const socket = networkStore.getState().socket;
      if (socket) {
        socket.emit('saveProgress', player);
        console.log('Save requested via websocket proxy.');
        return;
      }
      console.warn('Supabase is not configured and socket is not ready.');
      return;
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth required to save:', authError);
      return;
    }

    const { error } = await supabase
      .from('characters')
      .upsert({ user_id: user.id, name: player.name, state: player }, { onConflict: 'user_id' });

    if (error) console.error('Error saving:', error);
    else console.log('Progress saved successfully');
  },
  loadProgress: async () => {
    if (!supabase) {
      const networkStore = (await import('./useNetworkStore')).useNetworkStore;
      const socket = networkStore.getState().socket;
      if (socket?.connected) {
        socket.emit('loadProgress', (data: any) => {
          if (data) {
            const loaded = data as Partial<PlayerState>;
            const initial = buildInitialPlayer();
            const merged: PlayerState = { ...initial, ...loaded, stats: { ...initial.stats, ...(loaded.stats || {}) } };
            set({ player: merged });
            console.log('Progress loaded via websocket proxy.');
          } else {
            console.warn('No saved progress found on server.');
          }
        });
        return;
      }
      console.warn('Supabase is not configured and socket is not ready.');
      return;
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth required to load:', authError);
      return;
    }

    const { data, error } = await supabase
      .from('characters')
      .select('state')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') console.error('Error loading:', error);
      return;
    }

    if (data && data.state) {
      const loaded = data.state as Partial<PlayerState>;
      const initial = buildInitialPlayer();
      const merged: PlayerState = { ...initial, ...loaded, stats: { ...initial.stats, ...(loaded.stats || {}) } };
      set({ player: merged });
      console.log('Progress loaded successfully');
    }
  },
}));
