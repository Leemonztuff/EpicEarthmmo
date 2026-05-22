import { useNetworkStore } from '@/store/useNetworkStore';

export type InteractionType = 'npc' | 'chest' | 'warp';

export interface InteractionTarget {
  type: InteractionType;
  id: string;
  position: { x: number; z: number };
}

export function startInteraction(target: InteractionTarget) {
  const networkStore = useNetworkStore.getState();

  networkStore.sendMoveToTarget({
    targetX: target.position.x,
    targetZ: target.position.z,
    interaction: { type: target.type, id: target.id },
  });
}
