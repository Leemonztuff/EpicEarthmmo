import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Check, Lock } from 'lucide-react';
import { gameData } from '@/shared/loader';
import { WindowFrame } from './WindowFrame';

const { skills } = gameData;

export function SkillsWindow({ onClose }: { onClose: () => void }) {
  const player = useGameStore((state) => state.player);
  const unlockSkill = useGameStore((state) => state.unlockSkill);

  return (
    <WindowFrame title="Arbol de Habilidades" onClose={onClose} style={{ right: '10px', top: '10px', width: 'min(90vw, 320px)', height: 'min(60dvh, 400px)' }}>
      <div className="flex justify-between items-center bg-blue-100 border border-blue-200 p-2 rounded-sm mb-2 font-sans font-medium text-sm">
        <span>Puntos de Hab. (SP):</span>
        <span className="text-blue-700 font-bold">{player.skillPoints}</span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2 font-sans">
        {skills.map((skill) => {
          const isUnlocked = player.unlockedSkills.includes(skill.id) || skill.skillPointCost === 0;
          const meetsReqs = skill.requirements.every(r => player.unlockedSkills.includes(r) || r === 'basic_attack');
          const canUnlock = !isUnlocked && meetsReqs && player.skillPoints >= skill.skillPointCost;

          return (
            <div
              key={skill.id}
              className={`p-2 border rounded-md relative overflow-hidden transition-all duration-200 ${
                isUnlocked
                  ? 'bg-green-50 border-green-300 shadow-sm'
                  : meetsReqs
                    ? 'bg-white border-slate-300'
                    : 'bg-slate-100 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  {isUnlocked ? <Check size={14} className="text-green-600" /> : (!meetsReqs && <Lock size={12} className="text-slate-400" />)}
                  {skill.name}
                </div>
                {!isUnlocked && (
                  <div className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded uppercase">
                    Costo: {skill.skillPointCost} SP
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-600 mb-2 leading-tight">
                {skill.description}
              </div>

              {skill.requirements.length > 0 && !meetsReqs && (
                <div className="text-[10px] text-red-500 font-medium mb-1">
                  Requisito: {skill.requirements.map(r => skills.find(s => s.id === r)?.name).join(', ')}
                </div>
              )}

              {!isUnlocked && meetsReqs && (
                <button
                  onClick={() => unlockSkill(skill.id, skill.skillPointCost)}
                  disabled={!canUnlock}
                  className={`w-full py-1.5 rounded text-[11px] font-bold tracking-wide uppercase transition-colors ${
                    canUnlock
                      ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm active:translate-y-px'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {canUnlock ? 'Desbloquear Hab.' : 'No tienes suficiente SP'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </WindowFrame>
  );
}
