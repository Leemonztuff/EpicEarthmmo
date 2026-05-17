'use client';

import React, { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';

export function OrientationLock() {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const check = () => {
      if (typeof window === 'undefined') return;
      const isLand = window.innerWidth > window.innerHeight;
      setIsLandscape(isLand);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!isLandscape) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center text-white text-center p-8">
      <div className="w-20 h-20 rounded-2xl bg-slate-700/50 border-2 border-slate-600 flex items-center justify-center mb-6 animate-pulse">
        <RotateCcw size={32} className="text-blue-400 -rotate-90" />
      </div>
      <h2 className="text-xl font-bold mb-2">Rotate Device</h2>
      <p className="text-sm text-slate-400 max-w-[200px]">
        This game is designed for portrait mode. Please rotate your device.
      </p>
      <div className="mt-8 flex items-center gap-2 text-slate-600">
        <div className="w-8 h-14 rounded-lg border-2 border-slate-600 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
