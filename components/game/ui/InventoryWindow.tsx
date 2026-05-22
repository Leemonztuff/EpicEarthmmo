'use client';

import React, { useState, useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Modal, Button, Badge, TabBar, EmptyState, GameIcon, getItemVariant } from '@/components/ui';
import { Package, Heart, Sword, Gem, X } from 'lucide-react';
import { gameData } from '@/shared/loader';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';

export function InventoryWindow({ onClose }: { onClose: () => void }) {
  const player = useGameStore((state) => state.player);
  const consumeItem = useGameStore((state) => state.consumeItem);
  const equipItem = useGameStore((state) => state.equipItem);
  const equippedItems = player?.equippedItems || {};

  const [activeTab, setActiveTab] = useState('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  if (!player) return null;

  const tabs = [
    { id: 'all', label: 'All', icon: <Package size={12} /> },
    { id: 'usable', label: 'Usable', icon: <Heart size={12} /> },
    { id: 'equip', label: 'Gear', icon: <Sword size={12} /> },
    { id: 'misc', label: 'Misc', icon: <Gem size={12} /> },
  ];

  const inventory = player.inventory || [];
  
  const filteredItems = useMemo(() => {
    return inventory.filter((item) => {
      if (activeTab === 'all') return true;
      return item.type === activeTab;
    });
  }, [inventory, activeTab]);

  // Pad the grid to always show a minimum number of slots (classic RO style)
  const paddedSlots = useMemo(() => {
    const minSlots = 32; // 8x4 grid
    const slots = [...filteredItems];
    while (slots.length < minSlots) {
      slots.push(null as any); // Empty slot placeholder
    }
    return slots;
  }, [filteredItems]);

  const handleUseItem = (item: any) => {
    if (!item) return;
    if (item.type === 'usable') {
      consumeItem(item.id);
      if (item.amount <= 1) setSelectedItem(null);
    } else if (item.type === 'equip') {
      // Determine slot based on item description or standard weapon/armor
      const desc = (item.description || '').toLowerCase();
      const slot = desc.includes('shield') ? 'shield' : desc.includes('weapon') || desc.includes('sword') || desc.includes('bow') || desc.includes('dagger') ? 'weapon' : 'armor';
      equipItem(item.id, slot);
      setSelectedItem(null);
    }
  };

  const isEquipped = (itemId: string) => {
    return Object.values(equippedItems).includes(itemId);
  };

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
        
        {/* Compact Sorting Tabs */}
        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabId) => {
            setActiveTab(tabId);
            setSelectedItem(null); // Clear selected on tab change
          }}
          variant="pill"
          size="sm"
        />

        {/* Dynamic RO-Style Slot Grid */}
        <div className="min-h-[220px] bg-slate-950/40 p-2.5 rounded-2xl border border-white/5 relative">
          {filteredItems.length === 0 && activeTab !== 'all' ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <EmptyState
                icon={<Package size={32} className="text-slate-700" />}
                title="Empty Tab"
                description={`No items in ${activeTab}`}
                className="py-6"
              />
            </div>
          ) : (
            <div className="grid grid-cols-6 xs:grid-cols-8 gap-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
              {paddedSlots.map((item, index) => {
                if (!item) {
                  // Render empty slot
                  return (
                    <div 
                      key={`empty-${index}`} 
                      className="ro-item-slot opacity-30 select-none border border-dashed border-slate-800 bg-transparent"
                    />
                  );
                }

                const variant = getItemVariant(item.type);
                const equipped = isEquipped(item.id);
                const isSelected = selectedItem?.id === item.id;

                return (
                  <motion.div
                    key={`${item.id}-${index}`}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedItem(item)}
                    className={cn(
                      "ro-item-slot cursor-pointer select-none",
                      equipped && "ro-item-slot-equipped",
                      isSelected && "border-blue-400 bg-blue-500/10 shadow-[0_0_8px_rgba(92,134,180,0.3)]"
                    )}
                  >
                    {/* Item Icon */}
                    <GameIcon
                      iconType="item"
                      id={item.id}
                      name={item.name}
                      variant={variant}
                      size={28}
                    />

                    {/* Equip "E" indicator */}
                    {equipped && (
                      <span className="absolute top-0.5 left-0.5 px-0.5 bg-yellow-500 text-slate-950 font-black text-[6px] rounded leading-none border border-slate-950">
                        E
                      </span>
                    )}

                    {/* Amount badge inside slot */}
                    {item.amount > 1 && (
                      <span className="absolute bottom-0.5 right-0.5 bg-slate-950/80 px-0.5 text-white font-black text-[8px] rounded leading-none">
                        {item.amount}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* sliding Item Detail Action Panel */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-3 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-950/50 flex items-center justify-center border border-white/5 shrink-0">
                    <GameIcon
                      iconType="item"
                      id={selectedItem.id}
                      name={selectedItem.name}
                      variant={getItemVariant(selectedItem.type)}
                      size={32}
                    />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <h3 className="font-extrabold text-xs text-white uppercase">{selectedItem.name}</h3>
                      {selectedItem.type === 'equip' && (
                        <Badge variant="purple" size="xs">Gear</Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5 max-w-[200px]">
                      {selectedItem.description}
                    </p>
                  </div>
                </div>

                {/* Tactile Big Action Buttons */}
                <div className="flex flex-col gap-1.5 shrink-0">
                  {selectedItem.type !== 'misc' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUseItem(selectedItem)}
                      className="px-4 py-1.5 h-8 text-[11px] rounded-lg font-black uppercase tracking-wider"
                    >
                      {selectedItem.type === 'usable' ? 'Use' : isEquipped(selectedItem.id) ? 'Unequip' : 'Equip'}
                    </Button>
                  ) : (
                    <Badge variant="default" size="sm" className="text-[9px] uppercase tracking-wider h-8 flex items-center justify-center">Loot</Badge>
                  )}
                  
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="w-full text-center text-[9px] font-bold text-slate-500 hover:text-slate-400 uppercase py-0.5 cursor-pointer outline-none"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
