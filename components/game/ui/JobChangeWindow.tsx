'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { gameData } from '@/shared/loader';
import { Modal, Button, Text, IconBox, Badge } from '@/components/ui';
import { Sparkles, Sword, Shield, Zap, Target, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const { jobs } = gameData;
const availableJobs = jobs.filter(j => j.requirements);

const jobIcons: Record<string, any> = {
  swordsman: { icon: Sword, color: 'red' },
  mage: { icon: Zap, color: 'blue' },
  archer: { icon: Target, color: 'green' },
  thief: { icon: Star, color: 'purple' },
  acolyte: { icon: Sparkles, color: 'yellow' },
  merchant: { icon: Shield, color: 'amber' },
};

export function JobChangeWindow() {
  const changeJob = useGameStore(state => state.changeJob);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <Modal
      isOpen
      onClose={() => setDismissed(true)}
      title="Ascension Available"
      subtitle="The path to greatness lies ahead"
      position="center"
      size="md"
    >
      <div className="space-y-6">
        <div className="relative py-4 flex flex-col items-center">
           <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full" />
           <motion.div
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="relative z-10"
           >
              <IconBox icon={<Sparkles size={40} className="text-amber-400" />} color="yellow" size="xl" rounded="lg" />
           </motion.div>
           <Text variant="subheading" className="mt-4 text-center font-black text-xl text-white">Choose Your Destiny</Text>
           <Text variant="caption" className="text-center text-slate-400 mt-1">You have reached Job Level 10 and are ready to specialize.</Text>
        </div>

        <div className="grid gap-3">
          {availableJobs.map((job, index) => {
            const config = jobIcons[job.id.toLowerCase()] || { icon: Sparkles, color: 'default' };
            const Icon = config.icon;

            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  onClick={() => { changeJob(job.id); setDismissed(true); }}
                  className="w-full group relative overflow-hidden flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-700/50 hover:border-blue-500/50 transition-all text-left active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <IconBox icon={<Icon size={24} />} color={config.color} size="lg" rounded="md" className="group-hover:scale-110 transition-transform" />

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                       <Text variant="body" className="font-black text-white text-lg">{job.name}</Text>
                       <Badge variant="primary" size="xs">Recommended</Badge>
                    </div>
                    <Text variant="caption" className="text-slate-500 group-hover:text-slate-400 transition-colors">Start your journey as a specialized {job.name}.</Text>
                  </div>

                  <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-600 group-hover:text-blue-400 group-hover:bg-blue-900/20 transition-all">
                    <Sparkles size={18} />
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="md"
          onClick={() => setDismissed(true)}
          className="w-full text-slate-500 hover:text-slate-300"
        >
          Decide Later
        </Button>
      </div>
    </Modal>
  );
}
