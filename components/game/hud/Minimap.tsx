'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useNetworkStore } from '@/store/useNetworkStore';
import { MapPin } from 'lucide-react';

export function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const position = useGameStore((state) => state.position);
  const currentMapId = useGameStore((state) => state.currentMapId);
  const currentMapData = useNetworkStore((state) => state.currentMapData);
  const enemies = useGameStore((state) => state.enemies);
  const remotePlayers = useNetworkStore((state) => state.remotePlayers);
  const [isExpanded, setIsExpanded] = useState(false);

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

    const bgColor = currentMapData.mapType === 'dungeon' ? '#0f0f1a' : currentMapData.mapType === 'field' ? '#1a2e14' : '#1a1a2e';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    const offsetX = (size - mapW * scale) / 2;
    const offsetY = (size - mapH * scale) / 2;

    ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(offsetX, offsetY, mapW * scale, mapH * scale);

    for (const zone of currentMapData.safeZones) {
      const cx = offsetX + (zone.center.x + mapW / 2) * scale;
      const cy = offsetY + (zone.center.z + mapH / 2) * scale;
      const r = zone.radius * scale;
      ctx.fillStyle = 'rgba(74, 222, 128, 0.08)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.2)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    for (const warp of currentMapData.warps) {
      const wx = offsetX + (warp.position.x + mapW / 2) * scale;
      const wy = offsetY + (warp.position.z + mapH / 2) * scale;
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(wx, wy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(168, 85, 247, 0.3)';
      ctx.beginPath();
      ctx.arc(wx, wy, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const enemy of Object.values(enemies)) {
      if (enemy.isDead) continue;
      const ex = offsetX + (enemy.position.x + mapW / 2) * scale;
      const ey = offsetY + (enemy.position.z + mapH / 2) * scale;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(ex, ey, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const rp of Object.values(remotePlayers)) {
      const rx = offsetX + (rp.x + mapW / 2) * scale;
      const ry = offsetY + (rp.z + mapH / 2) * scale;
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(rx, ry, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const px = offsetX + (position.x + mapW / 2) * scale;
    const py = offsetY + (position.z + mapH / 2) * scale;

    ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.stroke();
  }, [currentMapData, enemies, remotePlayers, position, currentMapId]);

  useEffect(() => {
    renderMinimap();
  }, [renderMinimap]);

  const size = isExpanded ? 140 : 100;

  return (
    <div className="pointer-events-auto select-none">
      <div
        className="rounded-xl overflow-hidden border-2 border-slate-600/40 shadow-lg shadow-black/40 bg-slate-900/90 backdrop-blur-sm cursor-pointer transition-all duration-300"
        style={{ width: size, height: size }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <canvas ref={canvasRef} width={100} height={100} className="w-full h-full" />
        <div className="absolute bottom-1 left-1 flex items-center gap-1 bg-black/60 rounded px-1.5 py-0.5">
          <MapPin size={8} className="text-slate-400" />
          <span className="text-[8px] text-slate-300 font-medium truncate max-w-[60px]">
            {currentMapData?.mapName ?? 'Unknown'}
          </span>
        </div>
      </div>
    </div>
  );
}
