'use client';

import React, { useRef, useCallback } from 'react';
import { touchInput } from '@/lib/touchInput';

const STICK_SIZE = 120;
const THUMB_SIZE = 44;

export function VirtualJoystick() {
  const stickRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const activeTouch = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - centerRef.current.x;
    const dy = clientY - centerRef.current.y;
    const maxDist = STICK_SIZE / 2 - THUMB_SIZE / 2;
    let dist = Math.sqrt(dx * dx + dy * dy);
    let clampX = dx;
    let clampY = dy;
    if (dist > maxDist) {
      clampX = (dx / dist) * maxDist;
      clampY = (dy / dist) * maxDist;
      dist = maxDist;
    }
    if (thumbRef.current) {
      thumbRef.current.style.transform = `translate(${clampX}px, ${clampY}px)`;
    }
    const normX = dist > 0 ? clampX / maxDist : 0;
    const normY = dist > 0 ? clampY / maxDist : 0;
    touchInput.x = normX;
    touchInput.z = -normY;
  }, []);

  const reset = useCallback(() => {
    touchInput.x = 0;
    touchInput.z = 0;
    if (thumbRef.current) {
      thumbRef.current.style.transform = 'translate(0px, 0px)';
    }
    activeTouch.current = null;
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (activeTouch.current !== null) return;
    const touch = e.changedTouches[0];
    activeTouch.current = touch.identifier;
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

  return (
    <div
      ref={stickRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={reset}
      style={{
        position: 'fixed',
        bottom: 100,
        left: 24,
        width: STICK_SIZE,
        height: STICK_SIZE,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        border: '2px solid rgba(255,255,255,0.15)',
        touchAction: 'none',
        zIndex: 50,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        ref={thumbRef}
        style={{
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.25)',
          border: '2px solid rgba(255,255,255,0.4)',
          transition: 'none',
        }}
      />
    </div>
  );
}
