'use client';

import React, { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useNetworkStore } from '@/store/useNetworkStore';

const INPUT_RATE_MS = 50;

export function NetworkManager() {
  const initSocket = useNetworkStore(state => state.initSocket);
  const player = useGameStore(state => state.player);
  const inputSeqRef = useRef(0);

  useEffect(() => {
    inputSeqRef.current = 0;
    initSocket(player.name);
    const inputRef = setInterval(() => {
      const { inputDirection } = useGameStore.getState();
      const { socket, sendInput } = useNetworkStore.getState();
      if (!socket?.connected) return;
      inputSeqRef.current++;
      sendInput({ dirX: inputDirection.x, dirZ: inputDirection.z, seq: inputSeqRef.current });
    }, INPUT_RATE_MS);

    return () => {
      clearInterval(inputRef);
      const s = useNetworkStore.getState().socket;
      s?.disconnect();
    };
  }, [initSocket, player.name]);

  return null;
}
