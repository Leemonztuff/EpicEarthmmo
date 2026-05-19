'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Modal, Text, Button, Badge, GameIcon } from '@/components/ui';
import { Sparkles, Info } from 'lucide-react';
import { gameData } from '@/shared/loader';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';

const { skills } = gameData;

export function SkillsWindow({ onClose }: { onClose: () => void }) {
  const player = useGameStore((state) => state.player);
  const unlockSkill = useGameStore((state) => state.unlockSkill);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  if (!player) return null;

  const selectedSkill = skills.find(s => s.id === selectedSkillId);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Skill Tree"
      subtitle={`${player.jobClass} Class`}
      position="bottom"
      size="md"
    >
      <div className="space-y-6">
        {/* Points Header */}
        <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-5 border border-white/5 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Sparkles size={24} className="text-indigo-400" />
              </div>
              {player.skillPoints > 0 && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-slate-900"
                />
              )}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/60 mb-0.5">Skill Points Available</p>
              <h2 className="text-3xl font-black text-white leading-none">{player.skillPoints}</h2>
            </div>
          </div>
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-2 gap-3">
          {skills.map((skill, index) => {
            const isUnlocked = player.unlockedSkills.includes(skill.id) || skill.skillPointCost === 0;
            const meetsReqs = skill.requirements.every(r => player.unlockedSkills.includes(r) || r === 'basic_attack');
            const canUnlock = !isUnlocked && meetsReqs && player.skillPoints >= skill.skillPointCost;
            const isSelected = selectedSkillId === skill.id;

            return (
              <motion.button
                key={skill.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedSkillId(skill.id)}
                className={cn(
                  "relative p-4 rounded-[2rem] border-2 transition-all text-left flex flex-col gap-3 group active:scale-95",
                  isSelected
                    ? "bg-indigo-500/10 border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.2)]"
                    : isUnlocked
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : meetsReqs
                    ? "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                    : "bg-black/20 border-slate-900 opacity-40 grayscale"
                )}
              >
                <div className="flex items-start justify-between">
                  <GameIcon
                    iconType="skill"
                    id={skill.id}
                    name={skill.name}
                    variant={isUnlocked ? 'green' : meetsReqs ? 'amber' : 'default'}
                    size={40}
                  />
                  {skill.spCost > 0 && (
                    <span className="text-[10px] font-black text-blue-400/60 font-mono">{skill.spCost} SP</span>
                  )}
                </div>

                <div>
                  <h3 className="font-black text-sm text-white truncate">{skill.name}</h3>
                  <p className="text-[10px] text-slate-500 font-medium line-clamp-1">{skill.description}</p>
                </div>

                {isSelected && (
                  <motion.div layoutId="skill-glow" className="absolute inset-0 rounded-[2rem] shadow-[inset_0_0_20px_rgba(99,102,241,0.2)] pointer-events-none" />
                )}
              </motion.button>
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
                       {selectedSkill.requirements.map(req => (
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
                      variant={player.skillPoints >= selectedSkill.skillPointCost && selectedSkill.requirements.every(r => player.unlockedSkills.includes(r) || r === 'basic_attack') ? "primary" : "secondary"}
                      disabled={player.skillPoints < selectedSkill.skillPointCost || !selectedSkill.requirements.every(r => player.unlockedSkills.includes(r) || r === 'basic_attack')}
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
