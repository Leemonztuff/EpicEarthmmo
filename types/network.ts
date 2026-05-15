import { InventoryItem } from './game';

export interface PeerPlayerState {
  x: number;
  y: number;
  z: number;
  name: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface TradeOffer {
  zeny: number;
  items: InventoryItem[];
  locked: boolean;
  accepted: boolean;
}
