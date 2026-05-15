import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';

export function JobChangeWindow() {
  const changeJob = useGameStore(state => state.changeJob);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="absolute inset-0 m-auto w-64 h-72 bg-slate-200 border-2 border-slate-400 shadow-[4px_4px_10px_rgba(0,0,0,0.5)] rounded-sm pointer-events-auto flex flex-col">
       <div className="h-7 bg-gradient-to-b from-blue-700 to-blue-900 border-b border-slate-400 flex items-center justify-between px-2">
         <span className="text-xs font-bold text-white drop-shadow-sm uppercase">Cambio de Clase</span>
         <button onClick={() => setDismissed(true)} className="text-white hover:text-red-300 font-bold text-sm leading-none">&times;</button>
      </div>
      <div className="p-4 flex-1 flex flex-col items-center justify-center gap-4 text-slate-800 text-sm font-sans text-center">
         <p>¡Has alcanzado el Nivel de Job 10!<br/>Selecciona tu nueva clase:</p>
         <div className="flex gap-2 w-full flex-col">
            <button onClick={() => changeJob('Swordsman')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded shadow-sm">Swordsman</button>
            <button onClick={() => changeJob('Mage')} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded shadow-sm">Mage</button>
            <button onClick={() => changeJob('Archer')} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded shadow-sm">Archer</button>
         </div>
         <button onClick={() => setDismissed(true)} className="text-xs text-slate-500 hover:text-slate-700 underline">Más tarde</button>
      </div>
    </div>
  )
}
