import React, { useState, useEffect } from 'react';
import { cn } from '@/components/ui';

interface ExpPopup {
  id: string;
  amount: number;
  type: 'base' | 'job';
  timestamp: number;
}

const popups: ExpPopup[] = [];
let listeners: (() => void)[] = [];

export function showExpGain(amount: number, type: 'base' | 'job') {
  popups.push({ id: Date.now().toString() + Math.random(), amount, type, timestamp: Date.now() });
  if (popups.length > 5) popups.shift();
  listeners.forEach(fn => fn());
}

export function useExpPopups() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    listeners.push(fn);
    return () => { listeners = listeners.filter(l => l !== fn); };
  }, []);
  return popups;
}

export function ExpPopups() {
  const currentPopups = useExpPopups();
  const now = Date.now();
  const activePopups = currentPopups.filter(p => now - p.timestamp < 2000);

  if (activePopups.length === 0) return null;

  return (
    <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center gap-1">
      {activePopups.map(popup => {
        const age = (now - popup.timestamp) / 2000;
        const opacity = age < 0.5 ? 1 : 1 - (age - 0.5) * 2;
        const translateY = -age * 40;

        return (
          <div
            key={popup.id}
            className={cn(
              'text-center font-black drop-shadow-lg transition-none',
              popup.type === 'base' ? 'text-yellow-400' : 'text-purple-400'
            )}
            style={{
              opacity,
              transform: `translateY(${translateY}px)`,
              fontSize: popup.amount > 50 ? '1.5rem' : '1.1rem',
              textShadow: popup.type === 'base'
                ? '0 0 10px rgba(250, 204, 21, 0.5), 0 2px 4px rgba(0,0,0,0.8)'
                : '0 0 10px rgba(192, 132, 252, 0.5), 0 2px 4px rgba(0,0,0,0.8)',
            }}
          >
            +{popup.amount} {popup.type === 'base' ? 'EXP' : 'Job EXP'}
          </div>
        );
      })}
    </div>
  );
}
