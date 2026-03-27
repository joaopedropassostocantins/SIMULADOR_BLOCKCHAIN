// ════════════════════════════════════════════════════════════
// MOTOR DO JOGO E ESTADO DAS SALAS
// ════════════════════════════════════════════════════════════

// Memória do servidor (Em produção seria Redis/Banco de dados)
const rooms = new Map();

/**
 * Cria uma nova sala para o Professor
 */
export function createRoom(roomId) {
  if (rooms.has(roomId)) {
    return false; // Sala já existe
  }

  const newRoom = {
    id: roomId,
    status: 'lobby', // lobby, playing, finished
    professorSocketId: null,
    players: {},     // Dicionário de jogadores por socket.id
    blocks: [],      // Cadeia de blocos (será preenchida na Fase 2)
    bankTxs: [],     // Transações bancárias (será preenchida na Fase 2)
    globalTime: 0,   // Relógio global da partida
  };

  rooms.set(roomId, newRoom);
  return newRoom;
}

/**
 * Adiciona um aluno à sala
 */
export function joinRoom(roomId, socketId, playerName) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'Sala não encontrada' };
  if (room.status !== 'lobby') return { error: 'Jogo já em andamento' };

  const newPlayer = {
    id: socketId,
    name: playerName,
    balance: 100,    // 100 Carecodólares (CCD) iniciais
    position: 0,     // Casa inicial no tabuleiro
    connected: true
  };

  room.players[socketId] = newPlayer;
  return { room, player: newPlayer };
}

/**
 * Remove ou desconecta um jogador
 */
export function leaveRoom(roomId, socketId) {
  const room = rooms.get(roomId);
  if (room && room.players[socketId]) {
    delete room.players[socketId];
    return room;
  }
  return null;
}

/**
 * Retorna o estado atual da sala
 */
export function getRoom(roomId) {
  return rooms.get(roomId);
}

// ════════════════════════════════════════════════════════════
// DADOS EDUCACIONAIS — CONSTANTES EXPORTADAS
// ════════════════════════════════════════════════════════════
export const ROLES = [
  { id: "remetente", label: "Remetente", icon: "👤", desc: "Aluno que envia o dinheiro.", cor: "#60a5fa" },
  { id: "destinatario", label: "Destinatario", icon: "👤", desc: "Aluno que recebe.", cor: "#60a5fa" },
  { id: "caixa", label: "Caixa Bancario", icon: "🏦", desc: "Recebe a solicitacao e encaminha.", cor: "#fbbf24" },
  { id: "gerente", label: "Gerente", icon: "👔", desc: "Aprova ou recusa com base em limite.", cor: "#fbbf24" },
  { id: "compliance", label: "Compliance / PLD", icon: "🔍", desc: "Analisa a transacao quanto a lavagem de dinheiro.", cor: "#f87171" },
  { id: "bacen", label: "BACEN / SPB", icon: "🏛️", desc: "Banco Central processa a liquidacao final.", cor: "#a78bfa" },
  { id: "minerador", label: "Minerador", icon: "⛏️", desc: "Valida a transacao resolvendo o PoW.", cor: "#4ade80" },
];

export const EXPLAIN = {
  // Mantive as chaves do seu código original (serão mapeadas na Fase 2 e 3)
  genesis: { titulo: "Bloco Genesis", cor: "#fbbf24" },
  mineracao: { titulo: "Prova de Trabalho (PoW)", cor: "#a78bfa" },
  banco_inicio: { titulo: "Modelo Bancario Tradicional", cor: "#f59e0b" },
  banco_aprovacao: { titulo: "Etapa de Aprovacao Bancaria", cor: "#f59e0b" },
  banco_liquidacao: { titulo: "Liquidacao e Compensacao", cor: "#f59e0b" }
};
