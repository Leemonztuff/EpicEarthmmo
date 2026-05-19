# Movement, Camera & Interaction System Design

**Project:** EpicEarthMMO — Web-based Mobile MMORPG (Ragnarok Online Clone)  
**Author:** Systems Designer  
**Date:** 2026-05-19  
**Status:** Draft v1.1 (Decisions Baked In)  
**Depends On:** Sprite system, Network system (existing)

**Design Decisions (2026-05-19):**
1. Collision: BOTH — bitmap grid from map decorations + manual box colliders in map JSON for special objects
2. Pathfinding: BOTH — client-side A* for predictive movement, server validates max displacement per tick
3. NPC Interaction v1: Walk to NPC → open dialog window (requires dialog system integration)
4. Camera: Fixed-angle RO-style (camera always faces NE, user only zooms). No user orbit rotation.
5. Remote Players: YES — send direction + animState in server snapshots for proper animation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Player State Machine](#2-player-state-machine)
3. [Movement System](#3-movement-system)
4. [Collision System](#4-collision-system)
5. [Pathfinding System](#5-pathfinding-system)
6. [Camera System](#6-camera-system)
7. [Interaction System](#7-interaction-system)
8. [Input Handling](#8-input-handling)
9. [Client-Server Data Flow](#9-client-server-data-flow)
10. [Component Architecture](#10-component-architecture)
11. [Edge Cases & Error Handling](#11-edge-cases--error-handling)
12. [Mobile-Specific Considerations](#12-mobile-specific-considerations)
13. [Implementation Priority](#13-implementation-priority)
14. [Tuning Parameters](#14-tuning-parameters)
15. [Data Contracts](#15-data-contracts)

---

## 1. Executive Summary

### 1.1 Goals

- **Movement**: Smooth 8-directional with click-to-move, click-to-interact, collision with all world entities.
- **Camera**: Fixed-angle RO-style camera (NE-facing, ~50° pitch). Smart zoom, pinch/scroll zoom, collision-aware. No user orbit rotation.
- **Interaction**: Click-to-select, click-to-move, click-to-attack, context menus, hover tooltips, NPC dialog.

### 1.2 Design Pillars

| Pillar | Translation |
|---|---|
| **RO Authenticity** | Top-down 3/4 perspective, click-move, auto-attack on selection |
| **Mobile-First** | Touch joystick + tap-to-move, gesture-friendly |
| **Responsive Feel** | Client prediction, smooth interpolation, 50ms server ticks |
| **No Cheat** | Server-authoritative position, client reconciliation |

### 1.3 Key Changes from Current

| Current | Target |
|---|---|
| Implicit state in useFrame | Explicit `PlayerStateMachine` |
| No collision (clips through walls) | Rapier collision shapes + raycasting |
| Camera fixed, no rotation | Fixed-angle RO-style camera (NE-facing, zoom only) |
| Click-to-attack is the only click action | Unified click handler (move/attack/interact) |
| No pathfinding | Simple A* on grid derived from map collision |
| Remote players always idle | Animated remote players with direction |
| Input sent at 50ms always | Input sent only on state change + 100ms keepalive |

---

## 2. Player State Machine

### 2.1 States

```
┌─────────────────────────────────────────────────────────────┐
│                     PLAYER STATE MACHINE                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     ┌──────────┐     walk complete    ┌──────────┐          │
│     │          │ ──────────────────▶  │          │          │
│     │   IDLE   │                      │  WALK    │          │
│     │          │ ◀──────────────────  │          │          │
│     └────┬─────┘   input direction    └────┬─────┘          │
│          │                                  │                │
│          │ click enemy                      │ click enemy    │
│          ▼                                  ▼                │
│     ┌──────────┐     walk complete    ┌──────────────┐      │
│     │          │ ──────────────────▶  │              │      │
│     │ ATTACK   │   (enemy in range)   │ WALK_TO_ATTACK│     │
│     │          │ ◀──────────────────  │              │      │
│     └──────────┘   attack cooldown    └──────────────┘      │
│          │                                                    │
│          │ click NPC/warp             │                       │
│          ▼                            ▼                       │
│     ┌──────────┐     walk complete    ┌──────────────┐      │
│     │          │ ──────────────────▶  │              │      │
│     │INTERACT  │                      │WALK_TO_INTERACT│     │
│     │          │                      │              │      │
│     └──────────┘                      └──────────────┘      │
│                                                             │
│     ┌──────────┐                                            │
│     │  DEAD    │  (respawn → IDLE)                          │
│     └──────────┘                                            │
│                                                             │
│     ┌──────────┐                                            │
│     │  STUNNED │  (timer → IDLE)                            │
│     └──────────┘                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 State Definitions

| State | Description | Animation | Exit Conditions |
|---|---|---|---|
| `IDLE` | Standing still, no target | `idle` | Input direction → `WALK`; Click enemy in range → `ATTACK`; Click enemy out of range → `WALK_TO_ATTACK`; Click NPC/warp → `WALK_TO_INTERACT`; Death → `DEAD` |
| `WALK` | Moving via direct input (WASD/joystick) | `walk` | Zero input → `IDLE`; Click enemy in range → `ATTACK`; Click enemy out of range → `WALK_TO_ATTACK` (overrides); Hit stun → `STUNNED` |
| `WALK_TO_ATTACK` | Pathfinding to enemy | `walk` | Reached attack range → `ATTACK`; Target died/deselected → `IDLE`; Click ground → `WALK` |
| `WALK_TO_INTERACT` | Pathfinding to NPC/warp/object | `walk` | Reached interaction range → `INTERACT`; Click elsewhere → `IDLE` or `WALK` |
| `ATTACK` | Auto-attacking selected target | `attack` | Target dead/deselected → `IDLE`; Target moves out of range → `WALK_TO_ATTACK`; Input direction → `WALK` (override) |
| `INTERACT` | Performing interaction (NPC dialog, warp, pickup) | `idle` | Interaction complete → `IDLE`; Cancel → `IDLE` |
| `DEAD` | Player is dead | `dead` | Respawn timer → `IDLE` |
| `STUNNED` | Hit stun / crowd control | `hit` | Timer expires → `IDLE` |

### 2.3 Implementation: `PlayerStateMachine` Class

```typescript
// Proposed location: lib/playerStateMachine.ts

export type PlayerState =
  | 'IDLE'
  | 'WALK'
  | 'WALK_TO_ATTACK'
  | 'WALK_TO_INTERACT'
  | 'ATTACK'
  | 'INTERACT'
  | 'DEAD'
  | 'STUNNED';

interface StateTransition {
  from: PlayerState[];
  to: PlayerState;
  condition: () => boolean;
  onEnter?: () => void;
  onExit?: () => void;
}

class PlayerStateMachine {
  private currentState: PlayerState = 'IDLE';
  private transitions: StateTransition[] = [];
  private stateStartTime: number = 0;

  get state(): PlayerState { return this.currentState; }
  get elapsed(): number { return Date.now() - this.stateStartTime; }

  addTransition(transition: StateTransition): void { ... }
  tick(): void { /* evaluate transitions in priority order */ }
  forceState(newState: PlayerState): void { ... }
}
```

Integration: `Player.tsx` will call `stateMachine.tick()` each frame, and the state machine determines movement logic, animation, and behavior.

---

## 3. Movement System

### 3.1 Movement Modes

#### 3.1.1 Direct Input (WASD / Joystick)
- 8-directional normalized vector
- Applied immediately client-side (prediction)
- Sent to server at 100ms intervals (or on change)
- State: `WALK`

#### 3.1.2 Click-to-Move (Ground Click)
- Player clicks on terrain → NavMesh path computed → path stored as waypoint queue
- Player walks along path, updating target position each frame
- State: `WALK` (generalized — no separate state needed)
- On completion → `IDLE`

#### 3.1.3 Click-to-Interact (Entity Click)
- Click on enemy → compute path to attack range → `WALK_TO_ATTACK`
- Click on NPC/warp → compute path to interaction range → `WALK_TO_INTERACT`
- On reaching range → transition to `ATTACK` or `INTERACT`

### 3.2 Movement Formula

Movement uses **velocity-based acceleration/deceleration** (RO-style easing) instead of instant on/off:

```typescript
// Client-side prediction
const SPEED = BALANCE.movement.playerSpeed; // 8 units/sec
const ACCEL = SPEED * 8;   // reach full speed in ~0.125s
const FRICTION = 10;        // stop in ~0.1s

// Per-frame velocity update (delta in seconds)
if (isMoving) {
  velocity.x += (inputDir.x * SPEED - velocity.x) * Math.min(1, ACCEL * delta);
  velocity.z += (inputDir.z * SPEED - velocity.z) * Math.min(1, ACCEL * delta);
} else {
  velocity.x -= velocity.x * Math.min(1, FRICTION * delta);
  velocity.z -= velocity.z * Math.min(1, FRICTION * delta);
  if (Math.abs(velocity.x) < 0.001) velocity.x = 0;
  if (Math.abs(velocity.z) < 0.001) velocity.z = 0;
}

// Apply position via kinematic body (Rapier handles collision response)
const hasVelocity = velocity.x !== 0 || velocity.z !== 0;
if (hasVelocity) {
  const newPos = {
    x: pos.x + velocity.x * delta,
    y: pos.y,
    z: pos.z + velocity.z * delta,
  };
  rigidBody.setTranslation(newPos, true);
  playerPosition.x = newPos.x;  // update shared module for camera
  playerPosition.z = newPos.z;
}
```

The player is a `kinematicPosition` RigidBody — it is unaffected by gravity/forces and only moves where explicitly placed. Collision response still works (kinematic bodies push dynamic bodies and trigger collision callbacks).

### 3.3 Animation Direction

8-direction mapping already exists in `spriteManager.ts`. The direction is determined by the movement vector's angle.

```typescript
// Already implemented
directionRef.current = directionFromAngle(inputDir.x, inputDir.z);
```

### 3.4 Speed Modifiers

Pluggable speed modifiers (future-proofing):
- Base speed: `balance.movement.playerSpeed` (8)
- AGI bonus: `+0.02 * agi` (not currently used — reserved)
- Debuffs: multiply by `0.5` when slowed
- Terrain: different speeds per map tile type (future)

### 3.5 Client Prediction & Server Reconciliation

**Current system** is partially implemented:
- Client applies movement immediately (prediction)
- Server sends `worldSnapshot` with `lastProcessedSeq`
- Client corrects position when server diverges

**Proposed improvements:**

```
┌──────────────┐         ┌──────────────┐
│   CLIENT     │         │   SERVER     │
├──────────────┤         ├──────────────┤
│              │         │              │
│ Input(seq=1) │────────▶│ Process tick │
│   (dir dx,dz)│         │  (queue)     │
│              │         │              │
│ Input(seq=2) │────────▶│ Process tick │
│              │         │              │
│              │◀────────│ Snapshot     │
│  Reconcilie  │         │  (seq, pos)  │
│  with seq=2  │         │              │
└──────────────┘         └──────────────┘
```

- Keep input history of last 50 inputs (seq → input)
- On receiving snapshot, find matching seq
- If server position differs by > 0.5 units, snap-correct (or lerp over 200ms for < 3 units)
- Store pending inputs after that seq and re-apply them

**Reconciliation constants:**
```json
{
  "correctionSnapThreshold": 3.0,
  "correctionLerpSpeed": 0.08,
  "inputHistorySize": 50,
  "sendIntervalMs": 100
}
```

### 3.6 Movement Validation (Server-Side)

**Decision:** Client runs A* for predictive movement path. Server validates max displacement per tick — no server-side pathfinding.

Server validates every input:
- Clamp direction to unit circle
- Apply movement: `pos += dir * speed * tickTimeSec`
- Clamp to map bounds
- **Check collision** — server maintains its own simplified collision grid (or just enforces max displacement + bounds)
- **No teleportation allowed** — max displacement per tick = `speed * tickTimeSec * 1.5` (allows some margin for normal movement)
- If displacement exceeds limit, server snaps player to expected position

**Why no server-side pathfinding:**
- Server only needs to verify final position is reachable, not the path taken
- Max displacement check is sufficient to prevent teleport hacks
- Client handles all pathfinding for responsiveness
- Server resources are saved for combat/enemy AI

---

## 4. Collision System

### 4.1 Collision Architecture

The game uses **@react-three/rapier** (Rapier physics engine). Currently, only the player has a `RigidBody`. We need:

| Entity | RigidBody Type | Collider Shape | Group |
|---|---|---|---|
| Player | `kinematicPosition` | Capsule (radius 0.3, height 1.0) | 0x0001 |
| Enemies | `fixed` | Capsule (radius 0.3, height 1.0) | 0x0002 |
| Walls/Obstacles | `fixed` | Based on geometry | 0x0004 |
| Other Players | `kinematicPosition` | Capsule | 0x0008 |
| Warps/Triggers | `fixed` (sensor) | Box/Sphere | 0x0010 |

**Collision groups:**
- Player collides with: Walls, Obstacles, Enemies, Other Players
- Enemies collide with: Walls, Obstacles, Other Enemies
- Sensors (warps): detect Player only

### 4.2 Collision Shapes

#### Player Collider
```typescript
// In Player.tsx
<RigidBody
  ref={rigidBodyRef}
  colliders={false} // manual
  enabledRotations={[false, false, false]}
  type="dynamic"
  gravityScale={0}
  linearDamping={10}
>
  <CapsuleCollider args={[0.3, 0.4]} /> {/* height/2 = 0.4, radius = 0.3 */}
  <group ref={groupRef}>
    <Sprite ... />
  </group>
</RigidBody>
```

#### Wall Colliders
- Map will have a collision layer derived from map data
- Use `TrimeshCollider` or compound `CuboidCollider`s for walls/buildings
- Map boundary: invisible wall at map edge

#### Enemy Colliders
```typescript
// In Enemy.tsx
<RigidBody type="fixed" colliders={false}>
  <CapsuleCollider args={[0.3, 0.3]} />
  <Billboard ...>
    ...
  </Billboard>
</RigidBody>
```

### 4.3 Collision Response

**Desired behavior:** Player slides along walls, stops at enemies/obstacles.

**Implementation:** Rapier handles this naturally when:
- Player is `dynamic` with `gravityScale = 0`
- Other entities are `fixed`
- Player moves via `setTranslation` (not `setLinvel`)

**Critical change:** Move from `setTranslation` (teleport) to `setNextKinematicTranslation` for smooth collision.

```typescript
// Before (current — no collision):
rigidBodyRef.current.setTranslation(newPos, true);

// After (with collision):
rigidBodyRef.current.setNextKinematicTranslation(newPos);
```

This tells Rapier to move the body as a kinematic body, which will trigger collision responses.

### 4.4 Collision Layers & Filters

```typescript
const COLLISION_GROUPS = {
  PLAYER:    0b0001,  // 1
  ENEMY:     0b0010,  // 2
  WALL:      0b0100,  // 4
  PLAYER_2:  0b1000,  // 8 (other players)
  SENSOR:    0b00010000, // 16
};

// Player collides with walls, enemies, other players
// Player collisionGroups: 0b0001
// Player collisionMask: 0b0110 (walls 0100 | enemies 0010)
```

### 4.5 Map Collision Data

**Decision:** Use BOTH approaches simultaneously.

#### Approach A: Collision Bitmap Grid
Generate a collision grid from map decoration footprints at map load time. Each cell is `0` (walkable) or `1` (blocked).

- **Resolution:** 0.5 world units per cell (1.0 on mobile)
- **Generation:** On map load, rasterize all decoration bounding boxes onto the grid
- **Output:** A `boolean[][]` grid used for:
  - A* pathfinding queries
  - Client-side movement validation (quick check before Rapier)
- **Storage:** The grid is computed once at load time and cached. Not serialized in JSON.

#### Approach B: Manual Box Colliders in Map JSON
Define explicit collision volumes for special objects (buildings, walls, castle structures) in `map.json`:

```json
{
  "colliders": [
    { "type": "box", "position": [10, 0, 5], "size": [2, 1, 2] },
    { "type": "box", "position": [-10, 0, -3], "size": [4, 1, 1] },
    { "type": "cylinder", "position": [5, 0, 8], "radius": 1.5, "height": 2 }
  ]
}
```

These are converted to Rapier `CuboidCollider` / `CylinderCollider` instances on map load and added to the `WALL` collision group. This provides the actual physics collision for movement.

#### How Both Work Together

```
Map JSON → colliders[] → Rapier CuboidCollider(s) → Physics collision (player bumps into walls)
           decorations → rasterize → collisionGrid[][] → Pathfinding (A* avoids blocked cells)
           dimensions  → Wall colliders around map perimeter
```

Both grids stay in sync: the collision grid is always a superset of the manual collider blocks (rasterized). Any cell that overlaps a manual collider is marked blocked in the grid.

### 4.6 Wall Collision for Camera

Camera must not clip through walls/terrain (see Section 6.5).

---

## 5. Pathfinding System

**Decision:** Client-side A* for predictive movement. Server validates max displacement per tick (no server-side pathfinding).

### 5.1 Requirements
- Click-to-move: compute path from player position to clicked point
- Click-to-interact: compute path to within range of target
- Re-path if target moves (enemy kiting)
- Avoid obstacles, walls, other players (if enabled)
- Must be performant (web — no heavy computation per frame)
- Server: only verify player doesn't teleport (max displacement check)

### 5.2 Architecture

```
Map Data (collision grid)  →  NavMesh / Pathfinding Graph  →  A* Pathfinder
```

#### Collision Grid
- Generated on map load from collision colliders
- Resolution: 1 cell = 0.5 world units
- Each cell: `0` = walkable, `1` = blocked
- Build once at map load, cache

#### A* Implementation
```typescript
interface PathNode {
  x: number;
  z: number;
  g: number;  // cost from start
  h: number;  // heuristic to goal
  f: number;  // g + h
  parent: PathNode | null;
}

function findPath(
  start: {x, z},
  goal: {x, z},
  grid: boolean[][]  // true = blocked
): {x, z}[] | null {
  // A* with:
  // - Manhattan heuristic
  // - 8-directional movement (cost 1 for cardinal, 1.414 for diagonal)
  // - Max search nodes: 500 (fail gracefully)
  // - Return array of waypoints (simplified via string-pulling)
}
```

#### Waypoint Simplification
Raw A* paths have unnecessary zigzag. Apply a **string-pulling** pass:
```typescript
function simplifyPath(path: {x, z}[]): {x, z}[] {
  // Raycast from start, and any time we hit a blocked cell,
  // keep the previous node as a waypoint
}
```

### 5.3 Path Following

```typescript
class PathFollower {
  private waypoints: {x, z}[] = [];
  private currentTargetIndex: number = 0;
  private arrivedThreshold: number = 0.3;

  setPath(waypoints: {x, z}[]): void { ... }

  getDirection(currentPos: {x, z}): {x, z} | null {
    if (this.waypoints.length === 0) return null;

    const target = this.waypoints[this.currentTargetIndex];
    const dx = target.x - currentPos.x;
    const dz = target.z - currentPos.z;
    const dist = Math.sqrt(dx*dx + dz*dz);

    if (dist < this.arrivedThreshold) {
      this.currentTargetIndex++;
      if (this.currentTargetIndex >= this.waypoints.length) {
        this.waypoints = [];
        return null; // arrived
      }
      return this.getDirection(currentPos); // recurse with next waypoint
    }

    return { x: dx / dist, z: dz / dist };
  }
}
```

### 5.4 Re-Pathing Conditions
- Target enemy moves more than 2 units from last path destination
- Click on new position/target (overrides current path)
- Path is invalidated by dynamic obstacle (rare — full recompute)

### 5.5 Pathfinding Budget

| Constraint | Value |
|---|---|
| Max search nodes per frame | 500 |
| Max path length | 200 waypoints |
| Re-path max frequency | 1 per 500ms |
| Grid resolution | 0.5 world units |
| Pre-compute time per map | Only on load, < 100ms |

---

## 6. Camera System

### 6.1 Camera Mode: Fixed-Angle RO-Style (No User Orbit)

The camera uses a **fixed yaw angle** — always positioned to the NE of the player looking SW. This matches Ragnarok Online's classic perspective. The user can only:
- **Zoom in/out** (scroll wheel or pinch)
- **Smart zoom** (auto-adjust based on movement state)

No touch-drag or right-click-drag for orbit. This is intentional to preserve the RO feel and reduce complexity.

```
     Camera (NE, elevated)
          ↙
     ┌───────┐
     │ Player│  → facing SW
     └───────┘
```

### 6.2 Camera Parameters

```typescript
interface CameraConfig {
  // Fixed angle (RO-style: camera looks NE toward SW origin)
  fixedYaw: number;          // ~0.85 rad (~49°) — constant NE angle
  fixedPitch: number;        // ~0.87 rad (~50°) — constant overhead pitch

  // Zoom
  minDistance: number;       // 5
  maxDistance: number;       // 20
  defaultDistance: number;   // 14
  zoomSpeed: number;         // 2.0 units/s (scroll/pinch)
  smoothLerpSpeed: number;   // 0.06 (existing)

  // Smart zoom
  smartZoomBoost: number;    // 2.0 — how much extra distance when moving
}
```

### 6.3 Camera Controls

| Input | Action | Platform |
|---|---|---|
| Scroll wheel | Zoom in/out | Desktop |
| Pinch (2 fingers) | Zoom in/out | Mobile |
| *(No orbit rotation)* | — | — |

### 6.4 Camera Position Source

The camera reads from a shared module variable (`lib/playerPosition.ts`) instead of the Zustand store. This is because:

- The store `position` field is only updated by server `worldSnapshot` events (never changes when offline)
- The RigidBody position changes every frame during movement
- A module-level variable avoids React re-renders at 60fps

```typescript
// lib/playerPosition.ts — shared module
export const playerPosition = { x: 0, y: 0.5, z: 0 };
```

`Player.tsx` updates `playerPosition` every frame from the RigidBody translation. `CameraController.tsx` reads from it in `useFrame`.

A `useEffect` + `useGameStore.subscribe` syncs the RigidBody (and `playerPosition`) when the store position changes externally (admin teleport, server correction).

### 6.5 Smart Zoom

Camera zooms out when moving, zooms in when idle. Already partially exists in current `CameraController.tsx`. Extend it.

```typescript
const inputMag = Math.sqrt(inputDir.x ** 2 + inputDir.z ** 2);
const moveBoost = Math.min(inputMag * 2, 3);
const targetDistance = defaultDistance + moveBoost;
```

### 6.6 Camera Position Calculation

```typescript
const FIXED_YAW = 0.85;    // NE angle (radians)
const FIXED_PITCH = 0.87;  // 50° overhead

// Camera offset from player in world space
const offsetX = Math.sin(FIXED_YAW) * Math.cos(FIXED_PITCH) * distance;
const offsetY = Math.sin(FIXED_PITCH) * distance;
const offsetZ = Math.cos(FIXED_YAW) * Math.cos(FIXED_PITCH) * distance;

const targetPos = new THREE.Vector3(
  playerPos.x + offsetX,
  playerPos.y + offsetY,
  playerPos.z + offsetZ
);

camera.position.lerp(targetPos, smoothLerp);
camera.lookAt(playerPos.x, playerPos.y + 0.5, playerPos.z);
```

### 6.7 Camera Collision

Camera must not clip through terrain/objects.

**Approach:** Ray/sphere cast from player toward camera position.

```typescript
useFrame(() => {
  const idealPos = calculateIdealCameraPosition(playerPos, distance);
  const direction = idealPos.clone().sub(playerPos).normalize();
  const maxDist = playerPos.distanceTo(idealPos);

  // Raycast from player backward toward camera
  // Check against wall collision group only
  const hit = rapierWorld.castRay(
    playerPos,
    direction,
    maxDist,
    true, // solid
    COLLISION_GROUPS.WALL
  );

  if (hit) {
    // Pull camera in front of the wall
    camera.position.copy(
      playerPos.clone().add(direction.clone().multiplyScalar(hit.timeOfImpact * maxDist * 0.9))
    );
  } else {
    camera.position.copy(idealPos);
  }

  camera.lookAt(playerPos.x, playerPos.y + 0.5, playerPos.z);
});
```

### 6.8 Zoom Implementation

```typescript
// State
const distanceRef = useRef(14);
const targetZoomRef = useRef(14);

// Scroll wheel (desktop)
useEffect(() => {
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    targetZoomRef.current = clamp(
      targetZoomRef.current + e.deltaY * 0.01 * zoomSpeed,
      minDistance,
      maxDistance
    );
  };
  canvas.addEventListener('wheel', handleWheel, { passive: false });
  return () => canvas.removeEventListener('wheel', handleWheel);
}, []);

// Pinch zoom (mobile) — see Section 6.9
// Per-frame smoothing
const smoothLerp = 1 - Math.pow(1 - 0.06, delta * 60);
distanceRef.current += (targetZoomRef.current - distanceRef.current) * smoothLerp;
```

### 6.9 Pinch Zoom Implementation (Mobile)

```typescript
let lastTouchDist = 0;

canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    lastTouchDist = Math.sqrt(dx*dx + dy*dy);
  }
});

canvas.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2) {
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const delta = (lastTouchDist - dist) * 0.05;
    targetZoomRef.current = clamp(
      targetZoomRef.current + delta,
      minDistance,
      maxDistance
    );
    lastTouchDist = dist;
  }
});
```

---

## 7. Interaction System

### 7.1 Click/Tap Classification

```
User click/tap
  │
  ├─ Is on UI element? → Ignore (handled by React)
  │
  ├─ Is on an entity (enemy/NPC/warp/player)?
  │   ├─ Click → Select entity
  │   │   ├─ Enemy → enter WALK_TO_ATTACK (out of range) or ATTACK (in range)
  │   │   ├─ NPC → enter WALK_TO_INTERACT (out of range) or INTERACT (in range)
  │   │   ├─ Warp → enter WALK_TO_INTERACT (out of range) or INTERACT (in range)
  │   │   └─ Player → enter WALK_TO_INTERACT (out of range) → open trade/party menu
  │   │
  │   ├─ Right-click / long-press → Context menu (see 7.3)
  │   └─ Hover → Show name tooltip (see 7.4)
  │
  └─ Is on terrain?
      ├─ Click → Set targetPosition, enter WALK
      └─ Right-click / long-press → (reserved for future: mark on minimap)
```

### 7.2 Click Handler Architecture

New component: **`InteractionManager.tsx`**

```typescript
// Proposed: components/game/InteractionManager.tsx

function InteractionManager() {
  const { camera, gl } = useThree();
  const stateMachine = usePlayerStateMachine();

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0 && e.button !== 2) return; // left or right click only
    if (e.delta > 5) return; // was a drag, not a click

    const isRightClick = e.button === 2;

    // Check what was hit
    const hitEntity = findNearestInteractable(e);
    const hitTerrain = findTerrainPoint(e);

    if (isRightClick) {
      // Context menu
      if (hitEntity) openContextMenu(hitEntity, e);
      return;
    }

    // Left click
    if (hitEntity) {
      handleEntityClick(hitEntity);
    } else if (hitTerrain) {
      handleTerrainClick(hitTerrain);
    }
  }, []);

  return null; // invisible component, registers event handlers
}

// Usage: inside <Canvas>
<InteractionManager />
```

### 7.3 Context Menu

**Trigger:** Right-click (desktop) or long-press (mobile) on an entity.

**Menu options (context-dependent):**
- Enemy: Attack, Lock Target, Inspect
- NPC: Talk to, Follow (if ally)
- Player: Trade, Party Invite, Follow, Whisper
- Warp: Use Warp
- Ground: Move Here, (reserved)

**Implementation:** A React portal component rendered at pointer position.

### 7.4 Hover Tooltips

**Trigger:** Mouse hover on entity (desktop only — mobile has no hover).

```typescript
// In Enemy.tsx, onPointerOver / onPointerOut
// Already partially works — extend to show tooltip via HUD
```

For mobile, show tooltip on tap-hold (200ms delay without release).

### 7.5 Target Selection Visual

Already partially implemented:
- Gold ring under selected enemy (in `Enemy.tsx`)
- TargetFrame HUD shows HP bar, name, level

**Additions needed:**
- Selection indicator on NPCs/players (same golden ring)
- Highlight/glow on hovered entity
- Click feedback ripples on ground

### 7.6 NPC Interaction: Dialog Window (v1)

**Decision:** Walk to NPC → open dialog window. This requires a basic dialog system.

**Dialog Flow:**
1. Player clicks NPC → state machine: `WALK_TO_INTERACT`
2. Player reaches `interactionRange` → state: `INTERACT`
3. `INTERACT` triggers `onInteract()` callback on the NPC entity
4. NPC callback emits signal → HUD opens `DialogWindow`
5. `DialogWindow` shows NPC portrait + text + optional response buttons
6. Player clicks "Close" or selects a response → `INTERACT` exits → state: `IDLE`

**Minimal Dialog Data (in map JSON or separate NPC data file):**
```json
{
  "npcs": [
    {
      "id": "npc_01",
      "name": "Kafra Employee",
      "position": { "x": 5, "y": 0.5, "z": 3 },
      "dialog": [
        { "text": "Welcome to Prontera! How can I help you?", "responses": [
          { "text": "Save progress", "action": "save" },
          { "text": "Goodbye", "action": "close" }
        ]}
      ]
    }
  ]
}
```

**New components needed:**
- `DialogWindow` — React component in `components/game/ui/DialogWindow.tsx`
- NPC data loader — extend `shared/loader` to parse NPC definitions
- `useDialogStore` — simple Zustand store: `{ isOpen, npcName, dialogTree }`

### 7.7 Interactable Entity Registry

```typescript
interface Interactable {
  id: string;
  type: 'enemy' | 'npc' | 'warp' | 'player' | 'item';
  position: { x, y, z };
  interactionRange: number;
  onInteract: () => void;
  getContextMenuItems: () => ContextMenuItem[];
  getHoverInfo: () => { name: string; subtitle?: string };
}
```

Entities register themselves with `InteractionManager` on mount.

---

## 8. Input Handling

### 8.1 Input Sources

| Source | Platform | Maps To |
|---|---|---|
| Keyboard (WASD/Arrows) | Desktop | Direction vector |
| Virtual Joystick | Mobile | Direction vector |
| Mouse click on ground | Desktop | Target position |
| Touch tap on ground | Mobile | Target position |
| Click on entity | Both | Select + interact |
| Right-click on entity | Desktop | Context menu |
| Long-press on entity | Mobile | Context menu |
| Pinch (2F) | Mobile | Zoom |
| Scroll wheel | Desktop | Zoom |

### 8.2 Input Priority System

When multiple inputs are active, the priority is:

1. **Direct input (WASD/Joystick) → overrides click-to-move**
   - If player is walking via joystick and clicks on ground, the click is ignored
   - If player releases joystick while a target position exists, resume walking to that position

2. **Click on entity → overrides click-to-move to a position**
   - Changes target to entity with auto-attack/interact behavior

3. **Click on ground → sets new target position**
   - Deselects current target

### 8.3 Input State

```typescript
interface InputState {
  // Direct input (WASD / Joystick)
  direction: { x: number; z: number }; // normalized, or (0,0)

  // Click-to-move / click-to-interact
  target: {
    type: 'position' | 'entity';
    position?: { x: number; z: number };  // for ground click
    entityId?: string;                     // for entity click
    entityType?: 'enemy' | 'npc' | 'warp' | 'player';
  } | null;
}
```

Store this in a new `useInputStore` or as part of `useGameStore`.

### 8.4 Input Reconciliation

```
Frame loop:
  1. Read raw input (keys, touch, mouse clicks)
  2. Process through InputHandler → produces InputState
  3. Pass InputState to PlayerStateMachine → determines state & behavior
  4. PlayerStateMachine tells MovementController what to do
  5. MovementController moves the player (client prediction)
  6. NetworkManager sends direction + target info to server
```

---

## 9. Client-Server Data Flow

### 9.1 Current Data Flow

```
CLIENT (NetworkManager.tsx):
  setInterval(50ms) → sendInput({ dirX, dirZ, seq })

SERVER (game-server/index.ts):
  on('input') → push to player.inputQueue
  tick() → process all queues → move players → snapshot → emit 'worldSnapshot'

CLIENT:
  on('worldSnapshot') → reconcile position
```

### 9.2 Proposed Data Flow

The input message needs to carry MORE information:

```
CLIENT → SERVER: 'input'
{
  dirX: number,          // direct input direction
  dirZ: number,
  seq: number,           // sequence number
  targetType?: 'position' | 'entity' | null,
  targetX?: number,      // target position (for click-to-move)
  targetZ?: number,
  targetEntityId?: string, // target entity
  isAttacking?: boolean,  // whether player wants to attack
  timestamp: number       // client timestamp for latency calc
}

SERVER → CLIENT: 'worldSnapshot'
{
  tick: number,
  players: Record<socketId, SnapshotPlayer>,
  enemies: Record<enemyId, SnapshotEnemy>
}
// SnapshotPlayer now includes:
{
  x, y, z,
  hp, maxHp, sp, maxSp,
  lastProcessedSeq?,  // which seq was last processed
  state?: PlayerState, // server's view of player state (for validation)
  direction?: {x, z}   // facing direction
}
```

### 9.3 Server-Side Movement Processing

Server processes movement AND interaction targets:

```typescript
// In game-server tick():
for (const player of instance.players) {
  const latestInput = player.inputQueue[player.inputQueue.length - 1];

  // Process movement from direct input
  if (latestInput) {
    // Apply collision check (server has its own collision grid)
    const newPos = validateMovement(player, latestInput);
    player.x = newPos.x;
    player.z = newPos.z;
    player.lastProcessedSeq = latestInput.seq;
  }

  // Process target-based movement
  if (player.targetEntityId) {
    const enemy = instance.enemies.get(player.targetEntityId);
    if (enemy && !enemy.isDead) {
      const dist = distance(player, enemy);
      if (dist > ATTACK_RANGE) {
        // Move toward enemy
        moveToward(player, enemy.position, tickTimeSec);
      } else if (latestInput?.isAttacking) {
        // Allow attack (server processes attack separately)
      }
    } else {
      player.targetEntityId = null;
    }
  }
}
```

### 9.4 Lag Compensation

- Client sends `timestamp` with each input
- Server computes RTT when receiving
- When processing input, server accounts for network delay:
  - Simulate input at `serverTime - RTT/2` for hit detection
  - Position is already deterministic — no separate lag compensation needed for movement

### 9.5 Desync Detection

```typescript
// Client-side:
const serverPos = snapshot.players[socketId];
if (distance(clientPos, serverPos) > DESYNC_THRESHOLD) {
  // Hard correction
  rigidBody.setTranslation(serverPos, true);
  // Clear input history
  inputHistory.clear();
}
```

DESYNC_THRESHOLD = 3.0 world units (very high — only if something goes very wrong).

---

## 10. Component Architecture

### 10.1 New Components

| Component | Responsibility | File |
|---|---|---|
| `InteractionManager` | Handles all click/tap/hover events on 3D scene | `components/game/InteractionManager.tsx` |
| `MovementController` | Handles player movement logic (direct input, path following, collision) | `components/game/MovementController.tsx` |
| `ClickHandler` | Processes raycasting for click/hover on entities & terrain | `lib/clickHandler.ts` |
| `CollisionSystem` | Manages collision layers, provides collision queries | `lib/collisionSystem.ts` |
| `Pathfinding` | A* pathfinding + waypoint following | `lib/pathfinding.ts` |
| `InputHandler` | Processes all raw inputs into unified InputState | `lib/inputHandler.ts` |
| `PlayerStateMachine` | State machine for player behavior | `lib/playerStateMachine.ts` |
| `CameraController` (REFACTOR) | Fixed-angle RO-style camera, zoom, smart zoom, collision | `components/game/CameraController.tsx` |
| `ContextMenu` | Right-click/long-press context menu UI | `components/game/ui/ContextMenu.tsx` |
| `HoverTooltip` | Hover tooltip for entities | `components/game/ui/HoverTooltip.tsx` |

### 10.2 Modified Components

| Component | Changes |
|---|---|
| `Player.tsx` | Decompose into MovementController + state machine. Keep visual (Sprite + RigidBody). |
| `Enemy.tsx` | Add RigidBody collider, register with InteractionManager |
| `Map.tsx` | Add wall colliders, load collision grid on setup |
| `NetworkManager.tsx` | Send richer input data, handle new snapshot format |
| `RemotePlayers.tsx` | Animate with direction/state from server |
| `VirtualJoystick.tsx` | No changes needed (already produces normalized direction) |
| `useGameStore.ts` | Add `inputState`, `playerState`, `interactionTarget` |

### 10.3 Component Hierarchy (Proposed)

```
<GameScene>
  <Canvas>
    <Physics>
      <Map />
      <Player>
        <MovementController />      {/* New — handles state + movement */}
        <RigidBody>
          <CapsuleCollider />
          <Sprite />                {/* Visual only */}
        </RigidBody>
      </Player>
      <RemotePlayers />             {/* Animated with server data */}
      <Enemy />s                    {/* With colliders */}
      <WarpPortal />s
    </Physics>

    <CameraController />            {/* Refactored */}
    <InteractionManager />          {/* New — click/hover handling */}
    <ScreenShake />
    <EffectComposer>...</EffectComposer>
  </Canvas>

  <VirtualJoystick />
  <HUD>
    <ContextMenu />                 {/* New */}
    <TargetFrame />                 {/* Already exists */}
    ...
  </HUD>
</GameScene>
```

### 10.4 Key Class: `MovementController`

```typescript
// Proposed: components/game/MovementController.tsx
// This is a non-visual component that lives inside <Player>

function MovementController() {
  const stateMachine = usePlayerStateMachine();
  const pathFollower = usePathFollower();
  const rigidBody = useRigidBodyRef();

  useFrame((state, delta) => {
    // 1. Tick state machine
    stateMachine.tick();

    // 2. Get movement direction based on current state
    let direction = { x: 0, z: 0 };
    switch (stateMachine.state) {
      case 'WALK':
        direction = getDirectInput();
        break;
      case 'WALK_TO_ATTACK':
      case 'WALK_TO_INTERACT':
      case 'WALK':
        // If we have a click-to-move target
        direction = pathFollower.getDirection(currentPos) || { x: 0, z: 0 };
        // If direct input is active, override
        const directDir = getDirectInput();
        if (directDir.x !== 0 || directDir.z !== 0) {
          direction = directDir;
        }
        break;
      default:
        direction = { x: 0, z: 0 };
    }

    // 3. Apply collision-aware movement
    if (direction.x !== 0 || direction.z !== 0) {
      const displacement = {
        x: direction.x * SPEED * delta,
        z: direction.z * SPEED * delta,
      };
      // Rapier kinematic movement handles collision
      const newPos = {
        x: currentPos.x + displacement.x,
        y: currentPos.y,
        z: currentPos.z + displacement.z,
      };
      rigidBody.setNextKinematicTranslation(newPos);
    }

    // 4. Update animation state
    updateAnimation(stateMachine.state, direction);
  });
}
```

---

## 11. Edge Cases & Error Handling

### 11.1 Movement Edge Cases

| Case | Handling |
|---|---|
| **Lag spike** | Client continues prediction. On reconnect, server sends authoritative state. Hard snap if deviation > 3 units. |
| **Double-click / rapid clicks** | Debounce click handler (150ms). Only process last click. |
| **Click while moving via joystick** | Joystick overrides. Ignore click-to-move. Store target position for when joystick releases. |
| **Click on moving enemy** | Re-path when enemy moves > 2 units from last path destination. |
| **Path to unreachable target** | A* returns null → show "Cannot reach" toast, stay in place. |
| **Target dies while walking to it** | Transition to IDLE, deselect target. |
| **Map change while walking** | Cancel all paths, clear state machine, respawn at new spawn point. |

### 11.2 Camera Edge Cases

| Case | Handling |
|---|---|
| **Camera stuck in wall** | Sphere cast resolves this (Section 6.5). |
| **Very fast zoom** | Clamp zoom speed to 5 units/s. |
| **Mobile: 1F drag vs 2F pinch** | If touch count increases to 2, cancel drag mode, enter pinch mode. |
| **Pitch above/below limits** | Clamp to [minPitch, maxPitch]. |
| **Yaw overflow** | Keep yaw in [-π, π] range via modulo. |

### 11.3 Network Edge Cases

| Case | Handling |
|---|---|
| **Late packets (seq < last processed)** | Discard. |
| **Duplicate packets** | Server is idempotent (only process each seq once). |
| **Missing packets** | Client prediction covers gaps. Next snapshot corrects. |
| **Server crash** | Client detects via heartbeat timeout (5s). Show "Reconnecting..." overlay. |
| **Disconnect** | Save player position locally. On reconnect, restore. |

### 11.4 Overlapping Inputs

```
Scenario: Player is walking via joystick (WALK state).
         They tap on an enemy.

Resolution:
  1. Joystick input is still active → stay in WALK
  2. BUT: store the enemy as the "pending target"
  3. When joystick releases → enter WALK_TO_ATTACK for stored target
  4. If joystick reactivates → cancel target, back to WALK
```

---

## 12. Mobile-Specific Considerations

### 12.1 Touch Handling

- **Virtual joystick** (left side): Movement input
- **Tap on scene** (right side): Click-to-move, click-to-interact
- **2F pinch**: Zoom (no camera rotation available)
- **Long-press (500ms)**: Context menu (with haptic feedback if available)

### 12.2 Touch Event Priority

Determine what the user is touching:

```typescript
function classifyTouch(touch: Touch, elements: DOMRect[]): TouchIntent {
  // Is on joystick area?
  // Is on UI element?
  // Is on 3D scene?
  // Return: 'joystick' | 'ui' | 'scene'
}
```

- Camera orbit only activates when touch starts on `'scene'` area
- Use `event.composedPath()` to check if touch starts on a UI element

### 12.3 Viewport Considerations

- Camera smart-zoom defaults closer on mobile (smaller screen)
- Reduce `defaultDistance` to 10 on mobile
- Increase `minPitch` slightly for better ground visibility on small screens

```typescript
const isMobile = /Mobi|Android/i.test(navigator.userAgent);
const defaultDistance = isMobile ? 10 : 14;
const minDistance = isMobile ? 4 : 5;
```

### 12.4 Safe Areas

Virtual joystick and UI must respect `safe-area-inset-*` (already considered in current code with `safe-pl`, `safe-pb` classes).

### 12.5 Touch Processing for Context Menu

```typescript
let longPressTimer: NodeJS.Timeout | null = null;
let touchStartPos: {x, y} | null = null;

element.addEventListener('touchstart', (e) => {
  if (e.touches.length !== 1) return;
  touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };

  longPressTimer = setTimeout(() => {
    // Check if finger moved too much
    if (touchStartPos && distance(touchStartPos, currentPos) < 10) {
      openContextMenu(e.touches[0]);
    }
  }, 500);
});

element.addEventListener('touchmove', (e) => {
  if (longPressTimer && touchStartPos) {
    const dx = e.touches[0].clientX - touchStartPos.x;
    const dy = e.touches[0].clientY - touchStartPos.y;
    if (Math.sqrt(dx*dx + dy*dy) > 10) {
      clearTimeout(longPressTimer); // Cancel long-press — user is dragging
    }
  }
});

element.addEventListener('touchend', () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
  touchStartPos = null;
});
```

### 12.6 Mobile Performance

- Reduce collision grid resolution on mobile (1 unit vs 0.5)
- Cap pathfinding search nodes to 300 on mobile
- Reduce particle effects for camera orbit/hit feedback
- Use `dpr={[1, 1.5]}` on mobile (already partially done)

---

## 13. Implementation Priority

### Phase 1: Foundation (Week 1-2)

**Goal:** Minimum viable movement + camera + click-to-move with collision.

| Step | File(s) | What To Do | Why |
|---|---|---|---|
| **1.1** | `lib/collisionSystem.ts` (NEW) | Export collision group masks (`PLAYER`, `ENEMY`, `WALL`, `PLAYER_2`, `SENSOR`). Define helper `collisionFilter(group: number, mask: number)` for Rapier. | Central collision config used everywhere. |
| **1.2** | `shared/data/balance.json` | Add `collisionGridResolution: 0.5`, `reconciliationSnapThreshold: 3.0`. Already has movement fields. | Ensure balance file has new tuning fields. |
| **1.3** | `lib/playerStateMachine.ts` (NEW) | Export `PlayerStateMachine` class with states: `IDLE`, `WALK`, `WALK_TO_ATTACK`, `WALK_TO_INTERACT`, `ATTACK`, `INTERACT`, `DEAD`, `STUNNED`. Support `tick()`, `forceState()`, `addTransition()`. | Explicit state machine drives all player behavior. |
| **1.4** | `components/game/Player.tsx` | **REFACTOR**: Remove inline movement/attack/input logic. Keep only: `RigidBody` + `<CapsuleCollider args={[0.3, 0.4]} />` (manual, no auto-colliders) + `<Sprite>`. Add `<MovementController />` as child. Use `setNextKinematicTranslation` instead of `setTranslation`. | Decompose monolithic Player into visual shell + controller. |
| **1.5** | `components/game/MovementController.tsx` (NEW) | Non-visual component inside `<Player>`. Calls `stateMachine.tick()` each frame. Reads `InputState` (WASD keys, joystick, targetPosition). Computes movement direction based on state. Applies via `rigidBody.setNextKinematicTranslation(newPos)`. Updates animation refs (`animStateRef`, `directionRef`). Handles reconciliation: lerp toward server position if deviance < 3 units, snap if > 3. | Core movement control with state machine integration. |
| **1.6** | `components/game/Enemy.tsx` | Add `<RigidBody type="fixed" colliders={false}><CapsuleCollider args={[0.3, 0.3]} /></RigidBody>` wrapping existing content. Set collision groups to `ENEMY`. | Enemies become solid obstacles. |
| **1.7** | `components/game/Map.tsx` | Add map-perimeter wall colliders (4 invisible boxes at N/S/E/W edges). If map data includes `colliders[]`, create `<CuboidCollider>` for each. | Players can't walk out of bounds; buildings are solid. |
| **1.8** | `lib/collisionGrid.ts` (NEW) | `buildCollisionGrid(mapData: MapData): boolean[][]`. Rasterizes `colliders[]` and map bounds onto a grid. Exports `isWalkable(grid, x, z)` and `findPath(start, goal, grid)` as thin wrappers. | Collision grid for pathfinding (ready for Phase 2 but created now). |
| **1.9** | `components/game/CameraController.tsx` | **REWRITE**: Fixed-angle RO-style. Constants `FIXED_YAW=0.85`, `FIXED_PITCH=0.87`. Smooth zoom via scroll wheel & pinch. Smart zoom (zoom out when moving). Remove all orbit/rotation logic. Keep position lerp + lookAt. Add camera collision raycast (Section 6.6). | Camera no longer orbits — matches RO style. |
| **1.10** | `components/game/NetworkManager.tsx` | Keep current interval-based input sending but **extend** `sendInput` payload to include `targetType`, `targetX`, `targetZ`, `targetEntityId`, `isAttacking`, `timestamp` (optional/null for now if not implemented). Increase `INPUT_RATE_MS` from 50 to 100. | Reduced bandwidth, richer data for future phases. |
| **1.11** | `shared/types/network.ts` | Update `SnapshotPlayer` to include optional `animState?: string`, `dirX?: number`, `dirZ?: number`. Update `SnapshotEnemy` similarly. | Remote player animation data (wire format ready). |
| **1.12** | `game-server/index.ts` | In `tick()`, populate `animState` and `dirX`/`dirZ` on `SnapshotPlayer` from player's last known state. For now, derive simply: `animState = (dx\|\|dz) ? 'walk' : 'idle'`. | Server provides animation data for remote players. |
| **1.13** | `components/game/RemotePlayers.tsx` | Update `<RemotePlayerSprite>` to read `animState` and `dirX`/`dirZ` from `PeerPlayerState`. Convert `dirX,dirZ` to `Direction` via `directionFromAngle()`. Set `animStateRef.current` and `directionRef.current` accordingly. | Remote players now animate properly (walk/idle) with correct facing. |
| **1.14** | `store/useGameStore.ts` | Add fields: `playerState: PlayerState`, `inputState: InputState`, `interactionTarget`. Add setters. Keep existing fields. | State machine needs persistent state. |
| **1.15** | `store/useNetworkStore.ts` | Update reconciliation logic: track input history, smooth lerp toward server position, detect desync (>3 units → snap). Update `remotePlayers` to include `animState`/`dirX`/`dirZ`. | Smoother reconciliation with history. |

**Milestone checklist (end of Phase 1):**
- [ ] Player walks with WASD/joystick, clips into nothing (collision works)
- [ ] Player bumps into enemies and map walls (stops/slides)
- [ ] Camera follows player at fixed NE angle, zooms with scroll/pinch
- [ ] Camera smart-zooms when moving
- [ ] Click on ground → player pathfinds there (simple A*)
- [ ] Click on enemy → player walks to attack range, auto-attacks
- [ ] Remote players animate properly (walk/idle, facing correct direction)
- [ ] Network reconciliation is smooth (no sudden snaps in normal play)

### Phase 2: Click-to-Move & Pathfinding (Week 3-4)

| # | Task | Dependencies | Files Changed |
|---|---|---|---|
| 6 | **Collision grid generation** from map data | #3 | `lib/collisionGrid.ts` (new), `Map.tsx` |
| 7 | **A* Pathfinding** | #6 | `lib/pathfinding.ts` (new) |
| 8 | **PathFollower** — waypoint queue + steering | #7 | `lib/pathFollower.ts` (new) |
| 9 | **ClickHandler** — raycasting, entity vs terrain classification | None | `lib/clickHandler.ts` (new) |
| 10 | **InteractionManager** — click dispatch to state machine | #9, #1 | `components/game/InteractionManager.tsx` (new) |
| 11 | **Integrate click-to-move** with MovementController | #8, #10 | `MovementController.tsx` |

**Milestone:** Click on ground → player walks there with collision. Click on enemy → walks into range, auto-attacks.

### Phase 3: Interaction & Polish (Week 5-6)

| # | Task | Dependencies | Files Changed |
|---|---|---|---|
| 12 | **Context menu** (right-click / long-press) | #10 | `components/game/ui/ContextMenu.tsx` (new) |
| 13 | **Hover tooltips** | #10 | `components/game/ui/HoverTooltip.tsx` (new) |
| 14 | **NPC interaction** (walk to NPC → trigger dialog) | #10, #8 | `WarpPortal.tsx`, new NPC system |
| 15 | **Camera collision** | #5 | `CameraController.tsx` |
| 16 | **Remote player animation** | #1 | `RemotePlayers.tsx` |
| 17 | **Higher-order input prioritization** | #11 | `lib/inputHandler.ts` (new) |
| 18 | **Reconciliation improvements** (smoother correction) | #2 | `useNetworkStore.ts`, `Player.tsx` |

**Milestone:** Full interaction system works — click any entity, context menus, hover tooltips, camera never clips.

### Phase 4: Tuning & Bugs (Week 7-8)

| # | Task | Dependencies |
|---|---|---|
| 19 | Latency/desync testing with 2+ players | #18 |
| 20 | Pathfinding edge cases (unreachable, moving targets) | #7 |
| 21 | Mobile performance optimization | All |
| 22 | Touch gesture refinement (prevent pinch-zoom interference with clicks) | #5 |
| 23 | Balance tuning of speeds, ranges, camera distances | All |

---

## 14. Tuning Parameters

All tunable parameters, their safe ranges, and gameplay impact.

### 14.1 Movement

| Parameter | Default | Min | Max | Impact |
|---|---|---|---|---|
| `playerSpeed` | 8 | 4 | 16 | How fast player moves. Higher = less skill needed for positioning |
| `attackRange` | 3.0 | 1.0 | 7.0 | Melee vs ranged distance |
| `attackCooldownMs` | 250 | 100 | 1000 | DPS tuning |
| `interactionRange` | 2.0 | 1.0 | 5.0 | How close to NPC/warp to interact |

### 14.2 Pathfinding

| Parameter | Default | Min | Max | Impact |
|---|---|---|---|---|
| `gridResolution` | 0.5 | 0.25 | 1.0 | Path smoothness vs CPU. Lower = smoother but heavier. Mobile: 1.0 |
| `maxSearchNodes` | 500 | 200 | 2000 | Path quality vs CPU timeout |
| `repathIntervalMs` | 500 | 200 | 2000 | How often to re-path to moving target |
| `arrivedThreshold` | 0.3 | 0.1 | 1.0 | How close to waypoint before moving to next |

### 14.3 Camera (Fixed-Angle RO-Style)

| Parameter | Default | Min | Max | Impact |
|---|---|---|---|---|
| `fixedYaw` | 0.85 rad (49°) | 0.5 | 1.2 | Fixed horizontal angle. NE-ish direction. |
| `fixedPitch` | 0.87 rad (50°) | 0.6 | 1.1 | Fixed overhead angle. Higher = more top-down. |
| `minDistance` | 5 | 3 | 10 | How close camera can zoom |
| `maxDistance` | 20 | 15 | 30 | How far camera can zoom out |
| `defaultDistance` | 14 | 8 | 20 | Default zoom level |
| `zoomSpeed` | 2.0 | 0.5 | 5.0 | Camera zoom speed |
| `smoothLerp` | 0.06 | 0.02 | 0.15 | Camera smoothing (per frame at 60fps) |
| `smartZoomBoost` | 2.0 | 0 | 5.0 | How much camera zooms out when moving |

### 14.4 Network

| Parameter | Default | Min | Max | Impact |
|---|---|---|---|---|
| `sendIntervalMs` | 100 | 50 | 200 | How often client sends input. Lower = smoother but more bandwidth |
| `tickRateMs` | 50 | 20 | 100 | Server tick rate |
| `interestRange` | 30 | 15 | 60 | Visibility range |
| `correctionSnapThreshold` | 3.0 | 1.0 | 5.0 | When to hard-snap position |
| `correctionLerpSpeed` | 0.08 | 0.02 | 0.2 | Smooth correction speed |
| `inputHistorySize` | 50 | 20 | 100 | How many past inputs to keep for reconciliation |

---

## 15. Data Contracts

### 15.1 Client → Server: `input`

```typescript
interface PlayerInput {
  dirX: number;          // -1 to 1, direct input direction
  dirZ: number;          // -1 to 1
  seq: number;           // monotonic sequence number
  targetType?: 'ground' | 'entity' | null;
  targetX?: number;      // world X (for ground click)
  targetZ?: number;      // world Z (for ground click)
  targetEntityId?: string; // entity ID (for entity click)
  isAttacking?: boolean;  // true if attack button held / auto-attack enabled
  timestamp: number;      // client time for lag comp
}
```

### 15.2 Server → Client: `worldSnapshot`

```typescript
interface WorldSnapshot {
  tick: number;
  players: Record<string, SnapshotPlayer>;
  enemies: Record<string, SnapshotEnemy>;
}

interface SnapshotPlayer {
  x: number;
  y: number;
  z: number;
  hp: number;
  maxHp: number;
  sp: number;
  maxSp: number;
  lastProcessedSeq?: number;  // which client input seq was last processed
  state?: string;              // server's view of player state (IDLE/WALK/ATTACK)
  dirX?: number;               // server's view of facing direction
  dirZ?: number;
  animState?: string;          // 'idle' | 'walk' | 'attack'
}

interface SnapshotEnemy {
  hp: number;
  maxHp: number;
  isDead: boolean;
  position: { x: number; y: number; z: number };
  name?: string;
  level?: number;
  dirX?: number;              // facing direction for animation
  dirZ?: number;
}
```

### 15.3 Client → Server: `attack`

```typescript
interface AttackRequest {
  targetId: string;
  skillId: string | null;
  sp: number;
  position: { x: number; y: number; z: number }; // player position for validation
  timestamp: number;
}
```

### 15.4 Map Data (Extended with Collision)

```typescript
interface MapData {
  mapId: string;
  mapName: string;
  mapType: string;
  dimensions: { width: number; height: number };
  spawnPoints: MapSpawnPoint[];
  warps: WarpInfo[];
  safeZones: SafeZone[];
  decorations: Decoration[];
  grassTuftCount: number;
  grassTexture: GrassTexture;
  floorColor: string;
  // NEW:
  collisionGrid?: number[][];  // 0 = walkable, 1 = blocked
  colliders?: ColliderDef[];   // box colliders for walls/buildings
}

interface ColliderDef {
  type: 'box' | 'cylinder' | 'mesh';
  position: [number, number, number];
  size?: [number, number, number];  // for box
  radius?: number;                   // for cylinder
  height?: number;                   // for cylinder
  rotation?: number;                 // Y-axis rotation in radians
}
```

### 15.5 Store Updates

Add to `useGameStore`:

```typescript
// Additions to existing GameStore interface
interface GameStore {
  // New fields
  playerState: PlayerState;           // 'IDLE' | 'WALK' | etc
  inputState: InputState;
  interactionTarget: {
    type: 'enemy' | 'npc' | 'warp' | 'player' | 'item' | null;
    entityId: string | null;
  };

  // New actions
  setPlayerState: (state: PlayerState) => void;
  setInputState: (state: InputState) => void;
  setInteractionTarget: (target: InteractionTarget) => void;
  clearInteractionTarget: () => void;

  // Existing (keep)
  position: { x, y, z };
  inputDirection: { x, z };
  targetPosition: { x, z } | null;
  selectedTargetId: string | null;
  // ...
}
```

### 15.6 Store Updates (RemotePlayers)

Add to `useNetworkStore`. Server now sends direction + animState in every snapshot.

```typescript
interface PeerPlayerState {
  x: number;
  y: number;
  z: number;
  name: string;
  // NEW (from server snapshot):
  animState: 'idle' | 'walk' | 'attack' | 'hit' | 'dead';
  dirX: number;    // facing direction X component
  dirZ: number;    // facing direction Z component
  level?: number;
  jobClass?: string;
  hp?: number;
  maxHp?: number;
}
```

Server must include `animState` and `dirX`/`dirZ` in `SnapshotPlayer` (see Section 15.2). Client uses these to animate remote player sprites properly instead of always showing idle facing South.

---

## Appendix A: Glossary

| Term | Definition |
|---|---|
| **Client Prediction** | Client simulates movement immediately without waiting for server |
| **Server Reconciliation** | Client corrects its position based on authoritative server state |
| **Sequence Number** | Monotonic increasing number on each input packet, used for reconciliation |
| **RTT** | Round-trip time between client and server |
| **Kinematic Body** | Physics body that moves via direct position setting but still triggers collision events |
| **NavMesh** | Navigation mesh — graph of walkable surfaces for pathfinding |
| **String-Pulling** | Post-processing of A* paths to remove unnecessary waypoints |
| **Interest Range** | Maximum distance at which entities are visible to a player |

## Appendix B: Migration from Current to New System

```diff
- Current Player.tsx: 202 lines of inline movement + attack + input
+ New structure:
    Player.tsx: ~50 lines (RigidBody + Sprite + MovementController)
    MovementController.tsx: ~100 lines (state machine calls, collision-aware movement)
    PlayerStateMachine.ts: ~80 lines (state transitions)
    InputHandler.ts: ~60 lines (keyboard + joystick + click unification)

- Current CameraController.tsx: 69 lines (simple follow + smart zoom)
+ New CameraController.tsx: ~200 lines (orbit, yaw/pitch/zoom, collision, touch gestures)

- Current Enemy.tsx: already has pointer events, needs collider + registration
+ Add: CapsuleCollider, register in onClickHandler

- Current NetworkManager.tsx: sends dir only
+ New: sends richer input with target info, timestamp
```

## Appendix C: Key Gotchas

1. **`kinematicPosition` RigidBody**: Player uses `type="kinematicPosition"` with direct `setTranslation()` calls. This eliminates gravity/force interference that causes jitter on dynamic bodies. Kinematic bodies still participate in collision response (they push dynamic bodies and trigger callbacks).

2. **Rapier `CapsuleCollider` args**: `CapsuleCollider args={[radius, halfHeight]}`. For a player, `args={[0.3, 0.4]}` creates a 0.6-radius capsule 0.8 units tall.

3. **Rapier sensor colliders**: Use `sensor` prop on collider for warps/triggers — they detect overlap without physical collision.

4. **Camera collision performance**: Don't raycast every frame if camera hasn't moved much. Only raycast when camera position changes by > 0.1 units.

5. **Click vs drag ambiguity**: Track pointer movement distance. If moved > 5px between down and up, it was a drag (camera orbit), not a click. Only process clicks on `pointerup` if the total movement was small.

6. **Zustand render optimization**: `useGameStore(state => state.position)` creates a subscription. If position updates 60fps, the component re-renders 60fps. Consider using `useRef` + `getState()` for high-frequency position reads inside `useFrame`.

7. **Mobile scroll prevention**: Set `touch-action: none` on the canvas (already partially done in GameScene). Prevent default touch behavior to avoid page scroll.
