'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useNetworkStore } from '@/store/useNetworkStore';
import { gameData } from '@/shared/loader';
import { Button, Badge, Tooltip } from '@/components/ui';
import { Zap, Heart, Shield, Sword, Sparkles } from 'lucide-react';

const { skills, items } = gameData;

const skillIcons: Record<string, React.ReactNode> = {
  basic_attack: <Sword size={18} />,
};

function getSkillIcon(skillId: string) {
  return skillIcons[skillId] || <Sparkles size={18} />;
}

export function Hotbar() {
  const player = useGameStore((state) => state.player);
  const activeSkill = useGameStore((state) => state.activeSkill);
  const setActiveSkill = useGameStore((state) => state.setActiveSkill);
  const selectedTargetId = useGameStore((state) => state.selectedTargetId);
  const attackTarget = useNetworkStore((state) => state.attackTarget);
  const consumeItem = useGameStore((state) => state.consumeItem);

  const quickItems = player.inventory.filter(i => i.type === 'usable' && i.amount > 0).slice(0, 3);

  const handleAttack = () => {
    if (selectedTargetId) {
      attackTarget(selectedTargetId);
    }
  };

  return (
    <div className="pointer-events-auto select-none">
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1 items-center">
          <Tooltip content={selectedTargetId ? 'Attack Target' : 'No Target Selected'} position="top">
            <Button
              variant={selectedTargetId ? 'danger' : 'secondary'}
              size="squareLg"
              onClick={handleAttack}
              className={selectedTargetId ? 'animate-pulse' : ''}
            >
              <Sword size={24} />
            </Button>
          </Tooltip>
          <span className="text-[8px] text-white/60 font-medium">ATK</span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            {quickItems.map((item) => {
              const itemDef = items.find(i => i.id === item.id);
              const isHp = itemDef?.effect?.type.includes('hp') ?? false;
              const isSp = itemDef?.effect?.type.includes('sp') ?? false;
              const iconColor = isHp ? 'green' : isSp ? 'blue' : 'default';
              const Icon = isHp ? Heart : isSp ? Zap : Shield;

              return (
                <Tooltip key={item.id} content={`${item.name} (${item.amount}x)`} position="top">
                  <Button
                    variant="secondary"
                    size="square"
                    onClick={() => consumeItem(item.id)}
                    className={`flex-col ${isHp ? 'border-green-500/60' : isSp ? 'border-blue-500/60' : ''}`}
                  >
                    <Icon size={14} className={isHp ? 'text-green-300' : isSp ? 'text-blue-300' : 'text-slate-300'} />
                    <Badge variant="amount" size="xs" className="-mt-0.5">{item.amount}</Badge>
                  </Button>
                </Tooltip>
              );
            })}
          </div>

          <div className="flex gap-1">
            {player.unlockedSkills.slice(0, 5).map((skillId) => {
              const skillDef = skills.find(s => s.id === skillId);
              if (!skillDef) return null;
              const isActive = activeSkill === skillId;
              return (
                <Tooltip key={skillId} content={`${skillDef.name} (${skillDef.spCost} SP)`} position="top">
                  <Button
                    variant={isActive ? 'danger' : 'secondary'}
                    size="square"
                    onClick={() => setActiveSkill(isActive ? null : skillId)}
                    className="flex-col relative"
                  >
                    {getSkillIcon(skillId)}
                    <span className="text-[6px] text-white/60 font-medium -mt-0.5">{skillDef.spCost}</span>
                    {isActive && (
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                    )}
                  </Button>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
