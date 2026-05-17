'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useNetworkStore } from '@/store/useNetworkStore';
import { gameData } from '@/shared/loader';
import { Zap, Heart, Shield, Sword } from 'lucide-react';

const { skills, items } = gameData;

const skillIcons: Record<string, React.ReactNode> = {
  basic_attack: <Sword size={18} />,
};

function getSkillIcon(skillId: string) {
  return skillIcons[skillId] || <Zap size={18} />;
}

export function Hotbar() {
  const player = useGameStore((state) => state.player);
  const activeSkill = useGameStore((state) => state.activeSkill);
  const setActiveSkill = useGameStore((state) => state.setActiveSkill);
  const selectedTargetId = useGameStore((state) => state.selectedTargetId);
  const attackTarget = useNetworkStore((state) => state.attackTarget);
  const consumeItem = useGameStore((state) => state.consumeItem);

  const quickItems = player.inventory.filter(i => i.type === 'usable' && i.amount > 0).slice(0, 3);

  const handleAttack = () => {
    if (selectedTargetId) {
      attackTarget(selectedTargetId);
    }
  };

  return (
    <div className="pointer-events-auto select-none">
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1 items-center">
          <button
            onClick={handleAttack}
            className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 shadow-lg transition-all active:scale-95 touch-manipulation ${
              selectedTargetId
                ? 'bg-gradient-to-br from-red-600 to-red-800 border-red-400 shadow-red-900/50'
                : 'bg-slate-700/80 border-slate-500 shadow-black/30'
            }`}
          >
            <Sword size={24} className="text-white drop-shadow-md" />
          </button>
          <span className="text-[8px] text-white/70 font-medium">ATK</span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            {quickItems.map((item) => {
              const itemDef = items.find(i => i.id === item.id);
              const isHp = itemDef?.effect?.type.includes('hp') ?? false;
              const isSp = itemDef?.effect?.type.includes('sp') ?? false;
              return (
                <button
                  key={item.id}
                  onClick={() => consumeItem(item.id)}
                  className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center border shadow-md transition-all active:scale-95 touch-manipulation ${
                    isHp ? 'bg-gradient-to-br from-green-700 to-green-900 border-green-500/60' :
                    isSp ? 'bg-gradient-to-br from-blue-700 to-blue-900 border-blue-500/60' :
                    'bg-gradient-to-br from-slate-700 to-slate-900 border-slate-500/60'
                  }`}
                >
                  {isHp ? <Heart size={14} className="text-green-300" /> : isSp ? <Zap size={14} className="text-blue-300" /> : <Shield size={14} className="text-slate-300" />}
                  <span className="text-[7px] text-white/90 font-bold -mt-0.5">{item.amount}</span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-1">
            {player.unlockedSkills.slice(0, 5).map((skillId) => {
              const skillDef = skills.find(s => s.id === skillId);
              if (!skillDef) return null;
              const isActive = activeSkill === skillId;
              return (
                <button
                  key={skillId}
                  onClick={() => setActiveSkill(isActive ? null : skillId)}
                  className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center border shadow-md transition-all active:scale-95 touch-manipulation relative ${
                    isActive
                      ? 'bg-gradient-to-br from-red-600 to-red-800 border-red-400 shadow-red-900/50'
                      : 'bg-gradient-to-br from-slate-700 to-slate-900 border-slate-500/60'
                  }`}
                >
                  {getSkillIcon(skillId)}
                  <span className="text-[6px] text-white/70 font-medium -mt-0.5">{skillDef.spCost}</span>
                  {isActive && (
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
