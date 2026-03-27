import { 
  createRoom, joinRoom, leaveRoom, getRoom, startGame, 
  rollDice, processBankTx, processBlockchainTx, BOARD
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
      callback({ success: true, room, board: BOARD });
    });

    socket.on('joinRoom', ({ roomId, playerName }, callback) => {
      const result = joinRoom(roomId, socket.id, playerName);
      if (result.error) return callback({ success: false, error: result.error });
      socket.join(roomId);
      io.to(roomId).emit('playerJoined', result.room.players);
      callback({ success: true, player: result.player, room: result.room, board: BOARD });
    });

    // ── PROFESSOR CONTROLS ───────────────────────────────────────────
    socket.on('startGame', (roomId) => {
      const room = getRoom(roomId);
      if (room && room.professorSocketId === socket.id) startGame(roomId, io);
    });

    // ── ALUNO CONTROLS (GAMEPLAY) ────────────────────────────────────
    socket.on('rollDice', (roomId, callback) => {
      const result = rollDice(roomId, socket.id);
      if (result.error) {
        callback({ success: false, error: result.error });
      } else {
        const room = getRoom(roomId);
        io.to(roomId).emit('playerMoved', { 
          playerId: socket.id, dice: result.dice, position: result.position, 
          space: result.space, card: result.card, players: room.players 
        });
        callback({ success: true, result });
      }
    });

    socket.on('payViaBank', (roomId, callback) => {
      const tx = processBankTx(roomId, socket.id);
      if (tx) {
        const room = getRoom(roomId);
        io.to(roomId).emit('gameStateUpdate', { players: room.players, bankTxs: room.bankTxs });
        if(callback) callback({ success: true });
      } else {
        if(callback) callback({ success: false, error: "Falha ao iniciar processo bancário." });
      }
    });

    socket.on('payViaBlockchain', async (roomId, callback) => {
      if(callback) callback({ success: true }); // Libera UI para não travar enquanto aguarda
      
      const onProgress = (nonce) => {
        io.to(roomId).emit('miningProgress', { playerId: socket.id, nonce });
      };

      const newBlock = await processBlockchainTx(roomId, socket.id, onProgress);
      
      if (newBlock) {
        const room = getRoom(roomId);
        io.to(roomId).emit('blockMined', { block: newBlock, players: room.players, blocks: room.blocks });
      }
    });

    socket.on('disconnect', () => {
      for (const roomId of socket.rooms) {
        const room = leaveRoom(roomId, socket.id);
        if (room) io.to(roomId).emit('playerLeft', room.players);
      }
    });
  });
}
