'use client';

import React, { useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useNetworkStore } from '@/store/useNetworkStore';

export function NetworkManager() {
  const initSocket = useNetworkStore(state => state.initSocket);
  const position = useGameStore(state => state.position);
  const player = useGameStore(state => state.player);

  useEffect(() => {
    initSocket(player.name);
  }, [initSocket, player.name]);

  useEffect(() => {
    const broadcastPosition = useNetworkStore.getState().broadcastPosition;
    broadcastPosition({ x: position.x, y: position.y, z: position.z, name: player.name });
  }, [position, player.name]);

  return null;
}
