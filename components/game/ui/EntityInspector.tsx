'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Modal, Card, Text, Badge, IconBox, Section } from '@/components/ui';
import { Search, Hash, Activity, MapPin, Package, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export function EntityInspector({ onClose }: { onClose: () => void }) {
  const selectedTargetId = useGameStore(state => state.selectedTargetId);
  const enemies = useGameStore(state => state.enemies);
  const remotePlayers = useGameStore(state => state.remotePlayers);

  const target = selectedTargetId ? (enemies[selectedTargetId] || remotePlayers[selectedTargetId]) : null;

  return (
    <Modal isOpen onClose={onClose} title="Entity Inspector" subtitle="Raw State Debugger" position="center" size="md">
      {!target ? (
         <div className="py-20 text-center flex flex-col items-center gap-4">
            <IconBox icon={<Search size={32} />} size="xl" color="default" rounded="md" className="opacity-20" />
            <Text variant="caption" className="uppercase font-black tracking-widest text-slate-600">No Entity Selected</Text>
            <p className="text-xs text-slate-500 max-w-[200px]">Select an enemy or player in the game world to inspect their internal memory.</p>
         </div>
      ) : (
        <div className="space-y-6">
          {/* Entity Header */}
          <div className="bg-slate-950/60 rounded-3xl p-5 border border-slate-800 flex items-center gap-4">
             <IconBox icon={<Cpu size={24} />} color="blue" size="lg" rounded="md" />
             <div className="flex-1">
                <Text variant="body" className="font-black text-white text-lg tracking-tight uppercase italic">{target.name}</Text>
                <div className="flex items-center gap-2 mt-1">
                   <Badge variant="amount" size="xs">ID: {selectedTargetId?.substring(0, 8)}...</Badge>
                   <Badge variant="primary" size="xs">TYPE: {enemies[selectedTargetId!] ? 'ENEMY' : 'PLAYER'}</Badge>
                </div>
             </div>
          </div>

          {/* Raw JSON dump */}
          <Section title="State Object" icon={<Hash size={16} />}>
             <div className="bg-black/90 rounded-2xl p-4 border border-slate-800 font-mono text-[10px] text-blue-300 h-64 overflow-y-auto custom-scrollbar">
                <pre>{JSON.stringify(target, null, 2)}</pre>
             </div>
          </Section>

          {/* Real-time Telemetry */}
          <div className="grid grid-cols-2 gap-3">
             <TelemetryCard icon={<Activity size={12} />} label="Health" value={`${target.hp || 0} / ${target.maxHp || '?'}`} />
             <TelemetryCard icon={<MapPin size={12} />} label="Position" value={`${target.position?.x.toFixed(1)}, ${target.position?.z.toFixed(1)}`} />
          </div>
        </div>
      )}
    </Modal>
  );
}

function TelemetryCard({ icon, label, value }: any) {
  return (
    <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col gap-1">
       <div className="flex items-center gap-1.5 opacity-50">
          {icon}
          <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
       </div>
       <span className="text-xs font-mono text-white">{value}</span>
    </div>
  );
}
