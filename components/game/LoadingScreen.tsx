'use client';

import React, { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui';

const tips = [
  'Tip: Attack enemies to gain EXP and level up!',
  'Tip: Allocate stat points to improve your character.',
  'Tip: Use the joystick to move around the map.',
  'Tip: Warps connect different areas of the world.',
  'Tip: Aggressive mobs will chase you if you get too close.',
  'Tip: Safe zones protect you from enemy attacks.',
  'Tip: Unlock skills to deal more damage.',
  'Tip: Collect loot from defeated enemies.',
];

export function LoadingScreen() {
  const [tip, setTip] = useState(tips[0]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setTip(tips[Math.floor(Math.random() * tips.length)]);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6 max-w-xs w-full px-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-900/50">
          <span className="text-white text-3xl font-black">EE</span>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-black text-white mb-1">EpicEarthMMO</h1>
          <p className="text-slate-500 text-xs">Loading your adventure...</p>
        </div>

        <div className="w-full space-y-2">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 text-[10px]">Initializing...</span>
            <span className="text-slate-600 text-[10px]">{Math.round(progress)}%</span>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/40">
          <p className="text-slate-400 text-xs text-center">{tip}</p>
        </div>

        <Spinner size="md" color="blue" />
      </div>
    </div>
  );
}
