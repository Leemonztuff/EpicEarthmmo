# EpicEarthMMO

Web-based mobile MMORPG — Ragnarok Online clone built with Next.js + Three.js + Rapier.

## Stack

- **Frontend**: Next.js 15 (App Router), React Three Fiber 9, Three.js 0.170, Rapier physics
- **State**: Zustand 5
- **Server**: Express 5 + Socket.IO 4.8 (separate `game-server/` deployment)
- **Validation**: Zod 3.24 (shared schemas client + server)
- **Auth**: Supabase
- **UI**: Tailwind CSS 4, Framer Motion 12, Lucide React
- **Hosting**: Vercel (client), Railway (server)

## Quick Start

```bash
npm install
npm run dev       # Client (port 3000)
npm run dev:game  # Server (port 3001)
npm run dev:all   # Both concurrently
```

## Environment

Copy `.env.example` to `.env.local` and set:

```
NEXT_PUBLIC_GAME_SERVER_URL=http://localhost:3001
```

## Game Systems

| System | Status | Description |
|--------|--------|-------------|
| Movement | ✅ | Velocity-based with acceleration/deceleration (RO-style). WASD + virtual joystick |
| Camera | ✅ | Fixed-angle RO-style (NE-facing, ~50° pitch). Zoom only |
| Pathfinding | ✅ | A* 8-directional with string-pull smoothing, client-side prediction |
| Combat | ✅ | Auto-attack, 19 skills, hit/flee, crit, defense, kill/death |
| Skills | ✅ | 19 skills with cast/channel, AoE, knockback, buffs, debuffs |
| Mobs | ✅ | 10 enemy types with AI (idle/patrol/chase/attack/return) |
| NPCs | ✅ | Billboard sprites, branching dialog trees, shops |
| Maps | ✅ | 3 maps (Prontera, Prontera Fields, Geffen Dungeon) |
| Chests | ✅ | 3D chests with lid animation, loot drops |
| Warps | ✅ | Click → pathfind → auto-warp between maps |
| Network | ✅ | Socket.IO with polling fallback for Railway |
| Trade | ✅ | Peer-to-peer trade with item/zeny transfer |
| Classes | ⚠️ | 6 classes defined, passives not yet implemented |
| Audio | ❌ | Not implemented (music, SFX, ambient) |

## Architecture

```
Client (Next.js + R3F + Rapier)
  ↕ Socket.IO
Game Server (Express + Socket.IO + SkillEngine)
  ↕ Shared schemas (Zod)
Data (JSON balance, enemies, skills, items, jobs, maps, dialogs)
```

## Project Structure

```
├── app/                  Next.js App Router (pages, layout)
├── components/
│   ├── auth/             Login, character select
│   ├── game/             Three.js scene (28 components)
│   └── ui/               Reusable UI (23 components)
├── lib/                  Game logic (15 modules)
├── store/                Zustand stores (game, network)
├── shared/
│   ├── data/             JSON game data
│   ├── schemas/          Zod validation
│   ├── loader/           Data loading + formulas
│   └── types/            Network types
├── game-server/          Socket.IO server
│   ├── index.ts          Main server + game loop
│   ├── MapManager.ts     World state + mob AI
│   ├── SkillEngine.ts    Skill system + cooldowns
│   ├── BuffManager.ts    Status effects
│   └── GroundEffectManager.ts
└── docs/
    └── DEVELOPMENT_GUIDE.md  Full agent system + project guide
```

## Development Guide

See [`docs/DEVELOPMENT_GUIDE.md`](docs/DEVELOPMENT_GUIDE.md) for the complete development system: 18 AI agents with defined roles, prompts, responsibilities, project status, and priorities.
