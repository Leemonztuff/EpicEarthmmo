import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { PeerPlayerState, ChatMessage, TradeOffer, WorldSnapshot, PlayerInput } from '@/types/network';
import { EnemyState } from '@/types/game';

interface NetworkStore {
  socket: Socket | null;
  socketId: string | null;
  remotePlayers: Record<string, PeerPlayerState>;
  chatMessages: ChatMessage[];
  
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
      set({ socketId: newSocket.id });
      // Join game
      newSocket.emit('join', { 
        name: playerName, 
        stats: useGameStore.getState().player.stats
      });
    });

    newSocket.on('init', (data: { id: string, players: Record<string, PeerPlayerState>, enemies: Record<string, EnemyState> }) => {
       const others = { ...data.players };
       delete others[newSocket.id!];
       set({ remotePlayers: others });
       
       if (data.enemies) {
         useGameStore.getState().setEnemies(data.enemies);
       }
    });

    newSocket.on('playerJoined', (player: PeerPlayerState & { id: string }) => {
      set((s) => ({
        remotePlayers: { ...s.remotePlayers, [player.id]: player }
      }));
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
                const speed = 5;
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
        delete newPlayers[id];
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
      if (data.loot.length > 0) {
        gs.gainLoot(data.loot);
      }
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
