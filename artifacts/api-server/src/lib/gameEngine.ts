import crypto from "crypto";

// ─── Types ───────────────────────────────────────────────────────────────────

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

export interface Room {
  code: string;
  players: Player[];
  board: BoardTile[];
  currentPlayerIndex: number;
  phase: GamePhase;
  gameTime: number;
  timerInterval: ReturnType<typeof setInterval> | null;
  eventLog: GameEvent[];
  currentCard: SurpriseCard | null;
  pendingPaymentCost: number;
  currentPowChallenge: PowChallenge | null;
  bankDecayInterval: ReturnType<typeof setInterval> | null;
  bankSecondsLeft: number;
  bankTxs: BankTx[];
  confirmedBlocks: ConfirmedBlock[];
}

// ─── Board Definition ─────────────────────────────────────────────────────────

export const BOARD: BoardTile[] = [
  { id: 0,  name: "Início",         emoji: "🍌", type: "start",    ccdCost: 0 },
  { id: 1,  name: "Conta de Luz",   emoji: "⚡", type: "expense",  ccdCost: 5,  paymentOptions: ["bank", "blockchain"] },
  { id: 2,  name: "Imposto",        emoji: "💰", type: "expense",  ccdCost: 15, paymentOptions: ["bank", "blockchain"] },
  { id: 3,  name: "Bônus",          emoji: "🎁", type: "bonus",    ccdCost: -10 },
  { id: 4,  name: "Ransomware",     emoji: "💻", type: "ransomware", ccdCost: 10, paymentOptions: ["blockchain"] },
  { id: 5,  name: "Banco Int.",     emoji: "🌍", type: "bank",     ccdCost: 20, paymentOptions: ["bank", "blockchain"] },
  { id: 6,  name: "Remessa Int.",   emoji: "🌐", type: "expense",  ccdCost: 20, paymentOptions: ["bank", "blockchain"] },
  { id: 7,  name: "Conta de Luz",   emoji: "⚡", type: "expense",  ccdCost: 15, paymentOptions: ["bank", "blockchain"] },
  { id: 8,  name: "Imposto Mensal", emoji: "💰", type: "expense",  ccdCost: 15, paymentOptions: ["bank", "blockchain"] },
  { id: 9,  name: "Bônus",          emoji: "🎁", type: "bonus",    ccdCost: -15 },
  { id: 10, name: "Ransomware",     emoji: "💻", type: "ransomware", ccdCost: 20, paymentOptions: ["blockchain"] },
  { id: 11, name: "Banco Int.",     emoji: "🌍", type: "bank",     ccdCost: 20, paymentOptions: ["bank", "blockchain"] },
  { id: 12, name: "Remessa",        emoji: "🌐", type: "expense",  ccdCost: 20, paymentOptions: ["bank", "blockchain"] },
  { id: 13, name: "Ransomware",     emoji: "💻", type: "ransomware", ccdCost: 10, paymentOptions: ["blockchain"] },
  { id: 14, name: "FIM",            emoji: "🏆", type: "end",      ccdCost: 0 },
];

export const SURPRISE_CARDS: SurpriseCard[] = [
  { title: "Erro a seu favor!",    description: "O banco cometeu um erro (milagre!). Ganhe 10 CCD!",            effect: 10,  emoji: "🤑" },
  { title: "Hacker!",              description: "Um hacker invadiu seu computador! Perca 15 CCD!",              effect: -15, emoji: "👾" },
  { title: "Bônus de Mineração!",  description: "Você encontrou o nonce correto rapidinho. +20 CCD!",           effect: 20,  emoji: "⛏️" },
  { title: "Imposto Extra!",       description: "A Receita Federal achou suas criptos. -10 CCD!",               effect: -10, emoji: "📜" },
  { title: "Adoção em Massa!",     description: "O mundo todo está usando bananas! Valorizou! +15 CCD!",        effect: 15,  emoji: "🚀" },
  { title: "Forte Queda!",         description: "Elon Musk twittou mal das bananas. -10 CCD!",                  effect: -10, emoji: "📉" },
  { title: "Halvening!",           description: "O halvening chegou! Mineradores ganham bônus. +12 CCD!",       effect: 12,  emoji: "⛏️" },
  { title: "Regulatory FUD!",      description: "Governo regulamentou criptos. Pânico no mercado. -8 CCD!",     effect: -8,  emoji: "🏛️" },
];

// ─── Room Store ───────────────────────────────────────────────────────────────

const rooms = new Map<string, Room>();

export function generateRoomCode(): string {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  return rooms.has(code) ? generateRoomCode() : code;
}

