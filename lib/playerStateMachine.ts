import { type Direction, type AnimState } from './spriteManager';

export type PlayerPhase = 'idle' | 'walk' | 'attack' | 'interact' | 'dead';

export interface PlayerStateMachine {
  phase: PlayerPhase;
  animState: AnimState;
  direction: Direction;
  isMoving: boolean;
  targetEntityId: string | null;
  attackTimer: number;
}

export function createPlayerStateMachine(): PlayerStateMachine {
  return {
    phase: 'idle',
    animState: 'idle',
    direction: 'S',
    isMoving: false,
    targetEntityId: null,
    attackTimer: 0,
  };
}

export function updatePlayerStateMachine(
  sm: PlayerStateMachine,
  delta: number,
  isMovingInput: boolean,
  hasVelocity: boolean,
  direction: Direction,
  isAttacking: boolean,
): PlayerStateMachine {
  const next = { ...sm };
  next.isMoving = hasVelocity;
  next.direction = direction;

  if (next.attackTimer > 0) next.attackTimer = Math.max(0, next.attackTimer - delta);

  if (isAttacking) {
    next.phase = 'attack';
    next.animState = 'attack';
    return next;
  }

  if (next.phase === 'attack' && next.attackTimer <= 0) {
    next.phase = hasVelocity ? 'walk' : 'idle';
  }

  if (next.phase === 'dead') {
    next.animState = 'dead';
    return next;
  }

  if (hasVelocity) {
    next.phase = 'walk';
    next.animState = 'walk';
  } else {
    next.phase = 'idle';
    next.animState = 'idle';
  }

  return next;
}
