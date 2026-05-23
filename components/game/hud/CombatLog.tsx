'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/cn';

export function addCombatLog(message: string, color?: string) {
  if (typeof window !== 'undefined') {
     useGameStore.getState().addCombatLog?.(message);
  }
}

export function CombatLog() {
  const combatLog = useGameStore((state) => state.combatLog || []);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (scrollRef.current && !isCollapsed) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [combatLog, isCollapsed]);

  if (!combatLog || combatLog.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full max-w-[200px] xs:max-w-[240px] sm:max-w-[300px] pointer-events-auto select-none"
    >
      {/* Collapsible RO Glass Frame Panel */}
      <div className="ro-window-panel border border-slate-700/40 bg-slate-950/70 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl transition-all duration-300">
        
        {/* Interactive Header to Toggle Collapse */}
        <div 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="px-3 py-2 border-b border-white/5 flex items-center justify-between bg-slate-900/30 cursor-pointer active:brightness-90 transition-all hover:brightness-110 ro-double-border"
          title="Toggle Combat Log"
        >
<<<<<<< HEAD
          <div className="flex items-center gap-2">
             <Terminal size={10} className="text-blue-400 shrink-0" />
             <span className="text-[7.5px] sm:text-[9.5px] font-black text-slate-400 uppercase tracking-widest leading-none">
               Combat Log
             </span>
          </div>
          
          <button 
            className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-white transition-colors outline-none cursor-pointer"
          >
            {isCollapsed ? <ChevronUp size={12} strokeWidth={2.5} /> : <ChevronDown size={12} strokeWidth={2.5} />}
          </button>
=======
          <AnimatePresence initial={false}>
            {combatLog.map((log, i) => {
              const s = String(log || '');
              const isDamage = s.includes('Damage') || s.includes('Hit');
              const isHeal = s.includes('Heal') || s.includes('Restored');

              return (
                <motion.div
                  key={`${i}-${s}`}
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
                    {s}
                  </p>
                </motion.div>
              );
            })}
          </AnimatePresence>
>>>>>>> e663a2a (fix: defensive checks for .includes across UI to prevent runtime errors)
        </div>

        {/* Dynamic Expand/Collapse Body */}
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div
                ref={scrollRef}
                className="h-16 xs:h-20 sm:h-32 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar text-[9px] sm:text-[10.5px] font-semibold"
              >
                {combatLog.map((log, i) => {
                  const isDamage = log.includes('Damage') || log.includes('Hit');
                  const isHeal = log.includes('Heal') || log.includes('Restored');

                  return (
                    <motion.div
                      key={`${i}-${log}`}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-1.5"
                    >
                      <p className={cn(
                        "leading-normal line-clamp-2 sm:line-clamp-none font-medium",
                        isDamage ? "text-red-400/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]" :
                        isHeal ? "text-emerald-400/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]" :
                        "text-slate-300 drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]"
                      )}>
                        {log}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}
