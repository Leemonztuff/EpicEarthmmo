import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Modal, IconBox, Text, Button, ListItem, Badge, Section } from '@/components/ui';
import { Check, Lock, Zap } from 'lucide-react';
import { gameData } from '@/shared/loader';

const { skills } = gameData;

export function SkillsWindow({ onClose }: { onClose: () => void }) {
  const player = useGameStore((state) => state.player);
  const unlockSkill = useGameStore((state) => state.unlockSkill);

  return (
    <Modal isOpen onClose={onClose} title="Skills" subtitle={`Skill Points: ${player.skillPoints}`}>
      <Section>
        {skills.map((skill) => {
          const isUnlocked = player.unlockedSkills.includes(skill.id) || skill.skillPointCost === 0;
          const meetsReqs = skill.requirements.every(r => player.unlockedSkills.includes(r) || r === 'basic_attack');
          const canUnlock = !isUnlocked && meetsReqs && player.skillPoints >= skill.skillPointCost;

          return (
            <ListItem
              key={skill.id}
              icon={
                <IconBox
                  icon={isUnlocked ? <Check size={14} /> : <Lock size={12} />}
                  size="sm"
                  color={isUnlocked ? 'green' : 'default'}
                />
              }
              title={skill.name}
              description={skill.description}
              badge={!isUnlocked && (
                <Badge variant="primary" size="sm">
                  <Zap size={10} className="inline mr-0.5" />
                  {skill.skillPointCost}
                </Badge>
              )}
              action={
                !isUnlocked && meetsReqs ? (
                  <Button
                    variant={canUnlock ? 'primary' : 'secondary'}
                    size="sm"
                    disabled={!canUnlock}
                    onClick={() => unlockSkill(skill.id, skill.skillPointCost)}
                  >
                    {canUnlock ? 'Unlock' : 'No SP'}
                  </Button>
                ) : isUnlocked ? (
                  <Badge variant="success" size="sm">Unlocked</Badge>
                ) : null
              }
            />
          );
        })}
      </Section>
    </Modal>
  );
}
