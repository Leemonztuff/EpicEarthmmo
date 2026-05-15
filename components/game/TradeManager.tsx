import React from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';

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
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-900 border-2 border-blue-400 p-4 rounded shadow-lg pointer-events-auto text-center font-sans z-50">
        <p className="text-white text-sm mb-4">
          <span className="font-bold text-amber-300">{tradeRequest.name}</span> quiere comerciar contigo.
        </p>
        <div className="flex gap-4 justify-center">
          <button onClick={acceptTradeRequest} className="bg-green-600 hover:bg-green-500 text-white font-bold py-1 px-4 rounded text-sm shadow">Aceptar</button>
          <button onClick={declineTradeRequest} className="bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-4 rounded text-sm shadow">Rechazar</button>
        </div>
      </div>
    );
  }

  if (activeTrade) {
    const { myOffer, theirOffer } = activeTrade;
    const canAccept = myOffer.locked && theirOffer.locked;

    // TODO: Connect items to actual inventory logic for dragging/dropping
    // For mock, we just show UI

    return (
      <div className="absolute top-10 left-10 w-[500px] bg-slate-200 border-2 border-slate-400 shadow-xl rounded-sm pointer-events-auto flex flex-col z-40">
        <div className="h-7 bg-gradient-to-b from-blue-700 to-blue-900 border-b border-slate-400 flex items-center justify-between px-2">
          <span className="text-xs font-bold text-white uppercase flex-1">Trade</span>
          <button onClick={cancelTrade} className="text-white hover:text-red-400 font-bold">&times;</button>
        </div>
        
        <div className="p-2 flex gap-2 font-sans overflow-hidden">
          {/* My Side */}
          <div className="flex-1 bg-white border border-slate-300 p-2 flex flex-col gap-2">
            <h3 className="text-xs font-bold text-blue-700 text-center border-b pb-1">Mi Oferta</h3>
            <div className="h-40 border bg-slate-50 flex items-center justify-center">
              <span className="text-xs text-slate-400">Arrastra items aqui</span>
            </div>
            <div className="flex justify-between items-center bg-blue-50 px-2 py-1 border rounded">
              <span className="text-xs font-bold">Zeny</span>
              <input 
                type="number" 
                value={myOffer.zeny}
                onChange={e => updateTradeOffer({ zeny: parseInt(e.target.value) || 0 })}
                disabled={myOffer.locked}
                className="w-20 text-right text-xs p-1 border rounded"
              />
            </div>
            <button 
              onClick={lockTrade} 
              disabled={myOffer.locked}
              className={`py-1 text-xs font-bold text-white rounded transition-colors ${myOffer.locked ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-500'}`}
            >
              OK (Lock)
            </button>
          </div>

          {/* Their Side */}
          <div className="flex-1 bg-white border border-slate-300 p-2 flex flex-col gap-2 relative">
            <h3 className="text-xs font-bold text-red-700 text-center border-b pb-1">Su Oferta</h3>
            {theirOffer.locked && <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl text-green-500 opacity-50 font-black rotate-12 pointer-events-none">LOCKED</div>}
            <div className="h-40 border bg-slate-50 flex items-center justify-center">
              <span className="text-xs text-slate-400">Items de {activeTrade.peerId.slice(0,5)}</span>
            </div>
            <div className="flex justify-between items-center bg-blue-50 px-2 py-1 border rounded">
              <span className="text-xs font-bold">Zeny</span>
              <span className="text-xs font-bold text-blue-800">{theirOffer.zeny}Z</span>
            </div>
            <div className={`py-1 text-xs font-bold text-center rounded ${theirOffer.locked ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-slate-100 text-slate-400'}`}>
              {theirOffer.locked ? 'Ready' : 'Waiting...'}
            </div>
          </div>
        </div>
        
        <div className="p-2 border-t border-slate-300 bg-slate-100 flex justify-center gap-4">
          <button 
            onClick={acceptTrade}
            disabled={!canAccept || myOffer.accepted}
            className={`px-8 py-2 font-bold text-white text-sm rounded shadow-sm transition-colors ${canAccept && !myOffer.accepted ? 'bg-green-600 hover:bg-green-500' : 'bg-slate-400 cursor-not-allowed'}`}
          >
            {myOffer.accepted ? 'Aceptado...' : 'Trade'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
