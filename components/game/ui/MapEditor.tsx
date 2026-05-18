'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Modal, Button, Text, Card, Badge, IconBox, Section, TabBar } from '@/components/ui';
import { Map as MapIcon, Plus, Save, Move, Trash2, Layers, Box, Ghost, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function MapEditor({ onClose }: { onClose: () => void }) {
  const currentMapId = useGameStore(state => state.currentMapId);
  const [activeTab, setActiveTab] = useState('props');

  const tabs = [
    { id: 'props', label: 'Props', icon: <Box size={14} /> },
    { id: 'npcs', label: 'NPCs/Mobs', icon: <Ghost size={14} /> },
    { id: 'spawns', label: 'Spawns', icon: <User size={14} /> },
  ];

  return (
    <Modal isOpen onClose={onClose} title="World Architect" subtitle="Visual Development Environment" position="center" size="lg">
      <div className="space-y-6">
        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} variant="pill" size="sm" />

        <div className="grid grid-cols-3 gap-4">
           {/* Sidebar Controls */}
           <div className="col-span-1 space-y-4">
              <Section title="Toolbox" variant="default">
                 <div className="grid gap-2">
                    <EditorTool icon={<Move size={16} />} label="Translate" active />
                    <EditorTool icon={<Plus size={16} />} label="Create New" />
                    <EditorTool icon={<Layers size={16} />} label="Snapping" />
                 </div>
              </Section>

              <Section title="Library" variant="default">
                 <div className="bg-slate-900/60 rounded-2xl p-3 border border-slate-800 space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                    {activeTab === 'props' ? (
                       ['tree_large', 'rock_gray', 'building_a', 'lamppost', 'statue'].map(asset => (
                          <AssetItem key={asset} name={asset} />
                       ))
                    ) : (
                       ['poring', 'fabre', 'pupa', 'guard_npc', 'merchant_npc'].map(asset => (
                          <AssetItem key={asset} name={asset} />
                       ))
                    )}
                 </div>
              </Section>
           </div>

           {/* Main Element List */}
           <div className="col-span-2 space-y-4">
              <Card variant="glass" padding="md" rounded="2xl" className="h-[400px] flex flex-col">
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                       <IconBox icon={<Box size={16} />} size="sm" color="blue" rounded="sm" />
                       <Text variant="body" className="font-black text-white text-xs uppercase tracking-tight">Active Entities</Text>
                    </div>
                    <Badge variant="primary" size="xs">MAP: {currentMapId}</Badge>
                 </div>

                 <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                    <AnimatePresence mode="wait">
                       <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-1"
                       >
                          {[1, 2, 3, 4, 5].map(i => (
                             <div key={i} className="flex items-center justify-between p-2 rounded-xl border border-transparent hover:border-slate-700 hover:bg-white/5 transition-all group cursor-pointer">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-600">
                                      {activeTab === 'props' ? <Box size={14} /> : <Ghost size={14} />}
                                   </div>
                                   <div>
                                      <span className="text-[11px] font-black text-slate-300 block">{activeTab === 'props' ? 'decoration' : 'entity'}_{i}</span>
                                      <span className="text-[9px] text-slate-600 font-mono">X:{ (Math.random()*20).toFixed(1) } Z:{ (Math.random()*20).toFixed(1) }</span>
                                   </div>
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-red-400 transition-all">
                                   <Trash2 size={14} />
                                </button>
                             </div>
                          ))}
                       </motion.div>
                    </AnimatePresence>
                 </div>

                 <div className="mt-4 pt-4 border-t border-slate-800 flex gap-2">
                    <Button variant="primary" className="flex-1 h-12 rounded-xl shadow-blue-500/20" onClick={() => alert('Changes exported to JSON console.')}>
                       <Save size={18} className="mr-2" />
                       Sync to Server
                    </Button>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    </Modal>
  );
}

function AssetItem({ name }: { name: string }) {
  return (
    <button className="w-full text-left p-2 rounded-lg hover:bg-white/5 text-[10px] font-bold text-slate-500 hover:text-white transition-all truncate">
       {name.replace('_', ' ').toUpperCase()}
    </button>
  );
}

function EditorTool({ icon, label, active }: any) {
  return (
    <button className={cn(
      "w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
      active
        ? "bg-blue-600 border-blue-500 text-white shadow-lg"
        : "bg-slate-800/40 border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
    )}>
       {icon}
       <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
