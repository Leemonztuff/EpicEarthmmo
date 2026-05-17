import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { PeerPlayerState, ChatMessage, TradeOffer, WorldSnapshot, PlayerInput } from '@/shared/types/network';
import type { EnemyState } from '@/shared/schemas/gameState';
import { gameData } from '@/shared/loader';
import { addCombatLog } from '@/components/game/hud/CombatLog';
import { showToast } from '@/components/ui';
import { triggerShake } from '@/components/game/ScreenShake';
import { showExpGain } from '@/components/game/ExpPopups';

const { balance } = gameData;

interface MapData {
  mapId: string;
  mapName: string;
  mapType: string;
  dimensions: { width: number; height: number };
  warps: Array<{ id: string; name: string; position: { x: number; y: number; z: number }; targetMapName: string; visual: string }>;
  safeZones: Array<{ id: string; center: { x: number; z: number }; radius: number; name?: string }>;
  decorations: Array<{ position: [number, number, number]; type: string; scale: number }>;
  grassTuftCount: number;
  grassTexture: { baseColor: string; repeatX: number; repeatY: number };
  floorColor: string;
}

interface NetworkStore {
  socket: Socket | null;
  socketId: string | null;
  remotePlayers: Record<string, PeerPlayerState>;
  chatMessages: ChatMessage[];
  currentMapData: MapData | null;

  // Trade system (Mock functionality over standard socket for now)
  tradeRequest: { from: string, name: string } | null;
  activeTrade: {
    peerId: string;
    myOffer: TradeOffer;
    theirOffer: TradeOffer;
  } | null;

  initSocket: (playerName: string) => void;
  sendInput: (input: PlayerInput) => void;
  updateRemotePlayer: (id: string, state: Omit<PeerPlayerState, 'name'>) => void;
  sendChatMessage: (text: string) => void;
  addChatMessage: (msg: ChatMessage) => void;
  attackTarget: (targetId: string) => void;
  requestWarp: (warpId: string) => void;

  // Trade actions
  requestTrade: (targetSocketId: string, myName: string) => void;
  acceptTradeRequest: () => void;
  declineTradeRequest: () => void;
  updateTradeOffer: (offer: Partial<TradeOffer>) => void;
  lockTrade: () => void;
  acceptTrade: () => void;
  processTradeCompletion: () => void;
  cancelTrade: () => void;
}

const RECONCILIATION_WINDOW = 30;
interface PredictedState {
  seq: number;
  input: PlayerInput;
  timestamp: number;
}
const predictedStates: PredictedState[] = [];
let lastReconciledPos = { x: 0, y: 0.5, z: 0 };

