// ════════════════════════════════════════════════════════════
// MOTOR CRIPTOGRÁFICO E REGRAS DE NEGÓCIO (FASE 2)
// ════════════════════════════════════════════════════════════

const DIFF = 2;
const G0 = "0".repeat(64);
const BANK_STAGES = ["Solicitação", "Caixa", "Gerente", "Compliance", "BACEN/SPB", "Liquidado"];

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

// O setTimeout garante que o Node.js não trave os outros jogadores durante a mineração
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

// ════════════════════════════════════════════════════════════
// ESTADO DAS SALAS E MOTOR DO JOGO
// ════════════════════════════════════════════════════════════

const rooms = new Map();

export function createRoom(roomId) {
  if (rooms.has(roomId)) return false;

  const newRoom = {
    id: roomId,
    status: 'lobby', // lobby, playing, finished
    professorSocketId: null,
    players: {},
    blocks: [],
    bankTxs: [],
    globalTime: 0,
    tickInterval: null,
  };

  rooms.set(roomId, newRoom);
  return newRoom;
}

export function joinRoom(roomId, socketId, playerName) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'Sala não encontrada' };
  if (room.status !== 'lobby') return { error: 'Jogo já em andamento' };

  const newPlayer = {
    id: socketId,
    name: playerName,
    balance: 100, // 100 Carecodólares iniciais
    position: 0,
    isProcessing: false, // Bloqueia ações enquanto transaciona
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

export function getRoom(roomId) {
  return rooms.get(roomId);
}

// ── LÓGICA DE TEMPO REAL (DECAIMENTO E BANCO) ───────────────

export async function startGame(roomId, io) {
  const room = rooms.get(roomId);
  if (!room || room.status === 'playing') return;

  room.status = 'playing';

  // Minera o Bloco Genesis na largada
  const ts = Date.now();
  const data = { descricao: "Bloco Genesis — Jogo Iniciado" };
  const { nonce, hash } = await mineAsync(0, ts, data, G0, DIFF);
  room.blocks.push({ index: 0, timestamp: ts, data, previousHash: G0, nonce, hash });

  io.to(roomId).emit('gameStarted', { blocks: room.blocks, players: room.players });

  // Relógio Global: Roda a cada 1 segundo
  room.tickInterval = setInterval(() => {
    room.globalTime++;
    let stateChanged = false;

    // Processa transações bancárias pendentes
    for (const tx of room.bankTxs) {
      if (tx.stage < 5 && !tx.recusado) {
        const player = room.players[tx.playerId];
        
        // Decaimento bancário: Custa 1 CCD por segundo de atraso
        if (player && player.balance > 0) {
          player.balance -= 1;
          stateChanged = true;
        }

        // Sorteio para avançar de etapa no banco (aprox 30% de chance por segundo)
        if (Math.random() < 0.3) {
          tx.stage++;
          // Sorteio para ser recusado pelo Compliance/Gerente (aprox 5% de chance)
          if (tx.stage === 2 || tx.stage === 3) {
            if (Math.random() < 0.05) tx.recusado = true;
          }
          stateChanged = true;
          
          if (tx.stage === 5 || tx.recusado) {
            if (player) player.isProcessing = false; // Libera o jogador
          }
        }
      }
    }

    if (stateChanged) {
      io.to(roomId).emit('gameStateUpdate', {
        players: room.players,
        bankTxs: room.bankTxs,
        globalTime: room.globalTime
      });
    }
  }, 1000);
}

export function rollDice(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room || room.status !== 'playing') return null;
  const player = room.players[socketId];
  if (!player || player.isProcessing) return null;

  const dice = Math.floor(Math.random() * 6) + 1;
  player.position += dice; // A lógica fina do tabuleiro virá na Fase 3
  return { dice, position: player.position };
}

// Inicia uma transação via Banco
export function processBankTx(roomId, socketId, data) {
  const room = rooms.get(roomId);
  const player = room.players[socketId];
  if (!room || !player || player.isProcessing) return false;

  player.isProcessing = true; // Prende o jogador no banco
  const newTx = {
    id: Date.now(),
    playerId: socketId,
    playerName: player.name,
    descricao: data.descricao || "Transferência Bancária",
    stage: 0,
    recusado: false,
    taxaFixa: 5 // Taxa inicial do banco
  };
  
  player.balance -= newTx.taxaFixa;
  room.bankTxs.unshift(newTx);
  return newTx;
}

// Inicia uma transação via Blockchain (Proof of Work)
export async function processBlockchainTx(roomId, socketId, data, emitProgress) {
  const room = rooms.get(roomId);
  const player = room.players[socketId];
  if (!room || !player || player.isProcessing) return false;

  player.isProcessing = true;
  
  const prevBlock = room.blocks[room.blocks.length - 1];
  const ts = Date.now();
  const blockData = { 
    playerId: socketId, 
    playerName: player.name, 
    descricao: data.descricao || "Smart Contract Execution" 
  };

  // Gas fee fixo (ex: 2 CCD), mas sem decaimento de tempo!
  player.balance -= 2; 

  const { nonce, hash } = await mineAsync(
    room.blocks.length, 
    ts, 
    blockData, 
    prevBlock.hash, 
    DIFF, 
    emitProgress // Callback para enviar o nonce ao frontend via socket
  );

  const newBlock = { index: room.blocks.length, timestamp: ts, data: blockData, previousHash: prevBlock.hash, nonce, hash };
  room.blocks.push(newBlock);
  player.isProcessing = false;

  return newBlock;
}
