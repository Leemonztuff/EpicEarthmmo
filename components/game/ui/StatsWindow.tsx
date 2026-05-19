'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Modal, Text } from '@/components/ui';
import { TrendingUp, Star, Sword, Shield, Zap, Wind } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

const statConfig = [
  { key: 'str' as const, icon: Sword, label: 'STR', desc: 'Atk & Weight', color: 'red' as const },
  { key: 'agi' as const, icon: Wind, label: 'AGI', desc: 'ASpd & Flee', color: 'cyan' as const },
  { key: 'vit' as const, icon: Shield, label: 'VIT', desc: 'Def & HP', color: 'green' as const },
  { key: 'int' as const, icon: Zap, label: 'INT', desc: 'Matk & SP', color: 'blue' as const },
  { key: 'dex' as const, icon: Star, label: 'DEX', desc: 'Hit & Cast', color: 'yellow' as const },
  { key: 'luk' as const, icon: Star, label: 'LUK', desc: 'Crit & Dodge', color: 'purple' as const },
];

export function StatsWindow({ onClose }: { onClose: () => void }) {
  const player = useGameStore((state) => state.player);
  const allocateStat = useGameStore((state) => state.allocateStat);
  const getCombatStats = useGameStore((state) => state.getCombatStats);

  if (!player) return null;

  const points = player.stats?.statPoints || 0;
  const combat = getCombatStats();

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Character"
      subtitle={`Level ${player.baseLevel || 1} ${player.jobClass || 'Novice'}`}
      position="bottom"
    >
      <div className="space-y-6">
        {/* Points Display */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white/5 flex items-center justify-between shadow-2xl overflow-hidden relative">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-3xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-inner">
               <Star size={28} className="text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/60 mb-0.5">Stat Points Remaining</p>
              <h2 className="text-4xl font-black text-white leading-none tracking-tight">{points}</h2>
            </div>
          </div>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 blur-3xl rounded-full" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
          {statConfig.map(({ key, icon: Icon, label, desc, color }, index) => {
            const val = player.stats ? player.stats[key] : 0;
            const canAllocate = points > 0;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "group relative p-4 rounded-[1.5rem] border transition-all duration-300",
                  canAllocate
                    ? "bg-slate-900/40 border-white/5 hover:border-blue-500/30"
                    : "bg-black/20 border-white/5 opacity-80"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg",
                      color === 'red' ? "bg-red-500/20 text-red-400" :
                      color === 'cyan' ? "bg-cyan-500/20 text-cyan-400" :
                      color === 'green' ? "bg-emerald-500/20 text-emerald-400" :
                      color === 'blue' ? "bg-blue-500/20 text-blue-400" :
                      color === 'yellow' ? "bg-amber-500/20 text-amber-400" : "bg-purple-500/20 text-purple-400"
                    )}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-black text-slate-400">{label}</span>
                        <span className="text-xl font-black text-white leading-none">{val}</span>
                      </div>
                      <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">{desc}</p>
                    </div>
                  </div>

                  {canAllocate && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => allocateStat(key)}
                      className="w-10 h-10 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 transition-colors"
                    >
                      <TrendingUp size={18} />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Detailed Combat Sub-Stats */}
        <div className="bg-slate-950/40 rounded-[2.5rem] border border-white/5 p-6 shadow-xl">
           <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-blue-500 rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Combat Performance</h3>
           </div>

           <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <StatItem label="Atk" value={combat.atk} icon={<Sword size={14} className="text-red-400" />} />
              <StatItem label="Def" value={combat.def} icon={<Shield size={14} className="text-emerald-400" />} />
              <StatItem label="MAtk" value={combat.matk} icon={<Zap size={14} className="text-blue-400" />} />
              <StatItem label="Flee" value={combat.flee} icon={<Wind size={14} className="text-cyan-400" />} />
           </div>
        </div>
      </div>
    </Modal>
  );
}

function StatItem({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 opacity-60">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">{label}</span>
      </div>
      <span className="text-xl font-black text-white tracking-tight leading-none">{value}</span>
    </div>
  );
}
