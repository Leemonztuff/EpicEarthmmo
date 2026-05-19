'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { PlayerFrame } from './hud/PlayerFrame';
import { TargetFrame } from './hud/TargetFrame';
import { Minimap } from './hud/Minimap';
import { Hotbar } from './hud/Hotbar';
import { MenuBar } from './hud/MenuBar';
import { CombatLog } from './hud/CombatLog';
import { SettingsPanel } from './hud/SettingsPanel';
import {
  StatsWindow,
  SkillsWindow,
  InventoryWindow,
  JobChangeWindow,
  EquipmentWindow,
  MapNameDisplay
} from './ui';
import { TradeManager } from './TradeManager';
import { ChatBox } from './ChatBox';
import { ToastContainer } from '@/components/ui';
import { ExpPopups } from './ExpPopups';
import { AnimatePresence, motion } from 'framer-motion';

export function HUD({ characterName }: { characterName?: string }) {
  const player = useGameStore((state) => state.player);
  const ui = useGameStore((state) => state.ui);
  const toggleUI = useGameStore((state) => state.toggleUI);

  const [chatOpen, setChatOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);

  const handleToggleChat = () => setChatOpen(prev => !prev);
  const handleOpenSettings = () => setSettingsOpen(true);
  const handleOpenEquipment = () => setEquipmentOpen(true);

  if (!player) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 w-full h-full flex flex-col overflow-hidden p-2 sm:p-4">
      <ToastContainer />
      <ExpPopups />
      <MapNameDisplay />

      <div className="flex items-start justify-between pointer-events-auto">
        <PlayerFrame />
        <Minimap />
      </div>

      <div className="mt-1 pointer-events-auto flex justify-center">
        <TargetFrame />
      </div>

      <div className="flex-1 relative w-full h-full">
        <AnimatePresence>
          {ui.isStatsOpen && <StatsWindow onClose={() => toggleUI('isStatsOpen')} />}
          {ui.isSkillsOpen && <SkillsWindow onClose={() => toggleUI('isSkillsOpen')} />}
          {ui.isInventoryOpen && <InventoryWindow onClose={() => toggleUI('isInventoryOpen')} />}
          {equipmentOpen && <EquipmentWindow onClose={() => setEquipmentOpen(false)} />}
          {player.jobClass === 'Novice' && player.jobLevel >= 10 && <JobChangeWindow />}
        </AnimatePresence>
        <TradeManager />
        {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div className="flex justify-start pointer-events-auto">
          <CombatLog />
        </div>

        <div className="flex items-end justify-between gap-2 sm:gap-4">
          <div className="pointer-events-auto self-end">
            <ChatBoxWrapper isOpen={chatOpen} onToggle={handleToggleChat} />
          </div>
          <div className="flex flex-col items-end gap-3 sm:gap-4 pointer-events-auto flex-1 min-w-0">
            <Hotbar />
            <MenuBar
              onToggleChat={handleToggleChat}
              onOpenSettings={handleOpenSettings}
              onOpenEquipment={handleOpenEquipment}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatBoxWrapper({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  if (!isOpen) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-950/40 backdrop-blur-md border border-slate-800/60 flex items-center justify-center text-blue-400 hover:text-blue-300 hover:bg-slate-900/60 transition-all shadow-2xl cursor-pointer"
      >
        <MessageSquareIcon size={20} />
      </motion.button>
    );
  }
  return (
     <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="pointer-events-auto w-full max-w-[300px]"
     >
        <ChatBox />
     </motion.div>
  );
}

function MessageSquareIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
