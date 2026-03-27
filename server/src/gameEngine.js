// ════════════════════════════════════════════════════════════
// MOTOR CRIPTOGRÁFICO, REGRAS DE NEGÓCIO E TABULEIRO (FASE 3)
// ════════════════════════════════════════════════════════════

const DIFF = 2;
const G0 = "0".repeat(64);
const BANK_STAGES = ["Solicitação", "Caixa", "Gerente", "Compliance", "BACEN/SPB", "Liquidado"];

// ── DEFINIÇÃO DO TABULEIRO E CARTAS ─────────────────────────
export const BOARD = [
  { index: 0, tipo: "inicio", titulo: "Start", desc: "Sua jornada começa aqui." },
  { index: 1, tipo: "pagamento", titulo: "Conta de Luz", desc: "Pague 5 CCD.", valor: 5 },
  { index: 2, tipo: "surpresa", titulo: "Carta Surpresa", desc: "Compre uma carta do baralho." },
  { index: 3, tipo: "pagamento", titulo: "Imposto Mensal", desc: "Pague 15 CCD.", valor: 15 },
  { index: 4, tipo: "bonus", titulo: "Rendimento", desc: "Ganhe 10 CCD.", valor: 10 },
  { index: 5, tipo: "pagamento", titulo: "Compra Online", desc: "Pague 8 CCD.", valor: 8 },
  { index: 6, tipo: "surpresa", titulo: "Carta Surpresa", desc: "Compre uma carta." },
  { index: 7, tipo: "pagamento", titulo: "Remessa Internacional", desc: "Pague 20 CCD.", valor: 20 },
  { index: 8, tipo: "bonus", titulo: "Cashback", desc: "Ganhe 5 CCD.", valor: 5 },
  { index: 9, tipo: "pagamento", titulo: "Ransomware", desc: "Hacker exige 10 CCD.", valor: 10 },
  { index: 10, tipo: "surpresa", titulo: "Carta Surpresa", desc: "Compre uma carta." },
  { index: 11, tipo: "pagamento", titulo: "Mensalidade Escolar", desc: "Pague 12 CCD.", valor: 12 },
  { index: 12, tipo: "bonus", titulo: "Herança", desc: "Ganhe 15 CCD.", valor: 15 },
  { index: 13, tipo: "pagamento", titulo: "Assinatura Streaming", desc: "Pague 3 CCD.", valor: 3 },
  { index: 14, tipo: "surpresa", titulo: "Carta Surpresa", desc: "Compre uma carta." },
  { index: 15, tipo: "pagamento", titulo: "Financiamento Carro", desc: "Pague 25 CCD.", valor: 25 },
  { index: 16, tipo: "bonus", titulo: "Venda de Ativo", desc: "Ganhe 20 CCD.", valor: 20 },
  { index: 17, tipo: "pagamento", titulo: "Plano de Saúde", desc: "Pague 18 CCD.", valor: 18 },
  { index: 18, tipo: "surpresa", titulo: "Carta Surpresa", desc: "Compre uma carta." },
  { index: 19, tipo: "chegada", titulo: "Chegada", desc: "Fim do jogo! Quem tem mais saldo?" }
];

export const CARDS = [
  { id: 1, tipo: "bonus", titulo: "Erro a seu favor", desc: "O banco estornou uma tarifa indevida. Ganhe 10 CCD.", valor: 10 },
  { id: 2, tipo: "penalidade", titulo: "Taxa de Manutenção", desc: "Tarifa bancária surpresa. Perca 5 CCD.", valor: -5 },
  { id: 3, tipo: "bonus", titulo: "Airdrop Crypto", desc: "Você recebeu tokens de um novo protocolo. Ganhe 15 CCD.", valor: 15 },
  { id: 4, tipo: "penalidade", titulo: "Gas Fee Alto", desc: "A rede Ethereum está congestionada. Perca 8 CCD.", valor: -8 },
  { id: 5, tipo: "explicacao", titulo: "Feriado Bancário", desc: "Nenhum TED funciona hoje (SPB fechado). Apenas a blockchain opera 24/7.", valor: 0 },
];

