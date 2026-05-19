import { touchInput } from './touchInput';
import { gameData } from '@/shared/loader';

const { balance } = gameData;

const keys: Record<string, boolean> = {};

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => { keys[e.code] = true; });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
}

export interface MovementInput {
  x: number;
  z: number;
}

export interface MovementTarget {
  type: 'position' | 'entity';
  x: number;
  z: number;
  entityId?: string;
  arrived?: boolean;
}

export function getKeyboardInput(): MovementInput {
  let x = 0;
  let z = 0;

  if (keys['KeyA'] || keys['ArrowLeft']) x -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) x += 1;
  if (keys['KeyW'] || keys['ArrowUp']) z -= 1;
  if (keys['KeyS'] || keys['ArrowDown']) z += 1;

  return { x, z };
}

export function getTouchInput(): MovementInput {
  const joyX = touchInput.x;
  const joyZ = touchInput.z;
  if (Math.abs(joyX) > 0.1 || Math.abs(joyZ) > 0.1) {
    return { x: joyX, z: joyZ };
  }
  return { x: 0, z: 0 };
}

export function normalizeInput(input: MovementInput): MovementInput {
  const len = Math.sqrt(input.x * input.x + input.z * input.z);
  if (len > 1) {
    return { x: input.x / len, z: input.z / len };
  }
  return input;
}

export function getMovementInput(): { input: MovementInput; hasKeyboardInput: boolean } {
  const kb = getKeyboardInput();
  const hasKeyboard = kb.x !== 0 || kb.z !== 0;

  if (hasKeyboard) {
    return { input: normalizeInput(kb), hasKeyboardInput: true };
  }

  const touch = getTouchInput();
  return { input: normalizeInput(touch), hasKeyboardInput: false };
}

export function getTargetDirection(
  currentPos: { x: number; z: number },
  target: { x: number; z: number },
): MovementInput {
  const dx = target.x - currentPos.x;
  const dz = target.z - currentPos.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist < 0.3) return { x: 0, z: 0 };
  return { x: dx / dist, z: dz / dist };
}
