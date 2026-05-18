'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { ProgressBar, Avatar, Button, Card } from '@/components/ui';
import { X, Crosshair, Skull } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function TargetFrame() {
  const selectedTargetId = useGameStore((state) => state.selectedTargetId);
  const setSelectedTargetId = useGameStore((state) => state.setSelectedTargetId);
  const enemies = useGameStore((state) => state.enemies);

  const enemy = selectedTargetId ? enemies[selectedTargetId] : null;

  return (
    <AnimatePresence>
      {enemy && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="pointer-events-auto select-none mx-auto w-full max-w-[280px]"
        >
          <Card
            variant="glass"
            padding="sm"
            rounded="xl"
            className="border-red-500/30 shadow-[0_10px_30px_-10px_rgba(239,68,68,0.3)] bg-slate-950/80"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative">
                  <Avatar name={enemy.name} size="sm" ringColor="red" showLevel={false} className="shadow-lg" />
                  <div className="absolute -bottom-1 -right-1 bg-red-600 rounded-full p-0.5 border border-slate-900">
                    <Skull size={8} className="text-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-black text-sm truncate drop-shadow-md tracking-tight uppercase">
                      {enemy.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                     <Badge variant="danger" size="xs" className="px-1 py-0 h-auto text-[8px]">LVL {enemy.level}</Badge>
                     <Text variant="caption" className="text-red-400/60 text-[9px] font-bold uppercase">Aggressive</Text>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedTargetId(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <ProgressBar
              value={enemy.hp}
              max={enemy.maxHp}
              color="red"
              size="md"
              className="shadow-inner"
            />
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Badge({ children, variant, size, className }: any) {
   const variants: any = {
     danger: 'bg-red-500/20 text-red-500 border-red-500/30'
   };
   return (
     <span className={`border rounded font-black ${variants[variant]} ${className}`}>
        {children}
     </span>
   );
}