// ── MOTOR CRIPTOGRÁFICO ─────────────────────────────────────
function simHash(input) {
  let h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const str = String(input);
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h[0] = (h[0] ^ (c * 0x9e3779b9 + (h[1] << 6) + (h[2] >> 2))) >>> 0;
    h[1] = (h[1] ^ (h[0] * 0x85ebca6b + (h[2] << 13) + (h[3] >> 7))) >>> 0;
    h[2] = (h[2] ^ (h[1] * 0xc2b2ae35 + (h[3] << 3) + (h[0] >> 11))) >>> 0;
    h[3] = (h[3] ^ (h[2] * 0x27d4eb2f + (h[0] << 9) + (h[1] >> 5))) >>> 0;
    [h[4], h[5], h[6], h[7]] = [(h[7] + h[0]) >>> 0, (h[4] + h[1]) >>> 0, (h[5] + h[2]) >>> 0, (h[6] + h[3]) >>> 0];
  }
  return h.map(v => v.toString(16).padStart(8, "0")).join("");
}

function calcHash(idx, ts, data, prev, nonce) {
  return simHash(`${idx}${ts}${JSON.stringify(data)}${prev}${nonce}`);
}

async function mineAsync(idx, ts, data, prev, diff, onProg) {
  const prefix = "0".repeat(diff);
  let nonce = 0, hash = "";
  while (true) {
    nonce++;
    hash = calcHash(idx, ts, data, prev, nonce);
    if (hash.startsWith(prefix)) break;
    if (nonce % 500 === 0) { 
      if (onProg) onProg(nonce); 
      await new Promise(r => setTimeout(r, 0)); 
    }
  }
  return { nonce, hash };
}

export function validateChain(blocks) {
  let pv = true, ph = G0;
  return blocks.map((b) => {
    const exp = calcHash(b.index, b.timestamp, b.data, ph, b.nonce);
    const ok = pv && exp === b.hash && b.previousHash === ph && b.hash.startsWith("0".repeat(DIFF));
    pv = ok; ph = b.hash;
    return { ...b, _valid: ok };
  });
}

// ── ESTADO DAS SALAS ─────────────────────────────────────────
const rooms = new Map();

export function createRoom(roomId) {
  if (rooms.has(roomId)) return false;
  const newRoom = {
    id: roomId, status: 'lobby', professorSocketId: null, players: {}, blocks: [], bankTxs: [], globalTime: 0, tickInterval: null,
  };
  rooms.set(roomId, newRoom);
  return newRoom;
}

export function joinRoom(roomId, socketId, playerName) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'Sala não encontrada' };
  if (room.status !== 'lobby') return { error: 'Jogo já em andamento' };
  const newPlayer = {
    id: socketId, name: playerName, balance: 100, position: 0,
    isProcessing: false,  // Se true, está aguardando mineração/banco
    pendingPayment: null, // Guarda o valor se caiu em casa de "pagamento"
    finished: false,
    connected: true
  };
  room.players[socketId] = newPlayer;
  return { room, player: newPlayer };
}

export function leaveRoom(roomId, socketId) {
  const room = rooms.get(roomId);
  if (room && room.players[socketId]) {
    delete room.players[socketId];
    return room;
  }
  return null;
}

export function getRoom(roomId) { return rooms.get(roomId); }

