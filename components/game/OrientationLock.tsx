'use client';

import React, { useEffect, useState } from 'react';

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
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-white text-center p-8">
      <div className="text-6xl mb-6 rotate-90">📱</div>
      <h2 className="text-2xl font-bold mb-4">Gira el dispositivo</h2>
      <p className="text-base text-slate-400 max-w-xs">
        Este juego está diseñado para modo vertical (retrato).
      </p>
    </div>
  );
}
