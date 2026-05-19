'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Modal, Text, Button, ListItem, Badge, GameIcon } from '@/components/ui';
import { Star, Sparkles } from 'lucide-react';
import { gameData } from '@/shared/loader';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';

const { skills } = gameData;

export function SkillsWindow({ onClose }: { onClose: () => void }) {
  const player = useGameStore((state) => state.player);
  const unlockSkill = useGameStore((state) => state.unlockSkill);
  const [selectedSkill, setSelectedSkill] = useState<any>(null);

  if (!player) return null;

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
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                <Sparkles size={20} className="text-indigo-400" />
              </div>
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
                  onClick={() => setSelectedSkill(skill)}
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
                        onClick={(e) => { e.stopPropagation(); unlockSkill(skill.id, skill.skillPointCost); }}
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

        {/* Detail & Action Panel */}
        <AnimatePresence>
          {selectedSkill && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white">{selectedSkill.name}</h2>
                    <p className="text-sm text-slate-400 mt-1 max-w-[80%]">{selectedSkill.description}</p>
                  </div>
                  <GameIcon
                    iconType="skill"
                    id={selectedSkill.id}
                    name={selectedSkill.name}
                    variant="green"
                    size={56}
                  />
                </div>

                <div className="h-[1px] bg-white/5 w-full" />

                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Requirements</span>
                    <div className="flex gap-2">
                       {selectedSkill.requirements.map((req: string) => (
                         <Badge key={req} variant={player.unlockedSkills.includes(req) ? "success" : "default"} size="xs">
                            {req.replace('_', ' ')}
                         </Badge>
                       ))}
                    </div>
                  </div>

                  {player.unlockedSkills.includes(selectedSkill.id) ? (
                    <Badge variant="success" size="md" className="h-10 px-6 rounded-full bg-emerald-500/20 border-emerald-500/30 font-black">
                      MASTERED
                    </Badge>
                  ) : (
                    <Button
                      variant={player.skillPoints >= selectedSkill.skillPointCost && selectedSkill.requirements.every((r: string) => player.unlockedSkills.includes(r) || r === 'basic_attack') ? "primary" : "secondary"}
                      disabled={player.skillPoints < selectedSkill.skillPointCost || !selectedSkill.requirements.every((r: string) => player.unlockedSkills.includes(r) || r === 'basic_attack')}
                      onClick={() => unlockSkill(selectedSkill.id, selectedSkill.skillPointCost)}
                      className="h-12 px-8 rounded-full font-black text-sm shadow-xl"
                    >
                      LEARN ({selectedSkill.skillPointCost} SP)
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
