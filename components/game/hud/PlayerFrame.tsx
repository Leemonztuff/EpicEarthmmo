'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { gameData } from '@/shared/loader';
import { ProgressBar, ThinBar, Avatar, StatusEffectBar } from '@/components/ui';
import { Heart, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const { balance } = gameData;

const mockStatusEffects = [
  { icon: <Heart size={14} />, name: 'HP Regen', duration: 15000, variant: 'buff' as const, size: 'sm' as const },
  { icon: <Zap size={14} />, name: 'SP Regen', duration: 12000, variant: 'buff' as const, size: 'sm' as const },
];

export function PlayerFrame() {
  const player = useGameStore((state) => state.player);

  if (!player) return null;

  const baseMult = balance?.progression?.baseLevelUpThreshold?.multiplier || 100;
  const jobMult = balance?.progression?.jobLevelUpThreshold?.multiplier || 50;

  const baseExpThreshold = (player.baseLevel || 1) * baseMult;
  const jobExpThreshold = (player.jobLevel || 1) * jobMult;

  const baseExpPct = baseExpThreshold > 0 ? Math.min(100, ((player.baseExp || 0) / baseExpThreshold) * 100) : 0;
  const jobExpPct = jobExpThreshold > 0 ? Math.min(100, ((player.jobExp || 0) / jobExpThreshold) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="pointer-events-auto select-none"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="relative">
          <Avatar
            name={player.name || 'Hero'}
            level={player.baseLevel || 1}
            size="md"
            ringColor="gradient"
            className="shadow-xl shadow-black/40"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute inset-0 rounded-full bg-blue-400/20 blur-md -z-10"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-white font-black text-base truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] tracking-tight">
              {player.name || 'Hero'}
            </span>
            <span className="text-blue-400/80 text-[10px] font-black uppercase tracking-tighter">
              {player.jobClass || 'Novice'}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <ProgressBar
              value={player.hp || 0}
              max={player.maxHp || 100}
              color="hp"
              size="sm"
              className="w-40 sm:w-48 shadow-lg"
            />
            <ProgressBar
              value={player.sp || 0}
              max={player.maxSp || 100}
              color="sp"
              size="sm"
              className="w-32 sm:w-40 shadow-lg"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1 px-1 mb-2">
         <div className="flex items-center gap-2">
            <span className="text-[8px] font-black text-amber-500 w-6">BASE</span>
            <ThinBar value={baseExpPct} color="exp" className="flex-1" />
         </div>
         <div className="flex items-center gap-2">
            <span className="text-[8px] font-black text-purple-500 w-6">JOB</span>
            <ThinBar value={jobExpPct} color="jobExp" className="flex-1" />
         </div>
      </div>

      <StatusEffectBar effects={mockStatusEffects} />
    </motion.div>
  );
}