export const useNetworkStore = create<NetworkStore>()((set, get) => ({
  socket: null,
  socketId: null,
  remotePlayers: {},
  chatMessages: [],
  currentMapData: null,
  tradeRequest: null,
  activeTrade: null,
  initSocket: async (playerName: string) => {
    if (get().socket || typeof window === 'undefined') return;

    let useGameStore: any;
    try {
      useGameStore = (await import('./useGameStore')).useGameStore;
    } catch (err) {
      console.error('Failed to load game store:', err);
      return;
    }

    // Connect to game server on separate port
    const serverUrl = process.env.NEXT_PUBLIC_GAME_SERVER || 'http://localhost:3001';
    const newSocket = io(serverUrl);

    newSocket.on('connect', () => {
      console.log('Connected to MMO server:', newSocket.id);
      predictedStates.length = 0;
      lastReconciledPos = { x: 0, y: 0.5, z: 0 };
      set({ socketId: newSocket.id });
      // Join game
      newSocket.emit('join', { 
        name: playerName, 
        stats: useGameStore.getState().player.stats,
        equippedItems: useGameStore.getState().player.equippedItems,
      });
    });

    newSocket.on('init', (data: { id: string; mapId: string; mapName: string; mapType: string; players: Record<string, PeerPlayerState>; enemies: Record<string, EnemyState>; initData: any }) => {
       const others = { ...data.players };
       delete others[newSocket.id!];
       set({ remotePlayers: others });

       const gs = useGameStore.getState();
       gs.setMap(data.mapId, data.mapName, data.mapType);
       if (data.enemies) {
         gs.setEnemies(data.enemies);
       }
       if (data.initData) {
         set({ currentMapData: data.initData });
       }
       showToast(`Welcome to ${data.mapName}!`, 'success');
    });

    newSocket.on('mapChange', (data: { mapId: string; mapName: string; mapType: string; spawnPosition: { x: number; y: number; z: number }; enemies: Record<string, EnemyState>; players: Record<string, PeerPlayerState>; initData: any }) => {
       const gs = useGameStore.getState();
       gs.setMap(data.mapId, data.mapName, data.mapType);
       gs.setEnemies(data.enemies);
       showToast(`Arrived at ${data.mapName}`, 'info');
       gs.setPosition(data.spawnPosition);
       gs.setEnemies(data.enemies);

       const others = { ...data.players };
       delete others[newSocket.id!];
       set({ remotePlayers: others });
       if (data.initData) {
         set({ currentMapData: data.initData });
       }
    });

    newSocket.on('playerJoined', (player: PeerPlayerState & { id: string }) => {
      set((s) => ({
        remotePlayers: { ...s.remotePlayers, [player.id]: player }
      }));
      showToast(`${player.name} joined the map`, 'info');
    });

    newSocket.on('worldSnapshot', (snapshot: WorldSnapshot) => {
      const gs = useGameStore.getState();
      const localSocketId = get().socketId;

      // Update remote players from snapshot
      const updatedPlayers: Record<string, PeerPlayerState> = {};
      for (const [id, sp] of Object.entries(snapshot.players)) {
        if (id === localSocketId) {
          // Client reconciliation: replay unconfirmed inputs
          const serverSeq = sp.lastProcessedSeq ?? 0;
          const serverPos = { x: sp.x, y: sp.y, z: sp.z };

          // Find index in predicted buffer
          let replayIdx = predictedStates.length;
          for (let i = predictedStates.length - 1; i >= 0; i--) {
            if (predictedStates[i].seq <= serverSeq) {
              replayIdx = i + 1;
              break;
            }
          }

          // Start from server position, replay unconfirmed inputs
          const reconciled = { ...serverPos };
          for (let i = replayIdx; i < predictedStates.length; i++) {
            const inp = predictedStates[i].input;
            if (inp.dirX !== 0 || inp.dirZ !== 0) {
              const len = Math.sqrt(inp.dirX * inp.dirX + inp.dirZ * inp.dirZ);
              if (len > 0) {
                const speed = balance.movement.playerSpeed;
                reconciled.x += (inp.dirX / len) * speed * 0.05;
                reconciled.z += (inp.dirZ / len) * speed * 0.05;
              }
            }
          }

          // Clean up confirmed states
          while (predictedStates.length > 0 && predictedStates[0].seq <= serverSeq) {
            predictedStates.shift();
          }

          lastReconciledPos = reconciled;
          gs.setPosition(reconciled);
        } else {
          const existing = get().remotePlayers[id];
          updatedPlayers[id] = { x: sp.x, y: sp.y, z: sp.z, name: existing?.name ?? id };
        }
      }
      set({ remotePlayers: updatedPlayers });

      // Update enemies from snapshot
      for (const [id, se] of Object.entries(snapshot.enemies)) {
        gs.updateEnemyState(id, { hp: se.hp, isDead: se.isDead, position: se.position });
      }
    });

    newSocket.on('playerLeft', (id: string) => {
      set((s) => {
        const newPlayers = { ...s.remotePlayers };
        const name = newPlayers[id]?.name;
        delete newPlayers[id];
        if (name) showToast(`${name} left the map`, 'warning');
        return { remotePlayers: newPlayers };
      });
    });

    newSocket.on('chatMessage', (msg: ChatMessage) => {
      get().addChatMessage(msg);
    });

    newSocket.on('enemyRespawned', (enemy: EnemyState) => {
      useGameStore.getState().updateEnemyState(enemy.id, { 
        isDead: false, 
        hp: enemy.maxHp, 
        position: enemy.position 
      });
    });

    newSocket.on('enemyDamaged', (data: { targetId: string, damage: number, usedSkill: boolean, attackerId: string, hp: number, isDead: boolean }) => {
      const gs = useGameStore.getState();
      gs.updateEnemyState(data.targetId, { hp: data.hp, isDead: data.isDead });
      
      const enemy = gs.enemies[data.targetId];
      if (enemy) {
        const pos = { 
          x: enemy.position.x + (Math.random()*0.5-0.25), 
          y: enemy.position.y + 1, 
          z: enemy.position.z 
        };
        const color = data.attackerId === newSocket.id ? (data.usedSkill ? '#ffaa00' : 'white') : '#cccccc';
        gs.addDamageText(data.damage, pos, color);

        // Particle hit effect
        if (typeof window !== 'undefined') {
          import('@/components/game/QuarksParticleSystem').then(m => {
            m.createHitEffect(pos, color);
          }).catch(console.error);
        }
      }
    });

    newSocket.on('attackResult', (data: { targetId: string, damage: number, usedSkill: boolean, newSp: number, hp: number, isDead: boolean }) => {
      const gs = useGameStore.getState();
      gs.setSp(data.newSp);
      gs.updateEnemyState(data.targetId, { hp: data.hp, isDead: data.isDead });
    });

    newSocket.on('enemyKilled', (data: { targetId: string, expBase: number, expJob: number, loot: any[], newSp: number, damage: number, usedSkill: boolean, hp: number, isDead: boolean }) => {
      const gs = useGameStore.getState();
      gs.setSp(data.newSp);
      gs.updateEnemyState(data.targetId, { hp: data.hp, isDead: data.isDead });
      gs.gainExp(data.expBase, data.expJob);
      showExpGain(data.expBase, 'base');
      showExpGain(data.expJob, 'job');
      if (data.loot.length > 0) {
        gs.gainLoot(data.loot);
        const lootNames = data.loot.map(l => `${l.name} x${l.amount}`).join(', ');
        addCombatLog(`Loot: ${lootNames}`, 'text-yellow-400');
      }
      addCombatLog(`Enemy defeated! +${data.expBase} EXP`, 'text-green-400');
      gs.setSelectedTargetId(null);
    });

    newSocket.on('playerDamaged', (data: { enemyId: string; enemyName: string; damage: number; hp: number; maxHp: number; isDead: boolean }) => {
      const gs = useGameStore.getState();
      gs.updatePlayerHp(data.hp);
      addCombatLog(`${data.enemyName} hits you for ${data.damage} damage!`, 'text-red-400');
      triggerShake(data.damage > 10 ? 0.15 : 0.08, 0.2);

      const pos = {
        x: gs.position.x + (Math.random() * 0.5 - 0.25),
        y: gs.position.y + 1.2,
        z: gs.position.z,
      };
      gs.addDamageText(data.damage, pos, '#ff4444');
    });

    newSocket.on('playerDied', (data: { respawnPosition: { x: number; y: number; z: number } }) => {
      const gs = useGameStore.getState();
      gs.setPosition(data.respawnPosition);
      gs.updatePlayerHp(gs.player.maxHp);
      gs.setSp(gs.player.maxSp);
      gs.setSelectedTargetId(null);
    });

    // ── Trade Events ────────────────────────────────
    newSocket.on('tradeRequested', (data: { from: string; name: string }) => {
      set({ tradeRequest: { from: data.from, name: data.name } });
    });

    newSocket.on('tradeAccepted', (data: { peerId: string; name: string }) => {
      set({
        tradeRequest: null,
        activeTrade: {
          peerId: data.peerId,
          myOffer: { zeny: 0, items: [], locked: false, accepted: false },
          theirOffer: { zeny: 0, items: [], locked: false, accepted: false },
        },
      });
      get().addChatMessage({
        id: Date.now().toString(), sender: 'System',
        text: `Trade started with ${data.name}`,
        timestamp: Date.now(), isSystem: true,
      });
    });

    newSocket.on('tradeDeclined', (data: { name: string }) => {
      set({ tradeRequest: null });
      get().addChatMessage({
        id: Date.now().toString(), sender: 'System',
        text: `${data.name} declined the trade.`,
        timestamp: Date.now(), isSystem: true,
      });
    });

    newSocket.on('tradeOfferUpdated', (data: { from: string; offer: { zeny: number; locked: boolean } }) => {
      const state = get();
      if (!state.activeTrade) return;
      const isTheirs = data.from === state.activeTrade.peerId;
      if (isTheirs) {
        set({
          activeTrade: {
            ...state.activeTrade,
            theirOffer: { ...state.activeTrade.theirOffer, zeny: data.offer.zeny, locked: data.offer.locked },
          },
        });
      } else {
        set({
          activeTrade: {
            ...state.activeTrade,
            myOffer: { ...state.activeTrade.myOffer, zeny: data.offer.zeny, locked: data.offer.locked },
          },
        });
      }
    });

    newSocket.on('tradeReady', () => {
      get().addChatMessage({
        id: Date.now().toString(), sender: 'System',
        text: 'Both sides locked! Click Trade to complete.',
        timestamp: Date.now(), isSystem: true,
      });
    });

    newSocket.on('tradeCompleted', (data: { receivedZeny: number; sentZeny: number }) => {
      const gs = useGameStore.getState();
      // Update zeny server-side would be ideal, but client-side for now
      set({ activeTrade: null });
      get().addChatMessage({
        id: Date.now().toString(), sender: 'System',
        text: `Trade completed! +${data.receivedZeny} Zeny, -${data.sentZeny} Zeny`,
        timestamp: Date.now(), isSystem: true,
      });
    });

    newSocket.on('tradeCancelled', (data: { name: string }) => {
      set({ activeTrade: null, tradeRequest: null });
      get().addChatMessage({
        id: Date.now().toString(), sender: 'System',
        text: `Trade cancelled by ${data.name}.`,
        timestamp: Date.now(), isSystem: true,
      });
    });

    set({ socket: newSocket });
  },
  sendInput: (input) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('input', input);

      // Record for reconciliation
      predictedStates.push({ seq: input.seq, input, timestamp: Date.now() });
      if (predictedStates.length > RECONCILIATION_WINDOW) {
        predictedStates.shift();
      }
    }
  },
  updateRemotePlayer: (id, state) => set((s) => {
    const player = s.remotePlayers[id];
    if (!player) return s;
    return {
      remotePlayers: {
        ...s.remotePlayers,
        [id]: { ...player, ...state }
      }
    };
  }),
  sendChatMessage: (text) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('chat', text);
    }
  },
  addChatMessage: (msg) => set((state) => ({
    chatMessages: [...state.chatMessages, msg].slice(-50)
  })),

  attackTarget: async (targetId: string) => {
    const { socket } = get();
    if (socket && socket.connected) {
      const { useGameStore } = await import('./useGameStore');
      const gs = useGameStore.getState();
      socket.emit('attack', {
        targetId,
        skillId: gs.activeSkill,
        sp: gs.player.sp,
        position: gs.position,
      });
    }
  },

  requestWarp: (warpId: string) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('requestWarp', { warpId }, (res: { success: boolean; error?: string }) => {
        if (!res.success) {
          console.warn('Warp failed:', res.error);
        }
      });
    }
  },

  // Trade Actions
  requestTrade: (targetSocketId) => {
    const socket = get().socket;
    if (socket?.connected) {
      socket.emit('requestTrade', { targetSocketId });
    }
  },
  acceptTradeRequest: () => {
    const socket = get().socket;
    if (socket?.connected) {
      socket.emit('acceptTradeRequest');
    }
  },
  declineTradeRequest: () => {
    const socket = get().socket;
    if (socket?.connected) {
      socket.emit('declineTradeRequest');
    }
    set({ tradeRequest: null });
  },
  updateTradeOffer: (offerUpdate) => {
    const state = get();
    if (!state.activeTrade || state.activeTrade.myOffer.locked) return;
    const socket = state.socket;
    if (socket?.connected) {
      if (offerUpdate.zeny !== undefined) {
        socket.emit('updateTradeOffer', { zeny: offerUpdate.zeny });
      }
    }
  },
  lockTrade: () => {
    const socket = get().socket;
    if (socket?.connected) {
      socket.emit('lockTrade');
    }
  },
  acceptTrade: () => {
    const socket = get().socket;
    if (socket?.connected) {
      socket.emit('acceptTrade');
    }
  },
  processTradeCompletion: () => {},
  cancelTrade: () => {
    const socket = get().socket;
    if (socket?.connected) {
      socket.emit('cancelTrade');
    }
    set({ activeTrade: null, tradeRequest: null });
  },
}));
