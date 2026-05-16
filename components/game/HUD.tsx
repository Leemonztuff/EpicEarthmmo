'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { User, Backpack, Swords } from 'lucide-react';
import { ChatBox } from './ChatBox';
import { TradeManager } from './TradeManager';
import { JobChangeWindow } from './ui/JobChangeWindow';
import { InventoryWindow } from './ui/InventoryWindow';
import { StatsWindow } from './ui/StatsWindow';
import { SkillsWindow } from './ui/SkillsWindow';
import { MapNameDisplay } from './ui/MapNameDisplay';
import { gameData } from '@/shared/loader';

const { balance, skills } = gameData;

export function HUD() {
  const player = useGameStore((state) => state.player);
  const ui = useGameStore((state) => state.ui);
  const toggleUI = useGameStore((state) => state.toggleUI);
  const activeSkill = useGameStore((state) => state.activeSkill);
  const setActiveSkill = useGameStore((state) => state.setActiveSkill);
  const saveProgress = useGameStore((state) => state.saveProgress);
  const loadProgress = useGameStore((state) => state.loadProgress);

  const hpPct = player.maxHp > 0 ? (player.hp / player.maxHp) * 100 : 0;
  const spPct = player.maxSp > 0 ? (player.sp / player.maxSp) * 100 : 0;
  const baseExpThreshold = player.baseLevel * balance.progression.baseLevelUpThreshold.multiplier;
  const jobExpThreshold = player.jobLevel * balance.progression.jobLevelUpThreshold.multiplier;
  const baseExpPct = player.baseLevel > 0 && baseExpThreshold > 0 ? (player.baseExp / baseExpThreshold) * 100 : 0;
  const jobExpPct = player.jobLevel > 0 && jobExpThreshold > 0 ? (player.jobExp / jobExpThreshold) * 100 : 0;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10 w-full h-full">
      <MapNameDisplay />
      <div className="flex gap-2 items-start pointer-events-auto">
        <div className="bg-slate-900/80 border border-slate-700 p-2 rounded-md shadow-md text-white flex gap-3 w-64">
           <div className="w-12 h-12 bg-slate-700/50 rounded border border-slate-600"></div>
           <div className="flex flex-col gap-1 flex-1">
              <div className="font-bold text-sm">{player.name}</div>
              <div className="text-xs text-slate-300">Lv. {player.baseLevel} {player.jobClass} (Job {player.jobLevel})</div>
              {/* HP/SP Bars */}
              <div className="flex gap-1 w-full mt-1">
                 <div className="h-2.5 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${hpPct}%` }}></div>
                 </div>
                 <div className="h-2.5 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${spPct}%` }}></div>
                 </div>
              </div>
              {/* EXP Bars */}
              <div className="flex gap-1 w-full text-[8px] mt-0.5">
                  <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden relative group">
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">{player.baseExp}/{baseExpThreshold}</div>
                     <div className="h-full bg-yellow-400" style={{ width: `${baseExpPct}%` }}></div>
                  </div>
                 <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden relative group">
                    <div className="h-full bg-purple-400" style={{ width: `${jobExpPct}%` }}></div>
                 </div>
              </div>
           </div>
        </div>
        <div className="flex flex-col gap-1">
          <button onClick={saveProgress} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-sm">Save</button>
          <button onClick={loadProgress} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2 py-1 rounded shadow-sm">Load</button>
        </div>
      </div>

      <div className="flex-1 relative w-full h-full my-4 pointer-events-none">
         {ui.isStatsOpen && <StatsWindow onClose={() => toggleUI('isStatsOpen')} />}
         {ui.isSkillsOpen && <SkillsWindow onClose={() => toggleUI('isSkillsOpen')} />}
         {ui.isInventoryOpen && <InventoryWindow onClose={() => toggleUI('isInventoryOpen')} />}
         {player.jobClass === 'Novice' && player.jobLevel >= 10 && <JobChangeWindow />}
         <TradeManager />
      </div>

      <div className="flex justify-between items-end gap-2 pointer-events-none w-full">
        <div className="flex flex-col justify-end">
          <ChatBox />
        </div>
        <div className="flex flex-col gap-2 pointer-events-auto items-end">
          {/* Quick Skill Bar */}
          {player.unlockedSkills.map((skillId) => {
            const skillDef = skills.find(s => s.id === skillId);
            if (!skillDef) return null;
            return (
              <div className="flex gap-2" key={skillId}>
                <button
                  onClick={() => setActiveSkill(activeSkill === skillId ? null : skillId)}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center border font-bold text-xs shadow-md transition-transform active:scale-95 ${activeSkill === skillId ? 'bg-red-600 text-white border-red-400 scale-110' : 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700'}`}
                >
                  {skillDef.name.split(' ')[0].toUpperCase()}<br/>({skillDef.spCost} SP)
                </button>
              </div>
            );
          })}

          <div className="flex gap-3 bg-slate-900/80 p-2 rounded-md border border-slate-700">
             <button onClick={() => toggleUI('isStatsOpen')} className={`w-12 h-12 rounded-lg flex items-center justify-center border hover:bg-slate-600 ${ui.isStatsOpen ? 'text-amber-400 border-amber-400 bg-slate-800' : 'text-slate-300 border-slate-600'}`}>
                <User size={24} />
             </button>
             <button onClick={() => toggleUI('isInventoryOpen')} className={`w-12 h-12 rounded-lg flex items-center justify-center border hover:bg-slate-600 ${ui.isInventoryOpen ? 'text-amber-400 border-amber-400 bg-slate-800' : 'text-slate-300 border-slate-600'}`}>
                <Backpack size={24} />
             </button>
             <button onClick={() => toggleUI('isSkillsOpen')} className={`w-12 h-12 rounded-lg flex items-center justify-center border hover:bg-slate-600 ${ui.isSkillsOpen ? 'text-amber-400 border-amber-400 bg-slate-800' : 'text-slate-300 border-slate-600'}`}>
                <Swords size={24} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
