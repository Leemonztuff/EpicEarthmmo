'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Modal, Button, Badge, TabBar, EmptyState, GameIcon, getItemVariant } from '@/components/ui';
import { Package, Heart, Sword, Gem } from 'lucide-react';
import { gameData } from '@/shared/loader';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';

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

        <div className="min-h-[350px] relative">
          <AnimatePresence mode="wait">
            {filteredItems.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pt-12"
              >
                <EmptyState
                  icon={<Package size={48} className="text-slate-800" />}
                  title="Inventory Empty"
                  description={`No items in ${activeTab} category.`}
                />
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-4 sm:grid-cols-5 gap-2"
              >
                {filteredItems.map((item, index) => {
                  const variant = getItemVariant(item.type);

                  return (
                    <motion.button
                      key={`${item.id}-${index}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => setSelectedItem(item)}
                      className={cn(
                        "aspect-square rounded-xl border-2 flex flex-col items-center justify-center relative transition-all active:scale-95 bg-slate-900/40 border-slate-800 hover:border-slate-700",
                        selectedItem?.id === item.id && "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                      )}
                    >
                      <GameIcon
                        iconType="item"
                        id={item.id}
                        name={item.name}
                        variant={variant}
                        size={32}
                      />

                      {item.amount > 1 && (
                        <div className="absolute bottom-1 right-1">
                          <span className="text-[10px] font-black text-white bg-slate-950/80 px-1 rounded-sm border border-white/10 shadow-lg">
                            {item.amount}
                          </span>
                        </div>
                      )}
                    </motion.button>
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
                     <Badge variant="purple" size="md" className="rounded-full">EQUIP</Badge>
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
