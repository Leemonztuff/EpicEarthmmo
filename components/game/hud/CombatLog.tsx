'use client';

import React, { useRef, useEffect, useState } from 'react';

interface LogEntry {
  id: string;
  text: string;
  color: string;
  timestamp: number;
}

const logEntries: LogEntry[] = [];
let listeners: (() => void)[] = [];

export function addCombatLog(text: string, color: string = 'text-slate-300') {
  logEntries.push({ id: Date.now().toString() + Math.random(), text, color, timestamp: Date.now() });
  if (logEntries.length > 50) logEntries.shift();
  listeners.forEach(fn => fn());
}

export function useCombatLog() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    listeners.push(fn);
    return () => { listeners = listeners.filter(l => l !== fn); };
  }, []);
  return logEntries;
}

export function CombatLog() {
  const entries = useCombatLog();
  const containerRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries.length]);

  const recentEntries = entries.slice(-8);

  return (
    <div className="pointer-events-auto select-none">
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="w-8 h-8 rounded-lg bg-slate-900/70 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white touch-manipulation active:scale-95 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      ) : (
        <div className="w-[200px] sm:w-[260px]">
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden shadow-lg">
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-700/40">
              <span className="text-white text-xs font-bold">Combat Log</span>
              <button
                onClick={() => setCollapsed(true)}
                className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white touch-manipulation active:scale-95"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            </div>
            <div ref={containerRef} className="h-[80px] overflow-y-auto px-2 py-1 space-y-0.5">
              {recentEntries.map(entry => (
                <div key={entry.id} className={`text-[10px] leading-tight ${entry.color}`}>
                  {entry.text}
                </div>
              ))}
              {recentEntries.length === 0 && (
                <div className="text-[10px] text-slate-500 italic">No combat events yet</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
