import { Texture, TextureLoader, RepeatWrapping, ClampToEdgeWrapping, CanvasTexture } from 'three';

const textureLoader = typeof window !== 'undefined' ? new TextureLoader() : null;
const textureCache = new Map<string, Texture>();
const canvasCache = new Map<string, CanvasTexture>();
const failedTextures = new Set<string>();

// ─── Direction system ───────────────────────────────────────────

export type Direction = 'S' | 'SW' | 'W' | 'NW' | 'N' | 'NE' | 'E' | 'SE';

export const DIRECTIONS: Direction[] = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];

export function directionFromAngle(dx: number, dz: number): Direction {
  if (dx === 0 && dz === 0) return 'S';
  const angle = Math.atan2(dx, -dz);
  const i = Math.round(((angle + Math.PI + Math.PI / 8) % (Math.PI * 2)) / (Math.PI / 4)) % 8;
  return DIRECTIONS[i];
}

// ─── Animation types ────────────────────────────────────────────

export type AnimState = 'idle' | 'walk' | 'attack' | 'hit' | 'dead';

// ─── Sprite configuration ───────────────────────────────────────

interface AnimConfig {
  frames: number;
  durationMs: number;
}

interface EntityConfig {
  folder: string;
  animations: Record<AnimState, AnimConfig>;
}

const ENTITY_REGISTRY: Record<string, EntityConfig> = {
  novice_m: {
    folder: 'characters/novice_m',
    animations: {
      idle:   { frames: 1, durationMs: 600 },
      walk:   { frames: 4, durationMs: 600 },
      attack: { frames: 3, durationMs: 300 },
      hit:    { frames: 2, durationMs: 400 },
      dead:   { frames: 4, durationMs: 1200 },
    },
  },
  novice_f: {
    folder: 'characters/novice_f',
    animations: {
      idle:   { frames: 1, durationMs: 600 },
      walk:   { frames: 4, durationMs: 600 },
      attack: { frames: 3, durationMs: 300 },
      hit:    { frames: 2, durationMs: 400 },
      dead:   { frames: 4, durationMs: 1200 },
    },
  },
  swordsman_m: {
    folder: 'characters/swordsman_m',
    animations: {
      idle:   { frames: 1, durationMs: 600 },
      walk:   { frames: 4, durationMs: 600 },
      attack: { frames: 4, durationMs: 350 },
      hit:    { frames: 2, durationMs: 400 },
      dead:   { frames: 4, durationMs: 1200 },
    },
  },
  mage_m: {
    folder: 'characters/mage_m',
    animations: {
      idle:   { frames: 1, durationMs: 600 },
      walk:   { frames: 4, durationMs: 600 },
      attack: { frames: 4, durationMs: 400 },
      hit:    { frames: 2, durationMs: 400 },
      dead:   { frames: 4, durationMs: 1200 },
    },
  },
  archer_m: {
    folder: 'characters/archer_m',
    animations: {
      idle:   { frames: 1, durationMs: 600 },
      walk:   { frames: 4, durationMs: 600 },
      attack: { frames: 4, durationMs: 350 },
      hit:    { frames: 2, durationMs: 400 },
      dead:   { frames: 4, durationMs: 1200 },
    },
  },
  thief_m: {
    folder: 'characters/thief_m',
    animations: {
      idle:   { frames: 1, durationMs: 600 },
      walk:   { frames: 4, durationMs: 600 },
      attack: { frames: 4, durationMs: 300 },
      hit:    { frames: 2, durationMs: 400 },
      dead:   { frames: 4, durationMs: 1200 },
    },
  },
  acolyte_m: {
    folder: 'characters/acolyte_m',
    animations: {
      idle:   { frames: 1, durationMs: 600 },
      walk:   { frames: 4, durationMs: 600 },
      attack: { frames: 3, durationMs: 350 },
      hit:    { frames: 2, durationMs: 400 },
      dead:   { frames: 4, durationMs: 1200 },
    },
  },
  poring: {
    folder: 'monsters/poring',
    animations: {
      idle:   { frames: 2, durationMs: 800 },
      walk:   { frames: 2, durationMs: 500 },
      attack: { frames: 2, durationMs: 400 },
      hit:    { frames: 1, durationMs: 300 },
      dead:   { frames: 3, durationMs: 900 },
    },
  },
  fabre: {
    folder: 'monsters/fabre',
    animations: {
      idle:   { frames: 2, durationMs: 800 },
      walk:   { frames: 4, durationMs: 600 },
      attack: { frames: 2, durationMs: 400 },
      hit:    { frames: 1, durationMs: 300 },
      dead:   { frames: 3, durationMs: 900 },
    },
  },
  pupa: {
    folder: 'monsters/pupa',
    animations: {
      idle:   { frames: 2, durationMs: 1000 },
      walk:   { frames: 1, durationMs: 600 },
      attack: { frames: 2, durationMs: 500 },
      hit:    { frames: 1, durationMs: 300 },
      dead:   { frames: 3, durationMs: 900 },
    },
  },
  lunatic: {
    folder: 'monsters/lunatic',
    animations: {
      idle:   { frames: 2, durationMs: 600 },
      walk:   { frames: 4, durationMs: 400 },
      attack: { frames: 2, durationMs: 350 },
      hit:    { frames: 1, durationMs: 300 },
      dead:   { frames: 3, durationMs: 900 },
    },
  },
  wolf: {
    folder: 'monsters/wolf',
    animations: {
      idle:   { frames: 2, durationMs: 800 },
      walk:   { frames: 4, durationMs: 500 },
      attack: { frames: 3, durationMs: 350 },
      hit:    { frames: 1, durationMs: 300 },
      dead:   { frames: 3, durationMs: 900 },
    },
  },
  spore: {
    folder: 'monsters/spore',
    animations: {
      idle:   { frames: 2, durationMs: 1000 },
      walk:   { frames: 2, durationMs: 600 },
      attack: { frames: 2, durationMs: 400 },
      hit:    { frames: 1, durationMs: 300 },
      dead:   { frames: 3, durationMs: 900 },
    },
  },
};

