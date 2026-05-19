'use client';

import React, { useRef, useCallback, useState } from 'react';
import { touchInput } from '@/lib/touchInput';
import { motion } from 'framer-motion';

const STICK_SIZE = 140;
const THUMB_SIZE = 60;
const TRACK_SIZE = STICK_SIZE / 2 - THUMB_SIZE / 2;

export function VirtualJoystick() {
  const stickRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const activeTouch = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const [direction, setDirection] = useState({ x: 0, z: 0 });

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    if (!centerRef.current.x) return;

    const dx = clientX - centerRef.current.x;
    const dy = clientY - centerRef.current.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    let clampX = dx;
    let clampY = dy;

    if (dist > TRACK_SIZE) {
      clampX = (dx / dist) * TRACK_SIZE;
      clampY = (dy / dist) * TRACK_SIZE;
      dist = TRACK_SIZE;
    }

    if (thumbRef.current) {
      thumbRef.current.style.transform = `translate(${clampX}px, ${clampY}px)`;
    }

    const normX = dist > 0 ? clampX / TRACK_SIZE : 0;
    const normY = dist > 0 ? clampY / TRACK_SIZE : 0;

    touchInput.x = normX;
    touchInput.z = -normY;
    setDirection({ x: normX, z: normY });
  }, []);

  const reset = useCallback(() => {
    touchInput.x = 0;
    touchInput.z = 0;
    if (thumbRef.current) {
      thumbRef.current.style.transform = 'translate(0px, 0px)';
    }
    activeTouch.current = null;
    setIsActive(false);
    setDirection({ x: 0, z: 0 });
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (activeTouch.current !== null) return;
    const touch = e.changedTouches[0];
    activeTouch.current = touch.identifier;
    setIsActive(true);

    if (stickRef.current) {
      const rect = stickRef.current.getBoundingClientRect();
      centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      updatePosition(touch.clientX, touch.clientY);
    }
  }, [updatePosition]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouch.current) {
        updatePosition(touch.clientX, touch.clientY);
        break;
      }
    }
  }, [updatePosition]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouch.current) {
        reset();
        break;
      }
    }
  }, [reset]);

  const angle = Math.atan2(direction.z, direction.x);
  const intensity = Math.sqrt(direction.x * direction.x + direction.z * direction.z);

  return (
    <div
      ref={stickRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={reset}
      className="fixed bottom-[180px] left-6 z-[60] pointer-events-auto touch-none select-none safe-pl safe-pb"
      style={{
        width: STICK_SIZE,
        height: STICK_SIZE,
      }}
    >
      <motion.div
        animate={{
          scale: isActive ? 1.05 : 1,
          backgroundColor: isActive ? 'rgba(15, 23, 42, 0.4)' : 'rgba(15, 23, 42, 0.2)',
          borderColor: isActive ? 'rgba(96, 165, 250, 0.4)' : 'rgba(148, 163, 184, 0.1)'
        }}
        className="w-full h-full rounded-full border-2 backdrop-blur-[4px] flex items-center justify-center relative shadow-2xl transition-colors duration-300"
      >
        {/* Directional indicators */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="absolute top-2 text-[10px] text-slate-400">▲</div>
          <div className="absolute bottom-2 text-[10px] text-slate-400">▼</div>
          <div className="absolute left-2 text-[10px] text-slate-400">◀</div>
          <div className="absolute right-2 text-[10px] text-slate-400">▶</div>

          <div className="w-[1px] h-full bg-slate-400/20 absolute" />
          <div className="h-[1px] w-full bg-slate-400/20 absolute" />
        </div>

        {/* Active direction glow */}
        {isActive && intensity > 0.1 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: STICK_SIZE - 20,
              height: STICK_SIZE - 20,
              borderRadius: '50%',
              background: `conic-gradient(from ${angle + Math.PI}rad, transparent 0deg, rgba(59, 130, 246, ${intensity * 0.4}) 30deg, transparent 60deg)`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          />
        )}

        <div
          ref={thumbRef}
          className="rounded-full shadow-lg border-2 transition-transform duration-75"
          style={{
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            background: isActive
              ? 'radial-gradient(circle at 30% 30%, rgba(96, 165, 250, 0.8), rgba(59, 130, 246, 0.5))'
              : 'rgba(148, 163, 184, 0.15)',
            borderColor: isActive ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)',
            boxShadow: isActive ? '0 0 20px rgba(59, 130, 246, 0.5)' : 'none',
          }}
        />
      </motion.div>
    </div>
  );
}
