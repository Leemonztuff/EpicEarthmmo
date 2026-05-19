'use client';

import React, { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal } from 'lucide-react';

export function addCombatLog(message: string, color?: string) {
  if (typeof window !== 'undefined') {
     useGameStore.getState().addCombatLog?.(message);
  }
}

export function CombatLog() {
  const combatLog = useGameStore((state) => state.combatLog || []);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [combatLog]);

  if (!combatLog || combatLog.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full max-w-[200px] xs:max-w-[240px] sm:max-w-[300px]"
    >
      <div className="bg-slate-950/40 backdrop-blur-md rounded-xl sm:rounded-2xl border border-slate-800/60 overflow-hidden shadow-2xl">
        <div className="px-2 sm:px-3 py-1 sm:py-1.5 border-b border-slate-800/60 flex items-center gap-2 bg-slate-900/40">
           <Terminal size={8} className="text-blue-400 sm:size-2.5" />
           <span className="text-[7px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest">Combat Log</span>
        </div>

        <div
          ref={scrollRef}
          className="h-16 xs:h-20 sm:h-32 overflow-y-auto px-2 sm:px-3 py-1 sm:py-2 space-y-0.5 sm:space-y-1 custom-scrollbar text-[9px] sm:text-[11px] font-medium"
        >
          <AnimatePresence initial={false}>
            {combatLog.map((log, i) => {
              const isDamage = log.includes('Damage') || log.includes('Hit');
              const isHeal = log.includes('Heal') || log.includes('Restored');

              return (
                <motion.div
                  key={`${i}-${log}`}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-1.5"
                >
                  <p className={cn(
                    "leading-relaxed line-clamp-2 sm:line-clamp-none",
                    isDamage ? "text-red-400/90" :
                    isHeal ? "text-emerald-400/90" :
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
