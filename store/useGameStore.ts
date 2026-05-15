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

    let { hp, maxHp } = state.player;
    if (item.id === 'red_potion') {
      hp = Math.min(maxHp, hp + 30);
    }

    const newInventory = [...state.player.inventory];
    if (item.amount > 1) {
      newInventory[itemIndex] = { ...item, amount: item.amount - 1 };
    } else {
      newInventory.splice(itemIndex, 1);
    }

    return { player: { ...state.player, hp, inventory: newInventory } };
  }),
  changeJob: (newJob) => set((state) => {
    if (state.player.jobLevel >= 10 && state.player.jobClass === 'Novice') {
      return {
         player: {
             ...state.player,
             jobClass: newJob,
             jobLevel: 1, // Reset job level
             jobExp: 0,
         }
      }
    }
    return state;
  }),
  allocateStat: (stat) => set((state) => {
    if (stat === 'statPoints') return state;
    if (state.player.stats.statPoints > 0) {
      return { player: { ...state.player, stats: { ...state.player.stats, [stat]: state.player.stats[stat] + 1, statPoints: state.player.stats.statPoints - 1 } } };
    }
    return state;
  }),
  unlockSkill: (skillId, cost) => set((state) => {
    if (state.player.skillPoints >= cost && !state.player.unlockedSkills.includes(skillId)) {
      return { 
        player: { 
          ...state.player, 
          skillPoints: state.player.skillPoints - cost, 
          unlockedSkills: [...state.player.unlockedSkills, skillId] 
        } 
      };
    }
    return state;
  }),
  addDamageText: (amount, pos, color = 'white') => set((state) => {
    const id = Date.now() + Math.random().toString();
    const newDamage = { id, amount, position: pos, timestamp: Date.now(), color };
    return { damages: [...state.damages, newDamage] };
  }),
  gainExp: (base, job) => set((state) => {
    let { baseExp, jobExp, baseLevel, jobLevel, stats, hp, maxHp, sp, maxSp, skillPoints } = state.player;
    baseExp += base;
    jobExp += job;

    let leveledUp = false;

    // Base level up
    const baseExpNeeded = baseLevel * 100;
    if (baseExp >= baseExpNeeded) {
      baseExp -= baseExpNeeded;
      baseLevel += 1;
      stats.statPoints += Math.floor(baseLevel / 5) + 3;
      maxHp += 15;
      maxSp += 3;
      hp = maxHp;
      sp = maxSp;
      leveledUp = true;
    }

    // Job level up
    const jobExpNeeded = jobLevel * 50;
    if (jobExp >= jobExpNeeded && jobLevel < 50) { // Max job level 50 for example
      jobExp -= jobExpNeeded;
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
    const newInventory = [...state.player.inventory];
    
    items.forEach(newItem => {
      const existingItemIndex = newInventory.findIndex(i => i.id === newItem.id);
      if (existingItemIndex > -1) {
        newInventory[existingItemIndex] = {
           ...newInventory[existingItemIndex],
           amount: newInventory[existingItemIndex].amount + newItem.amount
        };
      } else {
        newInventory.push(newItem);
      }
    });

    return { player: { ...state.player, inventory: newInventory } };
  }),
  saveProgress: async () => {
    const { player } = get();
    // Use the Network fallback if Supabase isn't configured here
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
    const { error } = await supabase
      .from('characters')
      .upsert({ name: player.name, state: player }, { onConflict: 'name' });
      
    if (error) console.error('Error saving:', error);
    else console.log('Progress saved successfully');
  },
  loadProgress: async () => {
    const { player } = get();
    if (!supabase) {
      console.warn('Supabase is not configured.');
      return;
    }
    const { data, error } = await supabase
      .from('characters')
      .select('state')
      .eq('name', player.name)
      .single();
      
    if (error) {
      console.error('Error loading:', error);
      return;
    }
    
    if (data && data.state) {
      set({ player: data.state });
      console.log('Progress loaded successfully');
    }
  },
}));
