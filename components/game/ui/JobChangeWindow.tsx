import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { gameData } from '@/shared/loader';
import { BottomSheet } from '../hud/BottomSheet';

const { jobs } = gameData;
const availableJobs = jobs.filter(j => j.requirements);

export function JobChangeWindow() {
  const changeJob = useGameStore(state => state.changeJob);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <BottomSheet title="Job Change" onClose={() => setDismissed(true)} subtitle="You've reached Job Level 10!">
      <div className="text-center mb-4">
        <p className="text-slate-300 text-sm">Congratulations! Choose your new class:</p>
      </div>
      <div className="space-y-2">
        {availableJobs.map(job => (
          <button
            key={job.id}
            onClick={() => { changeJob(job.id); setDismissed(true); }}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl touch-manipulation active:scale-95 transition-all shadow-lg shadow-blue-900/30"
          >
            {job.name}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
