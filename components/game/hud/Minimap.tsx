'use client';

import React, { useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useNetworkStore } from '@/store/useNetworkStore';
import { MapPin, Users, Skull } from 'lucide-react';
import { motion } from 'framer-motion';
import type { EnemyState } from '@/types/game';
import type { PeerPlayerState } from '@/shared/types/network';

const VIEW_RADIUS = 500;

function toDotPct(entityX: number, entityZ: number, playerX: number, playerZ: number): { left: string; top: string } {
  const relX = ((entityX - playerX) / VIEW_RADIUS) * 50 + 50;
  const relY = 50 - ((entityZ - playerZ) / VIEW_RADIUS) * 50;
  return {
    left: `${Math.max(0, Math.min(100, relX))}%`,
    top: `${Math.max(0, Math.min(100, relY))}%`,
  };
}

function EnemyDot({ enemy, playerX, playerZ }: { enemy: EnemyState; playerX: number; playerZ: number }) {
  const pos = toDotPct(enemy.position.x, enemy.position.z, playerX, playerZ);
  return (
    <div
      className="absolute w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse z-10 border border-slate-950"
      style={{ left: pos.left, top: pos.top }}
      title={enemy.name}
    />
  );
}

function PlayerDot({ p, playerX, playerZ }: { p: PeerPlayerState; playerX: number; playerZ: number }) {
  const pos = toDotPct(p.x, p.z, playerX, playerZ);
  return (
    <div
      className="absolute w-1.5 h-1.5 bg-green-400 rounded-full border border-slate-950 z-10"
      style={{ left: pos.left, top: pos.top }}
      title={p.name}
    />
  );
}

export function Minimap() {
  const currentMapId = useGameStore((state) => state.currentMapId);
  const position = useGameStore((state) => state.position);
  const enemies = useGameStore((state) => state.enemies || {});
  const remotePlayers = useNetworkStore((state) => state.remotePlayers || {});

  const aliveEnemies = useMemo(
    () => Object.values(enemies).filter((e) => !e.isDead),
    [enemies]
  );

  const playerX = position?.x ?? 0;
  const playerZ = position?.z ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="pointer-events-auto select-none"
    >
      {/* Sleek Minimap Box utilizing RO Window Panel and glass effects */}
      <div className="w-24 h-24 xs:w-28 xs:h-28 sm:w-40 sm:h-40 rounded-2xl overflow-hidden shadow-2xl relative ro-window-panel border border-slate-700/40 bg-slate-950/70 backdrop-blur-md">
        
        {/* Map Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:10px_10px] sm:bg-[size:20px_20px] pointer-events-none" />

        {/* Map Name Overlay - Compact Capsule */}
        <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 z-10">
           <div className="bg-slate-950/80 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/5 flex items-center gap-1 shadow-md">
              <MapPin size={6} className="text-blue-400 sm:size-2 shrink-0" />
              <span className="text-[5.5px] sm:text-[7.5px] font-black text-white uppercase tracking-tighter truncate max-w-[40px] sm:max-w-[70px]">
                {currentMapId}
              </span>
           </div>
        </div>

        {/* Dynamic Map Content */}
        <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
           {/* Player Center Dot - Glowing Pulsing halo */}
           <motion.div
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ repeat: Infinity, duration: 2.2 }}
            className="w-2 h-2 bg-blue-500 rounded-full border border-white shadow-[0_0_8px_rgba(59,130,246,0.8)] z-20 relative"
           />

           {/* Enemy Dots */}
           {aliveEnemies.map((enemy) => (
             <EnemyDot key={enemy.id} enemy={enemy} playerX={playerX} playerZ={playerZ} />
           ))}

           {/* Remote Player Dots */}
           {Object.values(remotePlayers).map((p, i) => (
             <PlayerDot key={p.name ?? i} p={p} playerX={playerX} playerZ={playerZ} />
           ))}
        </div>

        {/* Dynamic Scanline sweep */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent h-full w-full pointer-events-none animate-[scanline_4s_linear_infinite]" />
      </div>

      {/* Legend Footer below map box */}
      <div className="flex justify-between mt-1 px-1.5">
         <div className="flex items-center gap-1">
            <Users size={8} className="text-slate-500 sm:size-2.5" />
            <span className="text-[6.5px] sm:text-[8px] font-black text-slate-500 font-mono leading-none">
              {Object.keys(remotePlayers).length + 1}
            </span>
         </div>
         <div className="flex items-center gap-1">
            <Skull size={8} className="text-slate-500 sm:size-2.5" />
            <span className="text-[6.5px] sm:text-[8px] font-black text-slate-500 font-mono leading-none">
              {aliveEnemies.length}
            </span>
         </div>
      </div>
    </motion.div>
  );
}
