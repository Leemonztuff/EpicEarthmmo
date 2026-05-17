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
import { StatsWindow } from './ui/StatsWindow';
import { SkillsWindow } from './ui/SkillsWindow';
import { InventoryWindow } from './ui/InventoryWindow';
import { JobChangeWindow } from './ui/JobChangeWindow';
import { TradeManager } from './TradeManager';
import { MapNameDisplay } from './ui/MapNameDisplay';
import { ChatBox } from './ChatBox';
import { ToastContainer } from '@/components/ui';
import { LoadingScreen } from './LoadingScreen';

export function HUD() {
  const player = useGameStore((state) => state.player);
  const ui = useGameStore((state) => state.ui);
  const toggleUI = useGameStore((state) => state.toggleUI);
  const [chatOpen, setChatOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleToggleChat = () => setChatOpen(prev => !prev);
  const handleOpenSettings = () => setSettingsOpen(true);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10 w-full h-full flex flex-col">
      <ToastContainer />
      <MapNameDisplay />

      <div className="flex items-start justify-between px-3 pt-2 pointer-events-auto">
        <div className="flex items-start gap-2">
          <PlayerFrame />
        </div>
        <Minimap />
      </div>

      <div className="px-3 pt-1 pointer-events-auto">
        <TargetFrame />
      </div>

      <div className="flex-1 relative w-full h-full">
        {ui.isStatsOpen && <StatsWindow onClose={() => toggleUI('isStatsOpen')} />}
        {ui.isSkillsOpen && <SkillsWindow onClose={() => toggleUI('isSkillsOpen')} />}
        {ui.isInventoryOpen && <InventoryWindow onClose={() => toggleUI('isInventoryOpen')} />}
        {player.jobClass === 'Novice' && player.jobLevel >= 10 && <JobChangeWindow />}
        <TradeManager />
        {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      </div>

      <div className="px-3 pb-3 space-y-2">
        <div className="flex justify-start pointer-events-auto">
          <CombatLog />
        </div>

        <div className="flex items-end justify-between">
          <div className="pointer-events-auto">
            <ChatBoxWrapper isOpen={chatOpen} onToggle={handleToggleChat} />
          </div>
          <div className="flex flex-col items-end gap-2">
            <Hotbar />
            <MenuBar onToggleChat={handleToggleChat} onOpenSettings={handleOpenSettings} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatBoxWrapper({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800/80 touch-manipulation active:scale-95 transition-all shadow-lg"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }
  return <ChatBox />;
}
