'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Modal, Text, Button, ListItem, Badge, GameIcon } from '@/components/ui';
import { Star, Sparkles } from 'lucide-react';
import { gameData } from '@/shared/loader';
import { motion } from 'framer-motion';

const { skills } = gameData;

export function SkillsWindow({ onClose }: { onClose: () => void }) {
  const player = useGameStore((state) => state.player);
  const unlockSkill = useGameStore((state) => state.unlockSkill);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Skill Tree"
      subtitle={`${player.jobClass} Skills`}
      position="bottom"
      size="md"
    >
      <div className="space-y-6">
        {/* Points Header */}
        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 rounded-2xl p-4 border border-indigo-500/20 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <div className="relative">
              <IconBox icon={<Sparkles size={20} className="text-indigo-400" />} color="purple" size="md" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-indigo-400/20 rounded-2xl"
              />
            </div>
            <div>
              <Text variant="caption" className="uppercase tracking-widest text-[10px] font-black text-indigo-400/60">Skill Points</Text>
              <Text variant="valueLg" className="text-2xl text-white">{player.skillPoints}</Text>
            </div>
          </div>
          {player.skillPoints > 0 && (
            <Badge variant="purple" size="md" className="animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              Level Up!
            </Badge>
          )}
        </div>

        <div className="grid gap-3">
          {skills.map((skill, index) => {
            const isUnlocked = player.unlockedSkills.includes(skill.id) || skill.skillPointCost === 0;
            const meetsReqs = skill.requirements.every(r => player.unlockedSkills.includes(r) || r === 'basic_attack');
            const canUnlock = !isUnlocked && meetsReqs && player.skillPoints >= skill.skillPointCost;

            return (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ListItem
                  variant={isUnlocked ? 'default' : meetsReqs ? 'clickable' : 'disabled'}
                  padding="sm"
                  className={cn(
                    "transition-all duration-300",
                    isUnlocked && "border-emerald-500/20 bg-emerald-500/5",
                    canUnlock && "border-indigo-500/30 bg-indigo-500/5"
                  )}
                  icon={
                    <div className="relative">
                      <GameIcon
                        iconType="skill"
                        id={skill.id}
                        name={skill.name}
                        variant={isUnlocked ? 'green' : meetsReqs ? 'amber' : 'default'}
                        size={32}
                        className="shrink-0"
                      />
                      {isUnlocked && (
                         <motion.div
                          layoutId={`sparkle-${skill.id}`}
                          className="absolute -top-1 -right-1"
                         >
                            <Star size={12} className="text-yellow-400 fill-yellow-400" />
                         </motion.div>
                      )}
                    </div>
                  }
                  title={
                    <div className="flex items-center gap-2">
                      <span className={cn(isUnlocked ? "text-white" : "text-slate-400")}>{skill.name}</span>
                      {skill.spCost > 0 && (
                        <Badge variant="primary" size="xs" className="font-mono">{skill.spCost} SP</Badge>
                      )}
                    </div>
                  }
                  description={skill.description}
                  action={
                    !isUnlocked && meetsReqs ? (
                      <Button
                        variant={canUnlock ? 'primary' : 'secondary'}
                        size="sm"
                        disabled={!canUnlock}
                        onClick={() => unlockSkill(skill.id, skill.skillPointCost)}
                        className="h-8"
                      >
                        {canUnlock ? `Unlock (${skill.skillPointCost})` : 'Need SP'}
                      </Button>
                    ) : isUnlocked ? (
                      <Badge variant="success" size="sm" className="bg-emerald-500/20 border-emerald-500/30">Mastered</Badge>
                    ) : (
                       <Badge variant="default" size="sm" className="opacity-50">Locked</Badge>
                    )
                  }
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
