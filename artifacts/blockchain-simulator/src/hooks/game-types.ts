export type TileType = "start" | "expense" | "bonus" | "ransomware" | "bank" | "end";
export type PaymentMethod = "bank" | "blockchain";
export type GamePhase = "lobby" | "playing" | "decision" | "bank_processing" | "blockchain_mining" | "finished";
export type EventType = "gain" | "loss" | "neutral" | "info";

export interface BoardTile {
  id: number;
  name: string;
  emoji: string;
  type: TileType;
  ccdCost: number;
  paymentOptions?: PaymentMethod[];
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  balance: number;
  position: number;
  isCurrentTurn: boolean;
  socketId: string;
  isProfessor: boolean;
}

export interface SurpriseCard {
  title: string;
  description: string;
  effect: number;
  emoji: string;
}

export interface GameEvent {
  id: string;
  timestamp: string;
  message: string;
  type: EventType;
  playerName?: string;
}

export interface PowChallenge {
  data: string;
  difficulty: number;
  targetCost: number;
}

export const BANK_STAGES = ["Solicitação", "Caixa", "Gerente", "Compliance", "BACEN/SPB", "Liquidado"];

export interface BankTx {
  id: string;
  playerName: string;
  descricao: string;
  stage: number;
  recusado: boolean;
}

export interface ConfirmedBlock {
  index: number;
  hash: string;
  playerName: string;
  descricao: string;
  nonce: number;
  timestamp: number;
}

export interface RoomState {
  code: string;
  players: Player[];
  board: BoardTile[];
  currentPlayerIndex: number;
  phase: GamePhase;
  gameTime: number;
  eventLog: GameEvent[];
  currentCard: SurpriseCard | null;
  pendingPaymentCost: number;
  bankSecondsLeft: number;
  hasPowChallenge: boolean;
  powChallenge: PowChallenge | null;
  bankTxs: BankTx[];
  confirmedBlocks: ConfirmedBlock[];
}

// Legacy compatibility aliases
export type GameState = RoomState;
