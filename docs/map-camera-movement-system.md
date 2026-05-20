# Sistema de Mapas, Cámara y Movimiento

**Proyecto:** EpicEarthMMO — MMORPG web isométrico (Ragnarok Online estilo)  
**Basado en:** Codebase existente (Next.js + R3F + Rapier + Socket.IO)  
**Estado:** Diseño consolidado v2.0  
**Fecha:** 2026-05-20  

---

## Tabla de Contenidos

1. [Arquitectura General](#1-arquitectura-general)
2. [Sistema de Mapas](#2-sistema-de-mapas)
3. [Grilla de Navegación](#3-grilla-de-navegación)
4. [Terreno Visual](#4-terreno-visual)
5. [Sistema de Cámara](#5-sistema-de-cámara)
6. [Sistema de Movimiento](#6-sistema-de-movimiento)
7. [Profundidad Visual y Sorting](#7-profundidad-visual-y-sorting)
8. [Entidades Dinámicas](#8-entidades-dinámicas)
9. [Iluminación y Ambiente](#9-iluminación-y-ambiente)
10. [Streaming y Performance](#10-streaming-y-performance)
11. [Formato de Datos de Mapa](#11-formato-de-datos-de-mapa)
12. [Herramientas y Pipeline](#12-herramientas-y-pipeline)
13. [Plan de Implementación](#13-plan-de-implementación)

---

## 1. Arquitectura General

### 1.1 Capas del Mundo

Cada mapa se compone de capas independientes, renderizadas en orden:

```
 8. ENTIDADES DINÁMICAS   (jugadores, mobs, NPCs, proyectiles)
 7. TECHOS                (ocultan entidades al pasar debajo)
 6. EFECTOS AMBIENTALES   (lluvia, niebla, partículas)
 5. SOMBRAS               (sombras baked de edificios/árboles)
 4. OBJETOS DECORATIVOS   (árboles, rocas, fuentes, mobiliario)
 3. COLISIONES            (colliders invisibles + navGrid)
 2. TERRENO VISUAL        (tiles con blending, altura, texturas)
 1. NAVEGACIÓN            (grilla lógica, desacoplada del visual)
```

**Principio clave:** La capa de navegación (1) está completamente desacoplada del render. La grilla lógica define por dónde se puede caminar, independientemente de cómo se vea el terreno.

### 1.2 Data Flow

```
Map JSON (config)
  ├── navGrid         → lib/navGrid.ts (A* pathfinding)
  ├── tiles[]         → TerrainRenderer.tsx (mesh por tile)
  ├── decorations[]   → MapLayers.tsx (con LOD por distancia)
  ├── colliders[]     → Rapier RigidBody invisibles
  ├── regions[]       → chunkSystem.ts (particionado espacial)
  ├── bakedLighting   → LightingLayer.tsx (luces + ambiente)
  ├── warps[]         → WarpPortal.tsx
  ├── npcs[]          → NPC.tsx
  ├── chests[]        → Chest.tsx
  ├── enemyAreas[]    → MapManager.ts (server-side spawning)
  └── spawnPoints[]   → Punto de entrada del jugador
```

### 1.3 Principios de Diseño

| Principio | Traducción |
|-----------|------------|
| **NavGrid desacoplada** | La grilla de navegación es independiente del mesh visual |
| **Sin física de colisión para el jugador** | El player usa `kinematicPosition` + navGrid, no Rapier collision |
| **Cámara fija sin rotación** | Yaw/pitch constantes, solo zoom. No órbita. |
| **Sprites billboard** | Personajes y criaturas como sprites 2D siempre frente a cámara |
| **Baked lighting** | Sin luces dinámicas. Todo precalculado o procedural simple. |
| **Server-authoritative** | Movimiento validado por desplazamiento máximo por tick |

---

## 2. Sistema de Mapas

### 2.1 Estructura de Mapa

Cada mapa existe como un archivo JSON en `shared/data/maps/{mapId}.json` con esta estructura:

```typescript
interface MapConfig {
  id: string;                    // 'prontera', 'morroc', etc.
  name: string;                  // 'Prontera City'
  type: 'town' | 'field' | 'dungeon' | 'instance' | 'pvp' | 'guild';
  dimensions: { width: number; height: number };  // en tiles (80x80, etc.)
  
  // Sistemas
  navGrid?: NavGrid;             // Grilla de navegación (precomputada en build)
  tiles: Tile[];                 // Terreno visual
  regions: MapRegion[];          // Zonas para streaming/LOD
  triggers: MapTrigger[];        // Triggers por zona
  colliders: Collider[];         // Cajas de colisión invisibles

  // Poblado
  spawnPoints: SpawnPoint[];     // Puntos de aparición de jugadores
  warps: Warp[];                 // Conexiones a otros mapas
  safeZones: SafeZone[];         // Zonas seguras (PVP off, regen)
  enemyAreas: EnemyArea[];       // Zonas de spawn de monstruos
  npcs: NPCSpawn[];              // NPCs estáticos
  chests: Chest[];               // cofres interactuables
  decorations: Decoration[];     // Objetos decorativos

  // Visual
  bakedLighting?: BakedLighting; // Iluminación precalculada
  grassTuftCount: number;        // Cantidad de briznas decorativas
  grassTexture: GrassTexture;    // Textura de suelo por defecto
  floorColor: string;            // Color de suelo fallback
  ambientMusic?: string;         // Música ambiental
  dayNightCycle: DayNightCycle;  // Config de ciclo día/noche
}
```

### 2.2 Regiones y Chunks

El mapa se divide en regiones (zonas temáticas: plaza, mercado, castillo) y cada región se subdivide en chunks para streaming:

```typescript
interface MapRegion {
  id: string;
  bounds: { minX: number; minZ: number; maxX: number; maxZ: number };
  chunkSize: number;           // 16 tiles por defecto
  ambientSound?: string;       // Sonido ambiental de la zona
  fogDensity: number;          // 0 = sin niebla, 1 = niebla densa
  fogColor: string;
  lightColor: string;
  lightIntensity: number;
}

interface Chunk {
  id: string;
  regionId: string;
  bounds: BoundingBox;
  decorations: Decoration[];
  tiles: Tile[];
  triggers: Trigger[];
  enemyAreas: EnemyArea[];
  loaded: boolean;
  loadPriority: number;
}
```

**Estrategia de carga:**
- Chunks visibles: los que están dentro del rango de visión del jugador (40 tiles)
- Chunks activos: los que tienen jugadores cerca (~60 tiles)
- Carga diferida: decoraciones LOD se cargan según distancia
- Descarga: chunks fuera de rango se descargan después de 5s sin jugadores cerca

### 2.3 Warps y Conexiones

```typescript
interface Warp {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  targetMapId: string;
  targetSpawnId: string;       // Punto de spawn en el mapa destino
  visual: 'portal' | 'door' | 'npc' | 'hidden';
  requirements?: {
    minLevel: number;
    questId?: string;
    itemRequired?: string;
    zenyCost: number;
  };
}
```

**Flujo de warp (existente):**
1. Jugador hace clic en warp
2. `interactionManager.startInteraction()` setea target + pathfinding
3. Al llegar, `performInteraction()` emite `requestWarp` al servidor
4. Servidor valida: cooldown, nivel, items, zeny
5. Servidor emite `mapChange` con destino
6. Cliente carga nuevo mapa en posición de spawn

### 2.4 Zonas de Seguridad y Triggers

```typescript
interface SafeZone {
  id: string;
  center: { x: number; z: number };
  radius: number;
  name?: string;
}

interface MapTrigger {
  id: string;
  type: 'warp' | 'dialog' | 'damage' | 'heal' | 'script' | 'region_change';
  position: { x: number; z: number };
  radius: number;              // 1 tile por defecto
  target?: string;
  data?: Record<string, any>;
}
```

**Triggers se evalúan EN EL SERVIDOR** cada tick: si un jugador está dentro del radio, se ejecuta la acción. Cliente solo muestra feedback visual (mensaje, efecto).

---

## 3. Grilla de Navegación

### 3.1 Estructura de la Grilla

```typescript
interface NavCell {
  walkable: boolean;           // ¿Se puede caminar?
  height: number;              // Altura del tile (para pendientes)
  terrainType: TerrainType;    // grass, dirt, stone, sand, snow...
  moveCost: number;            // 1 = normal, 2.5 = swamp, 999 = bloqueado
  isWater: boolean;
  isBlocked: boolean;          // Bloqueado por collider/decoración
  specialProperty?: string;    // 'ice_slick', 'mud', 'speed_boost'
}

interface NavGrid {
  cellSize: number;            // 1 tile por defecto
  rows: number;                // dimensiones en celdas
  cols: number;
  cells: NavCell[];            // flat array [row * cols + col]
}
```

**Costos de terreno (existentes en `navGrid.ts`):**

| Terreno | Costo |
|---------|-------|
| grass, wood, carpet, stone, bridge | 1.0 |
| dirt | 1.2 |
| sand | 1.5 |
| snow | 1.3 |
| ice | 1.8 |
| swamp | 2.5 |
| water, lava | 999 (inwalkable) |

### 3.2 Creación de la Grilla

La navGrid se genera en **build time** (no en runtime) a partir de:
1. Las dimensiones del mapa
2. Los `colliders[]` del JSON (cada collider bloquea las celdas que toca)
3. Las `decorations[]` con `hasCollision: true`
4. Las `waterZones` y `specialZones` del mapa

**Pipeline de generación:**

```
Map JSON → createNavGrid(cols, rows, cellSize, walls, waterZones, specialZones)
         → NavGrid exportada como parte del JSON del mapa
         → Cliente usa `createNavGridFromConfig()` para instanciar
```

### 3.3 Pathfinding (A* con Smoothing)

**Algoritmo (existente en `lib/navGrid.ts`):**
- Heurística octile (diagonal realista): `max(dx, dz) + (√2 - 1) * min(dx, dz)`
- 8 direcciones con diagonalesop only si ambos cardinales son walkables
- Costo diagonal: `√2 * moveCost`, cardinal: `1 * moveCost`
- Máximo 2000 iteraciones (fallback seguro)
- Si el destino está bloqueado, busca la celda walkable más cercana en 3x3

**Post-procesamiento (existente):**
- `smoothPath()`: Algoritmo de string-pulling que elimina waypoints redundantes
- Reduce rutas zigzagueantes a líneas rectas donde sea posible

**Flujo completo:**
```
1. Player hace clic en el suelo (Map.tsx handlePointerDown)
2. Map.tsx llama findPath(navGrid, start, end)
3. rawPath = A*(start, end)
4. smoothedPath = smoothPath(navGrid, rawPath)
5. setPath(smoothedPath) en la store
6. Player.tsx sigue waypoints en useFrame
```

### 3.4 Validación del Servidor

El servidor NO hace pathfinding. Solo valida:
- Que el desplazamiento por tick no exceda `maxMoveDistance` (balance)
- Que la posición final esté en una celda walkable
- Que el jugador no atraviese colliders (check de línea recta simple)

```typescript
// Server-side validation (game-server/index.ts)
function validateMovement(player: ServerPlayer, input: PlayerInput): boolean {
  const dx = input.x - player.x;
  const dz = input.z - player.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist > balance.movement.maxMoveDistance) return false;
  if (!isWalkable(navGrid, input.x, input.z)) return false;
  return true;
}
```

---

## 4. Terreno Visual

### 4.1 Sistema de Tiles

```typescript
interface Tile {
  position: [number, number];    // [col, row] en la grilla
  terrainType: TerrainType;      // grass, dirt, stone, sand...
  height: number;                // altura del tile (-1 a 1)
  textureId: string;             // 'grass_01', 'dirt_02', etc.
  blendNorth: number;            // 0-1, blend con tile del norte
  blendSouth: number;
  blendEast: number;
  blendWest: number;
}
```

**Renderizado (existente en `TerrainRenderer.tsx`):**
- Cada tile es un mesh plano con textura procedural
- 12 tipos de terreno con colores y texturas distintas
- Blending entre tiles adyacentes de diferente tipo (gradientes suaves)
- Altura por tile para pendientes suaves

**Optimizaciones (propuestas):**
- InstancedMesh para tiles del mismo tipo (reducir draw calls)
- Tile atlas de 16x16 texturas precocidas
- Merge de tiles planos adyacentes en meshes más grandes

### 4.2 Decoraciones (25+ tipos)

```typescript
interface Decoration {
  position: [number, number, number];
  type: 'tree' | 'bush' | 'rock' | 'flower' | 'building' 
      | 'fence' | 'well' | 'sign' | 'castle' | 'fountain'
      | 'lamppost' | 'bench' | 'torch' | 'pillar' | 'mushroom'
      | 'stone_path' | 'crack' | 'dungeon_wall' | ...;
  scale: number;
  layer: 'terrain' | 'decorations' | 'shadows' | 'effects' | 'ceiling' | 'entities';
  lodNear: number;    // distancia a la que aparece (default: 20)
  lodFar: number;     // distancia a la que desaparece (default: 50)
  hasCollision: boolean;  // bloquea navGrid?
}
```

**LOD por distancia (existente en `MapLayers.tsx`):**
- Cerca (0-20): mesh completo con textura
- Media (20-50): mesh simplificado o billboard
- Lejos (50+): invisible

**Orden de capas (estricto):**
```
1. Terreno
2. Sombras (planos semitransparentes en el suelo)
3. Decoraciones (árboles, muebles, estructuras)
4. Efectos (partículas, fuego, magia)
5. Techos (planos que ocultan al player debajo)
6. Entidades (sprites billboard)
```

### 4.3 Transiciones de Bioma

Cuando el jugador camina entre regiones de diferente bioma:
- Los tiles en la frontera tienen valores `blendNorth/South/East/West` no-cero
- `TerrainRenderer.tsx` pinta un gradiente entre los dos tipos
- La navGrid se actualiza con los costos del tile dominante

**Ejemplo:** Transición bosque → desierto:
```
Tile en (5,5): grass, blendEast: 0.7
Tile en (6,5): sand, blendWest: 0.3
→ El tile (5,5) se ve 70% grass, 30% sand
→ Costo de movimiento: 1.0 * 0.7 + 1.5 * 0.3 = 1.15
```

---

## 5. Sistema de Cámara

### 5.1 Configuración

```typescript
const CAMERA_CONFIG = {
  yaw: 0.7854,          // 45° — dirección NE (RO clásico)
  pitch: 0.7854,        // 45° — inclinación hacia abajo
  baseDist: 12,          // distancia base desde el jugador
  minDist: 5,            // zoom mínimo (más cerca)
  maxDist: 22,           // zoom máximo (más lejos)
  followSpeed: 0.04,     // suavidad de seguimiento
  lookAhead: 0.3,        // cuanto se adelanta en dirección de movimiento
  padding: 5,            // padding mínimo de los bordes del mapa
};
```

### 5.2 Posicionamiento (existente en `CameraController.tsx`)

```
Cámara en posición esférica relativa al jugador:
  x = player.x + dist * sin(pitch) * sin(yaw)
  y = player.y + dist * cos(pitch) + 2
  z = player.z + dist * sin(pitch) * cos(yaw)

Mirando hacia:
  lookAt(player.x, player.y + 0.5, player.z)
```

**Efecto visual:** La cámara está en el cuadrante NE mirando al SW, dando la perspectiva isométrica clásica de RO.

### 5.3 Seguimiento Suave

Cada frame:
1. Calcula `targetPosition` basado en posición del jugador + look-ahead
2. Interpola posición actual hacia target con `lerp` delta-independent
3. Clampa a bordes del mapa ajustados por zoom
4. Aplica zoom smoothing (lerp entre `currentDist` y `targetDist`)

```typescript
// Delta-independent lerp (existente)
const smoothLerp = 1 - Math.pow(1 - FOLLOW_SPEED, delta * 60);
camera.position.lerp(targetPosition, smoothLerp);
```

### 5.4 Zoom

```typescript
// Mouse wheel (existente)
targetDist = clamp(targetDist + deltaY * 0.01, minDist, maxDist);

// Pinch zoom (mobile, propuesto)
// Usar eventos touch con dos dedos, escala igual que wheel
```

### 5.5 Look-Ahead (existente)

La cámara se adelanta ligeramente en la dirección de movimiento del jugador:
```
lookX = player.x + inputDir.x * lookAhead * 3
lookZ = player.z + inputDir.z * lookAhead * 3
```

Decae en 500ms después de que el jugador deja de moverse. Esto da una sensación de "dirigir la mirada" sin ser brusco.

### 5.6 Límites del Mapa

Los límites se escalan con el zoom para que en zoom máximo no se vean áreas fuera del mapa:
```typescript
const zoomScale = currentDist / BASE_DIST;
const padding = MAP_BOUND_PADDING * zoomScale;
// Clampear targetPosition a [-halfW + padding, halfW - padding]
```

### 5.7 Lo que NO hace la cámara (por diseño)

- **No órbita**: El usuario no puede rotar la cámara. El yaw/pitch son fijos.
- **No colisión con paredes**: La cámara no hace raycast para evitar paredes. Si un edificio está entre la cámara y el jugador, se renderiza con transparencia o se oculta (ver sección de techos).
- **No smart zoom**: No se aleja automáticamente al moverse.

---

## 6. Sistema de Movimiento

### 6.1 Fuentes de Input

```typescript
interface MovementInput {
  x: number;  // -1 a 1, derecha positivo
  z: number;  // -1 a 1, abajo positivo (pantalla)
}

// Keyboard (existente en movementController.ts)
W/↑ → (0, -1)    S/↓ → (0, 1)
A/← → (-1, 0)    D/→ → (1, 0)

// Touch (existente en touchInput.ts, stub)
Joystick virtual → (joyX, joyZ)

// Click-to-move (existente en Map.tsx)
Click en suelo → navGrid.findPath() → gameStore.path[]
```

### 6.2 Rotación Cámara-Relativa

Todo input se rota por el yaw de la cámara para que WASD siempre sea relativo a la pantalla:

```typescript
function rotateInput(input: MovementInput): MovementInput {
  // Con FIXED_YAW = 0.7854 (45°)
  // cos(-45°) = 0.707, sin(-45°) = -0.707
  return {
    x: input.x * cos(-yaw) - input.z * sin(-yaw),
    z: input.x * sin(-yaw) + input.z * cos(-yaw),
  };
}
```

**Mapeo resultante (cámara en NE, mirando SW):**
| Tecla | Screen | Mundo |
|-------|--------|-------|
| W | ↑ | SW (-X, -Z) |
| S | ↓ | NE (+X, +Z) |
| A | ← | NW (-X, +Z) |
| D | → | SE (+X, -Z) |

### 6.3 Maquina de Estados del Jugador

```
                    ┌─────────────┐
                    │    IDLE     │
                    └──────┬──────┘
                           │
                ┌──────────┼──────────┐
                │          │          │
                ▼          ▼          ▼
          ┌──────────┐ ┌────────┐ ┌──────────┐
          │  WALK    │ │ ATTACK │ │ INTERACT │
          └─────┬────┘ └───┬────┘ └─────┬────┘
                │          │            │
                │   attack │            │ interact
                │   done   │            │ done
                └──────────┴────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    DEAD     │
                    └─────────────┘
```

**Estados (existente en `playerStateMachine.ts`):**
- `IDLE`: Esperando input. Transiciones: input→WALK, click enemigo→ATTACK, click NPC→INTERACT
- `WALK`: Moviéndose por input directo o pathfinding. Llega a destino→IDLE, enemigo en rango→ATTACK
- `ATTACK`: Auto-atacando al target seleccionado. Cooldown entre ataques. Enemigo fuera de rango→WALK
- `INTERACT`: Dialogando con NPC, abriendo cofre, usando warp. Termina→IDLE
- `DEAD`: Jugador muerto. Solo puede revivir o ser revivido.

### 6.4 Movimiento por Input Directo

```typescript
// Cada frame en Player.tsx useFrame:
const input = getMovementInput();           // Keyboard o touch
input = rotateInput(input);                 // Cámara-relativo

if (hasKeyboardInput && input != 0) {
  clearPath();                              // Input manual cancela path
  applyVelocity(input, delta);              // Aceleración/desaceleración
}
```

### 6.5 Movimiento por Pathfinding (Click-to-Move)

```typescript
// Map.tsx — al hacer clic en el suelo:
const rawPath = findPath(navGrid, playerPos, clickPos);
const path = smoothPath(navGrid, rawPath);
setPath(path);  // store

// Player.tsx — cada frame mientras haya path:
if (path && pathIndex < path.length) {
  const waypoint = path[pathIndex];
  const dir = normalize(waypoint - currentPos);
  if (dist <= 0.5) {
    pathIndex++;  // Siguiente waypoint
    if (pathIndex >= path.length) {
      clearPath();
      checkInteraction();  // Llegó al destino
    }
  } else {
    applyVelocity(dir, delta);
  }
}
```

**Re-cálculo de ruta:**
- Cuando el jugador se desvía mucho del camino original (>5 tiles)
- Cuando el destino cambia (nuevo clic)
- Cuando un obstáculo aparece (trigger de zona, otro jugador)

### 6.6 Aceleración y Desaceleración (RO-style)

```typescript
// Aceleración (existente en Player.tsx)
velocity.x += (targetDir.x * SPEED - velocity.x) * min(1, ACCEL * delta);
velocity.z += (targetDir.z * SPEED - velocity.z) * min(1, ACCEL * delta);

// Desaceleración (fricción)
velocity.x -= velocity.x * min(1, FRICTION * delta);
velocity.z -= velocity.z * min(1, FRICTION * delta);

// Aplicar velocidad
pos.x += velocity.x * delta;
pos.z += velocity.z * delta;
rigidBody.setTranslation(pos, true);
```

**Parámetros (de `gameData.balance.movement`):**
| Parámetro | Valor | Efecto |
|-----------|-------|--------|
| `playerSpeed` | 4.0 | Velocidad máxima |
| `ACCEL = SPEED * 8` | 32 | Aceleración instantánea (casi inmediata) |
| `FRICTION` | 10 | Desaceleración rápida al soltar tecla |

### 6.7 Auto-Follow de Enemigos

Cuando el jugador selecciona un enemigo (clic):
- Si está en rango de ataque: detenerse y atacar (con cooldown)
- Si está fuera de rango: caminar hacia el enemigo hasta estar en rango

```typescript
if (selectedTargetId) {
  const enemy = enemies[selectedTargetId];
  if (enemy && !enemy.isDead) {
    const dist = distance(player, enemy);
    if (dist <= ATTACK_RANGE) {
      if (canAttack()) {
        networkStore.attackTarget(selectedTargetId);
      }
      inputDir = { 0, 0 };  // Quieto para atacar
    } else {
      inputDir = normalize(enemy.pos - player.pos);  // Perseguir
    }
  }
}
```

### 6.8 Reconciliación con el Servidor

```typescript
// Solo cuando el jugador está quieto (existente)
if (!isMoving && !reconciled && socket.connected) {
  const dx = serverPos.x - localPos.x;
  const dz = serverPos.z - localPos.z;
  const distSq = dx * dx + dz * dz;
  
  if (distSq > 0.5) {
    // Corrección suave (50% del error por frame)
    localPos.x += dx * 0.5;
    localPos.z += dz * 0.5;
  } else if (distSq < 0.1) {
    reconciled = true;  // Ya está sincronizado
  }
}
```

### 6.9 Colisión (basada en NavGrid, no en Rapier)

El jugador NO tiene collider de Rapier. La colisión se maneja por navGrid:

```typescript
// Antes de mover, verificar si la nueva posición es walkable
const newPos = { x: pos.x + velocity.x * delta, z: pos.z + velocity.z * delta };
if (isWalkable(navGrid, newPos.x, newPos.z)) {
  rigidBody.setTranslation(newPos, true);
} else {
  // Intentar mover en X o Z por separado (slide contra paredes)
  const slideX = { x: newPos.x, z: pos.z };
  const slideZ = { x: pos.x, z: newPos.z };
  if (isWalkable(navGrid, slideX.x, slideX.z)) rigidBody.setTranslation(slideX, true);
  else if (isWalkable(navGrid, slideZ.x, slideZ.z)) rigidBody.setTranslation(slideZ, true);
}
```

**Esto NO existe actualmente en `Player.tsx`** — es una adición crítica. Actualmente el player atraviesa todo.

### 6.10 Bob Animación (existente)

```typescript
// Caminando: bob rápido (12 Hz) con amplitud 0.08
groupRef.current.position.y = Math.sin(time * 12) * 0.08;

// Quieto: respiración lenta (2 Hz) con amplitud 0.02
groupRef.current.position.y = Math.sin(time * 2) * 0.02;
```

---

## 7. Profundidad Visual y Sorting

### 7.1 Algoritmo de Pintado (Painter's Algorithm)

Los sprites se ordenan por profundidad (más lejos = se renderiza primero):

```typescript
const sorted = entities.sort((a, b) => {
  // Profundidad: Z + pequeña corrección por X (perspectiva isométrica)
  const depthA = a.position.z + a.position.x * 0.1;
  const depthB = b.position.z + b.position.x * 0.1;
  return depthA - depthB;  // Lejos → cerca
});
```

### 7.2 Capas de Profundidad

1. Terreno (siempre detrás de todo)
2. Sombras (encima del terreno, debajo de entidades)
3. Decoraciones (árboles, rocas — detrás de entidades si están más lejos)
4. Entidades (sprites — ordenadas por Y + Z)
5. Techos (planos transparentes que se ocultan cuando el player está debajo)
6. Efectos (partículas, números de daño — siempre al frente)

### 7.3 Manejo de Techos

Cuando el jugador está debajo de un techo (edificio, cueva):
- El techo se renderiza con `depthWrite: false` y opacidad reducida
- O se oculta completamente cuando el jugador está dentro del bounding box

```typescript
// Render condicional de techo
if (isPlayerUnderRoof) {
  <mesh opacity={0.3} transparent depthWrite={false}>...</mesh>
}
```

---

## 8. Entidades Dinámicas

### 8.1 Sprites Billboard (existente en `Sprite.tsx`)

```typescript
<Sprite
  entityId="poring"
  state="idle"        // idle | walk | attack | hit | dead
  direction="S"       // N | S | E | W | NW | NE | SW | SE
  width={1.5}
  height={1.5}
  billboard            // Siempre mira a la cámara
/>
```

**Billboard config:**
```typescript
<Billboard follow lockX={true} lockY={false} lockZ={true}>
```
- `lockX={true}`: No se inclina (siempre vertical)
- `lockY={false}`: Rota horizontalmente para mirar a la cámara
- `lockZ={true}`: No se ladea

### 8.2 Profundidad y Sorting de Entidades

Las entidades se agrupan en `SortedEntities` que renderiza en orden de profundidad:

```
Capa de entidades (ordenada):
  1. Mob lejano (z pequeño)
  2. Otro jugador
  3. NPC
  4. Player (z actual)
  5. Mob cercano (z grande)
```

**Offsets verticales:**
- Cada entidad tiene un `depthOffset` basado en su altura y distancia
- Los sprites se elevan ligeramente sobre el suelo (`y = position.y + 0.5`)
- La animación de flotación añade un offset sinusoidal

### 8.3 Enemigos (existente en `Enemy.tsx`)

```typescript
interface EnemyState {
  id: string;
  enemyId: string;     // 'poring', 'fabre', etc.
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  position: { x: number; y: number; z: number };
  isDead: boolean;
}
```

**Renderizado:**
- Sprite billboard con animación idle/dead
- HP bar debajo del nombre
- Círculo de selección dorado cuando está seleccionado
- Interpolación suave de posición (lerp 6x por segundo)

**Colisión (propuesta):**
- Enemigos tienen `CuboidCollider` de Rapier (ya existe)
- Pero el player no usa colisión Rapier → el enemigo es un obstáculo visual, no físico
- Para pathfinding, los enemigos en la posición actual no bloquean la navGrid (se recalculan en tiempo real si es necesario)

### 8.4 NPCs (existente en `NPC.tsx`)

```typescript
interface NPCSpawn {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  sprite: string;         // entityId del sprite
  dialogId: string;       // clave en dialogs.json
  direction?: Direction;
  collision?: boolean;    // ¿Bloquea el paso?
}
```

**Interacción:** Clic → `startInteraction()` → pathfinding → `performInteraction()` → ventana de diálogo

### 8.5 Proyectiles (propuesta)

```typescript
interface Projectile {
  id: string;
  sourceId: string;
  targetId: string;
  position: { x: number; y: number; z: number };
  speed: number;
  damage: number;
  onHit: () => void;
}
```

**Renderizado:** Esfera/pequeño mesh que se mueve linealmente de origen a destino. Sin físicas, solo interpolación visual.

---

## 9. Iluminación y Ambiente

### 9.1 Baked Lighting (existente)

```typescript
interface BakedLighting {
  ambientColor: string;       // '#888888'
  ambientIntensity: number;   // 0.4
  sunColor: string;           // '#ffffff'
  sunIntensity: number;       // 1.0
  sunDirection: [number, number, number];  // [0.5, 1, 0.3]
  hemisphereSky: string;      // '#87CEEB' (azul cielo)
  hemisphereGround: string;   // '#3a7d3a' (verde suelo)
  fogColor: string;           // '#c9e8f0'
  fogNear: number;            // 20
  fogFar: number;             // 50
  fakeAOIntensity: number;    // 0.15
}
```

**Renderizado (existente en `LightingLayer.tsx`):**
- `ambientLight` con color y intensidad del mapa
- `directionalLight` con color, intensidad y dirección del sol
- `hemisphereLight` para iluminación cielo/suelo
- `fog` con color y distancia del mapa
- `fakeAOIntensity` para oscurecer esquinas (post-process o vertex color)

### 9.2 Sombras

**Propuesta:** Sombras planas (planos semitransparentes en el suelo) para decoraciones estáticas, NO sombras dinámicas real-time.

```typescript
// Sombra de árbol (baked en el decoration mesh o plano separado)
<mesh position={[tree.x, 0.01, tree.z]} rotation={[-PI/2, 0, 0]}>
  <planeGeometry args={[2, 2]} />
  <meshBasicMaterial color="black" opacity={0.2} transparent depthWrite={false} />
</mesh>
```

### 9.3 Efectos Ambientales

- **Niebla:** `fog` de Three.js con color y densidad por región
- **Partículas:** Lluvia, hojas, polvo (sistema simple basado en `Points`)
- **Ciclo día/noche:** Cambio suave de colores ambientales y de sol (opcional, desactivado por defecto)

---

## 10. Streaming y Performance

### 10.1 Estrategia de Carga

```
Inicialización del mapa:
1. Cargar JSON del mapa (navGrid + config)
2. Crear navGrid → pathfinding disponible inmediatamente
3. Cargar tiles del chunk central (donde spawna el jugador)
4. Cargar decoraciones del chunk central
5. Cargar chunks circundantes en orden de distancia
6. Descargar chunks lejanos (>60 tiles)
```

### 10.2 LOD por Distancia

| Distancia | Decoraciones | Tiles | Entidades |
|-----------|-------------|-------|-----------|
| 0-20 | Mesh completo | Mesh completo | Sprite completo |
| 20-50 | Billboard/Mesh simple | Mesh simplificado | Sprite sin animación |
| 50+ | Invisible | Texture atlas | Invisible |

### 10.3 Límites de Rendimiento

| Recurso | Límite | Estrategia |
|---------|--------|------------|
| Tiles visibles | ~2,500 (50x50) | Chunk loading |
| Decoraciones visibles | ~500 | LOD + culling |
| Entidades dinámicas | ~100 | Culling por distancia |
| Sprites animados | ~50 | Solo animar los cercanos |
| Texturas de sprite | ~20 | Caché LRU (no usado actualmente) |

### 10.4 InstancedMesh para Tiles

**Propuesta:** En lugar de un mesh por tile, agrupar tiles del mismo tipo en `InstancedMesh`:

```typescript
// En lugar de 2500 meshes individuales:
const grassInstances = new THREE.InstancedMesh(planeGeo, grassMat, 1200);
// Posicionar cada instancia con matriz de transformación
```

Reducción estimada: 2500 draw calls → ~12 draw calls (uno por tipo de terreno).

---

## 11. Formato de Datos de Mapa

### 11.1 Ejemplo Completo (Prontera)

```json
{
  "id": "prontera",
  "name": "Prontera City",
  "type": "town",
  "dimensions": { "width": 80, "height": 80 },
  
  "navGrid": {
    "cellSize": 1,
    "rows": 80,
    "cols": 80,
    "cells": [ ... ]  // 6400 celdas walkable/blocked
  },
  
  "tiles": [
    { "position": [0, 0], "terrainType": "grass", "height": 0, "textureId": "grass_01", "blendNorth": 0, "blendSouth": 0, "blendEast": 0, "blendWest": 0 },
    ...
  ],
  
  "regions": [
    { "id": "center_plaza", "bounds": { "minX": 30, "minZ": 30, "maxX": 50, "maxZ": 50 }, "chunkSize": 10 }
  ],
  
  "spawnPoints": [
    { "id": "main", "position": { "x": 40, "y": 0.5, "z": 40 } }
  ],
  
  "warps": [
    { "id": "warp_prontera_01", "name": "To Payon Forest", "position": { "x": 5, "y": 0.5, "z": 40 }, "targetMapId": "payon_forest", "targetSpawnId": "entrance", "visual": "portal" }
  ],
  
  "safeZones": [
    { "id": "sz_center", "center": { "x": 40, "z": 40 }, "radius": 15, "name": "Plaza Central" }
  ],
  
  "enemyAreas": [
    { "enemyId": "poring", "center": { "x": 10, "z": 10 }, "radius": 8, "count": 5, "respawnSeconds": 10 }
  ],
  
  "decorations": [
    { "position": [35, 0, 45], "type": "fountain", "scale": 1, "layer": "decorations", "lodNear": 30, "lodFar": 60 },
    { "position": [30, 0, 35], "type": "lamppost", "scale": 0.8, "layer": "decorations", "hasCollision": true }
  ],
  
  "colliders": [
    { "position": [40, 0, 42], "size": [4, 3, 4] }
  ],
  
  "bakedLighting": {
    "ambientColor": "#b8c8e8",
    "ambientIntensity": 0.5,
    "sunColor": "#ffe8b0",
    "sunIntensity": 1.2,
    "hemisphereSky": "#87CEEB",
    "hemisphereGround": "#6a9a6a"
  },
  
  "grassTuftCount": 200,
  "grassTexture": { "baseColor": "#7ec850", "repeatX": 8, "repeatY": 8 },
  "floorColor": "#6aae4a",
  
  "dayNightCycle": { "enabled": false, "cycleMinutes": 30 }
}
```

### 11.2 Pipeline de Creación

```
1. Tiled / Editor propio → Export JSON
2. Script de build: decorations + colliders → rasterizar navGrid
3. Script de build: optimizar tiles (merge planos)
4. Script de build: generar baked lighting (opcional)
5. JSON final en shared/data/maps/{id}.json
6. Servidor carga al iniciar, cliente carga al cambiar de mapa
```

---

## 12. Herramientas y Pipeline

### 12.1 Herramientas Existentes

| Herramienta | Propósito | Estado |
|-------------|-----------|--------|
| `lib/navGrid.ts` | A* pathfinding + grid queries | ✅ Completo |
| `lib/chunkSystem.ts` | Particionado espacial | ✅ Estructural (falta activar culling) |
| `lib/spatialQuery.ts` | Queries espaciales (círculo, rect, cono) | ✅ Server-side |
| `lib/playerPosition.ts` | Módulo singleton para posición | ✅ Completo |
| `lib/interactionManager.ts` | Dispatch de interacciones | ✅ Completo |
| `lib/spriteManager.ts` | Sistema de sprites animados | ✅ Completo |
| `lib/movementController.ts` | Agregación de input | ✅ Completo |

### 12.2 Herramientas Propuestas

| Herramienta | Propósito | Prioridad |
|-------------|-----------|-----------|
| `lib/collision.ts` | Check de walkable + slide contra paredes | **Alta** (necesario ahora) |
| `lib/mapLoader.ts` | Carga progresiva de chunks | Media |
| `lib/spriteAtlas.ts` | Atlas de texturas para tiles | Baja |

### 12.3 Componentes de UI Debug (existentes)

| Componente | Propósito |
|------------|-----------|
| `ui/MapEditor.tsx` | Editor de mapas en cliente (place tiles, decorations) |
| `ui/DevToolsOverlay.tsx` | Overlay de debug (FPS, posición, path) |
| `ui/EntityInspector.tsx` | Inspeccionar entidades seleccionadas |
| `ui/AdminConsole.tsx` | Consola de comandos de admin |

---

## 13. Plan de Implementación

### 13.1 Fase 1 — Critico (Ahora)

| Tarea | Archivos | Depende de |
|-------|----------|------------|
| **Colisión por navGrid** en Player.tsx | `Player.tsx`, `lib/collision.ts` (nuevo) | navGrid existente |
| **Slide contra paredes** (moverse en X o Z por separado) | `Player.tsx` | Colisión navGrid |
| **Chunk culling real** | `Map.tsx`, `chunkSystem.ts` | Nada |
| **Activar LOD por región** | `MapLayers.tsx`, `Map.tsx` | Chunk system |

### 13.2 Fase 2 — Mejoras

| Tarea | Archivos | Depende de |
|-------|----------|------------|
| `InstancedMesh` para tiles | `TerrainRenderer.tsx` | Nada |
| Sombras planas para decoraciones | `MapLayers.tsx`, `Decoration` | Nada |
| Animación de enemigos (walk, attack) | `Enemy.tsx`, servidor | Sprite assets |
| Dirección de enemigos desde servidor | `Enemy.tsx`, `game-server/index.ts` | Nada |
| RemotePlayers con clase real | `RemotePlayers.tsx` | Network data |

### 13.3 Fase 3 — Features

| Tarea | Archivos | Depende de |
|-------|----------|------------|
| Joystick táctil completo | `lib/touchInput.ts`, nuevo componente | Nada |
| Proyectiles | Nuevo componente + server | Nada |
| Ciclo día/noche | `LightingLayer.tsx` | Baked lighting |
| Editor de mapas visual | `ui/MapEditor.tsx` | Formato de mapa |

### 13.4 Fase 4 — Optimización

| Tarea | Archivos | Depende de |
|-------|----------|------------|
| Path cache (resultados A* reutilizables) | `lib/navGrid.ts` | Nada |
| Progressive A* (interrumpible) | `lib/navGrid.ts` | Nada |
| Texture atlas para tiles | `TerrainRenderer.tsx` | Asset pipeline |
| Sprite sheets (en lugar de PNGs individuales) | `lib/spriteManager.ts` | Asset pipeline |

---

## Apéndice A: Diagrama de Flujo de Clic

```
Usuario hace clic
       │
       ▼
┌──────────────────┐
│ ¿Qué se clickeó?  │
├──────────────────┤
│ Suelo → Click-to-move (Map.tsx handlePointerDown)
│   → findPath(navGrid, start, end)
│   → smoothPath()
│   → setPath(path) en store
│   → Player.tsx sigue path
│
│ Enemigo → Enemy.tsx onPointerDown
│   → e.stopPropagation()  (evita que llegue al suelo)
│   → setSelectedTargetId(id)
│   → Player.tsx auto-follow/attack
│
│ NPC → NPC.tsx onClick
│   → startInteraction({ type: 'npc', ... })
│   → setTargetPosition(npc.pos)
│   → setInteractionTarget(npc)
│   → Player camina hacia NPC
│   → Al llegar: performInteraction() → openDialog()
│
│ Cofre → Chest.tsx onClick
│   → Mismo flujo que NPC
│   → Al llegar: performInteraction() → openChest()
│
│ Warp → WarpPortal.tsx onClick
│   → Mismo flujo que NPC
│   → Al llegar: performInteraction() → teleport()
└──────────────────┘
```

## Apéndice B: Diagrama de Flujo de Pathfinding

```
click en suelo (Map.tsx)
       │
       ▼
findPath(navGrid, playerPos, clickPos)
       │
       ├── worldToGrid(playerPos) → [startGx, startGz]
       ├── worldToGrid(clickPos) → [endGx, endGz]
       │
       ▼
A* search:
  Open set: [startNode]
  Closed set: []
       │
       ▼
  Mientras Open no vacío y < 2000 iter:
    │
    ├── Tomar nodo con menor F de Open
    ├── Si es el destino → reconstruir path → return
    ├── Mover a Closed
    ├── Para cada vecino (8 direcciones):
    │     ├── Si walkable y no en Closed
    │     ├── Calcular G, H, F
    │     ├── Si mejor G → actualizar en Open
    │
    ▼
smoothPath(navGrid, path)
       │
       ▼
  Por cada par de waypoints:
    ├── Probar línea recta entre ellos
    ├── Si todos los tiles intermedios son walkable
    ├── → Eliminar waypoints intermedios (string-pulling)
       │
       ▼
setPath(smoothedPath) → store
       │
       ▼
Player.tsx sigue waypoints cada frame:
  ├── Calcular dirección al siguiente waypoint
  ├── Aplicar velocidad (aceleración/desaceleración)
  ├── Verificar walkable en nueva posición (con slide)
  ├── Llegó al waypoint → avanzar índice
  └── Último waypoint → path completo → checkInteraction()
```

---

*Documento de diseño v2.0 — Basado en el codebase existente de EpicEarthMMO.*
*Próximo paso: Implementar Fase 1 (colisión navGrid + chunk culling).*