// ── FLUXO DE JOGO E TABULEIRO ────────────────────────────────
export async function startGame(roomId, io) {
  const room = rooms.get(roomId);
  if (!room || room.status === 'playing') return;
  room.status = 'playing';

  const ts = Date.now();
  const data = { descricao: "Bloco Genesis — Jogo Iniciado" };
  const { nonce, hash } = await mineAsync(0, ts, data, G0, DIFF);
  room.blocks.push({ index: 0, timestamp: ts, data, previousHash: G0, nonce, hash });

  io.to(roomId).emit('gameStarted', { blocks: room.blocks, players: room.players });

  room.tickInterval = setInterval(() => {
    room.globalTime++;
    let stateChanged = false;

    for (const tx of room.bankTxs) {
      if (tx.stage < 5 && !tx.recusado) {
        const player = room.players[tx.playerId];
        
        // Decaimento: Custa 1 CCD por segundo travado no banco
        if (player && player.balance > 0) {
          player.balance -= 1;
          stateChanged = true;
        }

        if (Math.random() < 0.3) {
          tx.stage++;
          if ((tx.stage === 2 || tx.stage === 3) && Math.random() < 0.05) tx.recusado = true;
          stateChanged = true;
          if (tx.stage === 5 || tx.recusado) {
            if (player) {
              player.isProcessing = false;
              if (tx.stage === 5) player.pendingPayment = null; // Pagamento concluído com sucesso
            }
          }
        }
      }
    }

    if (stateChanged) io.to(roomId).emit('gameStateUpdate', { players: room.players, bankTxs: room.bankTxs, globalTime: room.globalTime });
  }, 1000);
}

export function rollDice(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room || room.status !== 'playing') return { error: "Jogo não iniciado." };
  
  const player = room.players[socketId];
  if (!player || player.isProcessing || player.pendingPayment || player.finished) {
    return { error: "Você tem ações pendentes ou já terminou." };
  }

  const dice = Math.floor(Math.random() * 6) + 1;
  player.position += dice;
  if (player.position >= 19) {
    player.position = 19;
    player.finished = true;
  }

  const space = BOARD[player.position];
  let card = null;

  // Lógica das Casas
  if (space.tipo === "bonus") {
    player.balance += space.valor;
  } else if (space.tipo === "pagamento") {
    player.pendingPayment = { titulo: space.titulo, valor: space.valor }; // Bloqueia o player até pagar
  } else if (space.tipo === "surpresa") {
    card = CARDS[Math.floor(Math.random() * CARDS.length)];
    player.balance += card.valor;
  }

  return { dice, position: player.position, space, card, player };
}

// Inicia transação via Banco para resolver pendingPayment
export function processBankTx(roomId, socketId) {
  const room = rooms.get(roomId);
  const player = room.players[socketId];
  if (!room || !player || !player.pendingPayment || player.isProcessing) return false;

  player.isProcessing = true;
  player.balance -= player.pendingPayment.valor; // Desconta o valor principal logo de cara
  
  const newTx = {
    id: Date.now(),
    playerId: socketId,
    playerName: player.name,
    descricao: player.pendingPayment.titulo,
    stage: 0,
    recusado: false,
    taxaFixa: 5
  };
  
  player.balance -= newTx.taxaFixa; // Taxa do banco
  room.bankTxs.unshift(newTx);
  return newTx;
}

// Inicia transação via Blockchain para resolver pendingPayment
export async function processBlockchainTx(roomId, socketId, emitProgress) {
  const room = rooms.get(roomId);
  const player = room.players[socketId];
  if (!room || !player || !player.pendingPayment || player.isProcessing) return false;

  player.isProcessing = true;
  player.balance -= player.pendingPayment.valor; // Desconta valor principal
  player.balance -= 2; // Gas Fee fixo

  const prevBlock = room.blocks[room.blocks.length - 1];
  const ts = Date.now();
  const blockData = { playerId: socketId, playerName: player.name, descricao: `Pagto: ${player.pendingPayment.titulo}` };

  const { nonce, hash } = await mineAsync(room.blocks.length, ts, blockData, prevBlock.hash, DIFF, emitProgress);

  const newBlock = { index: room.blocks.length, timestamp: ts, data: blockData, previousHash: prevBlock.hash, nonce, hash };
  room.blocks.push(newBlock);
  
  player.isProcessing = false;
  player.pendingPayment = null; // Pagamento concluído

  return newBlock;
}
