'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { MessageSquare, X, ChevronRight } from 'lucide-react';
import { gameData } from '@/shared/loader';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';

export function DialogWindow() {
  const dialogState = useGameStore(state => state.dialogState);
  const setDialogState = useGameStore(state => state.setDialogState);

  if (!dialogState.isOpen || !dialogState.dialog) return null;

  const dialog = dialogState.dialog;
  const currentLine = dialog.lines[dialogState.currentLineIndex];
  const isLastLine = dialogState.currentLineIndex >= dialog.lines.length - 1;

  const handleNext = () => {
    if (isLastLine) {
      setDialogState({ isOpen: false, dialog: null, currentLineIndex: 0, selectedResponse: null });
      return;
    }
    setDialogState({ currentLineIndex: dialogState.currentLineIndex + 1 });
  };

  const handleResponse = (response: any) => {
    if (response.action === 'close') {
      setDialogState({ isOpen: false, dialog: null, currentLineIndex: 0, selectedResponse: null });
      return;
    }
    if (response.action === 'shop') {
      const mapData = gameData.maps.find((m: any) => m.id === useGameStore.getState().currentMapId);
      const npc = (mapData as any)?.npcs?.find((n: any) => n.dialogId === dialog?.id);
      if (npc) useGameStore.getState().setShopNpcId(npc.id);
      setDialogState({ isOpen: false, dialog: null, currentLineIndex: 0, selectedResponse: null });
      return;
    }
    if (response.nextDialogId) {
      setDialogState({ selectedResponse: response.text });
      handleNext();
      return;
    }
    handleNext();
  };

  const handleClose = () => {
    setDialogState({ isOpen: false, dialog: null, currentLineIndex: 0, selectedResponse: null });
  };

  const speakerName = currentLine?.speaker || dialog.npcName;

  return (
    <AnimatePresence>
      {dialogState.isOpen && (
        <div className="fixed inset-x-0 bottom-0 z-[100] flex justify-center p-4 pointer-events-none pb-safe">
          {/* Custom Floating Dialog Box Panel */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="pointer-events-auto w-full max-w-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/60 rounded-[1.5rem] shadow-[0_15px_30px_rgba(0,0,0,0.6)] ro-double-border flex flex-col overflow-hidden text-white select-none"
          >
            {/* Header: Compact with Speaker and Close Button */}
            <div className="ro-window-header flex items-center justify-between px-4 py-2 border-b border-white/5 shrink-0 h-[38px]">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
                  <MessageSquare size={11} className="text-indigo-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/90">
                  Conversation
                </span>
              </div>
              <button
                onClick={handleClose}
                className="w-5 h-5 rounded bg-red-950/40 border border-red-950/60 hover:bg-red-700/80 flex items-center justify-center text-red-200 hover:text-white transition-all cursor-pointer outline-none"
              >
                <X size={10} strokeWidth={3} />
              </button>
            </div>

            {/* Conversation content and options */}
            <div className="p-4 flex flex-col gap-3 min-h-[120px] justify-between">
              
              {/* Speaker & Text Block */}
              <div className="space-y-1">
                {/* Speaker tag with classic RO gradient badge */}
                <div className="inline-flex px-2 py-0.5 bg-gradient-to-r from-blue-700 to-indigo-600 rounded text-[9px] font-black uppercase tracking-widest text-white leading-none border border-blue-400/20 shadow">
                  {speakerName}
                </div>

                <p className="text-xs font-bold text-slate-100 leading-relaxed pt-1.5">
                  {currentLine?.text}
                </p>
              </div>

              {/* Action Buttons or NPC Options */}
              <div className="pt-1">
                {currentLine?.responses && currentLine.responses.length > 0 ? (
                  <div className="grid grid-cols-1 gap-1.5">
                    {currentLine.responses.map((response: any, i: number) => (
                      <motion.button
                        key={i}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleResponse(response)}
                        className="flex items-center justify-between w-full h-10 px-4 py-2.5 bg-slate-900/60 hover:bg-indigo-900/40 border border-slate-800 hover:border-indigo-500/30 text-slate-200 hover:text-white rounded-xl text-left text-[11px] font-extrabold uppercase tracking-wide transition-all duration-200 cursor-pointer shadow outline-none"
                      >
                        <span>{response.text}</span>
                        <ChevronRight size={12} className="text-slate-500 shrink-0" />
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.99 }}
                    onClick={handleNext}
                    className="flex items-center justify-center w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/30 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-98 cursor-pointer outline-none"
                  >
                    <span>{isLastLine ? 'Close Conversation' : 'Continue'}</span>
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
