'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Modal, Text } from '@/components/ui';
import { Sword, Shield, Zap, Wind, Star, TrendingUp } from 'lucide-react';
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
      title="Status"
      subtitle={`Lv. ${player.baseLevel || 1} ${player.jobClass || 'Novice'}`}
      size="md"
      position="bottom"
    >
      <div className="space-y-4">
        
        {/* Remaining Stat Points Banner - Compact & Radiant */}
        <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-3 flex items-center justify-between shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
               <Star size={20} className="text-amber-400 fill-amber-500/15" />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-amber-500/70">Remaining Points</p>
              <h2 className="text-2xl font-black text-white leading-none mt-0.5">{points}</h2>
            </div>
          </div>
          {points > 0 && (
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/30 text-[8px] font-black text-amber-400 uppercase tracking-wider shrink-0"
            >
              Ready!
            </motion.div>
          )}
        </div>

        {/* Attribute Sliders - Two column grid, extremely compact */}
        <div className="grid grid-cols-2 gap-2">
          {statConfig.map(({ key, icon: Icon, label, desc, color }, index) => {
            const val = player.stats ? player.stats[key] : 0;
            const canAllocate = points > 0;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  "p-2.5 rounded-xl border border-white/5 bg-slate-900/40 flex items-center justify-between gap-1.5 transition-all duration-200",
                  canAllocate && "hover:border-blue-500/20"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-white/5",
                    color === 'red' ? "bg-red-500/10 text-red-400" :
                    color === 'cyan' ? "bg-cyan-500/10 text-cyan-400" :
                    color === 'green' ? "bg-emerald-500/10 text-emerald-400" :
                    color === 'blue' ? "bg-blue-500/10 text-blue-400" :
                    color === 'yellow' ? "bg-amber-500/10 text-amber-400" : "bg-purple-500/10 text-purple-400"
                  )}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase">{label}</span>
                      <span className="text-sm font-black text-white leading-none">{val}</span>
                    </div>
                    <span className="text-[7px] text-slate-500 font-semibold uppercase leading-none block truncate">
                      {desc}
                    </span>
                  </div>
                </div>

                {/* Tactical Upgrade button */}
                {canAllocate && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => allocateStat(key)}
                    className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    <TrendingUp size={12} />
                  </motion.button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* combat Stats - Highly compact list in two rows */}
        <div className="bg-slate-950/40 rounded-2xl border border-white/5 p-3.5 shadow-xl">
           <div className="flex items-center gap-1.5 mb-2.5">
              <div className="w-[3px] h-3 bg-blue-500 rounded-full" />
              <h3 className="text-[8px] font-black uppercase tracking-widest text-slate-400">Combat Performance</h3>
           </div>

           <div className="grid grid-cols-4 gap-y-3 gap-x-2">
              <StatItem label="Atk" value={combat.atk} icon={<Sword size={11} className="text-red-400" />} />
              <StatItem label="Def" value={combat.def} icon={<Shield size={11} className="text-emerald-400" />} />
              <StatItem label="MAtk" value={combat.matk} icon={<Zap size={11} className="text-blue-400" />} />
              <StatItem label="Flee" value={combat.flee} icon={<Wind size={11} className="text-cyan-400" />} />
              
              <StatItem label="Hit" value={combat.hit} icon={<Star size={11} className="text-amber-400" />} />
              <StatItem label="Crit" value={Math.floor(combat.critChance * 100)} icon={<Star size={11} className="text-purple-400" />} unit="%" />
              <StatItem label="ASpd" value={Math.floor(combat.attackSpeed)} icon={<Wind size={11} className="text-slate-400" />} />
              <StatItem label="MDef" value={combat.mdef} icon={<Shield size={11} className="text-blue-400" />} />
           </div>
        </div>
      </div>
    </Modal>
  );
}

function StatItem({ label, value, icon, unit }: { label: string; value: number; icon: React.ReactNode; unit?: string }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <div className="flex items-center gap-1 opacity-70">
        {icon}
        <span className="text-[8px] font-bold uppercase tracking-tight text-slate-400 truncate">{label}</span>
      </div>
      <span className="text-xs font-black text-white tracking-tight leading-none">
        {value}{unit}
      </span>
    </div>
  );
}
