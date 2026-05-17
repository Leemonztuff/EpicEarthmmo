import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { gameData } from '@/shared/loader';
import { Modal, Button, Text } from '@/components/ui';

const { jobs } = gameData;
const availableJobs = jobs.filter(j => j.requirements);

export function JobChangeWindow() {
  const changeJob = useGameStore(state => state.changeJob);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <Modal isOpen onClose={() => setDismissed(true)} title="Job Change" subtitle="You've reached Job Level 10!">
      <div className="text-center mb-4">
        <Text variant="body">Congratulations! Choose your new class:</Text>
      </div>
      <div className="space-y-2">
        {availableJobs.map(job => (
          <Button
            key={job.id}
            variant="primary"
            size="lg"
            onClick={() => { changeJob(job.id); setDismissed(true); }}
            className="w-full"
          >
            {job.name}
          </Button>
        ))}
      </div>
    </Modal>
  );
}
