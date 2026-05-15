import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { 
  JobClass, PlayerStats, ItemType, InventoryItem, DamageText, 
  PlayerState, EnemyState, Vector3State, GameUIState 
} from '@/types/game';
import { INITIAL_PLAYER, INITIAL_ENEMIES } from '@/data/gameData';

interface GameStore {
  player: PlayerState;
  position: Vector3State; 
  targetPosition: Vector3State | null;
  selectedTargetId: string | null;
  activeSkill: string | null;
  enemies: Record<string, EnemyState>;
  damages: DamageText[];
  ui: GameUIState;
  setTargetPosition: (pos: Vector3State | null) => void;
  setPosition: (pos: Vector3State) => void;
  setSelectedTargetId: (id: string | null) => void;
  toggleUI: (window: keyof GameUIState) => void;
  allocateStat: (stat: keyof PlayerStats) => void;
  unlockSkill: (skillId: string, cost: number) => void;
  updateEnemyState: (id: string, partialState: Partial<EnemyState>) => void;
  setEnemies: (enemies: Record<string, EnemyState>) => void;
  addDamageText: (amount: number, pos: Vector3State, color?: string) => void;
  gainExp: (base: number, job: number) => void;
  gainLoot: (items: InventoryItem[]) => void;
  consumeItem: (itemId: string) => void;
  changeJob: (newJob: JobClass) => void;
  setActiveSkill: (skillId: string | null) => void;
  setSp: (sp: number) => void;
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
}

export const useGameStore = create<GameStore>()((set, get) => ({
  player: INITIAL_PLAYER,
  position: { x: 0, y: 0.5, z: 0 },
  targetPosition: null,
  selectedTargetId: null,
  activeSkill: null,
  enemies: INITIAL_ENEMIES,
  damages: [],
  ui: { isSkillsOpen: false, isStatsOpen: false, isInventoryOpen: false },
  setTargetPosition: (pos) => set({ targetPosition: pos }),
  setPosition: (pos) => set({ position: pos }),
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

    let { hp, maxHp, sp, maxSp } = state.player;
    const ITEM_EFFECTS: Record<string, () => void> = {
      red_potion: () => { hp = Math.min(maxHp, hp + 30); },
      blue_potion: () => { sp = Math.min(maxSp, sp + 15); },
    };

    const effect = ITEM_EFFECTS[item.id];
    if (!effect) return state;
    effect();

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
    if (state.player.jobLevel < 10 || state.player.jobClass !== 'Novice') return;

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
              skillPoints: s.player.skillPoints + 1,
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
    if (state.player.stats[stat] >= 99) return;

    // Optimistic update
    set((s) => ({
      player: { ...s.player, stats: { ...s.player.stats, [stat]: s.player.stats[stat] + 1, statPoints: s.player.stats.statPoints - 1 } }
    }));

    import('./useNetworkStore').then(({ useNetworkStore }) => {
      const socket = useNetworkStore.getState().socket;
      if (socket?.connected) {
        socket.emit('allocateStat', { stat }, (res: { success: boolean; stats?: PlayerStats; error?: string }) => {
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
    if (state.player.skillPoints < cost || state.player.unlockedSkills.includes(skillId)) return;

    // Optimistic update
    set((s) => ({
      player: {
        ...s.player,
        skillPoints: s.player.skillPoints - cost,
        unlockedSkills: [...s.player.unlockedSkills, skillId]
      }
    }));

    import('./useNetworkStore').then(({ useNetworkStore }) => {
      const socket = useNetworkStore.getState().socket;
      if (socket?.connected) {
        socket.emit('unlockSkill', { skillId }, (res: { success: boolean; error?: string }) => {
          if (!res.success) {
            set((s) => ({
              player: {
                ...s.player,
                skillPoints: s.player.skillPoints + cost,
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

    // Base level up (multiple level-ups possible)
    while (baseExp >= baseLevel * 100) {
      baseExp -= baseLevel * 100;
      baseLevel += 1;
      stats.statPoints += Math.floor((baseLevel - 1) / 5) + 3;
      maxHp += 15;
      maxSp += 3;
      hp = maxHp;
      sp = maxSp;
    }

    // Job level up (multiple level-ups possible)
    while (jobExp >= jobLevel * 50 && jobLevel < 50) {
      jobExp -= jobLevel * 50;
      jobLevel += 1;
      skillPoints += 1;
    }

    return {
      player: {
        ...state.player,
        baseLevel, jobLevel, baseExp, jobExp, skillPoints,
        hp, maxHp, sp, maxSp,
        stats: { ...stats }
      }
    };
  }),
  gainLoot: (items) => set((state) => {
    const MAX_STACK = 99;
    const newInventory = [...state.player.inventory];

    items.forEach(newItem => {
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
      console.warn('Supabase is not configured.');
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
      const merged: PlayerState = { ...INITIAL_PLAYER, ...loaded, stats: { ...INITIAL_PLAYER.stats, ...(loaded.stats || {}) } };
      set({ player: merged });
      console.log('Progress loaded successfully');
    }
  },
}));
