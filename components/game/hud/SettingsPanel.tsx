'use client';

import React, { useState } from 'react';
import { Modal, Button, Section, Text, IconBox, Badge } from '@/components/ui';
import { useGameStore } from '@/store/useGameStore';
import { Save, Monitor, Volume2, Palette, ShieldCheck, Download, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const saveProgress = useGameStore((state) => state.saveProgress);
  const loadProgress = useGameStore((state) => state.loadProgress);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });

  const handleSave = async () => {
    setSaving(true);
    setStatus({ type: '', msg: '' });
    await saveProgress();
    setSaving(false);
    setStatus({ type: 'success', msg: 'Data Synced' });
    setTimeout(() => setStatus({ type: '', msg: '' }), 3000);
  };

  const handleLoad = async () => {
    setLoading(true);
    setStatus({ type: '', msg: '' });
    await loadProgress();
    setLoading(false);
    setStatus({ type: 'success', msg: 'Data Restored' });
    setTimeout(() => setStatus({ type: '', msg: '' }), 3000);
  };

  return (
    <Modal isOpen onClose={onClose} title="System Configuration" position="bottom" size="md">
      <div className="space-y-6">
        {/* Save/Load Section */}
        <div className="bg-slate-900/50 rounded-3xl p-5 border border-slate-800 shadow-inner">
           <div className="flex items-center gap-3 mb-4">
              <IconBox icon={<ShieldCheck size={18} />} color="blue" size="sm" rounded="sm" />
              <div className="flex-1">
                 <h4 className="text-white font-black text-sm uppercase tracking-tight">Cloud Synchronization</h4>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Backup your hero data</p>
              </div>
              {status.msg && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <Badge variant="success" size="xs">{status.msg}</Badge>
                </motion.div>
              )}
           </div>

           <div className="flex gap-3">
            <Button
              variant="primary"
              size="md"
              disabled={saving}
              onClick={handleSave}
              className="flex-1 rounded-xl h-12"
            >
              <Save size={18} className="mr-2" />
              {saving ? 'Syncing...' : 'Sync Cloud'}
            </Button>
            <Button
              variant="secondary"
              size="md"
              disabled={loading}
              onClick={handleLoad}
              className="flex-1 rounded-xl h-12"
            >
              <Download size={18} className="mr-2" />
              {loading ? 'Restoring...' : 'Restore'}
            </Button>
          </div>
        </div>

        {/* Display Settings */}
        <Section title="Interface & Display" icon={<Monitor size={16} className="text-blue-400" />} variant="default">
          <div className="grid gap-2">
             <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-2xl border border-slate-700/30">
                <Text variant="body" className="font-bold text-slate-300">Orientation Lock</Text>
                <Badge variant="primary" size="sm">Landscape</Badge>
             </div>
             <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-2xl border border-slate-700/30">
                <Text variant="body" className="font-bold text-slate-300">Safe Area Insets</Text>
                <Badge variant="success" size="sm">Active</Badge>
             </div>
          </div>
        </Section>

        {/* Info / About */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
           <div className="flex items-center gap-3">
              <IconBox icon={<Palette size={16} />} size="sm" color="default" rounded="sm" />
              <div>
                 <Text variant="body" className="text-white font-black text-xs uppercase tracking-tight">EpicEarthMMO</Text>
                 <Text variant="caption" className="text-slate-500 font-bold">Version 1.0.4-PRO</Text>
              </div>
           </div>
           <Button variant="ghost" size="sm" className="text-blue-400 font-black tracking-widest uppercase text-[10px]">
              Docs <ExternalLink size={12} className="ml-1" />
           </Button>
        </div>
      </div>
    </Modal>
  );
}
