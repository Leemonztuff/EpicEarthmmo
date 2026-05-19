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

interface NetworkStore {
  socket: Socket | null;
  remotePlayers: Record<string, PeerPlayerState>;
  chatMessages: ChatMessage[];
  currentMapData: any | null;
  tradeRequest: { from: string; name: string } | null;
  activeTrade: {
    peerId: string;
    myOffer: TradeOffer;
    theirOffer: TradeOffer;
  } | null;

  initSocket: (playerName: string) => void;
  sendInput: (input: PlayerInput) => void;
  sendChatMessage: (text: string) => void;
  addChatMessage: (msg: ChatMessage) => void;
  attackTarget: (targetId: string) => void;
  requestWarp: (warpId: string) => void;
  updateRemotePlayer: (id: string, state: Partial<PeerPlayerState>) => void;

  // Trade
  requestTrade: (targetSocketId: string) => void;
  acceptTradeRequest: () => void;
  declineTradeRequest: () => void;
  updateTradeOffer: (offer: Partial<TradeOffer>) => void;
  lockTrade: () => void;
  acceptTrade: () => void;
  cancelTrade: () => void;
}

const RECONCILIATION_WINDOW = 20;
const predictedStates: any[] = [];
let lastReconciledPos = { x: 0, y: 0.5, z: 0 };

export const useNetworkStore = create<NetworkStore>((set, get) => ({
  socket: null,
  remotePlayers: {},
  chatMessages: [],
  currentMapData: null,
  tradeRequest: null,
  activeTrade: null,

  initSocket: async (playerName: string) => {
    if (get().socket?.connected) return;

    const { useGameStore } = await import('./useGameStore');
    const socketUrl = process.env.NEXT_PUBLIC_GAME_SERVER_URL || 'http://localhost:3001';
    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      query: { playerName }
    });

    newSocket.on('connect', () => {
      console.log('Connected to game server');
      showToast('Connected to server', 'success');
    });

    newSocket.on('mapData', (data) => {
      if (!data) return;
      set({ currentMapData: data });
      useGameStore.getState().setMap(data.mapId, data.mapName, data.mapType);
    });

    newSocket.on('worldUpdate', (snapshot: WorldSnapshot) => {
      if (!snapshot) return;

      const gs = useGameStore.getState();
      const myId = newSocket.id;
      const updatedPlayers: Record<string, PeerPlayerState> = {};

      const players = snapshot.players || {};
      for (const [id, sp] of Object.entries(players)) {
        if (id === myId) {
          const serverSeq = sp.lastSeq;
          let reconciled = { x: sp.x, y: sp.y, z: sp.z };
          lastReconciledPos = reconciled;
          gs.setPosition(reconciled);
        } else {
          const existing = get().remotePlayers[id];
          updatedPlayers[id] = { x: sp.x, y: sp.y, z: sp.z, name: (existing?.name || sp.name || id) };
        }
      }
      set({ remotePlayers: updatedPlayers });

      const enemies = snapshot.enemies || {};
      for (const [id, se] of Object.entries(enemies)) {
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
      if (!msg) return;
      set(s => ({ chatMessages: [...s.chatMessages, msg].slice(-50) }));
    });

    newSocket.on('enemyDamaged', (data) => {
      if (!data) return;
      const gs = useGameStore.getState();
      gs.updateEnemyState(data.targetId, { hp: data.hp, isDead: data.isDead });
      
      const enemy = gs.enemies[data.targetId];
      if (enemy && enemy.position) {
        const pos = { 
          x: enemy.position.x + (Math.random()*0.5-0.25), 
          y: enemy.position.y + 1, 
          z: enemy.position.z 
        };
        const color = data.attackerId === newSocket.id ? (data.usedSkill ? '#ffaa00' : 'white') : '#cccccc';
        gs.addDamageText(data.damage, pos, color);

        if (typeof window !== 'undefined') {
          import('@/components/game/QuarksParticleSystem').then(m => {
            m.createHitEffect(pos, color);
          }).catch(() => {});
        }
      }
    });

    newSocket.on('enemyKilled', (data) => {
      if (!data) return;
      const gs = useGameStore.getState();
      gs.setSp(data.newSp);
      gs.updateEnemyState(data.targetId, { hp: data.hp, isDead: data.isDead });
      gs.gainExp(data.expBase, data.expJob);
      showExpGain(data.expBase, 'base');
      showExpGain(data.expJob, 'job');
      addCombatLog(`Enemy defeated! +${data.expBase} EXP`);
      gs.setSelectedTargetId(null);
    });

    newSocket.on('playerDamaged', (data) => {
      if (!data) return;
      const gs = useGameStore.getState();
      gs.updatePlayerHp(data.hp);
      addCombatLog(`Received ${data.damage} damage!`);
      triggerShake(0.1, 0.2);
    });

    set({ socket: newSocket });
  },

  sendInput: (input) => {
    const s = get().socket;
    if (s?.connected) s.emit('input', input);
  },

  sendChatMessage: (text) => {
    const s = get().socket;
    if (s?.connected) s.emit('chat', text);
  },

  addChatMessage: (msg) => set(s => ({ chatMessages: [...s.chatMessages, msg].slice(-50) })),

  attackTarget: async (targetId: string) => {
    const s = get().socket;
    if (s?.connected) {
      const { useGameStore } = await import('./useGameStore');
      const gs = useGameStore.getState();
      s.emit('attack', {
        targetId,
        skillId: gs.activeSkill,
        sp: gs.player?.sp || 0,
        position: gs.position,
      });
    }
  },

  requestWarp: (warpId: string) => {
    const s = get().socket;
    if (s?.connected) s.emit('requestWarp', { warpId });
  },

  updateRemotePlayer: (id, state) => set(s => {
    const p = s.remotePlayers[id];
    if (!p) return s;
    return { remotePlayers: { ...s.remotePlayers, [id]: { ...p, ...state } } };
  }),

  requestTrade: (targetSocketId) => {
    const s = get().socket;
    if (s?.connected) s.emit('requestTrade', { targetSocketId });
  },
  acceptTradeRequest: () => {
    const s = get().socket;
    if (s?.connected) s.emit('acceptTradeRequest');
  },
  declineTradeRequest: () => {
    const s = get().socket;
    if (s?.connected) s.emit('declineTradeRequest');
    set({ tradeRequest: null });
  },
  updateTradeOffer: (offerUpdate) => {
    const s = get().socket;
    if (s?.connected) s.emit('updateTradeOffer', offerUpdate);
  },
  lockTrade: () => {
    const s = get().socket;
    if (s?.connected) s.emit('lockTrade');
  },
  acceptTrade: () => {
    const s = get().socket;
    if (s?.connected) s.emit('acceptTrade');
  },
  cancelTrade: () => {
    const s = get().socket;
    if (s?.connected) s.emit('cancelTrade');
    set({ activeTrade: null, tradeRequest: null });
  },
}));
