'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useNetworkStore } from '@/store/useNetworkStore';
import { gameData } from '@/shared/loader';
import { Badge } from '@/components/ui';
import { Zap, Heart, Shield, Sword, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const { skills, items } = gameData;

const skillIcons: Record<string, React.ReactNode> = {
  basic_attack: <Sword size={22} />,
};

function getSkillIcon(skillId: string) {
  return skillIcons[skillId] || <Sparkles size={20} />;
}

export function Hotbar() {
  const player = useGameStore((state) => state.player);
  const activeSkill = useGameStore((state) => state.activeSkill);
  const setActiveSkill = useGameStore((state) => state.setActiveSkill);
  const selectedTargetId = useGameStore((state) => state.selectedTargetId);
  const attackTarget = useNetworkStore((state) => state.attackTarget);
  const consumeItem = useGameStore((state) => state.consumeItem);

  if (!player) return null;

  const quickItems = (player.inventory || []).filter(i => i.type === 'usable' && i.amount > 0).slice(0, 3);

  const handleAttack = () => {
    if (selectedTargetId) {
      attackTarget(selectedTargetId);
    }
  };

  return (
    <div className="pointer-events-auto select-none">
      <div className="flex items-end gap-3 p-3 bg-slate-950/40 backdrop-blur-md rounded-[2rem] border border-slate-800/60 shadow-2xl">
        {/* Main Attack Button */}
        <div className="relative group">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleAttack}
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 cursor-pointer relative overflow-hidden",
              selectedTargetId
                ? "bg-gradient-to-b from-red-500 to-red-700 border-red-400 shadow-[0_0_25px_rgba(239,68,68,0.4)]"
                : "bg-slate-900 border-slate-800 text-slate-600 grayscale"
            )}
          >
            {selectedTargetId && (
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-white"
              />
            )}
            <Sword size={32} className={cn("relative z-10 text-white", !selectedTargetId && "text-slate-700")} />
          </motion.button>
          <div className="absolute -bottom-6 left-0 right-0 text-center">
             <span className="text-[9px] font-black text-white/40 uppercase tracking-tighter">Attack</span>
          </div>
        </div>

        <div className="h-12 w-[1px] bg-slate-800/60 mx-1 mb-2" />

        {/* Consumables and Skills */}
        <div className="flex flex-col gap-3">
          {/* Quick Items */}
          <div className="flex gap-2">
            {quickItems.map((item) => {
              const itemDef = items.find(i => i.id === item.id);
              const isHp = itemDef?.effect?.type.includes('hp') ?? false;
              const isSp = itemDef?.effect?.type.includes('sp') ?? false;

              return (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => consumeItem(item.id)}
                  className={cn(
                    "w-11 h-11 rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer relative",
                    isHp ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                    isSp ? "bg-blue-500/10 border-blue-500/30 text-blue-400" :
                    "bg-slate-900/50 border-slate-800 text-slate-400"
                  )}
                >
                  {isHp ? <Heart size={18} /> : isSp ? <Zap size={18} /> : <Shield size={18} />}
                  <Badge variant="amount" size="xs" className="absolute -top-1.5 -right-1.5 px-1 min-w-[18px] h-4.5 rounded-full border-slate-900 shadow-lg">
                    {item.amount}
                  </Badge>
                </motion.button>
              );
            })}
          </div>

          {/* Active Skills */}
          <div className="flex gap-2">
            {(player.unlockedSkills || []).slice(0, 4).map((skillId) => {
              const skillDef = skills.find(s => s.id === skillId);
              if (!skillDef) return null;
              const isActive = activeSkill === skillId;

              return (
                <motion.button
                  key={skillId}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setActiveSkill(isActive ? null : skillId)}
                  className={cn(
                    "w-11 h-11 rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer relative overflow-hidden",
                    isActive
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                      : "bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700"
                  )}
                >
                  {getSkillIcon(skillId)}
                  <span className="text-[7px] font-black text-white/50 absolute bottom-1">{skillDef.spCost}</span>
                  {isActive && (
                    <motion.div
                      layoutId="active-skill"
                      className="absolute inset-0 border-2 border-amber-400 rounded-xl"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
