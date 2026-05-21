'use client';

import React, { useState, useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Modal, Text, Button, Badge, Divider, showToast } from '@/components/ui';
import { gameData } from '@/shared/loader';
import { ShoppingBag, Package, DollarSign } from 'lucide-react';

export function ShopWindow() {
  const shopNpcId = useGameStore(s => s.shopNpcId);
  const setShopNpcId = useGameStore(s => s.setShopNpcId);
  const player = useGameStore(s => s.player);
  const buyFromShop = useGameStore(s => s.buyFromShop);
  const sellToShop = useGameStore(s => s.sellToShop);
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');

  const mapData = useMemo(() => gameData.maps.find((m: any) => m.id === useGameStore.getState().currentMapId), [shopNpcId]);
  const npc = useMemo(() => (mapData as any)?.npcs?.find((n: any) => n.id === shopNpcId), [mapData, shopNpcId]);
  const shopItems = useMemo(() => {
    if (!npc?.shopItems) return [];
    return npc.shopItems
      .map((itemId: string) => gameData.items.find((i: any) => i.id === itemId))
      .filter(Boolean);
  }, [npc]);

  const handleClose = () => setShopNpcId(null);

  const handleBuy = (item: any) => {
    if (player.zeny < (item.buyPrice ?? 99999)) {
      showToast('Not enough zeny!', 'error');
      return;
    }
    buyFromShop(item.id);
    showToast(`Purchased ${item.name}!`, 'success');
  };

  const handleSell = (item: any) => {
    sellToShop(item.id);
    showToast(`Sold ${item.name}!`, 'success');
  };

  if (!shopNpcId) return null;

  const inventoryItems = player.inventory || [];

  return (
    <Modal
      isOpen
      onClose={handleClose}
      title={npc?.name || 'Shop'}
      subtitle={`Zeny: ${player.zeny.toLocaleString()}`}
      size="lg"
      position="center"
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={tab === 'buy' ? 'primary' : 'secondary'}
            size="sm"
            fullWidth
            onClick={() => setTab('buy')}
          >
            <ShoppingBag size={14} className="mr-1.5" />
            Buy
          </Button>
          <Button
            variant={tab === 'sell' ? 'primary' : 'secondary'}
            size="sm"
            fullWidth
            onClick={() => setTab('sell')}
          >
            <Package size={14} className="mr-1.5" />
            Sell
          </Button>
        </div>

        {tab === 'buy' && (
          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
            {shopItems.length === 0 && (
              <Text variant="caption" className="text-slate-400 text-center py-8">
                Nothing for sale right now.
              </Text>
            )}
            {shopItems.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between bg-slate-800/40 rounded-xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm truncate">{item.name}</span>
                    <Badge variant={item.rarity > 1 ? 'warning' : 'default'} size="sm">
                      Lv.{item.levelReq || 1}
                    </Badge>
                  </div>
                  <Text variant="caption" className="text-slate-400 text-xs mt-0.5">
                    {item.description}
                  </Text>
                  {item.atk && <Text variant="caption" className="text-orange-400 text-xs">ATK +{item.atk} </Text>}
                  {item.def && <Text variant="caption" className="text-blue-400 text-xs">DEF +{item.def} </Text>}
                  {item.matk && <Text variant="caption" className="text-purple-400 text-xs">MATK +{item.matk} </Text>}
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleBuy(item)}
                  disabled={player.zeny < (item.buyPrice ?? 99999)}
                  className="ml-3 shrink-0"
                >
                  <DollarSign size={12} className="mr-1" />
                  {item.buyPrice ?? '—'}
                </Button>
              </div>
            ))}
          </div>
        )}

        {tab === 'sell' && (
          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
            {inventoryItems.length === 0 && (
              <Text variant="caption" className="text-slate-400 text-center py-8">
                Nothing to sell.
              </Text>
            )}
            {inventoryItems.filter(i => i.amount > 0).map((item: any) => {
              const def = gameData.items.find((d: any) => d.id === item.id);
              const sellPrice = def?.sellPrice ?? 0;
              return (
                <div key={item.id} className="flex items-center justify-between bg-slate-800/40 rounded-xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm truncate">{item.name}</span>
                      <Badge variant="default" size="sm">x{item.amount}</Badge>
                    </div>
                    {item.description && (
                      <Text variant="caption" className="text-slate-400 text-xs mt-0.5">
                        {item.description}
                      </Text>
                    )}
                  </div>
                  {sellPrice > 0 ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSell(item)}
                      className="ml-3 shrink-0"
                    >
                      <DollarSign size={12} className="mr-1" />
                      {sellPrice}
                    </Button>
                  ) : (
                    <Text variant="caption" className="text-slate-500 ml-3 shrink-0">No value</Text>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
