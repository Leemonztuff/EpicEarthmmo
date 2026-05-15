import { InventoryItem } from './game';
import { Vector3State } from './game';

export interface PeerPlayerState extends Vector3State {
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
