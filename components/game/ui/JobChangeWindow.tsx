'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { gameData } from '@/shared/loader';
import { Modal, Button, Text, IconBox, Badge } from '@/components/ui';
import { Sparkles, Sword, Shield, Zap, Target, Star, Swords, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';

const { jobs } = gameData;
const availableJobs = jobs.filter(j => j.requirements);

const jobIcons: Record<string, any> = {
  swordsman: { icon: Sword, color: 'red', desc: 'Frontline fighter with high HP and strong blade skills.' },
  mage: { icon: Zap, color: 'blue', desc: 'Elemental spellcaster dealing massive magical area damage.' },
  archer: { icon: Target, color: 'green', desc: 'Ranged specialist striking targets with lethal precision.' },
  thief: { icon: Star, color: 'purple', desc: 'Swift assassin utilizing poison and high evasion skills.' },
  acolyte: { icon: Sparkles, color: 'yellow', desc: 'Holy support priest capable of healing and blessing allies.' },
  merchant: { icon: Shield, color: 'amber', desc: 'Sturdy vendor fighting with axes and Zeny bonuses.' },
};

export function JobChangeWindow() {
  const changeJob = useGameStore(state => state.changeJob);
  const player = useGameStore(state => state.player);
  const [dismissed, setDismissed] = useState(false);
  const [hoveredJob, setHoveredJob] = useState<string | null>(null);

  if (dismissed || !player) return null;

  return (
    <Modal
      isOpen
      onClose={() => setDismissed(true)}
      title="Class Ascension"
      subtitle="The path to greatness lies ahead"
      position="center"
      size="md"
    >
      <div className="space-y-6">
        
        {/* Core Header with glowing gold effects */}
        <div className="relative py-4 flex flex-col items-center overflow-hidden rounded-2xl bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.15),transparent_60%)] blur-xl" />
          
          <motion.div
            animate={{ 
              rotate: [0, 8, -8, 0],
              scale: [1, 1.1, 1],
              filter: ["drop-shadow(0 0 4px rgba(245,158,11,0.2))", "drop-shadow(0 0 12px rgba(245,158,11,0.6))", "drop-shadow(0 0 4px rgba(245,158,11,0.2))"]
            }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="relative z-10"
          >
            <IconBox 
              icon={<Award size={36} className="text-amber-400" />} 
              color="yellow" 
              size="xl" 
              rounded="full" 
              className="bg-amber-950/40 border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
            />
          </motion.div>
          
          <Text variant="subheading" className="mt-4 text-center font-black text-lg text-white uppercase tracking-wider drop-shadow-md">
            Choose Your Destiny
          </Text>
          <Text variant="caption" className="text-center text-slate-400 mt-1 max-w-[280px] font-bold text-[9px] uppercase tracking-widest leading-none">
            You have reached Job Level {player.jobLevel} and are ready to specialize.
          </Text>
        </div>

        {/* Action class cards */}
        <div className="grid gap-2.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
          {availableJobs.map((job, index) => {
            const config = jobIcons[job.id.toLowerCase()] || { icon: Sparkles, color: 'default', desc: 'A specialized role.' };
            const Icon = config.icon;
            const isHovered = hoveredJob === job.id;

            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <button
                  onClick={() => { 
                    changeJob(job.id); 
                    setDismissed(true); 
                  }}
                  onMouseEnter={() => setHoveredJob(job.id)}
                  onMouseLeave={() => setHoveredJob(null)}
                  className={cn(
                    "w-full group relative overflow-hidden flex items-center gap-4 p-3.5 rounded-2xl border transition-all duration-300 text-left active:scale-[0.98] select-none cursor-pointer ro-double-border",
                    isHovered
                      ? "bg-amber-500/10 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                      : "bg-slate-900/55 border-slate-800/80 hover:border-slate-700"
                  )}
                >
                  {/* Subtle hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-600/0 to-amber-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Icon Frame */}
                  <IconBox 
                    icon={<Icon size={22} />} 
                    color={config.color} 
                    size="lg" 
                    rounded="xl" 
                    className="group-hover:scale-105 transition-transform shadow-md shrink-0" 
                  />

                  {/* Class Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                       <Text variant="body" className="font-extrabold text-white text-sm uppercase tracking-wide">{job.name}</Text>
                       {job.id === 'Swordsman' && (
                         <Badge variant="warning" size="xs" className="text-[7px] py-0 px-1 font-black">Easy</Badge>
                       )}
                       {job.id === 'Mage' && (
                         <Badge variant="purple" size="xs" className="text-[7px] py-0 px-1 font-black">Expert</Badge>
                       )}
                    </div>
                    <Text variant="caption" className="text-slate-400 text-[10px] mt-0.5 line-clamp-2 leading-tight">
                      {config.desc}
                    </Text>
                  </div>

                  {/* Right Sparkle Trigger */}
                  <div className={cn(
                    "w-9 h-9 rounded-full bg-slate-950/60 border border-slate-800 flex items-center justify-center text-slate-500 transition-all shrink-0",
                    "group-hover:text-amber-400 group-hover:bg-amber-950/20 group-hover:border-amber-500/30"
                  )}>
                    <Swords size={15} />
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Cancel Button */}
        <Button
          variant="ghost"
          size="md"
          onClick={() => setDismissed(true)}
          className="w-full text-slate-500 hover:text-slate-300 font-extrabold text-[10px] uppercase tracking-widest"
        >
          Decide Later
        </Button>
      </div>
    </Modal>
  );
}
