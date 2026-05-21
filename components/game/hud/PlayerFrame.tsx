'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useNetworkStore } from '@/store/useNetworkStore';
import { gameData } from '@/shared/loader';
import { ProgressBar, ThinBar, Avatar, StatusEffectBar } from '@/components/ui';
import { Heart, Zap, Shield, Swords, Skull, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ActiveBuffData } from '@/shared/types/network';

const { balance } = gameData;

function buffIcon(buff: ActiveBuffData) {
  if (buff.isDebuff) return <Skull size={14} />;
  if (buff.icon) return <Activity size={14} />;
  const id = (buff.buffId || '').toLowerCase();
  if (id.includes('hp')) return <Heart size={14} />;
  if (id.includes('sp') || id.includes('mana')) return <Zap size={14} />;
  if (id.includes('def') || id.includes('shield')) return <Shield size={14} />;
  if (id.includes('atk') || id.includes('str') || id.includes('dmg')) return <Swords size={14} />;
  return <Activity size={14} />;
}

function buffVariant(buff: ActiveBuffData): 'buff' | 'debuff' | 'neutral' {
  if (buff.isDebuff) return 'debuff';
  return 'buff';
}

function toStatusEffectProps(buffs: ActiveBuffData[]): React.ComponentProps<typeof StatusEffectBar>['effects'] {
  const now = Date.now();
  return buffs.map((buff) => ({
    icon: buffIcon(buff),
    name: buff.buffId,
    variant: buffVariant(buff),
    size: 'sm' as const,
    stackCount: buff.stacks > 1 ? buff.stacks : undefined,
    duration: Math.max(0, buff.expiresAt - now),
  }));
}

export function PlayerFrame() {
  const player = useGameStore((state) => state.player);
  const activeBuffs = useNetworkStore((state) => state.activeBuffs);

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
      className="pointer-events-auto select-none max-w-full"
    >
      <div className="flex items-center gap-2 sm:gap-3 mb-2">
        <div className="relative flex-shrink-0">
          <Avatar
            name={player.name || 'Hero'}
            level={player.baseLevel || 1}
            size="md"
            ringColor="gradient"
            className="shadow-xl shadow-black/40 w-10 h-10 sm:w-12 sm:h-12"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute inset-0 rounded-full bg-blue-400/20 blur-md -z-10"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
            <span className="text-white font-black text-sm sm:text-base truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] tracking-tight">
              {player.name || 'Hero'}
            </span>
            <span className="text-blue-400/80 text-[8px] sm:text-[10px] font-black uppercase tracking-tighter">
              {player.jobClass || 'Novice'}
            </span>
          </div>
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <ProgressBar
              value={player.hp || 0}
              max={player.maxHp || 100}
              color="hp"
              size="sm"
              className="w-28 xs:w-32 sm:w-48 shadow-lg h-1.5 sm:h-2"
            />
            <ProgressBar
              value={player.sp || 0}
              max={player.maxSp || 100}
              color="sp"
              size="sm"
              className="w-24 xs:w-28 sm:w-40 shadow-lg h-1.5 sm:h-2"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-0.5 sm:gap-1 px-1 mb-2">
         <div className="flex items-center gap-2">
            <span className="text-[7px] sm:text-[8px] font-black text-amber-500 w-4 sm:w-6">BASE</span>
            <ThinBar value={baseExpPct} color="exp" className="flex-1 h-1 sm:h-1.5" />
         </div>
         <div className="flex items-center gap-2">
            <span className="text-[7px] sm:text-[8px] font-black text-purple-500 w-4 sm:w-6">JOB</span>
            <ThinBar value={jobExpPct} color="jobExp" className="flex-1 h-1 sm:h-1.5" />
         </div>
      </div>

      <StatusEffectBar effects={toStatusEffectProps(activeBuffs)} />
    </motion.div>
  );
}