export function createRoom(socketId: string, playerName: string, avatar: string): Room {
  const code = generateRoomCode();
  const professor: Player = {
    id: crypto.randomUUID(),
    name: playerName,
    avatar,
    balance: 100,
    position: 0,
    isCurrentTurn: false,
    socketId,
    isProfessor: true,
  };
  const room: Room = {
    code,
    players: [professor],
    board: BOARD,
    currentPlayerIndex: 0,
    phase: "lobby",
    gameTime: 0,
    timerInterval: null,
    eventLog: [],
    currentCard: null,
    pendingPaymentCost: 0,
    currentPowChallenge: null,
    bankDecayInterval: null,
    bankSecondsLeft: 0,
    bankTxs: [],
    confirmedBlocks: [],
  };
  rooms.set(code, room);
  return room;
}

export function joinRoom(
  code: string,
  socketId: string,
  playerName: string,
  avatar: string,
): { room: Room; player: Player } | { error: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Sala não encontrada. Verifique o código." };
  if (room.phase !== "lobby") return { error: "Partida já iniciada. Aguarde a próxima." };
  if (room.players.length >= 6) return { error: "Sala cheia (máx. 6 jogadores)." };

  const player: Player = {
    id: crypto.randomUUID(),
    name: playerName,
    avatar,
    balance: 100,
    position: 0,
    isCurrentTurn: false,
    socketId,
    isProfessor: false,
  };
  room.players.push(player);
  addEvent(room, `🍌 ${playerName} entrou na sala!`, "info", playerName);
  return { room, player };
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code);
}

export function getRoomBySocket(socketId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.players.some(p => p.socketId === socketId)) return room;
  }
  return undefined;
}

export function removePlayerBySocket(socketId: string): { room: Room; player: Player } | null {
  const room = getRoomBySocket(socketId);
  if (!room) return null;
  const idx = room.players.findIndex(p => p.socketId === socketId);
  if (idx === -1) return null;
  const [player] = room.players.splice(idx, 1);
  addEvent(room, `🚪 ${player.name} saiu da sala.`, "neutral");
  if (room.players.length === 0) {
    cleanupRoom(room);
    rooms.delete(room.code);
  }
  return { room, player };
}

function cleanupRoom(room: Room) {
  if (room.timerInterval) clearInterval(room.timerInterval);
  if (room.bankDecayInterval) clearInterval(room.bankDecayInterval);
  room.timerInterval = null;
  room.bankDecayInterval = null;
}

// ─── Game Logic ───────────────────────────────────────────────────────────────

function addEvent(room: Room, message: string, type: EventType, playerName?: string) {
  room.eventLog.unshift({
    id: crypto.randomUUID(),
    timestamp: new Date().toLocaleTimeString("pt-BR"),
    message,
    type,
    playerName,
  });
  if (room.eventLog.length > 50) room.eventLog.pop();
}

export function startGame(
  room: Room,
  onTick: (room: Room) => void,
): { error?: string } {
  if (room.phase !== "lobby") return { error: "Jogo já iniciado." };
  if (room.players.length < 2) return { error: "Precisa de pelo menos 2 jogadores." };

  room.phase = "playing";
  room.currentPlayerIndex = 0;
  room.players.forEach((p, i) => {
    p.isCurrentTurn = i === 0;
    p.balance = 100;
    p.position = 0;
  });
  addEvent(room, "⛏️ Bloco Genesis minerado! Partida iniciada!", "info");
  addEvent(room, `🎮 É a vez de ${room.players[0].name}. Role o dado!`, "neutral", room.players[0].name);

  // Global game timer
  room.timerInterval = setInterval(() => {
    room.gameTime += 1;
    onTick(room);
  }, 1000);

  return {};
}

export function rollDice(room: Room, playerId: string): { steps: number; tile: BoardTile } | { error: string } {
  if (room.phase !== "playing") return { error: "Não é hora de rolar o dado." };
  const cp = room.players[room.currentPlayerIndex];
  if (cp.id !== playerId) return { error: "Não é a sua vez." };

  const steps = Math.floor(Math.random() * 6) + 1;
  const newPos = Math.min(cp.position + steps, room.board.length - 1);
  cp.position = newPos;
  const tile = room.board[newPos];

  addEvent(room, `🎲 ${cp.name} tirou ${steps} e foi para a casa "${tile.name}"`, "neutral", cp.name);

  if (tile.type === "bonus") {
    const gain = Math.abs(tile.ccdCost);
    cp.balance += gain;
    addEvent(room, `🎁 ${cp.name} ganhou ${gain} CCD de bônus!`, "gain", cp.name);
    advanceTurn(room);
  } else if (tile.type === "end") {
    room.phase = "finished";
    addEvent(room, `🏆 ${cp.name} chegou ao FIM!`, "info", cp.name);
  } else if (tile.paymentOptions && tile.paymentOptions.length > 0) {
    room.phase = "decision";
    room.pendingPaymentCost = tile.ccdCost;
    addEvent(room, `💳 ${cp.name} precisa pagar ${tile.ccdCost} CCD em "${tile.name}". Escolha o método!`, "neutral", cp.name);
  } else {
    // Free tile (start, etc.)
    advanceTurn(room);
  }

  return { steps, tile };
}

