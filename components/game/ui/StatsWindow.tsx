'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Modal, IconBox, Text, Button, Section, Badge, ProgressBar } from '@/components/ui';
import { Dumbbell, Wind, Heart, Brain, Crosshair, Clover, Star, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const statConfig = [
  { key: 'str' as const, icon: Dumbbell, label: 'STR', desc: 'Attack Power & Weight', color: 'red' as const },
  { key: 'agi' as const, icon: Wind, label: 'AGI', desc: 'Attack Speed & Flee', color: 'cyan' as const },
  { key: 'vit' as const, icon: Heart, label: 'VIT', desc: 'Defense & Max HP', color: 'green' as const },
  { key: 'int' as const, icon: Brain, label: 'INT', desc: 'Magic Power & Max SP', color: 'blue' as const },
  { key: 'dex' as const, icon: Crosshair, label: 'DEX', desc: 'Accuracy & Cast Time', color: 'yellow' as const },
  { key: 'luk' as const, icon: Clover, label: 'LUK', desc: 'Critical & Perfect Dodge', color: 'purple' as const },
];

export function StatsWindow({ onClose }: { onClose: () => void }) {
  const player = useGameStore((state) => state.player);
  const allocateStat = useGameStore((state) => state.allocateStat);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Character Status"
      subtitle={`Level ${player.baseLevel} ${player.jobClass}`}
      position="bottom"
    >
      <div className="space-y-6">
        {/* Points Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-4 border border-slate-700/50 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <IconBox icon={<Star size={20} className="text-amber-400" />} color="yellow" size="md" />
            <div>
              <Text variant="caption" className="uppercase tracking-widest text-[10px] font-black text-slate-500">Available Points</Text>
              <Text variant="valueLg" className="text-2xl text-white">{player.stats.statPoints}</Text>
            </div>
          </div>
          {player.stats.statPoints > 0 && (
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Badge variant="warning" size="md" className="animate-pulse">Points Available!</Badge>
            </motion.div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid gap-3">
          {statConfig.map(({ key, icon: Icon, label, desc, color }, index) => {
            const val = player.stats[key];
            const canAllocate = player.stats.statPoints > 0;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/30 rounded-2xl p-3 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconBox icon={<Icon size={18} />} size="md" color={color} rounded="sm" />
                    <div>
                      <div className="flex items-center gap-2">
                        <Text variant="body" className="font-black text-slate-100">{label}</Text>
                        <Text variant="value" className="text-lg text-white">{val}</Text>
                      </div>
                      <Text variant="caption" className="text-[10px] text-slate-500">{desc}</Text>
                    </div>
                  </div>

                  {canAllocate && (
                    <Button
                      variant="primary"
                      size="icon"
                      onClick={() => allocateStat(key)}
                      className="w-10 h-10 shadow-blue-500/20"
                    >
                      <TrendingUp size={18} />
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Derived Stats / Summary */}
        <Section title="Combat Statistics" variant="card" className="bg-slate-900/40">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Text variant="caption" className="text-[10px] uppercase text-slate-500 font-bold">Physical Attack</Text>
                <Text variant="value" className="text-white">{10 + player.stats.str * 2}</Text>
              </div>
              <div className="space-y-1">
                <Text variant="caption" className="text-[10px] uppercase text-slate-500 font-bold">Magic Attack</Text>
                <Text variant="value" className="text-white">{10 + player.stats.int * 2}</Text>
              </div>
              <div className="space-y-1">
                <Text variant="caption" className="text-[10px] uppercase text-slate-500 font-bold">Defense</Text>
                <Text variant="value" className="text-white">{player.stats.vit}</Text>
              </div>
              <div className="space-y-1">
                <Text variant="caption" className="text-[10px] uppercase text-slate-500 font-bold">Flee Rate</Text>
                <Text variant="value" className="text-white">{100 + player.stats.agi + player.baseLevel}</Text>
              </div>
           </div>
        </Section>
      </div>
    </Modal>
  );
}
