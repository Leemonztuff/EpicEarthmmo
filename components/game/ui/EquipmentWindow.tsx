'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Modal, IconBox, Text, Button, Badge, Section, ListItem, GameIcon } from '@/components/ui';
import { Sword, Shield, Shirt, Footprints, Crown, Gem, X, ArrowUpRight } from 'lucide-react';
import { gameData } from '@/shared/loader';

const { items } = gameData;

const slotConfig: Record<string, { label: string; icon: React.ReactNode; color: any }> = {
  headTop: { label: 'Headgear', icon: <Crown size={20} />, color: 'yellow' },
  weapon: { label: 'Weapon', icon: <Sword size={20} />, color: 'red' },
  armor: { label: 'Armor', icon: <Shirt size={20} />, color: 'blue' },
  shield: { label: 'Shield', icon: <Shield size={20} />, color: 'cyan' },
  shoes: { label: 'Shoes', icon: <Footprints size={20} />, color: 'green' },
  accessory1: { label: 'Accessory', icon: <Gem size={20} />, color: 'purple' },
};

const SLOT_ITEM_TYPES: Record<string, string> = {
  weapon: 'weapon',
  armor: 'armor',
  shield: 'shield',
  headTop: 'headgear',
  shoes: 'shoes',
  accessory1: 'accessory',
};

export function EquipmentWindow({ onClose }: { onClose: () => void }) {
  const player = useGameStore((state) => state.player);
  const equippedItems = player?.equippedItems || {};
  const equipItem = useGameStore((state) => state.equipItem);
  const unequipItem = useGameStore((state) => state.unequipItem);
  const getEquippedStats = useGameStore((state) => state.getEquippedStats);
  const equippedStats = (typeof getEquippedStats === 'function' ? getEquippedStats() : null) || {};

  const equippableItems = (player?.inventory || []).filter(i => i.type === 'equip');

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Equipment"
      subtitle="Manage your combat gear"
      position="bottom"
      size="md"
    >
      <div className="space-y-6">
        {/* Paper Doll Style Grid */}
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(slotConfig).map(([slot, config]) => {
            const equippedId = equippedItems[slot];
            const itemDef = equippedId ? items.find(i => i.id === equippedId) : null;

            return (
              <div
                key={slot}
                className={cn(
                  "relative group flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200",
                  itemDef
                    ? "bg-slate-800/60 border-slate-600/50 shadow-lg"
                    : "bg-slate-900/30 border-dashed border-slate-800"
                )}
              >
                {itemDef ? (
                  <GameIcon
                    iconType="item"
                    id={itemDef.id}
                    name={itemDef.name}
                    size={28}
                    className="shrink-0"
                  />
                ) : (
                  <IconBox
                    icon={config.icon}
                    size="md"
                    color="default"
                    rounded="sm"
                    className="opacity-20"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <Text variant="caption" className="uppercase text-[9px] font-black text-slate-500 tracking-tighter">
                    {config.label}
                  </Text>
                  {itemDef ? (
                    <Text variant="body" className="font-bold text-xs truncate text-white">
                      {itemDef.name}
                    </Text>
                  ) : (
                    <Text variant="body" className="text-xs text-slate-700 italic">Empty</Text>
                  )}
                </div>
                {itemDef && (
                  <button
                    onClick={() => unequipItem(slot as any)}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg cursor-pointer"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Bonus Stats Panel */}
        {Object.keys(equippedStats || {}).some(k => k !== 'statPoints' && (equippedStats as any)[k] !== 0) && (
          <Section title="Active Bonuses" variant="card" className="bg-emerald-500/5 border-emerald-500/20">
            <div className="flex flex-wrap gap-2">
              {Object.entries(equippedStats || {}).map(([key, val]) => {
                if (key === 'statPoints' || val === 0) return null;
                return (
                  <Badge key={key} variant="success" size="sm" className="bg-emerald-500/20">
                    {key.toUpperCase()} +{val}
                  </Badge>
                );
              })}
            </div>
          </Section>
        )}

        {/* Inventory Selection */}
        <Section title="Available Gear" variant="default">
          <div className="space-y-2">
            {equippableItems.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                <Text variant="caption" className="text-slate-600">No equippable items in inventory</Text>
              </div>
            ) : (
              equippableItems.map(item => {
                const itemDef = items.find(i => i.id === item.id);
                return (
                  <ListItem
                    key={item.id}
                    variant="clickable"
                    padding="sm"
                    icon={
                      <GameIcon
                        iconType="item"
                        id={item.id}
                        name={item.name}
                        size={28}
                        className="shrink-0"
                      />
                    }
                    title={item.name}
                    description={
                      <div className="flex gap-1 mt-1">
                        {itemDef?.equipStats && Object.entries(itemDef.equipStats || {}).map(([k, v]) => (
                          <Badge key={k} variant="primary" size="xs">{k.toUpperCase()} +{v}</Badge>
                        ))}
                      </div>
                    }
                    action={
                      <div className="flex gap-1">
                        <Button
                          variant="primary"
                          size="sm"
                          className="h-8 px-3"
                          onClick={() => {
                            const slot = itemDef?.type === 'weapon' ? 'weapon' : 'armor';
                            equipItem(item.id, slot);
                          }}
                        >
                          Equip
                        </Button>
                      </div>
                    }
                  />
                );
              })
            )}
          </div>
        </Section>
      </div>
    </Modal>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
