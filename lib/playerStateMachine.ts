import { type Direction, type AnimState } from './spriteManager';

export type PlayerPhase = 'idle' | 'walk' | 'attack' | 'interact' | 'dead';

export interface PlayerStateMachine {
  phase: PlayerPhase;
  animState: AnimState;
  direction: Direction;
  movementInput: { x: number; z: number };
  targetEntityId: string | null;
  interactTargetId: string | null;
  attackTimer: number;
  interactTimer: number;
  stuckTimer: number;
  lastPosition: { x: number; z: number };
}

export function createPlayerStateMachine(): PlayerStateMachine {
  return {
    phase: 'idle',
    animState: 'idle',
    direction: 'S',
    movementInput: { x: 0, z: 0 },
    targetEntityId: null,
    interactTargetId: null,
    attackTimer: 0,
    interactTimer: 0,
    stuckTimer: 0,
    lastPosition: { x: 0, z: 0 },
  };
}

export function updatePlayerStateMachine(
  sm: PlayerStateMachine,
  delta: number,
  input: { x: number; z: number },
  currentPos: { x: number; z: number },
): PlayerStateMachine {
  const next = { ...sm };

  const isMovingInput = Math.abs(input.x) > 0.01 || Math.abs(input.z) > 0.01;
  const isMoving = isMovingInput || next.targetEntityId !== null || next.interactTargetId !== null;
  const distanceMoved = Math.hypot(
    currentPos.x - next.lastPosition.x,
    currentPos.z - next.lastPosition.z,
  );

  next.lastPosition = { x: currentPos.x, z: currentPos.z };
  next.movementInput = input;

  if (distanceMoved < 0.001) {
    next.stuckTimer += delta;
  } else {
    next.stuckTimer = 0;
  }

  if (next.attackTimer > 0) next.attackTimer = Math.max(0, next.attackTimer - delta);
  if (next.interactTimer > 0) next.interactTimer = Math.max(0, next.interactTimer - delta);

  switch (next.phase) {
    case 'idle':
      if (isMovingInput) {
        next.phase = 'walk';
      }
      break;

    case 'walk':
      if (!isMoving) {
        next.phase = 'idle';
      }
      if (next.stuckTimer > 3 && isMovingInput) {
        next.stuckTimer = 0;
      }
      break;

    case 'attack':
      if (next.attackTimer <= 0) {
        next.phase = 'idle';
      }
      break;

    case 'interact':
      if (next.interactTimer <= 0) {
        next.phase = 'idle';
        next.interactTargetId = null;
      }
      break;

    case 'dead':
      break;
  }

  if (isMovingInput && next.phase !== 'attack' && next.phase !== 'interact' && next.phase !== 'dead') {
    next.phase = 'walk';
  }

  if (next.phase === 'walk') {
    next.animState = 'walk';
  } else if (next.phase === 'attack') {
    next.animState = 'attack';
  } else if (next.phase === 'interact') {
    next.animState = 'idle';
  } else if (next.phase === 'dead') {
    next.animState = 'dead';
  } else {
    next.animState = 'idle';
  }

  return next;
}
