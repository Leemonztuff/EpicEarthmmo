import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { WindowFrame } from './WindowFrame';

export function InventoryWindow({ onClose }: { onClose: () => void }) {
  const player = useGameStore((state) => state.player);
  const consumeItem = useGameStore((state) => state.consumeItem);

  return (
    <WindowFrame title="Inventario" onClose={onClose} style={{ right: '10px', top: '10px', width: 'min(90vw, 320px)', height: 'min(60dvh, 400px)' }}>
      <div className="flex justify-between items-center bg-blue-100 border border-blue-200 p-2 rounded-sm mb-2 font-sans font-medium text-sm">
        <span>Zeny:</span>
        <span className="text-blue-700 font-bold">{player.zeny}Z</span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2 font-sans">
        {player.inventory.length === 0 ? (
           <div className="text-center text-slate-400 py-4 text-xs">El inventario está vacío.</div>
        ) : (
          player.inventory.map((item, index) => (
              <div key={`${item.id}-${index}`} className="p-2 border border-slate-300 bg-white rounded-md relative flex justify-between items-start cursor-pointer hover:bg-slate-50 transition-colors">
               <div className="flex gap-2">
                 <div className="w-8 h-8 bg-slate-200 rounded flex items-center justify-center font-bold text-[10px] text-slate-500">{item.amount}x</div>
                 <div className="flex flex-col">
                    <span className="font-bold text-sm text-slate-800">{item.name}</span>
                    <span className="text-[10px] text-slate-500">{item.description}</span>
                 </div>
               </div>
                {item.type === 'usable' && (
                   <button onClick={() => consumeItem(item.id)} className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded shadow-sm hover:bg-blue-500 active:scale-95 touch-manipulation">Usar</button>
                )}
             </div>
          ))
        )}
      </div>
    </WindowFrame>
  );
}
