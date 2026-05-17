import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Modal, IconBox, Text, Button, ListItem, Badge, Section } from '@/components/ui';
import { Heart, Zap, Package, Coins } from 'lucide-react';
import { gameData } from '@/shared/loader';

const { items } = gameData;

export function InventoryWindow({ onClose }: { onClose: () => void }) {
  const player = useGameStore((state) => state.player);
  const consumeItem = useGameStore((state) => state.consumeItem);

  return (
    <Modal isOpen onClose={onClose} title="Inventory" subtitle={`${player.zeny} Zeny`}>
      {player.inventory.length === 0 ? (
        <div className="text-center text-slate-500 py-8">
          <Text variant="body">Inventory is empty</Text>
        </div>
      ) : (
        <Section>
          {player.inventory.map((item, index) => {
            const itemDef = items.find(i => i.id === item.id);
            const isHp = itemDef?.effect?.type.includes('hp') ?? false;
            const isSp = itemDef?.effect?.type.includes('sp') ?? false;
            const iconColor = isHp ? 'green' : isSp ? 'blue' : 'default';
            const Icon = isHp ? Heart : isSp ? Zap : Package;

            return (
              <ListItem
                key={`${item.id}-${index}`}
                icon={
                  <IconBox
                    icon={<Icon size={16} />}
                    size="sm"
                    color={iconColor}
                  />
                }
                title={item.name}
                description={item.description}
                action={
                  item.type === 'usable' ? (
                    <Button variant="primary" size="sm" onClick={() => consumeItem(item.id)}>
                      Use
                    </Button>
                  ) : (
                    <Badge variant="amount">{item.amount}x</Badge>
                  )
                }
              />
            );
          })}
        </Section>
      )}
    </Modal>
  );
}
