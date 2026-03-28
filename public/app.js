const socket = io();

// Elementos do DOM
const lobbyScreen = document.getElementById('lobbyScreen');
const gameScreen = document.getElementById('gameScreen');
const btnJoin = document.getElementById('btnJoin');
const btnCreate = document.getElementById('btnCreate');
const inputName = document.getElementById('playerName');
const inputRoom = document.getElementById('roomId');
const lobbyMessage = document.getElementById('lobbyMessage');

const displayRoomId = document.getElementById('displayRoomId');
const displayPlayerName = document.getElementById('displayPlayerName');
const displayBalance = document.getElementById('displayBalance');
const btnStartGame = document.getElementById('btnStartGame');
const btnRollDice = document.getElementById('btnRollDice');
const boardContainer = document.getElementById('boardContainer');
const logArea = document.getElementById('logArea');

const paymentPanel = document.getElementById('paymentPanel');
const paymentTitle = document.getElementById('paymentTitle');
const btnPayBank = document.getElementById('btnPayBank');
const btnPayBlockchain = document.getElementById('btnPayBlockchain');

// Painel de Filas
const queuesPanel = document.getElementById('queuesPanel');
const bankQueueList = document.getElementById('bankQueueList');
const miningStatus = document.getElementById('miningStatus');
const blockchainList = document.getElementById('blockchainList');

// Estado local do Cliente
let currentRoom = '';
let myPlayerId = '';
let boardData = [];

// ─── NOMES DOS ESTÁGIOS BANCÁRIOS (deve espelhar o gameEngine.js) ───────────
const BANK_STAGES = ["Solicitação", "Caixa", "Gerente", "Compliance", "BACEN/SPB", "Liquidado"];

// ─── RENDERIZAÇÃO DA FILA DO BANCO ─────────────────────────────────────────
function renderBankQueue(bankTxs) {
  if (!bankTxs || bankTxs.length === 0) {
    bankQueueList.innerHTML = '<p class="empty-msg">Nenhuma transação bancária ainda.</p>';
    return;
  }

  // Mostra as últimas 6 transações (mais recentes primeiro, já chegam com unshift)
  const visible = bankTxs.slice(0, 6);

  bankQueueList.innerHTML = visible.map(tx => {
    const isRecusado = tx.recusado;
    const isLiquidado = tx.stage === 5 && !isRecusado;
    const cardClass = 'bank-tx-card' + (isRecusado ? ' recusado' : isLiquidado ? ' liquidado' : '');

    // Monta os 6 segmentos da barra de progresso
    const stepsHtml = BANK_STAGES.map((_, i) => {
      let cls = 'stage-step';
      if (isRecusado)        cls += i <= tx.stage ? ' refused' : '';
      else if (i < tx.stage) cls += ' done';
      else if (i === tx.stage && !isLiquidado) cls += ' active';
      else if (isLiquidado)  cls += ' done';
      return `<div class="${cls}" title="${BANK_STAGES[i]}"></div>`;
    }).join('');

    let statusText, statusClass;
    if (isRecusado)    { statusText = '❌ Recusado pelo banco';  statusClass = 'status-err'; }
    else if (isLiquidado) { statusText = '✅ Liquidado';         statusClass = 'status-ok';  }
    else               { statusText = `⏳ ${BANK_STAGES[tx.stage]}`; statusClass = 'status-wait'; }

    return `
      <div class="${cardClass}">
        <div class="tx-header">
          <span class="tx-player">👤 ${tx.playerName}</span>
          <span class="tx-desc">${tx.descricao}</span>
        </div>
        <div class="stage-bar">${stepsHtml}</div>
        <div class="tx-stage-label ${statusClass}">${statusText}</div>
      </div>`;
  }).join('');
}

// ─── RENDERIZAÇÃO DO STATUS DE MINERAÇÃO ───────────────────────────────────
function renderMiningStatus(data) {
  if (!data) {
    miningStatus.innerHTML = '';
    return;
  }
  const quem = data.playerId === myPlayerId ? 'Você está minerando' : 'Minerando';
  miningStatus.innerHTML = `
    <div class="mining-card">
      <div class="mining-label">⛏️ ${quem}... ${data.nonce.toLocaleString('pt-BR')} hashes</div>
      <div class="mining-sub">Buscando prefixo "00" — Proof of Work em andamento</div>
    </div>`;
}

// ─── RENDERIZAÇÃO DA BLOCKCHAIN ────────────────────────────────────────────
function renderBlockchain(blocks) {
  if (!blocks || blocks.length === 0) {
    blockchainList.innerHTML = '<p class="empty-msg">Aguardando blocos...</p>';
    return;
  }

  // Exibe os últimos 5 blocos, do mais novo para o mais antigo
  const recent = blocks.slice(-5).reverse();
  blockchainList.innerHTML = recent.map(b => {
    const isGenesis = b.index === 0;
    const desc = isGenesis ? '🌱 Bloco Genesis — Jogo Iniciado' : `💸 ${b.data.descricao || 'Transação'}`;
    const metaLine = isGenesis
      ? `Nonce: ${b.nonce}`
      : `Por: ${b.data.playerName || 'Sistema'} &nbsp;|&nbsp; Nonce: ${b.nonce}`;
    return `
      <div class="block-card">
        <div class="block-index">Bloco #${b.index}</div>
        <div class="block-hash">${b.hash}</div>
        <div class="block-meta">${desc}<br>${metaLine}</div>
      </div>`;
  }).join('');
}

