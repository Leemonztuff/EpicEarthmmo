import { useGameStore } from '@/store/useGameStore';
import { useNetworkStore } from '@/store/useNetworkStore';
import { gameData } from '@/shared/loader';

const { dialogs } = gameData;

export type InteractionType = 'npc' | 'chest' | 'warp' | 'enemy';

export interface InteractionTarget {
  type: InteractionType;
  id: string;
  position: { x: number; z: number };
}

export function startInteraction(target: InteractionTarget) {
  const store = useGameStore.getState();
  store.setInteractionTarget(target);
  store.setTargetPosition({ x: target.position.x, z: target.position.z });
}

export function performInteraction(target: InteractionTarget) {
  const store = useGameStore.getState();

  switch (target.type) {
    case 'npc': {
      const networkStore = useNetworkStore.getState();
      const mapData = networkStore.currentMapData;
      const npc = (mapData?.npcs || []).find((n: any) => n.id === target.id);
      if (npc) {
        const dialog = (dialogs?.dialogs || []).find(d => d.id === npc.dialogId);
        if (dialog) {
          store.setDialogState({ isOpen: true, dialog, currentLineIndex: 0, selectedResponse: null });
        }
      }
      break;
    }
    case 'chest': {
      import('@/store/useNetworkStore').then(m => {
        m.useNetworkStore.getState().socket?.emit('openChest', { chestId: target.id });
      });
      break;
    }
    case 'warp': {
      import('@/store/useNetworkStore').then(m => {
        m.useNetworkStore.getState().requestWarp(target.id);
      });
      break;
    }
    case 'enemy': {
      store.setSelectedTargetId(target.id);
      break;
    }
  }

  store.setInteractionTarget(null);
  store.setTargetPosition(null);
}
