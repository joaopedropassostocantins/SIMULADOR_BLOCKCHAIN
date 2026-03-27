import { 
  createRoom, joinRoom, leaveRoom, getRoom, startGame, 
  rollDice, processBankTx, processBlockchainTx 
} from './gameEngine.js';

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Novo cliente: ${socket.id}`);

    // ── LOBBY E SALAS ────────────────────────────────────────────────
    socket.on('createRoom', (roomId, callback) => {
      const room = createRoom(roomId);
      if (!room) return callback({ success: false, error: 'Sala já existe.' });
      room.professorSocketId = socket.id;
      socket.join(roomId);
      callback({ success: true, room });
    });

    socket.on('joinRoom', ({ roomId, playerName }, callback) => {
      const result = joinRoom(roomId, socket.id, playerName);
      if (result.error) return callback({ success: false, error: result.error });
      socket.join(roomId);
      io.to(roomId).emit('playerJoined', result.room.players);
      callback({ success: true, player: result.player, room: result.room });
    });

    // ── PROFESSOR CONTROLS ───────────────────────────────────────────
    socket.on('startGame', (roomId) => {
      const room = getRoom(roomId);
      if (room && room.professorSocketId === socket.id) {
        startGame(roomId, io);
      }
    });

    // ── ALUNO CONTROLS (GAMEPLAY) ────────────────────────────────────
    socket.on('rollDice', (roomId, callback) => {
      const result = rollDice(roomId, socket.id);
      if (result) {
        io.to(roomId).emit('playerMoved', { 
          playerId: socket.id, 
          dice: result.dice, 
          position: result.position 
        });
        callback({ success: true, dice: result.dice });
      } else {
        callback({ success: false, error: "Aguarde sua transação finalizar." });
      }
    });

    socket.on('processBankTx', (roomId, data) => {
      const tx = processBankTx(roomId, socket.id, data);
      if (tx) {
        // Envia o estado atualizado para animar a entrada no banco
        const room = getRoom(roomId);
        io.to(roomId).emit('gameStateUpdate', { 
          players: room.players, 
          bankTxs: room.bankTxs 
        });
      }
    });

    socket.on('processBlockchainTx', async (roomId, data) => {
      // Callback invocado a cada 500 hashes testados pelo Node.js
      const onProgress = (nonce) => {
        // Manda o progresso apenas para a sala ver a mineração ao vivo
        io.to(roomId).emit('miningProgress', { playerId: socket.id, nonce });
      };

      const newBlock = await processBlockchainTx(roomId, socket.id, data, onProgress);
      
      if (newBlock) {
        const room = getRoom(roomId);
        io.to(roomId).emit('blockMined', { 
          block: newBlock, 
          players: room.players, // Saldo foi atualizado (gas fee)
          blocks: room.blocks
        });
      }
    });

    // ── DESCONEXÃO ───────────────────────────────────────────────────
    socket.on('disconnect', () => {
      for (const roomId of socket.rooms) {
        const room = leaveRoom(roomId, socket.id);
        if (room) io.to(roomId).emit('playerLeft', room.players);
      }
    });
  });
}
