'use client';

import React, { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useNetworkStore } from '@/store/useNetworkStore';

const INPUT_RATE_MS = 50;

export function NetworkManager({ playerName }: { playerName: string }) {
  const initSocket = useNetworkStore(state => state.initSocket);
  const inputSeqRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    inputSeqRef.current = 0;
    initSocket(playerName);

    const inputRef = setInterval(() => {
      const gs = useGameStore.getState();
      const ns = useNetworkStore.getState();

      if (!ns.socket?.connected || !gs.inputDirection) return;

      inputSeqRef.current++;
      ns.sendInput({
        dirX: gs.inputDirection.x || 0,
        dirZ: gs.inputDirection.z || 0,
        seq: inputSeqRef.current
      });
    }, INPUT_RATE_MS);

    return () => {
      clearInterval(inputRef);
      const s = useNetworkStore.getState().socket;
      if (s) {
        s.disconnect();
      }
    };
  }, [initSocket, playerName]);

  return null;
}
