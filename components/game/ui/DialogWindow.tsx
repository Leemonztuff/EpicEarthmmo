'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Modal, Text, Button } from '@/components/ui';
import { MessageCircle } from 'lucide-react';
import { gameData } from '@/shared/loader';

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

  return (
    <Modal isOpen onClose={handleClose} title={dialog.npcName} subtitle="NPC" position="bottom" size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
            <MessageCircle size={20} className="text-indigo-400" />
          </div>
          <div className="flex-1">
            <Text variant="caption" className="text-indigo-400/60 text-xs font-bold mb-1">
              {currentLine?.speaker || dialog.npcName}
            </Text>
            <p className="text-white/80 text-sm leading-relaxed">
              {currentLine?.text}
            </p>
          </div>
        </div>

        <div className="h-px bg-white/5" />

        {currentLine?.responses && currentLine.responses.length > 0 ? (
          <div className="space-y-2">
            {currentLine.responses.map((response: any, i: number) => (
              <Button
                key={i}
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => handleResponse(response)}
                className="justify-start text-left h-auto py-2.5"
              >
                {response.text}
              </Button>
            ))}
          </div>
        ) : (
          <Button variant="primary" size="sm" fullWidth onClick={handleNext}>
            {isLastLine ? 'Close' : 'Continue'}
          </Button>
        )}
      </div>
    </Modal>
  );
}
