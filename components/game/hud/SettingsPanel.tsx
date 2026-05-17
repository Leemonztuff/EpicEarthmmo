'use client';

import React, { useState } from 'react';
import { Modal, Button, Section, Text } from '@/components/ui';
import { useGameStore } from '@/store/useGameStore';
import { Save, Monitor, Volume2, Palette } from 'lucide-react';

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
    <Modal isOpen onClose={onClose} title="Settings">
      <div className="space-y-4">
        <Section title="Save / Load" icon={<Save size={16} className="text-blue-400" />} variant="card">
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="md"
              disabled={saving}
              onClick={handleSave}
              className="flex-1"
            >
              {saving ? 'Saving...' : 'Save Progress'}
            </Button>
            <Button
              variant="success"
              size="md"
              disabled={loading}
              onClick={handleLoad}
              className="flex-1"
            >
              {loading ? 'Loading...' : 'Load Progress'}
            </Button>
          </div>
          {message && <Text variant="success" className="text-center mt-1">{message}</Text>}
        </Section>

        <Section title="Display" icon={<Monitor size={16} className="text-slate-400" />} variant="card">
          <div className="flex items-center justify-between">
            <Text variant="body">Orientation</Text>
            <Text variant="caption">Portrait (9:16)</Text>
          </div>
          <div className="flex items-center justify-between">
            <Text variant="body">Safe Area</Text>
            <Text variant="caption">Enabled</Text>
          </div>
        </Section>

        <Section title="Audio" icon={<Volume2 size={16} className="text-slate-400" />} variant="card">
          <div className="flex items-center justify-between">
            <Text variant="body">Music</Text>
            <Text variant="caption">Not implemented</Text>
          </div>
          <div className="flex items-center justify-between">
            <Text variant="body">SFX</Text>
            <Text variant="caption">Not implemented</Text>
          </div>
        </Section>

        <Section title="About" icon={<Palette size={16} className="text-slate-400" />} variant="card">
          <Text variant="bodySm">EpicEarthMMO v0.1.0</Text>
          <Text variant="caption" className="mt-1">
            A web-based multiplayer RPG built with Next.js, Three.js, and Socket.IO
          </Text>
        </Section>
      </div>
    </Modal>
  );
}
