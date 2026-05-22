'use client';

import React, { useState, useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Modal, Button, Badge, TabBar, EmptyState, GameIcon, getItemVariant, showToast } from '@/components/ui';
import { gameData } from '@/shared/loader';
import { ShoppingBag, Package, DollarSign, Plus, Minus, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';

export function ShopWindow() {
  const shopNpcId = useGameStore(s => s.shopNpcId);
  const setShopNpcId = useGameStore(s => s.setShopNpcId);
  const player = useGameStore(s => s.player);
  const buyFromShop = useGameStore(s => s.buyFromShop);
  const sellToShop = useGameStore(s => s.sellToShop);
  const [activeTab, setActiveTab] = useState('buy');
  
  // Transaction quantity state
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const mapData = useMemo(() => gameData.maps.find((m: any) => m.id === useGameStore.getState().currentMapId), [shopNpcId]);
  const npc = useMemo(() => (mapData as any)?.npcs?.find((n: any) => n.id === shopNpcId), [mapData, shopNpcId]);
  const shopItems = useMemo(() => {
    if (!npc?.shopItems) return [];
    return npc.shopItems
      .map((itemId: string) => gameData.items.find((i: any) => i.id === itemId))
      .filter(Boolean);
  }, [npc]);

  const handleClose = () => {
    setShopNpcId(null);
    setSelectedItem(null);
  };

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setSelectedItem(null);
    setQuantity(1);
  };

  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
    setQuantity(1);
  };

  const incrementQty = () => {
    if (!selectedItem) return;
    if (activeTab === 'buy') {
      const maxBuy = Math.floor((player?.zeny || 0) / (selectedItem.buyPrice ?? 99999));
      if (quantity < Math.min(99, maxBuy)) {
        setQuantity(prev => prev + 1);
      }
    } else {
      const invItem = (player?.inventory || []).find((i: any) => i.id === selectedItem.id);
      const maxSell = invItem?.amount || 0;
      if (quantity < maxSell) {
        setQuantity(prev => prev + 1);
      }
    }
  };

  const decrementQty = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleBuyConfirm = () => {
    if (!selectedItem) return;
    const price = selectedItem.buyPrice ?? 99999;
    const totalCost = price * quantity;
    
    if ((player?.zeny || 0) < totalCost) {
      showToast('Not enough Zeny!', 'error');
      return;
    }

    // Execute multiple buys sequentially
    for (let i = 0; i < quantity; i++) {
      buyFromShop(selectedItem.id);
    }
    
    showToast(`Purchased ${quantity}x ${selectedItem.name}!`, 'success');
    setSelectedItem(null);
  };

  const handleSellConfirm = () => {
    if (!selectedItem) return;

    // Execute multiple sells sequentially
    for (let i = 0; i < quantity; i++) {
      sellToShop(selectedItem.id);
    }

    showToast(`Sold ${quantity}x ${selectedItem.name}!`, 'success');
    setSelectedItem(null);
  };

  if (!shopNpcId || !player) return null;

  const tabs = [
    { id: 'buy', label: 'Buy Items', icon: <ShoppingBag size={12} /> },
    { id: 'sell', label: 'Sell Loot', icon: <Package size={12} /> },
  ];

  const inventoryItems = player.inventory || [];

  return (
    <Modal
      isOpen
      onClose={handleClose}
      title={npc?.name || 'NPC Merchant'}
      subtitle={`${(player.zeny || 0).toLocaleString()} Zeny`}
      size="md"
      position="bottom"
    >
      <div className="space-y-4">
        
        {/* Sorting Tabs */}
        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleSelectTab}
          variant="pill"
          size="sm"
        />

        {/* Dynamic Shop/Inventory Items Grid/List */}
        <div className="min-h-[220px] bg-slate-950/40 p-2.5 rounded-2xl border border-white/5 relative">
          
          {activeTab === 'buy' && (
            <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
              {shopItems.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <EmptyState
                    icon={<ShoppingBag size={32} className="text-slate-700" />}
                    title="No Items"
                    description="This merchant has nothing for sale."
                    className="py-6"
                  />
                </div>
              ) : (
                shopItems.map((item: any) => {
                  const isSelected = selectedItem?.id === item.id;
                  const price = item.buyPrice ?? 99999;
                  const canAfford = player.zeny >= price;
                  
                  return (
                    <motion.div
                      key={item.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectItem(item)}
                      className={cn(
                        "p-2 rounded-xl border flex items-center justify-between gap-3 cursor-pointer select-none transition-all duration-200",
                        isSelected 
                          ? "border-blue-400 bg-blue-500/10 shadow-[0_0_8px_rgba(92,134,180,0.3)]" 
                          : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center justify-center shrink-0">
                          <GameIcon
                            iconType="item"
                            id={item.id}
                            name={item.name}
                            variant={getItemVariant(item.type)}
                            size={24}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-white font-extrabold text-xs uppercase truncate">{item.name}</span>
                            {item.levelReq > 1 && (
                              <Badge variant="warning" size="xs">Lv.{item.levelReq}</Badge>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-400 block truncate mt-0.5 font-medium leading-none">
                            {item.description}
                          </span>
                        </div>
                      </div>
                      
                      <div className="shrink-0 flex items-center gap-1">
                        <span className={cn("text-xs font-black font-mono leading-none", canAfford ? "text-amber-400" : "text-slate-500")}>
                          {price.toLocaleString()}
                        </span>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Z</span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'sell' && (
            <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
              {inventoryItems.filter((i: any) => i.amount > 0).length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <EmptyState
                    icon={<Package size={32} className="text-slate-700" />}
                    title="Empty Inventory"
                    description="No items to sell right now."
                    className="py-6"
                  />
                </div>
              ) : (
                inventoryItems.filter((i: any) => i.amount > 0).map((item: any) => {
                  const isSelected = selectedItem?.id === item.id;
                  const itemDef = gameData.items.find((d: any) => d.id === item.id);
                  const sellPrice = itemDef?.sellPrice ?? 0;
                  
                  return (
                    <motion.div
                      key={item.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectItem({ ...item, sellPrice })}
                      className={cn(
                        "p-2 rounded-xl border flex items-center justify-between gap-3 cursor-pointer select-none transition-all duration-200",
                        isSelected 
                          ? "border-blue-400 bg-blue-500/10 shadow-[0_0_8px_rgba(92,134,180,0.3)]" 
                          : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center justify-center shrink-0">
                          <GameIcon
                            iconType="item"
                            id={item.id}
                            name={item.name}
                            variant={getItemVariant(item.type)}
                            size={24}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-white font-extrabold text-xs uppercase truncate">{item.name}</span>
                            <Badge variant="default" size="xs">x{item.amount}</Badge>
                          </div>
                          <span className="text-[9px] text-slate-400 block truncate mt-0.5 font-medium leading-none">
                            {item.description || 'Loot obtained from fields.'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="shrink-0 flex items-center gap-1">
                        {sellPrice > 0 ? (
                          <>
                            <span className="text-xs font-black text-emerald-400 font-mono leading-none">
                              {sellPrice.toLocaleString()}
                            </span>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Z</span>
                          </>
                        ) : (
                          <span className="text-[8px] font-bold text-slate-600 uppercase">Worthless</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}

        </div>

        {/* Bottom Tactile Transaction Drawer */}
        <AnimatePresence>
          {selectedItem && (() => {
            const price = activeTab === 'buy' ? (selectedItem.buyPrice ?? 99999) : (selectedItem.sellPrice ?? 0);
            const total = price * quantity;
            const canTransact = activeTab === 'buy' ? player.zeny >= total : price > 0;
            
            return (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="bg-slate-900/95 border border-slate-700/60 rounded-2xl p-3 shadow-2xl relative overflow-hidden"
              >
                {/* Details Section */}
                <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-2.5 mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-slate-950/50 flex items-center justify-center border border-white/5 shrink-0">
                      <GameIcon
                        iconType="item"
                        id={selectedItem.id}
                        name={selectedItem.name}
                        variant={getItemVariant(selectedItem.type)}
                        size={28}
                      />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <h4 className="text-xs font-black text-white uppercase leading-none">{selectedItem.name}</h4>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wide">
                          {selectedItem.type === 'usable' ? 'Consumable' : selectedItem.type === 'equip' ? 'Gear' : 'Loot'}
                        </span>
                      </div>
                      
                      {/* Equip stats badges if any */}
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {selectedItem.atk && <Badge variant="warning" size="xs">ATK +{selectedItem.atk}</Badge>}
                        {selectedItem.def && <Badge variant="primary" size="xs">DEF +{selectedItem.def}</Badge>}
                        {selectedItem.matk && <Badge variant="purple" size="xs">MATK +{selectedItem.matk}</Badge>}
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="text-[9px] font-bold text-slate-500 hover:text-slate-400 uppercase py-1 cursor-pointer outline-none"
                  >
                    Cancel
                  </button>
                </div>

                {/* Tactile Amount and Action Row */}
                <div className="flex items-center justify-between gap-4">
                  {/* Quantity adjustment buttons */}
                  <div className="flex items-center gap-1.5 bg-slate-950/40 p-1 rounded-full border border-white/5">
                    <button
                      onClick={decrementQty}
                      disabled={quantity <= 1}
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center border text-slate-400 cursor-pointer transition-colors outline-none",
                        quantity <= 1 
                          ? "opacity-30 border-transparent cursor-not-allowed" 
                          : "border-slate-800 bg-slate-900 active:bg-slate-800 hover:text-white"
                      )}
                    >
                      <Minus size={14} />
                    </button>
                    
                    <span className="w-8 text-center text-xs font-black text-white font-mono">
                      {quantity}
                    </span>
                    
                    <button
                      onClick={incrementQty}
                      className="w-9 h-9 rounded-full flex items-center justify-center border border-slate-800 bg-slate-900 active:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors outline-none"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Price display and dynamic confirm button */}
                  <div className="flex-1 flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">
                        {activeTab === 'buy' ? 'Total Cost:' : 'Estimated Earnings:'}
                      </span>
                      <span className={cn("text-xs font-black font-mono", activeTab === 'buy' ? (canTransact ? "text-amber-400" : "text-red-400") : "text-emerald-400")}>
                        {total.toLocaleString()}
                      </span>
                      <span className="text-[8px] font-black text-slate-500 uppercase">Z</span>
                    </div>

                    <Button
                      variant={activeTab === 'buy' ? 'primary' : 'success'}
                      size="sm"
                      disabled={!canTransact}
                      onClick={activeTab === 'buy' ? handleBuyConfirm : handleSellConfirm}
                      className={cn(
                        "h-10 px-5 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-lg w-full max-w-[160px]",
                        activeTab === 'sell' && "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white border-emerald-400/20"
                      )}
                    >
                      <DollarSign size={12} className="mr-1 inline-block" />
                      {activeTab === 'buy' ? `Buy x${quantity}` : `Sell x${quantity}`}
                    </Button>
                  </div>
                </div>

              </motion.div>
            );
          })()}
        </AnimatePresence>

      </div>
    </Modal>
  );
}
