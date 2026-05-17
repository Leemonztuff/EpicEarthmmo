'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Modal, IconBox, Text, Button, ListItem, Badge, Section } from '@/components/ui';
import { Sword, Shield, Shirt, Footprints, Crown, Gem, ArrowUpRight, X } from 'lucide-react';
import { gameData } from '@/shared/loader';

const { items } = gameData;

const slotConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  weapon: { label: 'Weapon', icon: <Sword size={16} />, color: 'red' },
  armor: { label: 'Armor', icon: <Shirt size={16} />, color: 'blue' },
  shield: { label: 'Shield', icon: <Shield size={16} />, color: 'cyan' },
  headTop: { label: 'Headgear', icon: <Crown size={16} />, color: 'yellow' },
  shoes: { label: 'Shoes', icon: <Footprints size={16} />, color: 'green' },
  accessory1: { label: 'Accessory', icon: <Gem size={16} />, color: 'purple' },
};

export function EquipmentWindow({ onClose }: { onClose: () => void }) {
  const player = useGameStore((state) => state.player);
  const equippedItems = player.equippedItems || {};
  const equipItem = useGameStore((state) => state.equipItem);
  const unequipItem = useGameStore((state) => state.unequipItem);
  const getEquippedStats = useGameStore((state) => state.getEquippedStats);
  const equippedStats = getEquippedStats();

  const equipSlots = Object.keys(slotConfig) as string[];

  const equippableItems = player.inventory.filter(i => i.type === 'equip');

  return (
    <Modal isOpen onClose={onClose} title="Equipment" subtitle="Manage your gear">
      <div className="space-y-4">
        <Section title="Equipped" variant="card">
          <div className="space-y-2">
            {equipSlots.map(slot => {
              const config = slotConfig[slot];
              const equippedId = equippedItems[slot];
              const itemDef = equippedId ? items.find(i => i.id === equippedId) : null;

              return (
                <div key={slot} className="flex items-center gap-3">
                  <IconBox icon={config.icon} size="sm" color={config.color as any} />
                  <div className="flex-1 min-w-0">
                    {itemDef ? (
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <Text variant="body" className="font-bold text-sm truncate">{itemDef.name}</Text>
                          <Text variant="caption">{itemDef.description}</Text>
                        </div>
                        <Button variant="ghost" size="iconSm" onClick={() => unequipItem(slot as any)}>
                          <X size={14} />
                        </Button>
                      </div>
                    ) : (
                      <Text variant="caption" className="text-slate-600">{config.label} (Empty)</Text>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {Object.keys(equippedStats).some(k => k !== 'statPoints' && (equippedStats as any)[k] !== 0) && (
          <Section title="Bonus Stats" variant="card">
            <div className="flex flex-wrap gap-2">
              {Object.entries(equippedStats).map(([key, val]) => {
                if (key === 'statPoints' || val === 0) return null;
                return (
                  <Badge key={key} variant="success" size="sm">
                    {key.toUpperCase()} +{val}
                  </Badge>
                );
              })}
            </div>
          </Section>
        )}

        {equippableItems.length > 0 && (
          <Section title="Available to Equip" variant="card">
            <div className="space-y-2">
              {equippableItems.map(item => {
                const itemDef = items.find(i => i.id === item.id);
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <IconBox icon={<ArrowUpRight size={14} />} size="sm" color="default" />
                    <div className="flex-1 min-w-0">
                      <Text variant="body" className="font-bold text-sm truncate">{item.name}</Text>
                      {itemDef?.equipStats && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {Object.entries(itemDef.equipStats).map(([k, v]) => (
                            <Badge key={k} variant="primary" size="xs">
                              {k.toUpperCase()} +{v}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {(Object.keys(slotConfig) as string[]).map(slot => (
                        <button
                          key={slot}
                          onClick={() => equipItem(item.id, slot as any)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold bg-slate-700/50 text-slate-400 hover:bg-blue-600 hover:text-white touch-manipulation active:scale-95 transition-all"
                          title={`Equip to ${slotConfig[slot].label}`}
                        >
                          {slotConfig[slot].icon}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}
      </div>
    </Modal>
  );
}
