'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { ProgressBar, Avatar } from '@/components/ui';
import { X, Skull } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function TargetFrame() {
  const selectedTargetId = useGameStore((state) => state.selectedTargetId);
  const setSelectedTargetId = useGameStore((state) => state.setSelectedTargetId);
  const enemies = useGameStore((state) => state.enemies || {});

  const enemy = selectedTargetId ? enemies[selectedTargetId] : null;

  return (
    <AnimatePresence>
      {enemy && (
        <motion.div
          initial={{ opacity: 0, y: -15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.95 }}
          className="pointer-events-auto select-none mx-auto w-full max-w-[220px] xs:max-w-[240px] md:max-w-[280px]"
        >
          {/* Blood-Red accented capsule mirroring PlayerFrame */}
          <div className="flex flex-col p-2 rounded-2xl ro-window-panel border border-red-900/40 shadow-[0_0_20px_rgba(239,68,68,0.25)] bg-slate-950/75 backdrop-blur-md">
            
            {/* Main Details */}
            <div className="flex items-center gap-2">
              
              {/* Avatar frame */}
              <div className="relative shrink-0">
                <Avatar 
                  name={enemy.name} 
                  size="sm" 
                  ringColor="red" 
                  showLevel={false} 
                  className="w-8 h-8 md:w-9 md:h-9 border border-red-500/10 shadow-lg bg-slate-950" 
                />
                <div className="absolute -bottom-1 -right-1 bg-red-600 rounded-full p-0.5 border border-slate-950 shadow-md">
                  <Skull size={9} className="text-white" />
                </div>
                
                {/* Threat aura pulse */}
                <motion.div
                  animate={{ opacity: [0.15, 0.45, 0.15] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 rounded-full bg-red-500/10 blur-sm -z-10"
                />
              </div>

              {/* Stats column */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-white font-black text-xs truncate tracking-tight uppercase">
                    {enemy.name}
                  </span>
                  
                  {/* Close action */}
                  <button
                    onClick={() => setSelectedTargetId(null)}
                    className="text-slate-500 hover:text-red-400 active:scale-90 transition-all p-0.5 outline-none cursor-pointer shrink-0"
                    title="Clear Target"
                  >
                    <X size={13} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="flex flex-col gap-0.5">
                  {/* Thicker HP Bar */}
                  <ProgressBar
                    value={enemy.hp || 0}
                    max={enemy.maxHp || 100}
                    color="red"
                    size="sm"
                    className="w-full h-[8px] rounded-sm border-0 bg-red-950/45 shadow-inner"
                    showLabel={true}
                  />
                  
                  <div className="flex justify-between items-center px-0.5 mt-0.5">
                    <span className="text-[6.5px] font-black text-red-400/90 tracking-widest">HOSTILE</span>
                    <span className="text-[7.5px] font-black text-red-500 font-mono">
                      LV.{enemy.level}
                    </span>
                  </div>
                </div>

              </div>

            </div>
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
