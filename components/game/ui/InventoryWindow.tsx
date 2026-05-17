import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { BottomSheet } from '../hud/BottomSheet';
import { Heart, Zap, Package, Coins } from 'lucide-react';
import { gameData } from '@/shared/loader';

const { items } = gameData;

export function InventoryWindow({ onClose }: { onClose: () => void }) {
  const player = useGameStore((state) => state.player);
  const consumeItem = useGameStore((state) => state.consumeItem);

  return (
    <BottomSheet title="Inventory" onClose={onClose} subtitle={`${player.zeny} Zeny`}>
      {player.inventory.length === 0 ? (
        <div className="text-center text-slate-500 py-8 text-sm">Inventory is empty</div>
      ) : (
        <div className="space-y-2">
          {player.inventory.map((item, index) => {
            const itemDef = items.find(i => i.id === item.id);
            const isHp = itemDef?.effect?.type.includes('hp') ?? false;
            const isSp = itemDef?.effect?.type.includes('sp') ?? false;
            return (
              <div
                key={`${item.id}-${index}`}
                className="flex items-center justify-between bg-slate-800/50 rounded-xl px-3 py-2.5 border border-slate-700/40"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isHp ? 'bg-green-600/20' : isSp ? 'bg-blue-600/20' : 'bg-slate-700/50'
                  }`}>
                    {isHp ? <Heart size={16} className="text-green-400" /> :
                     isSp ? <Zap size={16} className="text-blue-400" /> :
                     <Package size={16} className="text-slate-400" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-white font-bold text-sm truncate">{item.name}</div>
                    <div className="text-slate-500 text-[10px] truncate">{item.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-slate-400 text-xs font-bold">{item.amount}x</span>
                  {item.type === 'usable' && (
                    <button
                      onClick={() => consumeItem(item.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg touch-manipulation active:scale-95 transition-all"
                    >
                      Use
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </BottomSheet>
  );
}
