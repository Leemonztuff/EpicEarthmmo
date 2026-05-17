import React from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { BottomSheet } from './hud/BottomSheet';
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
            <div className="w-14 h-14 rounded-full bg-blue-600/30 border-2 border-blue-500/50 flex items-center justify-center mx-auto mb-3">
              <Coins size={24} className="text-blue-400" />
            </div>
            <p className="text-white text-sm mb-1">Trade Request</p>
            <p className="text-amber-400 font-bold text-base mb-4">{tradeRequest.name}</p>
            <div className="flex gap-3">
              <button
                onClick={acceptTradeRequest}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 touch-manipulation active:scale-95 transition-all"
              >
                <Check size={16} /> Accept
              </button>
              <button
                onClick={declineTradeRequest}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 touch-manipulation active:scale-95 transition-all"
              >
                <X size={16} /> Decline
              </button>
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
      <BottomSheet title="Trade" onClose={cancelTrade}>
        <div className="grid grid-cols-2 gap-3">
          {/* My Side */}
          <div className="space-y-2">
            <h3 className="text-blue-400 font-bold text-xs text-center uppercase tracking-wider">Your Offer</h3>
            <div className="h-24 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/30 flex items-center justify-center">
              <span className="text-xs text-slate-500">Items (TBA)</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
              <Coins size={14} className="text-yellow-400" />
              <span className="text-slate-300 text-xs flex-1">Zeny</span>
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
            <button
              onClick={lockTrade}
              disabled={myOffer.locked}
              className={`w-full py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 touch-manipulation active:scale-95 transition-all ${
                myOffer.locked ? 'bg-slate-700/50 text-slate-500' : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              <Lock size={12} /> {myOffer.locked ? 'Locked' : 'Lock Offer'}
            </button>
          </div>

          {/* Their Side */}
          <div className="space-y-2 relative">
            <h3 className="text-red-400 font-bold text-xs text-center uppercase tracking-wider">Their Offer</h3>
            <div className="h-24 border-2 border-slate-700/50 rounded-xl bg-slate-800/30 flex items-center justify-center relative overflow-hidden">
              {theirOffer.locked && (
                <div className="absolute text-2xl text-green-500/40 font-black rotate-12">LOCKED</div>
              )}
              <span className="text-xs text-slate-500">Their items</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
              <Coins size={14} className="text-yellow-400" />
              <span className="text-slate-300 text-xs flex-1">Zeny</span>
              <span className="text-xs font-bold text-yellow-400">{theirOffer.zeny}Z</span>
            </div>
            <div className={`py-2 text-xs font-bold text-center rounded-lg flex items-center justify-center gap-1.5 ${
              theirOffer.locked ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-slate-800/50 text-slate-500'
            }`}>
              <Check size={12} /> {theirOffer.locked ? 'Ready' : 'Waiting...'}
            </div>
          </div>
        </div>

        <button
          onClick={acceptTrade}
          disabled={!canAccept || myOffer.accepted}
          className={`w-full mt-4 py-3 font-bold text-sm rounded-xl flex items-center justify-center gap-2 touch-manipulation active:scale-95 transition-all ${
            canAccept && !myOffer.accepted
              ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/30'
              : 'bg-slate-800/50 text-slate-500'
          }`}
        >
          <Check size={16} /> {myOffer.accepted ? 'Accepted' : 'Complete Trade'}
        </button>
      </BottomSheet>
    );
  }

  return null;
}
