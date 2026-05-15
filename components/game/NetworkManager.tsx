'use client';

import React, { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useNetworkStore } from '@/store/useNetworkStore';

export function NetworkManager() {
  const initSocket = useNetworkStore(state => state.initSocket);
  const position = useGameStore(state => state.position);
  const player = useGameStore(state => state.player);
  const lastBroadcastRef = useRef(0);

  useEffect(() => {
    initSocket(player.name);
    return () => {
      const s = useNetworkStore.getState().socket;
      s?.disconnect();
    };
  }, [initSocket, player.name]);

  useEffect(() => {
    const now = Date.now();
    if (now - lastBroadcastRef.current < 66) return;
    lastBroadcastRef.current = now;

    const networkStore = useNetworkStore.getState();
    if (!networkStore.socket?.connected) return;
    networkStore.broadcastPosition({ x: position.x, y: position.y, z: position.z, name: player.name });
  }, [position, player.name]);

  return null;
}
