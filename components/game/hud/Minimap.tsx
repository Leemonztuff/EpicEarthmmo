'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useNetworkStore } from '@/store/useNetworkStore';
import { Card } from '@/components/ui';
import { MapPin, Users, Skull } from 'lucide-react';
import { motion } from 'framer-motion';

export function Minimap() {
  const currentMapId = useGameStore((state) => state.currentMapId);
  const enemies = useGameStore((state) => state.enemies || {});
  const remotePlayers = useNetworkStore((state) => state.remotePlayers || {});

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="pointer-events-auto"
    >
      <Card
        variant="glass"
        padding="none"
        rounded="2xl"
        className="w-32 h-32 sm:w-40 sm:h-40 overflow-hidden border-slate-800 shadow-2xl relative"
      >
        {/* Map Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />

        {/* Map Name Overlay */}
        <div className="absolute top-2 left-2 z-10">
           <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
              <MapPin size={8} className="text-blue-400" />
              <span className="text-[8px] font-black text-white uppercase tracking-tighter truncate max-w-[60px]">
                {currentMapId}
              </span>
           </div>
        </div>

        {/* Dynamic Map Content (Mockup representation) */}
        <div className="relative w-full h-full flex items-center justify-center">
           {/* Player Center Dot */}
           <motion.div
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(59,130,246,0.8)] z-20"
           />

           {/* Enemy Dots (Randomized for mock) */}
           <div className="absolute top-1/4 right-1/3 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
           <div className="absolute bottom-1/3 left-1/4 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
           <div className="absolute top-1/2 left-1/3 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
        </div>

        {/* Scanline Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent h-full w-full pointer-events-none animate-[scanline_4s_linear_infinite]" />
      </Card>

      <div className="flex justify-between mt-2 px-1">
         <div className="flex items-center gap-1">
            <Users size={10} className="text-slate-500" />
            <span className="text-[9px] font-bold text-slate-500">{Object.keys(remotePlayers).length + 1}</span>
         </div>
         <div className="flex items-center gap-1">
            <Skull size={10} className="text-slate-500" />
            <span className="text-[9px] font-bold text-slate-500">{Object.keys(enemies).length}</span>
         </div>
      </div>
    </motion.div>
  );
}
