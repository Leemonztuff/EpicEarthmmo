'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useNetworkStore } from '@/store/useNetworkStore';
import { gameData } from '@/shared/loader';
import { Badge, GameIcon } from '@/components/ui';
import { Sword } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

const { skills, items } = gameData;

export function Hotbar() {
  const player = useGameStore((state) => state.player);
  const activeSkill = useGameStore((state) => state.activeSkill);
  const setActiveSkill = useGameStore((state) => state.setActiveSkill);
  const selectedTargetId = useGameStore((state) => state.selectedTargetId);
  const attackTarget = useNetworkStore((state) => state.attackTarget);
  const consumeItem = useGameStore((state) => state.consumeItem);

  if (!player) return null;

  const quickItems = (player.inventory || []).filter(i => i.type === 'usable' && i.amount > 0).slice(0, 4);

  const handleAttack = () => {
    if (selectedTargetId) {
      attackTarget(selectedTargetId);
    }
  };

  return (
    <div className="pointer-events-auto select-none w-full safe-pr">
      <div className="flex items-center justify-end gap-2 sm:gap-4 p-2 sm:p-4 bg-slate-950/40 backdrop-blur-md rounded-3xl border border-slate-800/60 shadow-2xl">

        {/* Skills and Consumables Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Quick Items */}
          <div className="flex gap-1.5 sm:gap-2">
            {quickItems.map((item) => {
              return (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => consumeItem(item.id)}
                  className={cn(
                    "w-9 h-9 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer relative",
                    "bg-slate-900/50 border-slate-800"
                  )}
                >
                  <GameIcon
                    iconType="item"
                    id={item.id}
                    name={item.name}
                    size={22}
                  />
                  <Badge variant="amount" size="xs" className="absolute -top-1 -right-1 px-1 min-w-[14px] h-3.5 text-[8px] rounded-full border-slate-900 shadow-lg">
                    {item.amount}
                  </Badge>
                </motion.button>
              );
            })}
          </div>

          {/* Active Skills */}
          <div className="flex gap-1.5 sm:gap-2">
            {(player.unlockedSkills || []).slice(0, 2).map((skillId) => {
              const skillDef = skills.find(s => s.id === skillId);
              if (!skillDef) return null;
              const isActive = activeSkill === skillId;

              return (
                <motion.button
                  key={skillId}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setActiveSkill(isActive ? null : skillId)}
                  className={cn(
                    "w-9 h-9 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer relative overflow-hidden",
                    isActive
                      ? "bg-amber-500/20 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                      : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                  )}
                >
                  <GameIcon
                    iconType="skill"
                    id={skillId}
                    name={skillDef.name}
                    variant={isActive ? 'amber' : 'default'}
                    size={22}
                  />
                  <span className="text-[6px] font-black text-white/50 absolute bottom-0.5">{skillDef.spCost}</span>
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

        <div className="h-10 sm:h-14 w-[1px] bg-slate-800/60 mx-1" />

        {/* Main Attack Button - Larger for Mobile */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleAttack}
            className={cn(
              "w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center transition-all duration-300 border-2 cursor-pointer relative overflow-hidden shadow-2xl",
              selectedTargetId
                ? "bg-gradient-to-tr from-red-600 to-orange-500 border-white/20 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                : "bg-slate-900 border-slate-800 text-slate-700 grayscale"
            )}
          >
            {selectedTargetId && (
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0, 0.3, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 bg-white"
              />
            )}
            <Sword size={32} className={cn("relative z-10 text-white", !selectedTargetId && "text-slate-800 opacity-40")} />

            <div className="absolute inset-0 flex items-end justify-center pb-1">
               <span className={cn(
                 "text-[8px] font-black uppercase tracking-widest",
                 selectedTargetId ? "text-white/60" : "text-transparent"
               )}>ATK</span>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