// Função auxiliar para escrever no terminal da tela
function logMessage(msg) {
  const p = document.createElement('p');
  p.textContent = `> ${msg}`;
  p.style.margin = '2px 0';
  logArea.appendChild(p);
  logArea.scrollTop = logArea.scrollHeight;
}

// ─── AÇÕES DO LOBBY ────────────────────────────────────────────────────────
btnCreate.addEventListener('click', () => {
  const roomId = inputRoom.value.trim();
  if (!roomId) return alert('Digite o nome da sala!');
  
  socket.emit('createRoom', roomId, (res) => {
    if (res.success) {
      currentRoom = roomId;
      boardData = res.board;
      enterGameScreen("Professor", true);
      logMessage("Sala criada. Aguardando alunos...");
    } else {
      lobbyMessage.textContent = res.error;
    }
  });
});

btnJoin.addEventListener('click', () => {
  const roomId = inputRoom.value.trim();
  const playerName = inputName.value.trim();
  if (!roomId || !playerName) return alert('Preencha nome e sala!');
  
  socket.emit('joinRoom', { roomId, playerName }, (res) => {
    if (res.success) {
      currentRoom = roomId;
      myPlayerId = socket.id;
      boardData = res.board;
      enterGameScreen(playerName, false);
      logMessage("Você entrou na sala!");
    } else {
      lobbyMessage.textContent = res.error;
    }
  });
});

function enterGameScreen(name, isProfessor) {
  lobbyScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  displayRoomId.textContent = currentRoom;
  displayPlayerName.textContent = name;
  if (isProfessor) btnStartGame.classList.remove('hidden');
  renderBoard();
}

function renderBoard() {
  boardContainer.innerHTML = '';
  boardData.forEach(space => {
    const div = document.createElement('div');
    div.className = 'space';
    div.id = `space-${space.index}`;
    div.innerHTML = `<strong>${space.titulo}</strong><br>Casa ${space.index}`;
    boardContainer.appendChild(div);
  });
}

// ─── AÇÕES DE JOGO ─────────────────────────────────────────────────────────
btnStartGame.addEventListener('click', () => {
  socket.emit('startGame', currentRoom);
  btnStartGame.classList.add('hidden');
});

btnRollDice.addEventListener('click', () => {
  btnRollDice.disabled = true;
  socket.emit('rollDice', currentRoom, (response) => {
    if (!response.success) {
      alert(response.error);
      btnRollDice.disabled = false;
    }
  });
});

// Ações de Pagamento
btnPayBank.addEventListener('click', () => {
  paymentPanel.classList.add('hidden');
  logMessage("Iniciando transferência bancária... Aguarde o gerente.");
  socket.emit('payViaBank', currentRoom);
});

btnPayBlockchain.addEventListener('click', () => {
  paymentPanel.classList.add('hidden');
  logMessage("Enviando transação para a Mempool. Minerando...");
  socket.emit('payViaBlockchain', currentRoom);
});

// ─── ESCUTANDO O SERVIDOR (SOCKET.IO) ──────────────────────────────────────

socket.on('gameStarted', (data) => {
  logMessage("🚀 O JOGO COMEÇOU! O Bloco Genesis foi minerado.");
  btnRollDice.disabled = false;
  queuesPanel.classList.remove('hidden');
  if (data.blocks) renderBlockchain(data.blocks);
});

socket.on('playerMoved', (data) => {
  const isMe = data.playerId === myPlayerId;
  const player = data.players[data.playerId];
  
  logMessage(`🎲 ${player.name} rolou ${data.dice} e foi para a casa ${data.position} (${data.space.titulo}).`);
  
  if (isMe) {
    displayBalance.textContent = player.balance;
    if (data.card) {
      alert(`CARTA SURPRESA: ${data.card.titulo}\n${data.card.desc}`);
      logMessage(`Você tirou uma carta: ${data.card.titulo}`);
    }
    
    // Se caiu em casa de pagamento, mostra as opções
    if (player.pendingPayment) {
      paymentTitle.textContent = `Pague: ${player.pendingPayment.titulo} (Valor: ${player.pendingPayment.valor} CCD)`;
      paymentPanel.classList.remove('hidden');
    } else {
      btnRollDice.disabled = false; // Libera o dado se não tiver que pagar nada
    }
  }
});

socket.on('gameStateUpdate', (data) => {
  if (myPlayerId && data.players[myPlayerId]) {
    const me = data.players[myPlayerId];
    displayBalance.textContent = me.balance;
    if (!me.isProcessing && !me.pendingPayment && paymentPanel.classList.contains('hidden')) {
      btnRollDice.disabled = false;
    }
  }
  if (data.bankTxs !== undefined) renderBankQueue(data.bankTxs);
});

socket.on('miningProgress', (data) => {
  if (data.playerId === myPlayerId) {
    logMessage(`⚙️ Minerando... Hashes testados: ${data.nonce}`);
  }
  renderMiningStatus(data);
});

socket.on('blockMined', (data) => {
  logMessage(`⛓️ BLOCO MINERADO! Transação de ${data.block.data.playerName} liquidada no bloco #${data.block.index}. Hash: ${data.block.hash.substring(0, 10)}...`);
  renderMiningStatus(null);
  if (data.blocks) renderBlockchain(data.blocks);

  if (myPlayerId && data.players[myPlayerId]) {
    displayBalance.textContent = data.players[myPlayerId].balance;
    if (!data.players[myPlayerId].isProcessing) {
      btnRollDice.disabled = false;
    }
  }
});
