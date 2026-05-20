import React, { useEffect, useState } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';

interface ActiveBuff {
  id: string;
  buffId: string;
  stacks: number;
  expiresAt: number;
  isDebuff: boolean;
  icon?: string;
  color: string;
}

function BuffIcon({ buff, index, now }: { buff: ActiveBuff; index: number; now: number }) {
  const remaining = Math.max(0, (buff.expiresAt || 0) - now);
  const duration = 10000;
  const progress = duration > 0 ? remaining / duration : 0;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: `${60 + index * 40}px`,
        left: '10px',
        width: 32,
        height: 32,
        borderRadius: 4,
        border: `2px solid ${buff.isDebuff ? '#ff4444' : '#44ff44'}`,
        backgroundColor: buff.color || '#888888',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        color: 'white',
        fontWeight: 'bold',
      }}
    >
      {buff.stacks > 1 ? buff.stacks : ''}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${Math.max(0, Math.min(100, progress * 100))}%`,
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderRadius: '0 0 2px 2px',
        }}
      />
    </div>
  );
}

export function BuffOverlay() {
  const socket = useNetworkStore((s) => s.socket);
  const [buffs, setBuffs] = useState<ActiveBuff[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!socket) return;

    const handleBuffsUpdate = (data: ActiveBuff[]) => {
      setBuffs(data);
    };

    socket.on('buffsUpdate', handleBuffsUpdate);

    return () => {
      socket.off('buffsUpdate', handleBuffsUpdate);
    };
  }, [socket]);

  useEffect(() => {
    const interval = setInterval(() => {
      const t = Date.now();
      setNow(t);
      setBuffs(prev => prev.filter(b => b.expiresAt > t));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  if (buffs.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      {buffs.map((buff, i) => (
        <BuffIcon key={buff.id} buff={buff} index={i} now={now} />
      ))}
    </div>
  );
}
