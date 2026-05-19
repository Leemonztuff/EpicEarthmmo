# Integration Phase 2: Pathfinding + NPC + Object Interaction

**Project:** EpicEarthMMO — Web-based Mobile MMORPG (Ragnarok Online Clone)  
**Author:** Systems Designer  
**Date:** 2026-05-19  
**Status:** Draft  
**Depends On:** `lib/collisionGrid.ts` (A*), `lib/movementController.ts`, `lib/playerStateMachine.ts`, `components/game/WarpPortal.tsx`, `store/useGameStore.ts`  

---

## Table of Contents

1. [Data Formats](#1-data-formats)
2. [Component Architecture](#2-component-architecture)
3. [Data Flow: Click → Pathfind → Walk → Interact → Result](#3-data-flow)
4. [Implementation Order](#4-implementation-order)
5. [Dialog System Design](#5-dialog-system-design)
6. [Pathfinding Integration Details](#6-pathfinding-integration-details)
7. [File Change Index](#7-file-change-index)

---

## 1. Data Formats

### 1.1 NPC Data (in Map JSON)

Add an `npcs[]` array to the map JSON alongside existing `warps[]`, `colliders[]`, etc.

```json
{
  "id": "prontera",
  "name": "Prontera",
  "type": "town",
  "dimensions": { "width": 80, "height": 80 },
  "spawnPoints": [...],
  "warps": [...],
  "npcs": [
    {
      "id": "npc_kafra_01",
      "name": "Kafra Employee",
      "position": { "x": 3, "y": 0.5, "z": 2 },
      "sprite": "kafra",                        // sprite entity ID for rendering
      "direction": "S",                          // default facing direction
      "dialogId": "kafra_welcome",               // key into dialog database
      "interactionRange": 2.0,                   // optional, defaults to balance value
      "behaviors": ["save", "storage"],          // flags for what this NPC does (optional)
      "collision": true                          // whether NPC blocks movement (default: true)
    },
    {
      "id": "npc_merchant_01",
      "name": "Tool Dealer",
      "position": { "x": -4, "y": 0.5, "z": -2 },
      "sprite": "merchant",
      "direction": "N",
      "dialogId": "tool_dealer_main"
    }
  ],
  "chests": [
    {
      "id": "chest_01",
      "position": { "x": -10, "y": 0.5, "z": -5 },
      "visual": "wooden_chest",                  // visual variant
      "contents": [
        { "itemId": "red_potion", "amount": 3, "chance": 1.0 },
        { "itemId": "zeny", "amount": 100, "chance": 1.0 }
      ],
      "respawnSeconds": 300,                     // time before chest reappears
      "isOpen": false                            // runtime state
    }
  ],
  "colliders": [...],
  "decorations": [...],
  "safeZones": [...]
}
```

### 1.2 NPC Dialog Data (Separate JSON File)

NPC dialog is stored in `shared/data/dialogs.json` — separate from map data to allow reuse of dialog trees across NPCs.

```json
{
  "dialogs": [
    {
      "id": "kafra_welcome",
      "npcName": "Kafra Employee",
      "npcSprite": "kafra",
      "nodes": [
        {
          "id": "start",
          "text": "Welcome to the Kafra Services! How may I assist you today?",
          "responses": [
            { "text": "Save my progress", "action": { "type": "save" }, "nextNode": "saved" },
            { "text": "Use storage", "action": { "type": "open_storage" }, "nextNode": null },
            { "text": "Never mind", "action": { "type": "close" }, "nextNode": null }
          ]
        },
        {
          "id": "saved",
          "text": "Your adventure has been recorded. Stay safe out there!",
          "responses": [
            { "text": "Thank you!", "action": { "type": "close" }, "nextNode": null }
          ]
        }
      ],
      "startNode": "start"
    },
    {
      "id": "tool_dealer_main",
      "npcName": "Tool Dealer",
      "npcSprite": "merchant",
      "nodes": [
        {
          "id": "start",
          "text": "Looking to buy some essentials? I've got everything an adventurer needs!",
          "responses": [
            { "text": "Open shop", "action": { "type": "open_shop", "shopId": "tool_dealer" }, "nextNode": null },
            { "text": "Not now", "action": { "type": "close" }, "nextNode": null }
          ]
        }
      ],
      "startNode": "start"
    }
  ]
}
```

**Dialog Node Schema:**

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique node ID within this dialog |
| `text` | string | NPC dialogue line (supports `{playerName}` template) |
| `responses` | Response[] | Array of player response options |
| `response.text` | string | Button label shown to player |
| `response.action` | Action | What happens on selection |
| `response.nextNode` | string\|null | Next dialog node ID, or `null` to close |

**Action Types:**

| Type | Effect |
|---|---|
| `close` | Close dialog, return to idle |
| `save` | Trigger save (send to server) |
| `open_storage` | Open storage UI (future) |
| `open_shop` | Open shop UI with given `shopId` |
| `give_item` | Give item to player (no confirmation) |
| `take_item` | Remove item from player inventory |
| `trigger_quest` | Start/advance a quest (future) |
| `custom` | Custom callback via `eventName` |

### 1.3 Updated Warp Data (Click-to-Warp)

Warp entries in map JSON **already** have the needed fields. The `visual` field determines rendering style. The `targetMapId` and `targetSpawnId` already exist in `WarpSchema`.

No schema changes needed for warps — we only need to **add interaction** to the existing visual component.

### 1.4 Schema Update: maps.ts

Add to `shared/schemas/maps.ts`:

```typescript
// ── New schemas ──

export const NPCSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  sprite: z.string().optional(),
  direction: z.enum(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']).optional().default('S'),
  dialogId: z.string(),
  interactionRange: z.number().positive().optional(),
  behaviors: z.array(z.string()).optional(),
  collision: z.boolean().optional().default(true),
});

export const ChestContentsSchema = z.object({
  itemId: z.string(),
  amount: z.number().int().positive(),
  chance: z.number().min(0).max(1).optional().default(1),
});

export const ChestSchema = z.object({
  id: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  visual: z.enum(['wooden_chest', 'iron_chest', 'golden_chest', 'treasure_box']).optional().default('wooden_chest'),
  contents: z.array(ChestContentsSchema),
  respawnSeconds: z.number().int().positive().optional().default(0),
  isOpen: z.boolean().optional().default(false),
});

// ── Update MapSchema ──
// Add these lines to the existing MapSchema object:
//   npcs: z.array(NPCSchema).optional().default([]),
//   chests: z.array(ChestSchema).optional().default([]),
```

### 1.5 Dialog Schema (New File: `shared/schemas/dialogs.ts`)

```typescript
import { z } from 'zod';

export const DialogActionSchema = z.object({
  type: z.enum(['close', 'save', 'open_storage', 'open_shop', 'give_item', 'take_item', 'trigger_quest', 'custom']),
  shopId: z.string().optional(),
  itemId: z.string().optional(),
  amount: z.number().int().optional(),
  eventName: z.string().optional(),  // for 'custom' action type
});

export const DialogResponseSchema = z.object({
  text: z.string().min(1).max(120),
  action: DialogActionSchema,
  nextNode: z.string().nullable(),
});

export const DialogNodeSchema = z.object({
  id: z.string(),
  text: z.string().min(1).max(500),
  responses: z.array(DialogResponseSchema),
});

export const DialogSchema = z.object({
  id: z.string(),
  npcName: z.string(),
  npcSprite: z.string().optional(),
  nodes: z.array(DialogNodeSchema),
  startNode: z.string(),
});

export const DialogDatabaseSchema = z.object({
  dialogs: z.array(DialogSchema),
});

export type DialogAction = z.infer<typeof DialogActionSchema>;
export type DialogResponse = z.infer<typeof DialogResponseSchema>;
export type DialogNode = z.infer<typeof DialogNodeSchema>;
export type Dialog = z.infer<typeof DialogSchema>;
export type DialogDatabase = z.infer<typeof DialogDatabaseSchema>;
```

### 1.6 New Store Types

Add to `types/game.ts` or create `types/interaction.ts`:

```typescript
// types/interaction.ts

export type InteractableType = 'npc' | 'warp' | 'chest' | 'enemy' | 'player';

export interface InteractionTarget {
  type: InteractableType;
  entityId: string;
  position: { x: number; y: number; z: number };
  interactionRange: number;
  name: string;
  // Type-specific payload:
  dialogId?: string;           // for NPC
  targetMapId?: string;        // for warp
  chestContents?: ChestContentRef[];  // for chest
}

export interface ChestContentRef {
  itemId: string;
  amount: number;
  chance: number;
}

export interface PathWaypoint {
  x: number;
  z: number;
}

export interface PathState {
  waypoints: PathWaypoint[];
  currentIndex: number;
  target: { type: 'position' | 'entity'; entityId?: string } | null;
  lastRecomputeTime: number;
}
```

---

## 2. Component Architecture

### 2.1 New Components

| Component | File | Purpose |
|---|---|---|
| `NPCRenderer` | `components/game/NPCRenderer.tsx` | Renders NPC sprites in 3D scene with name labels and selection indicators |
| `InteractionManager` | `components/game/InteractionManager.tsx` | Invisible component that handles all click events — classifies click targets, dispatches to pathfinding |
| `PathFollower` | `lib/pathFollower.ts` | Waypoint queue + steering logic. Reads path from A*, advances through waypoints, recomputes when needed |
| `DialogWindow` | `components/game/ui/DialogWindow.tsx` | Modal dialog UI — NPC portrait, text, response buttons |
| `ChestInteractable` | `components/game/ChestInteractable.tsx` | Chest 3D object — visual states (closed/open), click handler, loot window trigger |
| `LootWindow` | `components/game/ui/LootWindow.tsx` | "You received" popup — item icons + names with animation |
| `useInteractionStore` | `store/useInteractionStore.ts` | Zustand store: dialog state, interaction target, path state, loot notifications |

### 2.2 Modified Components

| Component | Changes |
|---|---|
| `Map.tsx` | Add rendering loop for `npcs[]` (as `<NPCRenderer>`) and `chests[]` (as `<ChestInteractable>`). Pass `mapData` ref down. Add `<InteractionManager>`. |
| `Player.tsx` | Integrate `PathFollower` into `useFrame`. Replace simple targetPosition movement with waypoint-based movement. |
| `WarpPortal.tsx` | Already has `onClick={handleInteract}` that calls `requestWarp`. **No click-interaction changes needed** — but needs to integrate with pathfinding: click → pathfind to warp → auto-interact when in range. |
| `useGameStore.ts` | Add interaction state fields (target entity, path state). |
| `useNetworkStore.ts` | Add `requestInteraction` socket action for NPC/chest interactions (server validation). |
| `shared/schemas/maps.ts` | Add NPCSchema, ChestSchema, update MapSchema. |
| `shared/schemas/index.ts` | Export new schemas. |
| `shared/loader/clientLoader.ts` | Load dialogs.json. |
| `shared/data/balance.json` | Add `npcInteractionRange`, `chestInteractionRange`, `pathRecalcIntervalMs` if not present. |

### 2.3 Component Hierarchy

```
<Canvas>
  <Physics>
    <Map>
      <Floor />
      <Colliders />
      <WarpPortal />s           ← already exists, no visual changes
      <NPCRenderer />s          ← NEW: renders NPC sprites
      <ChestInteractable />s    ← NEW: renders chests
      <Enemy />s
      <SafeZoneIndicator />s
    </Map>
    <Player>
      <RigidBody>
        <CapsuleCollider />
        <Sprite />
      </RigidBody>
    </Player>
    <RemotePlayers />
  </Physics>

  <InteractionManager />        ← NEW: registers pointer events
  <CameraController />
  <ScreenShake />
</Canvas>

<HUD>
  <DialogWindow />              ← NEW: modal dialog UI (renders when active)
  <LootWindow />                ← NEW: loot notification (renders when active)
  <TargetFrame />
  <Minimap />
  ...
</HUD>
```

**Note:** `InteractionManager` lives **outside** `<Physics>` but inside `<Canvas>` so it has access to `useThree()` for raycasting.

---

## 3. Data Flow: Click → Pathfind → Walk → Interact → Result

### 3.1 Unified Click Flow

```
Player clicks/taps on 3D scene
        │
        ▼
InteractionManager.handlePointerDown(e)
        │
        ├─ Is pointer on UI element? → IGNORE (React handles UI clicks)
        │
        ├─ Is click on an entity (check via raycaster)?
        │   │
        │   ├─ Entity is NPC
        │   │   → setInteractionTarget({ type: 'npc', entityId, position, dialogId })
        │   │   → startPathfinding(position)
        │   │
        │   ├─ Entity is Warp Portal
        │   │   → setInteractionTarget({ type: 'warp', entityId, position, targetMapId })
        │   │   → startPathfinding(position)
        │   │
        │   ├─ Entity is Chest
        │   │   → setInteractionTarget({ type: 'chest', entityId, position })
        │   │   → startPathfinding(position)
        │   │
        │   └─ Entity is Enemy
        │       → setSelectedTargetId(entityId)
        │       → (existing auto-follow/attack logic handles this)
        │
        └─ Is click on terrain?
            → setTargetPosition({ x, z })
            → setInteractionTarget(null)
            → setSelectedTargetId(null)
            → startPathfinding({ x, z })
```

### 3.2 Pathfinding + Waypoint Following Flow

```
startPathfinding(targetPosition)
        │
        ▼
1. Get collision grid from cache (built when map loaded)
        │
        ▼
2. Call findPath(grid, playerX, playerZ, targetX, targetZ)
        │
        ├─ path found (non-empty)
        │   → set pathWaypoints = [p1, p2, ..., target]
        │   → set pathIndex = 0
        │   → set pathActive = true
        │
        └─ path empty (unreachable)
            → showToast("Cannot reach destination")
            → setInteractionTarget(null)
            → return early

        │
        ▼
3. Each frame in Player.tsx/PathFollower:
   a. If pathActive is false → skip
   b. Get current waypoint: waypoints[pathIndex]
   c. Compute direction toward waypoint (normalized)
   d. If distance to current waypoint < arrivedThreshold (0.3):
      - pathIndex++
      - If pathIndex >= waypoints.length:
          → pathActive = false
          → onArrived()  // see 3.3
   e. Set inputDir to waypoint direction
   f. Movement applies via existing setTranslation logic
```

### 3.3 Arrival Handler (onArrived)

When the last waypoint is reached:

```
Path complete → target reached
        │
        ▼
Check interactionTarget.type:
        │
        ├─ 'npc'
        │   → sm phase = 'interact'
        │   → interactTimer = 0.8 (brief interaction pause)
        │   → After interactTimer expires:
        │       → openDialogWindow(interactionTarget.dialogId)
        │
        ├─ 'warp'
        │   → sm phase = 'interact'
        │   → interactTimer = 0.5
        │   → After interactTimer expires:
        │       → emit warp request: socket.emit('requestWarp', { warpId })
        │       → (server handles map change)
        │
        ├─ 'chest'
        │   → sm phase = 'interact'
        │   → interactTimer = 0.8
        │   → After interactTimer expires:
        │       → emit socket.emit('openChest', { chestId })
        │       → if response: openChest animation + loot window
        │
        └─ 'position' (just moving)
            → sm phase = 'idle'
            → clear interactionTarget
```

### 3.4 Re-Path Conditions (during waypoint following)

Recompute path when ANY of these triggers:

```
1. Timer-based: lastRecomputeTime + 500ms has elapsed
   AND interactionTarget is an entity (NPC/chest/warp)
   → Recompute with current player position + target position

2. Target moved: interactionTarget is entity AND
   distance(entity.position, lastPathTargetPosition) > 1.0
   → Recompute (entity likely isn't moving for NPC/warp, but future-proof)

3. Waypoint unreachable: player stuck (stuckTimer > 2.0s)
   AND pathActive is true
   → Recompute from current position. If still unreachable, cancel path.

4. Direct input override: WASD or joystick active
   → Cancel path immediately (inputDirection overrides)

5. Map change: currentMapId changes
   → Cancel path, clear all state
```

### 3.5 Interaction State Machine Integration

The existing `playerStateMachine.ts` has `interact` phase and `interactTimer`. We extend it:

- When path reaches target and target is an interactable (NPC/warp/chest):
  - Set `sm.phase = 'interact'`
  - Set `sm.interactTimer = INTERACT_DELAY` (0.5-0.8s — a brief pause before trigger)
  - Set `sm.interactTargetId = entityId`
- During `interact` phase:
  - Player stays in place, animation stays `'idle'`
  - After timer expires, the **arrival callback** fires
- After callback completes (dialog opens, warp fires, chest opens):
  - Call `sm.phase = 'idle'`
  - Clear `sm.interactTargetId`

---

## 4. Implementation Order

### Phase 2A: Core Infrastructure (Build First — Foundation)

| Step | Task | Files | Why First |
|------|------|-------|-----------|
| **2A.1** | Add `NPCSchema` + `ChestSchema` to `shared/schemas/maps.ts` | `shared/schemas/maps.ts` | Data formats must be defined before any component work |
| **2A.2** | Create `shared/schemas/dialogs.ts` | `shared/schemas/dialogs.ts` | Dialog schema needed for dialog system |
| **2A.3** | Create `shared/data/dialogs.json` with initial NPC dialog data | `shared/data/dialogs.json` | Content needed for testing |
| **2A.4** | Add NPC/chest map data to `prontera.json` (test NPC + chest) | `shared/data/maps/prontera.json` | Test data needed immediately |
| **2A.5** | Update `shared/loader/clientLoader.ts` to load dialogs | `shared/loader/clientLoader.ts` | Dialog data must be available at runtime |
| **2A.6** | Update `shared/schemas/index.ts` exports | `shared/schemas/index.ts` | Keep exports clean |

### Phase 2B: Pathfinding Integration (Critical Path)

| Step | Task | Files | Why |
|------|------|-------|-----|
| **2B.1** | Create `lib/pathFollower.ts` | `lib/pathFollower.ts` | Core waypoint-following logic needed by all interactions |
| **2B.2** | Update `store/useGameStore.ts` with path state fields | `store/useGameStore.ts` | Store must hold path state |
| **2B.3** | Integrate `PathFollower` into `Player.tsx` useFrame | `components/game/Player.tsx` | Player must follow waypoints |
| **2B.4** | Handle re-path conditions in Player.tsx | `components/game/Player.tsx` | Ensure robust path following |

### Phase 2C: Interaction Manager (Dispatch Layer)

| Step | Task | Files | Why |
|------|------|-------|-----|
| **2C.1** | Create `types/interaction.ts` | `types/interaction.ts` | Type definitions for interaction system |
| **2C.2** | Create `store/useInteractionStore.ts` | `store/useInteractionStore.ts` | Dialog + interaction state store |
| **2C.3** | Create `components/game/InteractionManager.tsx` | `components/game/InteractionManager.tsx` | Central click dispatch |
| **2C.4** | Add `<InteractionManager>` to `GameScene.tsx` | `components/game/GameScene.tsx` | Wire it in |

### Phase 2D: NPC System

| Step | Task | Files | Why |
|------|------|-------|-----|
| **2D.1** | Create `components/game/NPCRenderer.tsx` | `components/game/NPCRenderer.tsx` | Visual NPC rendering with interaction support |
| **2D.2** | Add NPC rendering loop in `Map.tsx` | `components/game/Map.tsx` | NPCs appear in the world |
| **2D.3** | Add NPC colliders (RigidBody with sensor or solid) | `Map.tsx`, `NPCRenderer.tsx` | NPCs block movement / register clicks |
| **2D.4** | Create `components/game/ui/DialogWindow.tsx` | `components/game/ui/DialogWindow.tsx` | The dialog UI |
| **2D.5** | Wire DialogWindow into HUD | `components/game/HUD.tsx` | Dialog appears when triggered |
| **2D.6** | NPC interaction flow: click → pathfind → dialog | Integration test | Full NPC flow works |

### Phase 2E: Chest + Warp Interaction

| Step | Task | Files | Why |
|------|------|-------|-----|
| **2E.1** | Create `components/game/ChestInteractable.tsx` | `components/game/ChestInteractable.tsx` | Chest visual + click handler |
| **2E.2** | Add chest rendering loop in `Map.tsx` | `components/game/Map.tsx` | Chests appear in world |
| **2E.3** | Update `WarpPortal.tsx` for pathfinding integration | `components/game/WarpPortal.tsx` | Click warp → pathfind → interact |
| **2E.4** | Create `components/game/ui/LootWindow.tsx` | `components/game/ui/LootWindow.tsx` | Loot notification |
| **2E.5** | Wire LootWindow into HUD | `components/game/HUD.tsx` | Loot shows when chest opened |

---

## 5. Dialog System Design

### 5.1 Dialog Flow

```
1. Player reaches NPC → interactTimer expires
2. onArrived() dispatches: openDialog(dialogId)
3. DialogWindow opens (React portal / modal overlay)
4. DialogWindow loads dialog nodes from dialogDatabase
5. Shows initial node (startNode):
   ┌──────────────────────────────────┐
   │  [NPC Portrait]  NPC Name         │
   │                                   │
   │  Dialog text here...              │
   │  (supports {playerName} etc)      │
   │                                   │
   │  ┌──────────────────────────┐     │
   │  │ Response button 1        │     │
   │  ├──────────────────────────┤     │
   │  │ Response button 2        │     │
   │  ├──────────────────────────┤     │
   │  │ Response button 3 (close)│     │
   │  └──────────────────────────┘     │
   └──────────────────────────────────┘
6. Player clicks response:
   - Execute response.action (save, open_shop, close, etc.)
   - If response.nextNode exists → load that node
   - If response.nextNode is null → close dialog
7. Dialog closed → clear interaction state → phase = idle
```

### 5.2 Zustand Store: `useInteractionStore`

```typescript
// store/useInteractionStore.ts

interface InteractionStore {
  // Dialog state
  dialogOpen: boolean;
  currentDialogId: string | null;
  currentNode: DialogNode | null;
  dialogNpcName: string;
  dialogNpcSprite: string;

  // Loot notification state
  lootQueue: LootNotification[];

  // Actions
  openDialog: (dialogId: string) => void;
  selectResponse: (response: DialogResponse) => void;
  closeDialog: () => void;
  pushLoot: (items: LootNotification[]) => void;
  popLoot: () => LootNotification | undefined;
}

interface LootNotification {
  itemId: string;
  itemName: string;
  amount: number;
  icon?: string;
}
```

### 5.3 DialogWindow Component

```
┌───────────────────────────────────────┐
│  DialogWindow.tsx                      │
│                                       │
│  This is an HTML overlay (not 3D).    │
│  Position: fixed, centered.           │
│                                       │
│  Uses <Modal> from components/ui/.    │
│                                       │
│  Renders when dialogOpen === true      │
│                                       │
│  Props: none (reads from store)        │
│                                       │
│  State: none (reads from store)        │
│                                       │
│  Structure:                            │
│    <div className="dialog-overlay">    │
│      <div className="dialog-box">      │
│        <div className="dialog-portrait">│
│          <SpriteNPC /> or img         │
│        </div>                          │
│        <div className="dialog-name">   │
│          {npcName}                     │
│        </div>                          │
│        <div className="dialog-text">   │
│          {currentNode.text}            │
│        </div>                          │
│        <div className="dialog-responses">│
│          {currentNode.responses.map(r => │
│            <button onClick={selectResponse(r)}>│
│              {r.text}                  │
│            </button>                   │
│          )}                            │
│        </div>                          │
│      </div>                            │
│    </div>                              │
│                                       │
└───────────────────────────────────────┘
```

### 5.4 Dialog Styling (RO-Themed)

- Semi-transparent dark background overlay (blocks game interaction behind)
- Centered panel with parchment/paper texture feel
- NPC portrait on the left (use existing Sprite component or static image)
- NPC name in gold/yellow text above the portrait
- Dialog text in white/cream on dark background
- Response buttons: rounded rectangles, light background, dark text
- Hover effect on response buttons (glow / color shift)
- Close button (X) in top-right corner
- **Mobile**: Full-screen width, larger touch targets (min 44px)

### 5.5 Player Name Template

Dialog text can contain `{playerName}` which is replaced at render time:

```typescript
const interpolatedText = node.text.replace(
  /\{playerName\}/g,
  useGameStore.getState().player.name
);
```

### 5.6 Dialog Action Handlers

```typescript
function handleDialogAction(action: DialogAction): void {
  switch (action.type) {
    case 'close':
      useInteractionStore.getState().closeDialog();
      break;

    case 'save':
      socket.emit('saveProgress');
      // Next node shows confirmation
      break;

    case 'open_storage':
      // Future: open storage UI
      useInteractionStore.getState().closeDialog();
      showToast('Storage not yet available', 'info');
      break;

    case 'open_shop':
      // Future: open shop UI
      useInteractionStore.getState().closeDialog();
      showToast(`Opening ${action.shopId}...`, 'info');
      break;

    case 'give_item':
      socket.emit('giveItem', { itemId: action.itemId, amount: action.amount });
      break;

    case 'take_item':
      // Client-side validation then server request
      break;

    case 'custom':
      // Dispatch custom event (for quests, etc.)
      window.dispatchEvent(new CustomEvent(action.eventName!));
      break;
  }
}
```

---

## 6. Pathfinding Integration Details

### 6.1 PathFollower Module (`lib/pathFollower.ts`)

```typescript
// lib/pathFollower.ts

import { findPath, isWalkable, CollisionGridData } from './collisionGrid';

export interface PathFollowerState {
  waypoints: Array<{ x: number; z: number }>;
  currentIndex: number;
  active: boolean;
  arrived: boolean;
  lastRecomputeTime: number;
  /** The original destination (world coords) */
  destination: { x: number; z: number } | null;
}

export function createPathFollowerState(): PathFollowerState {
  return {
    waypoints: [],
    currentIndex: 0,
    active: false,
    arrived: false,
    lastRecomputeTime: 0,
    destination: null,
  };
}

/**
 * Compute a path from currentPos to targetPos.
 * Returns true if a valid path was found.
 */
export function computePath(
  state: PathFollowerState,
  grid: CollisionGridData,
  currentPos: { x: number; z: number },
  targetPos: { x: number; z: number },
  now: number,
): boolean {
  state.destination = targetPos;
  state.lastRecomputeTime = now;

  // Verify start is walkable — if player is in a collider, try to nudge
  let startWx = currentPos.x;
  let startWz = currentPos.z;
  if (!isWalkable(grid, startWx, startWz)) {
    // Nudge: search in expanding spiral for walkable cell
    const nudged = findNearestWalkable(grid, startWx, startWz);
    if (!nudged) {
      state.active = false;
      state.arrived = false;
      return false;
    }
    startWx = nudged.x;
    startWz = nudged.z;
  }

  // Clamp target to walkable area
  let endWx = targetPos.x;
  let endWz = targetPos.z;
  if (!isWalkable(grid, endWx, endWz)) {
    const nudged = findNearestWalkable(grid, endWx, endWz);
    if (!nudged) {
      state.active = false;
      state.arrived = false;
      return false;
    }
    endWx = nudged.x;
    endWz = nudged.z;
  }

  const rawPath = findPath(grid, startWx, startWz, endWx, endWz);

  if (rawPath.length === 0) {
    // Direct path might already be at destination
    const dist = Math.hypot(endWx - startWx, endWz - startWz);
    if (dist < 0.5) {
      state.waypoints = [];
      state.currentIndex = 0;
      state.active = false;
      state.arrived = true;
      return true;
    }
    // No path found
    state.active = false;
    state.arrived = false;
    return false;
  }

  // String-pull the path to remove unnecessary waypoints
  state.waypoints = stringPullPath(rawPath, grid);
  state.currentIndex = 0;
  state.active = true;
  state.arrived = false;
  return true;
}

/**
 * Get movement direction toward current waypoint.
 * Returns { x, z } normalized, or { 0, 0 } if no path active or arrived.
 */
export function getPathDirection(
  state: PathFollowerState,
  currentPos: { x: number; z: number },
  arrivedThreshold: number = 0.3,
): { x: number; z: number } {
  if (!state.active || state.arrived || state.waypoints.length === 0) {
    return { x: 0, z: 0 };
  }

  const wp = state.waypoints[state.currentIndex];
  const dx = wp.x - currentPos.x;
  const dz = wp.z - currentPos.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist < arrivedThreshold) {
    // Advance to next waypoint
    state.currentIndex++;
    if (state.currentIndex >= state.waypoints.length) {
      state.active = false;
      state.arrived = true;
      return { x: 0, z: 0 };
    }
    // Recurse: get direction to next waypoint
    return getPathDirection(state, currentPos, arrivedThreshold);
  }

  return { x: dx / dist, z: dz / dist };
}

/**
 * Check if path should be recomputed.
 */
export function shouldRecompute(
  state: PathFollowerState,
  targetPos: { x: number; z: number } | null,
  currentPos: { x: number; z: number },
  now: number,
  recomputeIntervalMs: number = 500,
  targetMoveThreshold: number = 1.0,
): boolean {
  if (!state.active || !state.destination || !targetPos) return false;

  // Timer-based recompute
  if (now - state.lastRecomputeTime < recomputeIntervalMs) return false;

  // Target moved significantly
  const dstMoved = Math.hypot(
    targetPos.x - state.destination.x,
    targetPos.z - state.destination.z,
  );
  if (dstMoved > targetMoveThreshold) return true;

  return false;
}

/**
 * Find nearest walkable cell to a given world position (spiral search).
 */
function findNearestWalkable(
  grid: CollisionGridData,
  wx: number,
  wz: number,
  maxRadius: number = 5,
): { x: number; z: number } | null {
  const cellSize = grid.cellSize;
  const halfW = (grid.width * cellSize) / 2;
  const halfH = (grid.height * cellSize) / 2;

  for (let r = 0; r <= maxRadius; r += cellSize) {
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      const cx = wx + Math.cos(angle) * r;
      const cz = wz + Math.sin(angle) * r;
      if (isWalkable(grid, cx, cz)) {
        return { x: cx, z: cz };
      }
    }
  }
  return null;
}

/**
 * String-pull (remove collinear/unecessary waypoints).
 * Keeps only waypoints where the direction changes.
 */
function stringPullPath(
  path: Array<[number, number]>,
  _grid: CollisionGridData,
): Array<{ x: number; z: number }> {
  if (path.length <= 2) {
    return path.map(([x, z]) => ({ x, z }));
  }

  const result: Array<{ x: number; z: number }> = [];
  result.push({ x: path[0][0], z: path[0][1] });

  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const next = path[i + 1];

    const d1x = curr[0] - prev[0];
    const d1z = curr[1] - prev[1];
    const d2x = next[0] - curr[0];
    const d2z = next[1] - curr[1];

    // If direction changes significantly, keep this waypoint
    const cross = d1x * d2z - d1z * d2x;
    const dot = d1x * d2x + d1z * d2z;
    const angle = Math.atan2(Math.abs(cross), dot);

    if (angle > 0.1) {
      result.push({ x: curr[0], z: curr[1] });
    }
  }

  result.push({ x: path[path.length - 1][0], z: path[path.length - 1][1] });
  return result;
}
```

### 6.2 Integration Into Player.tsx

The current `Player.tsx` useFrame does:

1. Server reconciliation
2. Get input
3. Auto-follow enemy
4. Click-to-move target (simple direction)
5. Apply movement
6. Update state machine

**Changes:**

After step 2 (Get input), insert pathfinding:

```
2a. Check if pathActive:
    - If direct input active (WASD/joystick) → CANCEL path
    - If no direct input AND pathActive:
        → Call getPathDirection(pathState, currentPos)
        → If has direction, set inputDir = pathDirection
        → If arrived (pathState.arrived):
            → setTargetPosition(null)
            → handleOnArrived()
    - If no direct input AND targetPosition set AND !pathActive:
        → Compute new path (startPathfinding)
```

```
handleOnArrived():
    Check interactionTarget.type:
        - 'npc' → open dialog after interactTimer
        - 'warp' → emit warp request after interactTimer
        - 'chest' → emit chest open after interactTimer
        - 'position' → clear state
```

### 6.3 Collision Grid Caching

The collision grid should be computed once per map load and cached.

**Where to cache:** In `useGameStore` or `useNetworkStore`.

```typescript
// Add to useGameStore or useNetworkStore:
currentCollisionGrid: CollisionGridData | null;
setCollisionGrid: (grid: CollisionGridData) => void;
```

**When to build:** When `Map.tsx` receives `mapData`, call `createCollisionGrid()` and store it.

```typescript
// In Map.tsx, when mapData loads:
const collisionGrid = useMemo(() => {
  return createCollisionGrid(
    mapData.dimensions.width,
    mapData.dimensions.height,
    balance.collisionGridResolution || 0.5,
    mapData.colliders || [],
    mapData.decorations,
  );
}, [mapData]);

// Store it in the game store
useEffect(() => {
  setCollisionGrid(collisionGrid);
}, [collisionGrid]);
```

### 6.4 Collision Group for NPCs

Add NPC colliders to the `NPCRenderer` component. `CollisionGroup.NPC` (value 4) is already defined in `lib/collisionSystem.ts`.

```typescript
// In NPCRenderer.tsx — wrap in RigidBody for collision:
<RigidBody type="fixed" colliders={false} sensor={!npcData.collision}>
  <CuboidCollider
    args={[0.3, 0.5, 0.3]}
    position={[npcData.position.x, npcData.position.y + 0.5, npcData.position.z]}
    collisionGroups={interactionGroups(
      [CollisionGroup.NPC],
      [CollisionGroup.PLAYER, CollisionGroup.ENEMY, CollisionGroup.GROUND],
    )}
  />
  <Sprite entityId={spriteId} ... />
  <Text ...>{npcData.name}</Text>
</RigidBody>
```

The collider uses `sensor` when `collision: false` — the NPC can be clicked but doesn't block movement.

### 6.5 InteractionManager Raycasting

```typescript
// components/game/InteractionManager.tsx

function InteractionManager() {
  const { camera, gl, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());

  const handleClick = useCallback((event: MouseEvent) => {
    // Convert screen coords to NDC
    pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.current.setFromCamera(pointer.current, camera);

    // Get all interactable objects (they have a data-entity-id attribute)
    const intersects = raycaster.current.intersectObjects(scene.children, true);

    for (const hit of intersects) {
      const obj = hit.object;
      const entityType = obj.userData?.entityType; // 'npc' | 'warp' | 'chest' | 'enemy'
      const entityId = obj.userData?.entityId;

      if (entityType) {
        handleEntityClick(entityType, entityId, hit.point);
        return;
      }
    }

    // No entity hit → terrain click
    handleTerrainClick(hit.point);
  }, []);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', handleClick);
    return () => canvas.removeEventListener('pointerdown', handleClick);
  }, []);

  return null;
}
```

**Key design: Entities set `userData` on their meshes:**

```typescript
// In mesh creation:
<mesh
  userData={{ entityType: 'npc', entityId: 'npc_kafra_01' }}
  onPointerDown={(e) => { e.stopPropagation(); }}
>
  <spriteGeometry />
</mesh>
```

### 6.6 Pathfinding Budget & Performance

| Constraint | Value | Notes |
|---|---|---|
| Grid resolution | 0.5 world units | 80×80 map = 160×160 grid (25,600 cells) |
| Max A* iterations | grid.width × grid.height | ~25,600 worst case, typical path << 1,000 |
| Repath interval | 500ms | Prevent excessive recomputation |
| Arrival threshold | 0.3 world units | Distance to consider waypoint reached |
| Max waypoints per path | 200 | Safety limit |
| String-pull | Always active | Reduces waypoints by ~60% on average |

---

## 7. File Change Index

### New Files

| # | File | Purpose |
|---|------|---------|
| 1 | `lib/pathFollower.ts` | Waypoint following, path computation, string-pull |
| 2 | `store/useInteractionStore.ts` | Zustand store for dialog + interaction state |
| 3 | `components/game/InteractionManager.tsx` | Click event classification + dispatch |
| 4 | `components/game/NPCRenderer.tsx` | NPC sprite rendering + collider + name label |
| 5 | `components/game/ChestInteractable.tsx` | Chest 3D object with open/close states |
| 6 | `components/game/ui/DialogWindow.tsx` | NPC dialog modal UI |
| 7 | `components/game/ui/LootWindow.tsx` | Loot notification popup |
| 8 | `shared/data/dialogs.json` | NPC dialog database |
| 9 | `shared/schemas/dialogs.ts` | Zod schema for dialog data |
| 10 | `types/interaction.ts` | TypeScript types for interaction system |

### Modified Files

| # | File | Changes |
|---|------|---------|
| 1 | `shared/schemas/maps.ts` | Add `NPCSchema`, `ChestSchema`, update `MapSchema` with `npcs` + `chests` fields |
| 2 | `shared/schemas/index.ts` | Export new dialog + interaction schemas |
| 3 | `shared/loader/clientLoader.ts` | Load `dialogs.json` into gameData |
| 4 | `shared/data/maps/prontera.json` | Add NPC + chest test data |
| 5 | `store/useGameStore.ts` | Add `pathState`, `collisionGrid`, path store actions |
| 6 | `components/game/Player.tsx` | Integrate PathFollower, replumb targetPosition flow |
| 7 | `components/game/Map.tsx` | Add NPC/Chest rendering, build & cache collision grid |
| 8 | `components/game/WarpPortal.tsx` | Add `userData` for raycast detection, remove direct `onClick` warp (defer to InteractionManager) |
| 9 | `components/game/GameScene.tsx` | Add `<InteractionManager />` inside Canvas |
| 10 | `components/game/HUD.tsx` | Add `<DialogWindow />` and `<LootWindow />` |
| 11 | `components/game/Enemy.tsx` | Add `userData={{ entityType: 'enemy', entityId }}` for click detection |
| 12 | `shared/data/balance.json` | Ensure `npcInteractionRange`, `chestInteractionRange`, `collisionGridResolution`, `pathRecalcIntervalMs` exist |

---

## Appendix A: Key Edge Cases

| Case | Handling |
|---|---|
| **Path to NPC blocked by wall** | A* returns empty → show "Cannot reach" toast, don't open dialog |
| **NPC clicked while already walking** | Cancel current path, recompute from current position |
| **Player moves during dialog** | Opening dialog sets phase=interact; dialog open blocks movement. Closing dialog returns to idle. |
| **Click warp while dialog is open** | Dialog takes priority; warp click ignored until dialog closed |
| **Chest already opened** | Server responds with `alreadyOpen` → show "Already opened" toast, don't open loot window |
| **Rapid clicks on entity** | Debounce: if same entity clicked within 200ms, ignore second click |
| **Warp portal clicked, player is already in range** | Skip pathfinding, trigger interact immediately |
| **NPC/chest at unreachable position** | A* returns no path → cancel interaction, show toast |
| **Map change during path follow** | Map.tsx `useEffect` cleanup cancels path, clears interaction store |
| **Touch + keyboard simultaneous** | Keyboard input priority — cancel path if direct input active |

## Appendix B: Server-Side Changes Needed

| # | Socket Event | Direction | Payload | Description |
|---|---|---|---|---|
| 1 | `requestInteract` | Client→Server | `{ targetId, targetType }` | Player wants to interact with NPC/chest |
| 2 | `openChest` | Client→Server | `{ chestId }` | Player wants to open a chest |
| 3 | `chestResult` | Server→Client | `{ chestId, success, items? }` | Result of chest open attempt |
| 4 | `npcDialog` | Server→Client | `{ dialogId, npcName, npcSprite }` | Server confirms NPC interaction, sends dialog data |
| 5 | `saveProgress` | Client→Server | `{}` | Save player state |

The server validates:
- Player is within `interactionRange` of the target
- Target exists on the current map
- Player is not dead
- Chest has not been opened (and is not on cooldown)
- Player meets any requirements (level, quest state, etc.)