// ─── Fallback drawing functions ─────────────────────────────────

type FallbackDraw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

const FALLBACK_DRAWS: Record<string, FallbackDraw> = {};

function drawNovice(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#8B4513';
  ctx.beginPath();
  ctx.arc(32, 18, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#A0522D';
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (i - 2) * 0.3;
    ctx.beginPath();
    ctx.arc(32 + Math.cos(angle) * 10, 18 + Math.sin(angle) * 10, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ffd5a0';
  ctx.beginPath();
  ctx.arc(32, 20, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#333';
  ctx.fillRect(27, 18, 3, 3);
  ctx.fillRect(34, 18, 3, 3);
  ctx.fillStyle = '#c97';
  ctx.fillRect(30, 24, 4, 1);
  ctx.fillStyle = '#2a7a9e';
  ctx.beginPath();
  ctx.moveTo(22, 26);
  ctx.lineTo(42, 26);
  ctx.lineTo(44, 42);
  ctx.lineTo(20, 42);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(22, 37, 20, 2);
  ctx.fillStyle = '#ffd5a0';
  ctx.fillRect(16, 28, 6, 4);
  ctx.fillRect(42, 28, 6, 4);
  ctx.fillStyle = '#4a4a6a';
  ctx.fillRect(24, 42, 6, 10);
  ctx.fillRect(34, 42, 6, 10);
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(23, 50, 8, 3);
  ctx.fillRect(33, 50, 8, 3);
}

function drawPoring(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#ff8cb0';
  ctx.beginPath();
  ctx.ellipse(32, 36, 18, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffb0d0';
  ctx.beginPath();
  ctx.ellipse(32, 38, 10, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#333';
  ctx.fillRect(18, 28, 6, 6);
  ctx.fillRect(40, 28, 6, 6);
  ctx.fillStyle = 'white';
  ctx.fillRect(20, 29, 2, 2);
  ctx.fillRect(42, 29, 2, 2);
  ctx.fillStyle = '#cc6688';
  ctx.beginPath();
  ctx.arc(32, 40, 4, 0.1, Math.PI - 0.1);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#ffb0b0';
  ctx.beginPath();
  ctx.arc(16, 38, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(48, 38, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e07090';
  ctx.beginPath();
  ctx.ellipse(14, 22, 4, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(50, 22, 4, 6, 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawFabre(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const segments = [
    { x: 32, y: 42, r: 8, color: '#6ab04c' },
    { x: 32, y: 34, r: 7, color: '#7dce5a' },
    { x: 32, y: 27, r: 6, color: '#8de06a' },
    { x: 32, y: 21, r: 5, color: '#9df07a' },
  ];
  for (const seg of segments) {
    ctx.fillStyle = seg.color;
    ctx.beginPath();
    ctx.arc(seg.x, seg.y, seg.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#333';
  ctx.fillRect(28, 20, 3, 4);
  ctx.fillRect(33, 20, 3, 4);
  ctx.strokeStyle = '#5a9a3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(28, 17);
  ctx.lineTo(22, 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(36, 17);
  ctx.lineTo(42, 10);
  ctx.stroke();
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.arc(22, 10, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(42, 10, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawPupa(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#c4a87a';
  ctx.beginPath();
  ctx.ellipse(32, 34, 16, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a08060';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (i - 2) * 0.4;
    ctx.beginPath();
    ctx.moveTo(32, 34);
    ctx.lineTo(32 + Math.cos(angle) * 14, 34 + Math.sin(angle) * 14);
    ctx.stroke();
  }
  ctx.fillStyle = '#8a7a5a';
  ctx.beginPath();
  ctx.ellipse(32, 18, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.fillRect(28, 16, 3, 3);
  ctx.fillRect(33, 16, 3, 3);
}

function drawLunatic(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f0f0f0';
  ctx.beginPath();
  ctx.ellipse(32, 36, 14, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ddd';
  ctx.beginPath();
  ctx.ellipse(32, 38, 8, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#333';
  ctx.fillRect(22, 28, 5, 5);
  ctx.fillRect(37, 28, 5, 5);
  ctx.fillStyle = 'white';
  ctx.fillRect(24, 29, 2, 2);
  ctx.fillRect(39, 29, 2, 2);
  ctx.fillStyle = '#ff8cb0';
  ctx.beginPath();
  ctx.arc(32, 38, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e0e0e0';
  ctx.beginPath();
  ctx.ellipse(16, 20, 5, 10, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(48, 20, 5, 10, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffaaaa';
  ctx.beginPath();
  ctx.ellipse(16, 14, 3, 5, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(48, 14, 3, 5, 0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawWolf(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#666';
  ctx.beginPath();
  ctx.ellipse(32, 36, 18, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#888';
  ctx.beginPath();
  ctx.ellipse(32, 38, 12, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#555';
  ctx.beginPath();
  ctx.ellipse(48, 28, 8, 7, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff4444';
  ctx.fillRect(50, 26, 3, 3);
  ctx.fillStyle = '#444';
  ctx.beginPath();
  ctx.moveTo(44, 22);
  ctx.lineTo(42, 14);
  ctx.lineTo(48, 20);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(52, 22);
  ctx.lineTo(54, 14);
  ctx.lineTo(50, 20);
  ctx.fill();
  ctx.fillStyle = '#777';
  ctx.beginPath();
  ctx.ellipse(14, 36, 6, 4, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawSpore(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#8B4513';
  ctx.beginPath();
  ctx.ellipse(32, 42, 8, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#CD853F';
  ctx.beginPath();
  ctx.ellipse(32, 26, 16, 10, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#DEB887';
  ctx.beginPath();
  ctx.ellipse(32, 26, 12, 7, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#333';
  ctx.fillRect(26, 32, 3, 3);
  ctx.fillRect(35, 32, 3, 3);
  ctx.fillStyle = '#ff8';
  ctx.beginPath();
  ctx.arc(20, 22, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(32, 18, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(44, 22, 3, 0, Math.PI * 2);
  ctx.fill();
}

FALLBACK_DRAWS['novice_m'] = drawNovice;
FALLBACK_DRAWS['novice_f'] = drawNovice;
FALLBACK_DRAWS['swordsman_m'] = drawNovice;
FALLBACK_DRAWS['mage_m'] = drawNovice;
FALLBACK_DRAWS['archer_m'] = drawNovice;
FALLBACK_DRAWS['thief_m'] = drawNovice;
FALLBACK_DRAWS['acolyte_m'] = drawNovice;
FALLBACK_DRAWS['poring'] = drawPoring;
FALLBACK_DRAWS['fabre'] = drawFabre;
FALLBACK_DRAWS['pupa'] = drawPupa;
FALLBACK_DRAWS['lunatic'] = drawLunatic;
FALLBACK_DRAWS['wolf'] = drawWolf;
FALLBACK_DRAWS['spore'] = drawSpore;

// ─── Load / cache ───────────────────────────────────────────────

function getConfig(entityId: string): EntityConfig | undefined {
  return ENTITY_REGISTRY[entityId];
}

function getSpritePath(entityId: string, state: AnimState, dir: Direction): string | null {
  const config = getConfig(entityId);
  if (!config) return null;
  return `/assets/sprites/${config.folder}/${entityId}_${state}_${dir.toLowerCase()}.png`;
}

function isTextureReady(tex: Texture): boolean {
  const img = tex.image as HTMLImageElement | undefined;
  return !!img && img.width > 0 && img.height > 0;
}

function loadTexture(path: string): Texture | null {
  if (!textureLoader) return null;
  if (failedTextures.has(path)) return null;
  const cached = textureCache.get(path);
  if (cached) return cached;

  const tex = textureLoader.load(path);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  textureCache.set(path, tex);

  const img = tex.image;
  if (img instanceof HTMLImageElement) {
    img.onerror = () => {
      failedTextures.add(path);
      textureCache.delete(path);
    };
  }

  return tex;
}

function getFallbackTexture(entityId: string): CanvasTexture | null {
  const draw = FALLBACK_DRAWS[entityId];
  if (!draw || typeof document === 'undefined') return null;

  const key = `fallback_${entityId}`;
  const cached = canvasCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, 64, 64);
  const tex = new CanvasTexture(canvas);
  canvasCache.set(key, tex);
  return tex;
}

// ─── Public API ─────────────────────────────────────────────────

export interface SpriteFrame {
  texture: Texture | null;
  offsetX: number;
  offsetY: number;
  repeatX: number;
  repeatY: number;
  frameIndex: number;
  totalFrames: number;
}

export function getSpriteFrame(
  entityId: string,
  state: AnimState,
  dir: Direction,
  elapsedMs: number,
): SpriteFrame {
  const config = getConfig(entityId);
  const anim = config?.animations[state];
  const frames = anim?.frames ?? 1;
  const duration = anim?.durationMs ?? 600;

  const path = getSpritePath(entityId, state, dir);

  let texture: Texture | null = null;

  if (path) {
    texture = loadTexture(path);
    if (texture && !isTextureReady(texture)) {
      texture = getFallbackTexture(entityId);
    }
  } else {
    texture = getFallbackTexture(entityId);
  }

  if (frames <= 1) {
    return { texture, offsetX: 0, offsetY: 0, repeatX: 1, repeatY: 1, frameIndex: 0, totalFrames: 1 };
  }

  const frameIndex = Math.floor((elapsedMs % duration) / (duration / frames));
  const clampedIndex = Math.min(frameIndex, frames - 1);
  const repeatX = 1 / frames;

  return {
    texture,
    offsetX: clampedIndex * repeatX,
    offsetY: 0,
    repeatX,
    repeatY: 1,
    frameIndex: clampedIndex,
    totalFrames: frames,
  };
}

export function prefetchEntity(entityId: string): void {
  const config = getConfig(entityId);
  if (!config) return;

  for (const state of Object.keys(config.animations) as AnimState[]) {
    for (const dir of DIRECTIONS) {
      const path = getSpritePath(entityId, state, dir);
      if (path) loadTexture(path);
    }
  }
}

export function hasSprite(entityId: string): boolean {
  return !!ENTITY_REGISTRY[entityId];
}

export function registerEntity(entityId: string, config: EntityConfig): void {
  ENTITY_REGISTRY[entityId] = config;
}