// ─── Bank Transaction ─────────────────────────────────────────────────────────
// Regra didática: Banco é LENTO — corroe 1 CCD/segundo por 5 segundos + taxa fixa de 5 CCD
// Total extra: até 10 CCD a mais que via Blockchain

const BANK_PROCESSING_SECONDS = 5;
const BANK_FEE = 5;

export function startBankPayment(
  room: Room,
  playerId: string,
  onTick: (room: Room, secondsLeft: number, ccdLostThisTick: number) => void,
  onComplete: (room: Room) => void,
): { error?: string } {
  if (room.phase !== "decision") return { error: "Nenhum pagamento pendente." };
  const cp = room.players[room.currentPlayerIndex];
  if (cp.id !== playerId) return { error: "Não é a sua vez." };

  const baseCost = room.pendingPaymentCost;
  // Apply base cost + fixed fee immediately
  cp.balance -= baseCost + BANK_FEE;
  room.phase = "bank_processing";
  room.bankSecondsLeft = BANK_PROCESSING_SECONDS;

  // Create a BankTx entry to track stage progression in the Queues Panel
  const bankTx: BankTx = {
    id: crypto.randomUUID(),
    playerName: cp.name,
    descricao: room.board[cp.position]?.name ?? "Pagamento",
    stage: 0,
    recusado: false,
  };
  room.bankTxs.unshift(bankTx);
  if (room.bankTxs.length > 10) room.bankTxs.pop();

  addEvent(room, `🏦 ${cp.name} optou pelo Banco Tradicional. Taxa de ${BANK_FEE} CCD cobrada. Processando (${BANK_PROCESSING_SECONDS}s)...`, "loss", cp.name);

  // Decay: 1 CCD/second for BANK_PROCESSING_SECONDS seconds
  // Each tick also advances the bank transaction stage (0→5 over 5 ticks)
  if (room.bankDecayInterval) clearInterval(room.bankDecayInterval);
  room.bankDecayInterval = setInterval(() => {
    room.bankSecondsLeft -= 1;
    cp.balance -= 1; // corrosão por atraso

    // Advance BankTx stage: stages 0-4 advance per tick, stage 5 = Liquidado on completion
    const stageStep = BANK_PROCESSING_SECONDS - room.bankSecondsLeft; // 1-5
    bankTx.stage = Math.min(stageStep, BANK_STAGES.length - 2); // cap at 4 until complete

    onTick(room, room.bankSecondsLeft, 1);

    if (room.bankSecondsLeft <= 0) {
      clearInterval(room.bankDecayInterval!);
      room.bankDecayInterval = null;
      bankTx.stage = BANK_STAGES.length - 1; // "Liquidado"
      addEvent(room, `✅ Transação bancária de ${cp.name} concluída com ${BANK_PROCESSING_SECONDS}s de atraso. Total perdido: ${baseCost + BANK_FEE + BANK_PROCESSING_SECONDS} CCD`, "loss", cp.name);
      advanceTurn(room);
      onComplete(room);
    }
  }, 1000);

  return {};
}

// ─── Blockchain Transaction (PoW) ─────────────────────────────────────────────
// Regra didática: Blockchain é RÁPIDA mas exige Proof of Work (hash com zeros)
// Custo exato, sem taxa, transação imediata após minerar

const POW_DIFFICULTY = 2; // hash deve começar com "00"

export function generatePowChallenge(room: Room, playerId: string): { challenge: PowChallenge } | { error: string } {
  if (room.phase !== "decision") return { error: "Nenhum pagamento pendente." };
  const cp = room.players[room.currentPlayerIndex];
  if (cp.id !== playerId) return { error: "Não é a sua vez." };

  const data = `${room.code}:${cp.id}:${Date.now()}:${room.pendingPaymentCost}`;
  const challenge: PowChallenge = {
    data,
    difficulty: POW_DIFFICULTY,
    targetCost: room.pendingPaymentCost,
  };
  room.currentPowChallenge = challenge;
  room.phase = "blockchain_mining";

  addEvent(room, `⛏️ ${cp.name} iniciou mineração Blockchain! Encontre o nonce correto (dificuldade: ${POW_DIFFICULTY} zeros)...`, "neutral", cp.name);
  return { challenge };
}

