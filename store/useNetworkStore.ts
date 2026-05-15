import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { PeerPlayerState, ChatMessage, TradeOffer } from '@/types/network';
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
  broadcastPosition: (pos: PeerPlayerState) => void;
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

export const useNetworkStore = create<NetworkStore>()((set, get) => ({
  socket: null,
  socketId: null,
  remotePlayers: {},
  chatMessages: [],
  tradeRequest: null,
  activeTrade: null,
  initSocket: async (playerName: string) => {
    if (get().socket || typeof window === 'undefined') return;

    // We do late import to avoid circular dependency issues at boot
    const { useGameStore } = await import('./useGameStore');

    // Connect to same host/port serving Next.js
    const newSocket = io();

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

    newSocket.on('playerMoved', (data: { id: string, x: number, y: number, z: number }) => {
      set((s) => {
        const player = s.remotePlayers[data.id];
        if (!player) return s;
        return {
          remotePlayers: {
            ...s.remotePlayers,
            [data.id]: { ...player, x: data.x, y: data.y, z: data.z }
          }
        };
      });
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

    newSocket.on('attackResult', (data: { targetId: string, damage: number, usedSkill: boolean, newSp: number }) => {
      const gs = useGameStore.getState();
      gs.setSp(data.newSp);
      gs.setActiveSkill(data.usedSkill ? null : gs.activeSkill);
    });

    newSocket.on('enemyKilled', (data: { targetId: string, expBase: number, expJob: number, loot: any[], newSp: number, damage: number, usedSkill: boolean }) => {
      const gs = useGameStore.getState();
      gs.setSp(data.newSp);
      gs.setActiveSkill(data.usedSkill ? null : gs.activeSkill);
      gs.gainExp(data.expBase, data.expJob);
      if (data.loot.length > 0) {
        gs.gainLoot(data.loot);
      }
      gs.setSelectedTargetId(null);
    });

    set({ socket: newSocket });
  },
  broadcastPosition: (pos) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('move', pos);
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
        playerStats: gs.player.stats,
        sp: gs.player.sp 
      });
    }
  },

  // Trade Actions (These are mocked for now, would need server validation)
  requestTrade: (targetSocketId, myName) => {
    get().addChatMessage({ id: Date.now().toString(), sender: 'System', text: `Trade with ${targetSocketId} feature pending server integration.`, timestamp: Date.now(), isSystem: true });
  },
  acceptTradeRequest: () => {},
  declineTradeRequest: () => {},
  updateTradeOffer: (offerUpdate) => {},
  lockTrade: () => {},
  acceptTrade: () => {},
  processTradeCompletion: () => {},
  cancelTrade: () => {}
}));
