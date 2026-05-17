import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Modal, IconBox, Text, Button, Section, Badge } from '@/components/ui';
import { Dumbbell, Wind, Heart, Brain, Crosshair, Clover } from 'lucide-react';

const statConfig = [
  { key: 'str' as const, icon: Dumbbell, label: 'STR', desc: 'Physical damage', color: 'red' as const },
  { key: 'agi' as const, icon: Wind, label: 'AGI', desc: 'Attack speed & flee', color: 'cyan' as const },
  { key: 'vit' as const, icon: Heart, label: 'VIT', desc: 'Defense & HP', color: 'green' as const },
  { key: 'int' as const, icon: Brain, label: 'INT', desc: 'Magic damage & SP', color: 'blue' as const },
  { key: 'dex' as const, icon: Crosshair, label: 'DEX', desc: 'Accuracy & cast time', color: 'yellow' as const },
  { key: 'luk' as const, icon: Clover, label: 'LUK', desc: 'Critical & luck', color: 'purple' as const },
];

export function StatsWindow({ onClose }: { onClose: () => void }) {
  const player = useGameStore((state) => state.player);
  const allocateStat = useGameStore((state) => state.allocateStat);

  return (
    <Modal isOpen onClose={onClose} title="Status" subtitle={`Status Points: ${player.stats.statPoints}`}>
      <Section>
        {statConfig.map(({ key, icon: Icon, label, desc, color }) => (
          <div key={key} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconBox icon={<Icon size={16} />} size="sm" color={color} />
              <div>
                <Text variant="body" className="font-bold text-sm">{label}</Text>
                <Text variant="caption">{desc}</Text>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Text variant="valueLg" className="w-8 text-right">{player.stats[key]}</Text>
              {player.stats.statPoints > 0 && (
                <Button
                  variant="primary"
                  size="icon"
                  onClick={() => allocateStat(key)}
                >
                  +
                </Button>
              )}
            </div>
          </div>
        ))}
      </Section>
    </Modal>
  );
}
