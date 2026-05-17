'use client';

import React, { useRef, useCallback, useState } from 'react';
import { touchInput } from '@/lib/touchInput';

const STICK_SIZE = 130;
const THUMB_SIZE = 50;
const TRACK_SIZE = STICK_SIZE / 2 - THUMB_SIZE / 2;

export function VirtualJoystick() {
  const stickRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const activeTouch = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const [direction, setDirection] = useState({ x: 0, z: 0 });

  const updatePosition = useCallback((clientX: number, clientY: number) => {
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
    const rect = stickRef.current!.getBoundingClientRect();
    centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    updatePosition(touch.clientX, touch.clientY);
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
      style={{
        position: 'fixed',
        bottom: 150,
        left: 16,
        width: STICK_SIZE,
        height: STICK_SIZE,
        borderRadius: '50%',
        background: isActive ? 'rgba(15, 23, 42, 0.7)' : 'rgba(15, 23, 42, 0.4)',
        border: `2px solid ${isActive ? 'rgba(96, 165, 250, 0.5)' : 'rgba(100, 116, 139, 0.3)'}`,
        touchAction: 'none',
        zIndex: 50,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        boxShadow: isActive ? '0 0 20px rgba(59, 130, 246, 0.3), 0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.3)',
        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Directional indicators */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: isActive ? 0.3 : 0.15,
        transition: 'opacity 0.2s',
      }}>
        <div style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', color: '#94a3b8', fontSize: 10 }}>▲</div>
        <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', color: '#94a3b8', fontSize: 10 }}>▼</div>
        <div style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 10 }}>◀</div>
        <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 10 }}>▶</div>
      </div>

      {/* Active direction glow */}
      {isActive && intensity > 0.3 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: STICK_SIZE - 20,
          height: STICK_SIZE - 20,
          borderRadius: '50%',
          background: `conic-gradient(from ${angle + Math.PI}rad, transparent 0deg, rgba(59, 130, 246, ${intensity * 0.3}) 30deg, transparent 60deg)`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }} />
      )}

      <div
        ref={thumbRef}
        style={{
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          borderRadius: '50%',
          background: isActive
            ? 'radial-gradient(circle at 30% 30%, rgba(96, 165, 250, 0.6), rgba(59, 130, 246, 0.3))'
            : 'rgba(148, 163, 184, 0.25)',
          border: `2px solid ${isActive ? 'rgba(96, 165, 250, 0.6)' : 'rgba(148, 163, 184, 0.4)'}`,
          transition: 'none',
          boxShadow: isActive ? '0 0 12px rgba(59, 130, 246, 0.4), inset 0 0 8px rgba(255,255,255,0.1)' : 'none',
        }}
      />
    </div>
  );
}
