export interface Player {
  id: string;
  name: string;
  avatar: string; // emoji
  balance: number;
  position: number; // tile index
  isCurrentTurn: boolean;
}

export interface BoardTile {
  id: number;
  name: string;
  emoji: string;
  type: 'start' | 'expense' | 'bonus' | 'ransomware' | 'bank' | 'end';
  ccdCost: number; // positive = cost/loss to player, negative = gain
  paymentOptions?: ('bank' | 'blockchain')[];
}

export interface SurpriseCard {
  title: string;
  description: string;
  effect: number; // positive = gain, negative = loss
  emoji: string;
}

export interface GameEvent {
  id: string;
  timestamp: string;
  message: string;
  type: 'gain' | 'loss' | 'neutral' | 'info';
  playerName?: string;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  board: BoardTile[];
  eventLog: GameEvent[];
  currentCard: SurpriseCard | null;
  gameTime: number; // seconds elapsed
  phase: 'waiting' | 'playing' | 'decision' | 'finished';
  pendingPaymentCost: number;
}
