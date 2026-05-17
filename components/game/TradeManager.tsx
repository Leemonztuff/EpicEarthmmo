import React from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { Modal, Button, IconBox, Text, Badge, Section } from '@/components/ui';
import { Check, X, Lock, Coins } from 'lucide-react';

export function TradeManager() {
  const tradeRequest = useNetworkStore(state => state.tradeRequest);
  const activeTrade = useNetworkStore(state => state.activeTrade);
  const acceptTradeRequest = useNetworkStore(state => state.acceptTradeRequest);
  const declineTradeRequest = useNetworkStore(state => state.declineTradeRequest);
  const updateTradeOffer = useNetworkStore(state => state.updateTradeOffer);
  const lockTrade = useNetworkStore(state => state.lockTrade);
  const acceptTrade = useNetworkStore(state => state.acceptTrade);
  const cancelTrade = useNetworkStore(state => state.cancelTrade);

  if (tradeRequest) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative bg-slate-900/95 backdrop-blur-md border border-blue-500/40 rounded-2xl p-5 shadow-2xl pointer-events-auto max-w-xs w-full mx-4 animate-slide-up">
          <div className="text-center">
            <IconBox
              icon={<Coins size={24} />}
              size="lg"
              color="blue"
              className="mx-auto mb-3"
            />
            <Text variant="body" className="mb-1">Trade Request</Text>
            <Text variant="value" className="text-amber-400 text-base mb-4">{tradeRequest.name}</Text>
            <div className="flex gap-3">
              <Button variant="success" size="md" onClick={acceptTradeRequest} className="flex-1">
                <Check size={16} /> Accept
              </Button>
              <Button variant="danger" size="md" onClick={declineTradeRequest} className="flex-1">
                <X size={16} /> Decline
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTrade) {
    const { myOffer, theirOffer } = activeTrade;
    const canAccept = myOffer.locked && theirOffer.locked;

    return (
      <Modal isOpen onClose={cancelTrade} title="Trade">
        <div className="grid grid-cols-2 gap-3">
          <Section>
            <Text variant="label" className="text-center uppercase tracking-wider text-blue-400">Your Offer</Text>
            <div className="h-24 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/30 flex items-center justify-center">
              <Text variant="caption">Items (TBA)</Text>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
              <Coins size={14} className="text-yellow-400" />
              <Text variant="body" className="flex-1">Zeny</Text>
              <input
                type="number"
                min={0}
                max={999999999}
                value={myOffer.zeny}
                onChange={e => updateTradeOffer({ zeny: Math.max(0, parseInt(e.target.value) || 0) })}
                disabled={myOffer.locked}
                className="w-20 text-right text-xs bg-slate-700/50 text-white rounded px-2 py-1 border border-slate-600/50 disabled:opacity-50"
              />
            </div>
            <Button
              variant={myOffer.locked ? 'secondary' : 'primary'}
              size="md"
              disabled={myOffer.locked}
              onClick={lockTrade}
              className="w-full"
            >
              <Lock size={12} /> {myOffer.locked ? 'Locked' : 'Lock Offer'}
            </Button>
          </Section>

          <Section>
            <Text variant="label" className="text-center uppercase tracking-wider text-red-400">Their Offer</Text>
            <div className="h-24 border-2 border-slate-700/50 rounded-xl bg-slate-800/30 flex items-center justify-center relative overflow-hidden">
              {theirOffer.locked && (
                <div className="absolute text-2xl text-green-500/40 font-black rotate-12">LOCKED</div>
              )}
              <Text variant="caption">Their items</Text>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
              <Coins size={14} className="text-yellow-400" />
              <Text variant="body" className="flex-1">Zeny</Text>
              <Text variant="value" className="text-yellow-400 text-xs">{theirOffer.zeny}Z</Text>
            </div>
            <Badge
              variant={theirOffer.locked ? 'success' : 'default'}
              size="md"
              className="w-full text-center justify-center"
            >
              <Check size={12} className="inline mr-1" /> {theirOffer.locked ? 'Ready' : 'Waiting...'}
            </Badge>
          </Section>
        </div>

        <Button
          variant="success"
          size="lg"
          disabled={!canAccept || myOffer.accepted}
          onClick={acceptTrade}
          className="w-full mt-4"
        >
          <Check size={16} /> {myOffer.accepted ? 'Accepted' : 'Complete Trade'}
        </Button>
      </Modal>
    );
  }

  return null;
}
