'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useNetworkStore } from '@/store/useNetworkStore';
import { gameData } from '@/shared/loader';
import { Badge, GameIcon, showToast } from '@/components/ui';
import { Sword } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

const { skills, items } = gameData;

export function Hotbar() {
  const player = useGameStore((state) => state.player);
  const activeSkill = useGameStore((state) => state.activeSkill);
  const setActiveSkill = useGameStore((state) => state.setActiveSkill);
  const selectedTargetId = useGameStore((state) => state.selectedTargetId);
  const position = useGameStore((state) => state.position);
  const attackTarget = useNetworkStore((state) => state.attackTarget);
  const castSkill = useNetworkStore((state) => state.castSkill);
  const consumeItem = useGameStore((state) => state.consumeItem);

  if (!player) return null;

  const quickItems = (player.inventory || []).filter(i => i.type === 'usable' && i.amount > 0).slice(0, 3);

  const handleAttack = () => {
    if (selectedTargetId) {
      attackTarget(selectedTargetId);
    }
  };

  const handleSkillClick = (skillId: string) => {
    const skillDef = skills.find(s => s.id === skillId);
    if (!skillDef) return;

    if (player.sp < skillDef.spCost) {
      showToast('Not enough SP', 'error');
      return;
    }

    const targetType = (skillDef as any).targetType;

    if (targetType === 'self') {
      castSkill(skillId);
      return;
    }

    if (selectedTargetId && (targetType === 'single_enemy' || targetType === 'single_ally')) {
      castSkill(skillId, selectedTargetId);
      return;
    }

    if (targetType === 'aoe_enemy' || targetType === 'aoe_ally' || targetType === 'ground_target') {
      castSkill(skillId, undefined, position.x, position.z);
      return;
    }

    if (targetType === 'directional' || targetType === 'cone' || targetType === 'line') {
      const dirX = 0;
      const dirZ = 1;
      castSkill(skillId, selectedTargetId ?? undefined, position.x, position.z, dirX, dirZ);
      return;
    }

    if (targetType === 'chain') {
      if (selectedTargetId) {
        castSkill(skillId, selectedTargetId);
      }
      return;
    }

    castSkill(skillId, selectedTargetId ?? undefined);
  };

  return (
    <div className="pointer-events-auto select-none max-w-full">
      <div className="flex items-end gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-950/40 backdrop-blur-md rounded-2xl sm:rounded-[2rem] border border-slate-800/60 shadow-2xl">
        {/* Main Attack Button */}
        <div className="relative group">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleAttack}
            className={cn(
              "w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 border-2 cursor-pointer relative overflow-hidden",
              selectedTargetId
                ? "bg-gradient-to-b from-red-500 to-red-700 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
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
            <Sword size={32} className="relative z-10 text-white" />
          </motion.button>
          <div className="absolute -bottom-5 left-0 right-0 text-center">
             <span className="text-[7px] sm:text-[9px] font-black text-white/40 uppercase tracking-tighter">Attack</span>
          </div>
        </div>

        <div className="h-10 sm:h-12 w-[1px] bg-slate-800/60 mx-0.5 sm:mx-1 mb-2" />

        {/* Consumables and Skills */}
        <div className="flex flex-col gap-2 sm:gap-3">
          {/* Quick Items */}
          <div className="flex gap-1.5 sm:gap-2">
            {quickItems.map((item) => {
              return (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => consumeItem(item.id)}
                  className={cn(
                    "w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer relative",
                    "bg-slate-900/50 border-slate-800"
                  )}
                >
                  <GameIcon
                    iconType="item"
                    id={item.id}
                    name={item.name}
                    size={22}
                  />
                  <Badge variant="amount" size="xs" className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 px-1 min-w-[14px] sm:min-w-[18px] h-3.5 sm:h-4.5 text-[8px] sm:text-[10px] rounded-full border-slate-900 shadow-lg">
                    {item.amount}
                  </Badge>
                </motion.button>
              );
            })}
          </div>

          {/* Active Skills */}
          <div className="flex gap-1.5 sm:gap-2">
            {(player.unlockedSkills || []).slice(0, 4).map((skillId) => {
              const skillDef = skills.find(s => s.id === skillId);
              if (!skillDef) return null;
              const isActive = activeSkill === skillId;

              return (
                <motion.button
                  key={skillId}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleSkillClick(skillId)}
                  className={cn(
                    "w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer relative overflow-hidden",
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
                  <span className="text-[6px] sm:text-[7px] font-black text-white/50 absolute bottom-0.5 sm:bottom-1">{skillDef.spCost}</span>
                  {isActive && (
                    <motion.div
                      layoutId="active-skill"
                      className="absolute inset-0 border-2 border-amber-400 rounded-lg sm:rounded-xl"
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
