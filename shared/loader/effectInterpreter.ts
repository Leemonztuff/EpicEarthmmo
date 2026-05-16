import { ItemEffect, Item } from '../schemas';
import { PlayerState } from '../schemas/gameState';

export interface EffectResult {
  hp?: number;
  maxHp?: number;
  sp?: number;
  maxSp?: number;
  statChanges?: Partial<Record<string, number>>;
  success: boolean;
}

export function applyItemEffect(
  effect: ItemEffect,
  player: PlayerState,
  item: Item,
): EffectResult {
  switch (effect.type) {
    case 'restore_hp': {
      const amount = effect.value ?? 0;
      const newHp = Math.min(player.maxHp, player.hp + amount);
      return { hp: newHp, success: true };
    }

    case 'restore_sp': {
      const amount = effect.value ?? 0;
      const newSp = Math.min(player.maxSp, player.sp + amount);
      return { sp: newSp, success: true };
    }

    case 'restore_hp_percent': {
      const percent = effect.percent ?? 0;
      const amount = Math.floor(player.maxHp * (percent / 100));
      const newHp = Math.min(player.maxHp, player.hp + amount);
      return { hp: newHp, success: true };
    }

    case 'restore_sp_percent': {
      const percent = effect.percent ?? 0;
      const amount = Math.floor(player.maxSp * (percent / 100));
      const newSp = Math.min(player.maxSp, player.sp + amount);
      return { sp: newSp, success: true };
    }

    case 'buff_stat': {
      if (!effect.targetStat || !effect.value) {
        return { success: false };
      }
      return {
        statChanges: { [effect.targetStat]: effect.value },
        success: true,
      };
    }

    default:
      return { success: false };
  }
}

export function findItemById(items: Item[], itemId: string): Item | undefined {
  return items.find(i => i.id === itemId);
}
