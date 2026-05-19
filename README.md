# EpicEarthMMO

Web-based mobile MMORPG — Ragnarok Online clone built with Next.js + Three.js + Rapier.

## Stack

- **Frontend**: Next.js 14 (App Router), React Three Fiber, @react-three/rapier
- **State**: Zustand
- **Server**: Node.js, Socket.IO (separate `game-server/` directory)
- **Hosting**: Vercel (client), Railway (server)

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local` and set:

```
NEXT_PUBLIC_GAME_SERVER_URL=https://epicearthmmo-production.up.railway.app
```

## Architecture

| Layer | Tech | Description |
|-------|------|-------------|
| Rendering | Three.js / R3F | 3D scene with billboard sprites |
| Physics | Rapier (via @react-three/rapier) | Collision detection, kinematic player movement |
| Networking | Socket.IO | WebSocket with polling fallback for Railway |
| State | Zustand | Client-side game + network stores |
| Pathfinding | Custom A* on collision grid | Client-side prediction, server validates displacement |

## Key Systems

- **Movement**: Velocity-based with acceleration/deceleration (RO-style feel). WASD rotated for isometric camera.
- **Camera**: Fixed-angle RO-style (NE-facing, ~50° pitch). Zoom only — no orbit.
- **Collision**: Rapier physics + manual box colliders from map JSON.
- **Combat**: Click enemy → auto-follow → attack on cooldown.
- **Interaction**: NPC dialog, chest open, warp portals with pathfinding.

## Project Structure

```
components/game/     — Three.js scene components (Player, Map, Enemy, NPC, etc.)
lib/                 — Game logic (movement, collision, pathfinding, state machine)
store/               — Zustand stores (game state, network)
shared/              — Shared types, schemas, data files (balance, maps, dialogs)
game-server/         — Socket.IO server (separate deployment)
docs/                — Design docs & session state
```
