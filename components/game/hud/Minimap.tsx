'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useNetworkStore } from '@/store/useNetworkStore';

export function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const position = useGameStore((state) => state.position);
  const currentMapId = useGameStore((state) => state.currentMapId);
  const currentMapData = useNetworkStore((state) => state.currentMapData);
  const enemies = useGameStore((state) => state.enemies);
  const remotePlayers = useNetworkStore((state) => state.remotePlayers);

  const renderMinimap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentMapData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const mapW = currentMapData.dimensions.width;
    const mapH = currentMapData.dimensions.height;
    const scale = size / Math.max(mapW, mapH);

    ctx.clearRect(0, 0, size, size);

    ctx.fillStyle = currentMapData.mapType === 'dungeon' ? '#1a1a2e' : currentMapData.mapType === 'field' ? '#2d4a1e' : '#3a3a3a';
    ctx.fillRect(0, 0, size, size);

    const offsetX = (size - mapW * scale) / 2;
    const offsetY = (size - mapH * scale) / 2;

    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(offsetX, offsetY, mapW * scale, mapH * scale);

    for (const zone of currentMapData.safeZones) {
      const cx = offsetX + (zone.center.x + mapW / 2) * scale;
      const cy = offsetY + (zone.center.z + mapH / 2) * scale;
      const r = zone.radius * scale;
      ctx.fillStyle = 'rgba(74, 222, 128, 0.15)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const warp of currentMapData.warps) {
      const wx = offsetX + (warp.position.x + mapW / 2) * scale;
      const wy = offsetY + (warp.position.z + mapH / 2) * scale;
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(wx, wy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c084fc';
      ctx.font = '6px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(warp.name, wx, wy - 5);
    }

    for (const enemy of Object.values(enemies)) {
      if (enemy.isDead) continue;
      const ex = offsetX + (enemy.position.x + mapW / 2) * scale;
      const ey = offsetY + (enemy.position.z + mapH / 2) * scale;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(ex, ey, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const rp of Object.values(remotePlayers)) {
      const rx = offsetX + (rp.x + mapW / 2) * scale;
      const ry = offsetY + (rp.z + mapH / 2) * scale;
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const px = offsetX + (position.x + mapW / 2) * scale;
    const py = offsetY + (position.z + mapH / 2) * scale;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.stroke();
  }, [currentMapData, enemies, remotePlayers, position, currentMapId]);

  useEffect(() => {
    renderMinimap();
  }, [renderMinimap]);

  return (
    <div className="pointer-events-auto select-none">
      <div className="w-[100px] h-[100px] rounded-lg overflow-hidden border-2 border-slate-600/60 shadow-lg shadow-black/40 bg-slate-900/90">
        <canvas ref={canvasRef} width={100} height={100} className="w-full h-full" />
      </div>
    </div>
  );
}
