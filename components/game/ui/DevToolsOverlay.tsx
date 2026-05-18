'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Search, Map as MapIcon, X, Settings2 } from 'lucide-react';
import { AdminConsole } from './AdminConsole';
import { EntityInspector } from './EntityInspector';
import { MapEditor } from './MapEditor';

export function DevToolsOverlay() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const tools = [
    { id: 'console', icon: Terminal, label: 'Console', color: 'bg-blue-600' },
    { id: 'inspector', icon: Search, label: 'Inspector', color: 'bg-emerald-600' },
    { id: 'editor', icon: MapIcon, label: 'Architect', color: 'bg-purple-600' },
  ];

  return (
    <div className="fixed top-1/2 -translate-y-1/2 left-4 z-[100] flex flex-col items-start gap-3 pointer-events-auto">
      <AnimatePresence>
        {isExpanded && tools.map((tool, index) => (
          <motion.button
            key={tool.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setActiveTool(tool.id)}
            className="group relative w-12 h-12 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-800 shadow-2xl flex items-center justify-center text-white hover:border-blue-500/50 transition-all cursor-pointer"
          >
            <tool.icon size={20} className="group-hover:scale-110 transition-transform" />
            <div className="absolute left-14 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
               {tool.label}
            </div>
          </motion.button>
        ))}
      </AnimatePresence>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-2xl cursor-pointer border-2",
          isExpanded
            ? "bg-red-600 border-red-500 text-white rotate-90"
            : "bg-slate-950 border-blue-500/50 text-blue-500 hover:bg-slate-900"
        )}
      >
        {isExpanded ? <X size={20} /> : <Settings2 size={20} />}
      </button>

      {activeTool === 'console' && <AdminConsole onClose={() => setActiveTool(null)} />}
      {activeTool === 'inspector' && <EntityInspector onClose={() => setActiveTool(null)} />}
      {activeTool === 'editor' && <MapEditor onClose={() => setActiveTool(null)} />}
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
