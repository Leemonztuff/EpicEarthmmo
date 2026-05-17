import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Check, Lock, Zap } from 'lucide-react';
import { gameData } from '@/shared/loader';
import { BottomSheet } from '../hud/BottomSheet';

const { skills } = gameData;

export function SkillsWindow({ onClose }: { onClose: () => void }) {
  const player = useGameStore((state) => state.player);
  const unlockSkill = useGameStore((state) => state.unlockSkill);

  return (
    <BottomSheet title="Skills" onClose={onClose} subtitle={`Skill Points: ${player.skillPoints}`}>
      <div className="space-y-2">
        {skills.map((skill) => {
          const isUnlocked = player.unlockedSkills.includes(skill.id) || skill.skillPointCost === 0;
          const meetsReqs = skill.requirements.every(r => player.unlockedSkills.includes(r) || r === 'basic_attack');
          const canUnlock = !isUnlocked && meetsReqs && player.skillPoints >= skill.skillPointCost;

          return (
            <div
              key={skill.id}
              className={`p-3 rounded-xl border transition-all ${
                isUnlocked
                  ? 'bg-green-900/20 border-green-500/30'
                  : meetsReqs
                    ? 'bg-slate-800/50 border-slate-700/50'
                    : 'bg-slate-800/30 border-slate-700/30 opacity-60'
              }`}
            >
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isUnlocked ? 'bg-green-600/30' : 'bg-slate-700/50'
                  }`}>
                    {isUnlocked ? <Check size={14} className="text-green-400" /> : <Lock size={12} className="text-slate-500" />}
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">{skill.name}</div>
                    <div className="text-slate-400 text-[10px]">{skill.description}</div>
                  </div>
                </div>
                {!isUnlocked && (
                  <div className="flex items-center gap-1 bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-md text-[10px] font-bold">
                    <Zap size={10} />
                    {skill.skillPointCost}
                  </div>
                )}
              </div>

              {skill.requirements.length > 0 && !meetsReqs && (
                <div className="text-[10px] text-red-400 font-medium mb-2 ml-10">
                  Requires: {skill.requirements.map(r => skills.find(s => s.id === r)?.name).join(', ')}
                </div>
              )}

              {!isUnlocked && meetsReqs && (
                <button
                  onClick={() => unlockSkill(skill.id, skill.skillPointCost)}
                  disabled={!canUnlock}
                  className={`w-full mt-2 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition-all touch-manipulation active:scale-95 ${
                    canUnlock
                      ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/30'
                      : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {canUnlock ? 'Unlock Skill' : 'Not enough SP'}
                </button>
              )}

              {isUnlocked && (
                <div className="mt-2 ml-10 text-[10px] text-green-400 font-medium">Unlocked</div>
              )}
            </div>
          );
        })}
      </div>
    </BottomSheet>
  );
}
