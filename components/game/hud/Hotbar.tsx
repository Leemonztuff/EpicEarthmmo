'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useNetworkStore } from '@/store/useNetworkStore';
import { gameData } from '@/shared/loader';
import { Badge, GameIcon, showToast } from '@/components/ui';
import { Swords } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';

const { skills } = gameData;

export function Hotbar() {
  const player = useGameStore((state) => state.player);
  const activeSkill = useGameStore((state) => state.activeSkill);
  const skillCooldowns = useGameStore((state) => state.skillCooldowns);
  const selectedTargetId = useGameStore((state) => state.selectedTargetId);
  const position = useGameStore((state) => state.position);
  
  const attackTarget = useNetworkStore((state) => state.attackTarget);
  const castSkill = useNetworkStore((state) => state.castSkill);
  const consumeItem = useGameStore((state) => state.consumeItem);
  
  const [now, setNow] = useState(Date.now());

  // Keep cooldowns ticking accurately
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, []);

  if (!player) return null;

  // Items and skills filters
  const quickItems = useMemo(() => {
    return (player.inventory || [])
      .filter((i) => i.type === 'usable' && i.amount > 0)
      .slice(0, 3);
  }, [player.inventory]);

  const activeSkills = useMemo(() => {
    return (player.unlockedSkills || []).slice(0, 4);
  }, [player.unlockedSkills]);

  const handleAttack = () => {
    if (selectedTargetId) {
      attackTarget(selectedTargetId);
    } else {
      showToast('Select a target first!', 'info');
    }
  };

  const handleSkillClick = (skillId: string) => {
    const skillDef = skills.find((s) => s.id === skillId);
    if (!skillDef) return;

    if (player.sp < skillDef.spCost) {
      showToast('Not enough SP', 'error');
      return;
    }

    const targetType = skillDef.targetType;

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

    castSkill(skillId, selectedTargetId ?? undefined);
  };

  // ERGONOMIC CALCULATIONS FOR CONCENTRIC ARCS
  // Center of Attack Button is right: 36px, bottom: 36px
  const centerPosition = { right: 36, bottom: 36 };
  
  // Outer Arc for Skills (Radius: 105px, from 90° (top) to 180° (left))
  const getOuterArcStyle = (index: number, total: number) => {
    const radius = 105;
    // Spacing out nicely
    const startAngle = Math.PI; // 180 deg
    const endAngle = Math.PI / 2; // 90 deg
    const angle = total > 1 
      ? startAngle - (index / (total - 1)) * (startAngle - endAngle)
      : startAngle;
    
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    return {
      position: 'absolute' as const,
      right: `${centerPosition.right - x}px`,
      bottom: `${centerPosition.bottom + y}px`,
    };
  };

  // Inner Arc for Items (Radius: 60px, from 100° to 170°)
  const getInnerArcStyle = (index: number, total: number) => {
    const radius = 60;
    const startAngle = Math.PI * 0.95; // ~170 deg
    const endAngle = Math.PI * 0.55; // ~100 deg
    const angle = total > 1 
      ? startAngle - (index / (total - 1)) * (startAngle - endAngle)
      : startAngle;
    
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    return {
      position: 'absolute' as const,
      right: `${centerPosition.right - x}px`,
      bottom: `${centerPosition.bottom + y}px`,
    };
  };

  return (
    <div className="absolute right-0 bottom-0 pointer-events-none select-none w-[200px] h-[200px] z-20">
      
      {/* 1. MAIN ATTACK BUTTON (Center of Arc) */}
      <div 
        className="pointer-events-auto absolute"
        style={{ 
          right: `${centerPosition.right}px`, 
          bottom: `${centerPosition.bottom}px`,
          transform: 'translate(50%, 50%)' // Center exactly on coordinates
        }}
      >
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleAttack}
          className={cn(
            "w-[68px] h-[68px] rounded-full flex items-center justify-center border-2 shadow-2xl relative cursor-pointer outline-none transition-all duration-300",
            selectedTargetId
              ? "bg-gradient-to-b from-red-500 to-red-700 border-red-300 shadow-[0_0_24px_rgba(239,68,68,0.6)]"
              : "bg-slate-900/90 border-slate-700 text-slate-500 grayscale opacity-80"
          )}
        >
          {selectedTargetId && (
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-white rounded-full"
            />
          )}
          <Swords size={28} className="relative z-10 text-white drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.5)]" />
        </motion.button>
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[7px] font-black uppercase text-white/50 tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          Atk
        </span>
      </div>

      {/* 2. QUICK CONSUMABLE ITEMS (Inner Arc, Radius: 60px) */}
      <AnimatePresence>
        {quickItems.map((item, index) => {
          const style = getInnerArcStyle(index, quickItems.length);
          return (
            <motion.div
              key={item.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="pointer-events-auto"
              style={{
                ...style,
                transform: 'translate(50%, 50%)'
              }}
            >
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => consumeItem(item.id)}
                className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-700/60 bg-slate-950/80 shadow-xl cursor-pointer relative overflow-hidden backdrop-blur-md"
              >
                <GameIcon
                  iconType="item"
                  id={item.id}
                  name={item.name}
                  size={20}
                />
                
                {/* Count badge */}
                <Badge 
                  variant="amount" 
                  size="xs" 
                  className="absolute -top-1 -right-1 px-1 min-w-[14px] h-[14px] leading-none text-[8px] rounded-full border border-slate-950 bg-amber-500 font-bold shadow-lg"
                >
                  {item.amount}
                </Badge>
              </motion.button>
              
              {/* Shortcut Tag */}
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[6px] font-black text-slate-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                I{index + 1}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* 3. ACTIVE SKILLS (Outer Arc, Radius: 105px) */}
      <AnimatePresence>
        {activeSkills.map((skillId, index) => {
          const skillDef = skills.find((s) => s.id === skillId);
          if (!skillDef) return null;

          const isActive = activeSkill === skillId;
          const cdExpires = skillCooldowns[skillId] ?? 0;
          const cdRemaining = Math.max(0, cdExpires - now);
          const onCooldown = cdRemaining > 0;
          const style = getOuterArcStyle(index, activeSkills.length);

          return (
            <motion.div
              key={skillId}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="pointer-events-auto"
              style={{
                ...style,
                transform: 'translate(50%, 50%)'
              }}
            >
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => !onCooldown && handleSkillClick(skillId)}
                disabled={onCooldown}
                className={cn(
                  "w-[42px] h-[42px] rounded-full flex flex-col items-center justify-center border shadow-xl relative overflow-hidden transition-all duration-200 cursor-pointer backdrop-blur-md",
                  onCooldown && "cursor-not-allowed border-slate-800",
                  isActive
                    ? "bg-amber-500/25 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                    : "bg-slate-900/90 border-slate-700 hover:border-slate-500"
                )}
              >
                <GameIcon
                  iconType="skill"
                  id={skillId}
                  name={skillDef.name}
                  variant={isActive ? 'amber' : 'default'}
                  size={20}
                />
                
                {/* SP Cost text at the bottom */}
                <span className="text-[6px] font-black text-blue-400/90 absolute bottom-0.5 tracking-tighter">
                  {skillDef.spCost}
                </span>

                {/* HIGH-FIDELITY CLOCKWISE RADIAL SWEEP FOR COOLDOWN */}
                {onCooldown && (
                  <>
                    {/* Dark radial overlay */}
                    <div 
                      className="ro-cooldown-sweep z-10 flex items-center justify-center"
                      style={{
                        background: 'rgba(0, 0, 0, 0.72)'
                      }}
                    >
                      <span className="text-[9px] font-black text-white tracking-tighter select-none">
                        {(cdRemaining / 1000).toFixed(1)}
                      </span>
                    </div>
                  </>
                )}
                
                {/* Highlight ring for active skills */}
                {isActive && (
                  <motion.div
                    layoutId="active-skill"
                    className="absolute inset-0 border border-amber-400 rounded-full"
                  />
                )}
              </motion.button>
              
              {/* Shortcut Hotkey Tag (eg: F1, F2...) */}
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[7px] font-black text-amber-500/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                F{index + 1}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
