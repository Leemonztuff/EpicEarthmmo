import { touchInput } from './touchInput';

const keys: Record<string, boolean> = {};

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => { keys[e.code] = true; });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
}

export interface MovementInput {
  x: number;
  z: number;
}

let keyboardInput: MovementInput = { x: 0, z: 0 };

export function getRawKeyboardInput(): MovementInput {
  let x = 0;
  let z = 0;

  if (keys['KeyA'] || keys['ArrowLeft']) x -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) x += 1;
  if (keys['KeyW'] || keys['ArrowUp']) z -= 1;
  if (keys['KeyS'] || keys['ArrowDown']) z += 1;

  keyboardInput = { x, z };
  return { x, z };
}

export function hasAnyKeyboardInput(): boolean {
  return keyboardInput.x !== 0 || keyboardInput.z !== 0;
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
  const kb = getRawKeyboardInput();
  const hasKeyboard = kb.x !== 0 || kb.z !== 0;

  if (hasKeyboard) {
    return { input: normalizeInput(kb), hasKeyboardInput: true };
  }

  const touch = getTouchInput();
  return { input: normalizeInput(touch), hasKeyboardInput: false };
}
