'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { User, Backpack, Swords, Settings, MessageSquare, Shield, Maximize, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';

interface MenuBarProps {
  onToggleChat: () => void;
  onOpenSettings: () => void;
  onOpenEquipment: () => void;
}

export function MenuBar({ onToggleChat, onOpenSettings, onOpenEquipment }: MenuBarProps) {
  const ui = useGameStore((state) => state.ui);
  const toggleUI = useGameStore((state) => state.toggleUI);
  const [expanded, setExpanded] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const menuItems = [
    { id: 'isStatsOpen', label: 'Character', icon: User, onClick: () => toggleUI('isStatsOpen'), active: ui.isStatsOpen, color: 'amber' },
    { id: 'isInventoryOpen', label: 'Inventory', icon: Backpack, onClick: () => toggleUI('isInventoryOpen'), active: ui.isInventoryOpen, color: 'emerald' },
    { id: 'isSkillsOpen', label: 'Skills', icon: Swords, onClick: () => toggleUI('isSkillsOpen'), active: ui.isSkillsOpen, color: 'purple' },
    { id: 'equipment', label: 'Equipment', icon: Shield, onClick: onOpenEquipment, active: false, color: 'cyan' },
    { id: 'chat', label: 'Chat', icon: MessageSquare, onClick: onToggleChat, active: false, color: 'blue' },
    { id: 'fullscreen', label: 'Fullscreen', icon: Maximize, onClick: toggleFullscreen, active: false, color: 'slate' },
    { id: 'settings', label: 'Settings', icon: Settings, onClick: onOpenSettings, active: false, color: 'slate' },
  ];

  const activeBg: Record<string, string> = {
    blue: 'bg-blue-500/25 border-blue-400 text-blue-400',
    amber: 'bg-amber-500/25 border-amber-400 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.25)]',
    emerald: 'bg-emerald-500/25 border-emerald-400 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.25)]',
    purple: 'bg-purple-500/25 border-purple-400 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.25)]',
    cyan: 'bg-cyan-500/25 border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.25)]',
    slate: 'bg-slate-500/25 border-slate-400 text-slate-400',
  };

  return (
    <div className="pointer-events-auto select-none safe-pr flex items-center justify-end">
      <div className="relative flex items-center">
        
        {/* Expanded Tray - Slides out horizontally to the left */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 250 }}
              className="flex items-center gap-1.5 p-1.5 pr-3 mr-2 ro-window-panel rounded-2xl border border-slate-700/50 shadow-2xl bg-slate-950/80 backdrop-blur-md"
            >
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      item.onClick();
                      // Auto-collapse on mobile screens for better UX
                      if (window.innerWidth < 768) {
                        setExpanded(false);
                      }
                    }}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-200 cursor-pointer relative",
                      item.active
                        ? activeBg[item.color]
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 active:bg-slate-800"
                    )}
                    title={item.label}
                  >
                    <Icon size={18} />
                    
                    {/* Small active dot indicators */}
                    {item.active && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-current" />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Master Collapsible Menu Button (Styled as iconic RO Kafra menu trigger) */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "w-11 h-11 rounded-full flex items-center justify-center border shadow-2xl cursor-pointer relative z-10 transition-all duration-300",
            expanded
              ? "bg-red-600 border-red-400 text-white hover:bg-red-500"
              : "ro-window-header border-slate-600 hover:brightness-110 text-white"
          )}
          title="Game Menu"
        >
          {expanded ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
        </motion.button>
      </div>
    </div>
  );
}
