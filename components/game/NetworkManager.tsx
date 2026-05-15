'use client';

import React, { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useNetworkStore } from '@/store/useNetworkStore';

const INPUT_RATE_MS = 50;
let inputSeq = 0;

export function NetworkManager() {
  const initSocket = useNetworkStore(state => state.initSocket);
  const player = useGameStore(state => state.player);

  useEffect(() => {
    initSocket(player.name);
    const inputRef = setInterval(() => {
      const { inputDirection } = useGameStore.getState();
      const { socket, sendInput } = useNetworkStore.getState();
      if (!socket?.connected) return;
      sendInput({ dirX: inputDirection.x, dirZ: inputDirection.z, seq: ++inputSeq });
    }, INPUT_RATE_MS);

    return () => {
      clearInterval(inputRef);
      const s = useNetworkStore.getState().socket;
      s?.disconnect();
    };
  }, [initSocket, player.name]);

  return null;
}
