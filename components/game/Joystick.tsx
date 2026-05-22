'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { touchInput } from '@/lib/touchInput';

const BASE_SIZE = 130;
const THUMB_SIZE = 52;
const MAX_RADIUS = 42;
const DEAD_ZONE = 10;

export function Joystick() {
  const baseRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const [thumbOffset, setThumbOffset] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setVisible(isTouch);
  }, []);

  const getPosition = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - centerRef.current.x;
    const dy = clientY - centerRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < DEAD_ZONE) {
      return { thumbX: 0, thumbY: 0, nx: 0, ny: 0 };
    }

    const clampedDist = Math.min(dist, MAX_RADIUS);
    const ratio = clampedDist / dist;
    const nx = dx / MAX_RADIUS;
    const ny = dy / MAX_RADIUS;

    return {
      thumbX: dx * ratio,
      thumbY: dy * ratio,
      nx: Math.max(-1, Math.min(1, nx)),
      ny: Math.max(-1, Math.min(1, ny)),
    };
  }, []);

  const updateJoystick = useCallback((clientX: number, clientY: number) => {
    const pos = getPosition(clientX, clientY);
    setThumbOffset({ x: pos.thumbX, y: pos.thumbY });
    touchInput.x = pos.nx;
    touchInput.z = -pos.ny;
  }, [getPosition]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;

    const rect = baseRef.current?.getBoundingClientRect();
    if (rect) {
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }

    setActive(true);
    updateJoystick(touch.clientX, touch.clientY);
  }, [updateJoystick]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = Array.from(e.changedTouches).find(t => t.identifier === touchIdRef.current);
    if (!touch) return;
    updateJoystick(touch.clientX, touch.clientY);
  }, [updateJoystick]);

  const handleTouchEnd = useCallback((_e: React.TouchEvent) => {
    touchIdRef.current = null;
    setActive(false);
    setThumbOffset({ x: 0, y: 0 });
    touchInput.x = 0;
    touchInput.z = 0;
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={baseRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="fixed pointer-events-auto touch-none select-none"
      style={{
        width: BASE_SIZE,
        height: BASE_SIZE,
        left: `calc(env(safe-area-inset-left, 0px) + 12px)`,
        bottom: `calc(env(safe-area-inset-bottom, 0px) + 12px)`,
      }}
    >
      {/* Base ring */}
      <div
        className={`absolute inset-0 rounded-full transition-opacity duration-200 ${active ? 'opacity-40' : 'opacity-20'}`}
        style={{
          background: 'radial-gradient(circle, rgba(125,162,200,0.25) 0%, rgba(75,109,147,0.08) 60%, transparent 100%)',
          border: '2px solid rgba(125, 162, 200, 0.45)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          boxShadow: active ? '0 0 15px rgba(92, 134, 180, 0.3)' : 'none',
        }}
      />

      {/* Tick marks at cardinal directions */}
      {[
        { angle: 0, label: '↑' },
        { angle: 90, label: '→' },
        { angle: 180, label: '↓' },
        { angle: 270, label: '←' },
      ].map(({ angle }) => {
        const rad = (angle * Math.PI) / 180;
        const r = 20;
        return (
          <div
            key={angle}
            className="absolute text-slate-300/40 text-[9px] font-black"
            style={{
              left: `calc(50% + ${Math.sin(rad) * r}px - 4px)`,
              top: `calc(50% - ${Math.cos(rad) * r}px - 5px)`,
              width: 8,
              height: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {angle === 0 ? '↑' : angle === 90 ? '→' : angle === 180 ? '↓' : '←'}
          </div>
        );
      })}

      {/* Thumb */}
      <div
        className={`absolute rounded-full transition-[width,height,opacity] duration-150 ${active ? 'opacity-65' : 'opacity-35'}`}
        style={{
          width: active ? THUMB_SIZE + 4 : THUMB_SIZE,
          height: active ? THUMB_SIZE + 4 : THUMB_SIZE,
          left: `calc(50% - ${(active ? THUMB_SIZE + 4 : THUMB_SIZE) / 2}px + ${thumbOffset.x}px)`,
          top: `calc(50% - ${(active ? THUMB_SIZE + 4 : THUMB_SIZE) / 2}px + ${thumbOffset.y}px)`,
          background: active
            ? 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(92, 134, 180, 0.5) 100%)'
            : 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(75, 109, 147, 0.25) 100%)',
          border: active ? '2.5px solid rgba(255, 255, 255, 0.7)' : '2px solid rgba(125, 162, 200, 0.5)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          boxShadow: active 
            ? '0 0 16px rgba(125, 162, 200, 0.4), inset 0 2px 4px rgba(255,255,255,0.5)' 
            : 'inset 0 1px 2px rgba(255,255,255,0.2)',
        }}
      />
    </div>
  );
}
