'use client';

import React, { useState } from 'react';

export type IconType = 'item' | 'skill';
export type IconVariant = 'default' | 'green' | 'blue' | 'purple' | 'red' | 'yellow' | 'cyan' | 'amber';

const TYPE_COLORS: Record<string, IconVariant> = {
  usable: 'green',
  equip: 'purple',
  misc: 'default',
};

const VARIANT_CLASSES: Record<IconVariant, string> = {
  default: 'bg-slate-800 text-slate-400 border-slate-700',
  green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  purple: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  red: 'bg-red-500/15 text-red-400 border-red-500/30',
  yellow: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

interface GameIconProps {
  iconType: IconType;
  id: string;
  name: string;
  variant?: IconVariant;
  size?: number;
  className?: string;
}

export function getIconPath(iconType: IconType, id: string): string {
  const base = iconType === 'item' ? '/assets/items' : '/assets/skills';
  return `${base}/${id}.png`;
}

export function getItemVariant(itemType?: string): IconVariant {
  return TYPE_COLORS[itemType || ''] || 'default';
}

export function GameIcon({ iconType, id, name, variant, size = 24, className = '' }: GameIconProps) {
  const [hasError, setHasError] = useState(false);
  const path = getIconPath(iconType, id);
  const initial = name.charAt(0).toUpperCase();
  const v = variant || 'default';

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg font-black ${VARIANT_CLASSES[v]} border ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.45 }}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={path}
      alt={name}
      className={`object-contain rounded-lg ${className}`}
      style={{ width: size, height: size }}
      onError={() => setHasError(true)}
    />
  );
}
