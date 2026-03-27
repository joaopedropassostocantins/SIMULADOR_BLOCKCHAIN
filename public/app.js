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

// Estado local do Cliente
let currentRoom = '';
let myPlayerId = '';
let boardData = [];

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
  // Atualiza saldo na tela se for o jogador atual
  if (myPlayerId && data.players[myPlayerId]) {
    const me = data.players[myPlayerId];
    displayBalance.textContent = me.balance;
    
    // Se o jogador estava processando algo e agora terminou de pagar via banco
    if (!me.isProcessing && !me.pendingPayment && paymentPanel.classList.contains('hidden')) {
        btnRollDice.disabled = false;
    }
  }
  
  // Aqui poderíamos atualizar a interface visual do banco (Fase 5 talvez!)
});

socket.on('miningProgress', (data) => {
  if (data.playerId === myPlayerId) {
    logMessage(`⚙️ Minerando... Hashes testados: ${data.nonce}`);
  }
});

socket.on('blockMined', (data) => {
  logMessage(`⛓️ BLOCO MINERADO! Transação de ${data.block.data.playerName} liquidada no bloco #${data.block.index}. Hash: ${data.block.hash.substring(0, 10)}...`);
  
  if (myPlayerId && data.players[myPlayerId]) {
      displayBalance.textContent = data.players[myPlayerId].balance;
      if (!data.players[myPlayerId].isProcessing) {
          btnRollDice.disabled = false; // Libera o dado
      }
  }
});
