'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal } from 'lucide-react';

export function addCombatLog(message: string, color?: string) {
  const gs = useGameStore.getState();
  gs.addCombatLog?.(message);
}

export function CombatLog() {
  const combatLog = useGameStore((state) => state.combatLog);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [combatLog]);

  if (combatLog.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full max-w-[240px] sm:max-w-[300px]"
    >
      <div className="bg-slate-950/40 backdrop-blur-md rounded-2xl border border-slate-800/60 overflow-hidden shadow-2xl">
        <div className="px-3 py-1.5 border-b border-slate-800/60 flex items-center gap-2 bg-slate-900/40">
           <Terminal size={10} className="text-blue-400" />
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Combat Log</span>
        </div>

        <div
          ref={scrollRef}
          className="h-24 sm:h-32 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar text-[11px] font-medium"
        >
          <AnimatePresence initial={false}>
            {combatLog.map((log, i) => {
              const isDamage = log.includes('Damage') || log.includes('Hit');
              const isHeal = log.includes('Heal') || log.includes('Restored');
              const isExp = log.includes('EXP');

              return (
                <motion.div
                  key={`${i}-${log}`}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-2"
                >
                  <span className="text-slate-600 font-mono text-[9px] mt-0.5">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                  <p className={cn(
                    "leading-relaxed",
                    isDamage ? "text-red-400/90" :
                    isHeal ? "text-emerald-400/90" :
                    isExp ? "text-amber-400/90" :
                    "text-slate-300"
                  )}>
                    {log}
                  </p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
