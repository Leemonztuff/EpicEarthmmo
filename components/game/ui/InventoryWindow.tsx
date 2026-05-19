'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Modal, Button, ListItem, Badge, TabBar, EmptyState, GameIcon, getItemVariant } from '@/components/ui';
import { Package, Heart, Sword, Gem } from 'lucide-react';
import { gameData } from '@/shared/loader';
import { motion, AnimatePresence } from 'framer-motion';

const { items } = gameData;

export function InventoryWindow({ onClose }: { onClose: () => void }) {
  const player = useGameStore((state) => state.player);
  const consumeItem = useGameStore((state) => state.consumeItem);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);

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
    return item.type === activeTab;
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
                  const variant = getItemVariant(item.type);

                  return (
                    <ListItem
                      key={`${item.id}-${index}`}
                      variant="clickable"
                      padding="sm"
                      onClick={() => setSelectedItem(item)}
                      icon={
                        <GameIcon
                          iconType="item"
                          id={item.id}
                          name={item.name}
                          variant={variant}
                          size={28}
                          className="shrink-0"
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

        {/* Item Detail Panel */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-slate-950/60 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <GameIcon
                    iconType="item"
                    id={selectedItem.id}
                    name={selectedItem.name}
                    variant={getItemVariant(selectedItem.type)}
                    size={48}
                  />
                  <div>
                    <h3 className="font-black text-white">{selectedItem.name}</h3>
                    <p className="text-xs text-slate-400 leading-tight">{selectedItem.description}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                   {selectedItem.type === 'usable' ? (
                     <Button
                       variant="primary"
                       size="sm"
                       onClick={() => {
                         consumeItem(selectedItem.id);
                         if (selectedItem.amount <= 1) setSelectedItem(null);
                       }}
                       className="px-6 rounded-full shadow-lg shadow-blue-500/20"
                     >
                       Use
                     </Button>
                   ) : (
                     <Badge variant="purple" size="md" className="rounded-full">GEAR</Badge>
                   )}
                   <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)} className="text-slate-500">
                     Dismiss
                   </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
