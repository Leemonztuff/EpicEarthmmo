'use client';

import React, { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { Save, Upload, Monitor, Volume2, Palette } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const saveProgress = useGameStore((state) => state.saveProgress);
  const loadProgress = useGameStore((state) => state.loadProgress);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    await saveProgress();
    setSaving(false);
    setMessage('Progress saved!');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleLoad = async () => {
    setLoading(true);
    setMessage('');
    await loadProgress();
    setLoading(false);
    setMessage('Progress loaded!');
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <BottomSheet title="Settings" onClose={onClose}>
      <div className="space-y-4">
        <section>
          <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-2">
            <Save size={16} className="text-blue-400" />
            Save / Load
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-blue-400 text-white rounded-lg font-medium text-sm touch-manipulation active:scale-95 transition-all"
            >
              {saving ? 'Saving...' : 'Save Progress'}
            </button>
            <button
              onClick={handleLoad}
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:text-emerald-400 text-white rounded-lg font-medium text-sm touch-manipulation active:scale-95 transition-all"
            >
              {loading ? 'Loading...' : 'Load Progress'}
            </button>
          </div>
          {message && <p className="text-green-400 text-xs mt-1 text-center">{message}</p>}
        </section>

        <section>
          <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-2">
            <Monitor size={16} className="text-slate-400" />
            Display
          </h3>
          <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-sm">Orientation</span>
              <span className="text-slate-500 text-xs">Portrait (9:16)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-sm">Safe Area</span>
              <span className="text-slate-500 text-xs">Enabled</span>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-2">
            <Volume2 size={16} className="text-slate-400" />
            Audio
          </h3>
          <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-sm">Music</span>
              <span className="text-slate-500 text-xs">Not implemented</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-sm">SFX</span>
              <span className="text-slate-500 text-xs">Not implemented</span>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-2">
            <Palette size={16} className="text-slate-400" />
            About
          </h3>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-slate-400 text-xs">EpicEarthMMO v0.1.0</p>
            <p className="text-slate-500 text-[10px] mt-1">A web-based multiplayer RPG built with Next.js, Three.js, and Socket.IO</p>
          </div>
        </section>
      </div>
    </BottomSheet>
  );
}
