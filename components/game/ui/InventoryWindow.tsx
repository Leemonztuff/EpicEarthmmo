'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Modal, IconBox, Button, ListItem, Badge, TabBar, EmptyState } from '@/components/ui';
import { Heart, Zap, Package, Sword, Shield, Gem } from 'lucide-react';
import { gameData } from '@/shared/loader';
import { motion, AnimatePresence } from 'framer-motion';

const { items } = gameData;

export function InventoryWindow({ onClose }: { onClose: () => void }) {
  const player = useGameStore((state) => state.player);
  const consumeItem = useGameStore((state) => state.consumeItem);
  const [activeTab, setActiveTab] = useState('all');

  if (!player) return null;

  const tabs = [
    { id: 'all', label: 'All', icon: <Package size={14} /> },
    { id: 'usable', label: 'Usable', icon: <Heart size={14} /> },
    { id: 'equip', label: 'Gear', icon: <Sword size={14} /> },
    { id: 'misc', label: 'Misc', icon: <Gem size={14} /> },
  ];

  const inventory = player.inventory || [];

  const filteredItems = inventory.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'usable') return item.type === 'usable';
    if (activeTab === 'equip') return item.type === 'equip';
    return item.type === 'misc';
  });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Inventory"
      subtitle={`${(player.zeny || 0).toLocaleString()} Zeny`}
      size="md"
      position="bottom"
    >
      <div className="space-y-4">
        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="pill"
          size="sm"
        />

        <div className="min-h-[300px]">
          <AnimatePresence mode="wait">
            {filteredItems.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <EmptyState
                  icon={<Package size={48} className="text-slate-700" />}
                  title="No items found"
                  description={activeTab === 'all' ? "Your inventory is currently empty." : `You don't have any items in the ${activeTab} category.`}
                />
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="grid gap-2"
              >
                {filteredItems.map((item, index) => {
                  const itemDef = items.find(i => i.id === item.id);
                  const isHp = itemDef?.effect?.type.includes('hp') ?? false;
                  const isSp = itemDef?.effect?.type.includes('sp') ?? false;

                  let iconColor: any = 'default';
                  let Icon = Package;

                  if (item.type === 'usable') {
                    iconColor = isHp ? 'green' : isSp ? 'blue' : 'yellow';
                    Icon = isHp ? Heart : isSp ? Zap : Package;
                  } else if (item.type === 'equip') {
                    iconColor = 'purple';
                    Icon = itemDef?.type === 'weapon' ? Sword : Shield;
                  }

                  return (
                    <ListItem
                      key={`${item.id}-${index}`}
                      variant="clickable"
                      padding="sm"
                      icon={
                        <IconBox
                          icon={<Icon size={18} />}
                          size="md"
                          color={iconColor}
                          rounded="sm"
                        />
                      }
                      title={
                        <div className="flex items-center justify-between">
                          <span>{item.name}</span>
                          {item.amount > 1 && (
                            <Badge variant="amount" size="xs">x{item.amount}</Badge>
                          )}
                        </div>
                      }
                      description={item.description}
                      action={
                        item.type === 'usable' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            className="h-8 px-4"
                            onClick={(e) => {
                              e.stopPropagation();
                              consumeItem(item.id);
                            }}
                          >
                            Use
                          </Button>
                        ) : item.type === 'equip' ? (
                          <Badge variant="purple" size="xs">Gear</Badge>
                        ) : null
                      }
                    />
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Modal>
  );
}