export function verifyAndApplyBlockchainPayment(
  room: Room,
  playerId: string,
  nonce: number,
): { success: boolean; hash?: string; error?: string } {
  if (room.phase !== "blockchain_mining") return { success: false, error: "Nenhuma mineração em curso." };
  const cp = room.players[room.currentPlayerIndex];
  if (cp.id !== playerId) return { success: false, error: "Não é a sua vez." };
  if (!room.currentPowChallenge) return { success: false, error: "Desafio não encontrado." };

  const { data, difficulty, targetCost } = room.currentPowChallenge;
  const hash = crypto.createHash("sha256").update(`${data}:${nonce}`).digest("hex");
  const target = "0".repeat(difficulty);

  if (!hash.startsWith(target)) {
    return { success: false, error: `Hash inválido: ${hash.substring(0, 12)}... (não começa com ${target})` };
  }

  // Valid PoW — apply exact cost, no fee
  cp.balance -= targetCost;
  room.currentPowChallenge = null;

  // Record the confirmed block in the queues panel
  const blockDescricao = room.board[cp.position]?.name ?? "Pagamento";
  room.confirmedBlocks.unshift({
    index: room.confirmedBlocks.length,
    hash,
    playerName: cp.name,
    descricao: `Pagto: ${blockDescricao}`,
    nonce,
    timestamp: Date.now(),
  });
  if (room.confirmedBlocks.length > 10) room.confirmedBlocks.pop();

  addEvent(room, `✅ ${cp.name} minerou com sucesso! Hash: ${hash.substring(0, 16)}... Nonce: ${nonce}. Pagou exatos ${targetCost} CCD sem taxas!`, "gain", cp.name);
  advanceTurn(room);

  return { success: true, hash };
}

// Server-side PoW solve (fallback / auto-mine for demo)
export function serverSolvePow(data: string, difficulty: number): { nonce: number; hash: string } {
  const target = "0".repeat(difficulty);
  let nonce = 0;
  let hash = "";
  do {
    hash = crypto.createHash("sha256").update(`${data}:${nonce}`).digest("hex");
    nonce++;
  } while (!hash.startsWith(target));
  return { nonce: nonce - 1, hash };
}

// ─── Surprise Cards ───────────────────────────────────────────────────────────

export function drawSurpriseCard(room: Room, playerId: string): { card: SurpriseCard } | { error: string } {
  if (room.phase !== "playing") return { error: "Cartas só podem ser compradas durante a jogada." };
  const cp = room.players[room.currentPlayerIndex];
  if (cp.id !== playerId) return { error: "Não é a sua vez." };

  const card = SURPRISE_CARDS[Math.floor(Math.random() * SURPRISE_CARDS.length)];
  cp.balance += card.effect;
  room.currentCard = card;

  addEvent(
    room,
    `🃏 ${cp.name} tirou: "${card.title}" (${card.effect > 0 ? "+" : ""}${card.effect} CCD)`,
    card.effect >= 0 ? "gain" : "loss",
    cp.name,
  );

  return { card };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function advanceTurn(room: Room) {
  const nextIdx = (room.currentPlayerIndex + 1) % room.players.length;
  room.currentPlayerIndex = nextIdx;
  room.players.forEach((p, i) => { p.isCurrentTurn = i === nextIdx; });
  room.phase = "playing";
  room.pendingPaymentCost = 0;
  room.currentCard = null;
  addEvent(room, `🎮 É a vez de ${room.players[nextIdx].name}. Role o dado!`, "neutral", room.players[nextIdx].name);
}

export function getRoomSafeState(room: Room) {
  return {
    code: room.code,
    players: room.players,
    board: room.board,
    currentPlayerIndex: room.currentPlayerIndex,
    phase: room.phase,
    gameTime: room.gameTime,
    eventLog: room.eventLog,
    currentCard: room.currentCard,
    pendingPaymentCost: room.pendingPaymentCost,
    bankSecondsLeft: room.bankSecondsLeft,
    hasPowChallenge: !!room.currentPowChallenge,
    powChallenge: room.currentPowChallenge,
    bankTxs: room.bankTxs,
    confirmedBlocks: room.confirmedBlocks,
  };
}
