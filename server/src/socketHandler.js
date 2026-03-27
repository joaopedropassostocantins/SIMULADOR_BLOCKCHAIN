import { createRoom, joinRoom, leaveRoom, getRoom } from './gameEngine.js';

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Novo cliente conectado: ${socket.id}`);

    // ── PROFESSOR: Cria a sala ─────────────────────────────────────────
    socket.on('createRoom', (roomId, callback) => {
      const room = createRoom(roomId);
      if (!room) {
        if (callback) callback({ success: false, error: 'Sala já existe ou erro interno.' });
        return;
      }
      
      room.professorSocketId = socket.id;
      socket.join(roomId);
      console.log(`👨‍🏫 Professor criou a sala: ${roomId}`);
      
      if (callback) callback({ success: true, room });
    });

    // ── ALUNO: Entra na sala ───────────────────────────────────────────
    socket.on('joinRoom', ({ roomId, playerName }, callback) => {
      const result = joinRoom(roomId, socket.id, playerName);
      
      if (result.error) {
        if (callback) callback({ success: false, error: result.error });
        return;
      }

      socket.join(roomId);
      console.log(`🎓 Aluno ${playerName} entrou na sala ${roomId}`);

      // Avisa a sala inteira (incluindo o professor) que alguém entrou
      io.to(roomId).emit('playerJoined', result.room.players);

      if (callback) callback({ success: true, player: result.player, room: result.room });
    });

    // ── GERAL: Desconexão ──────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`❌ Cliente desconectado: ${socket.id}`);
      // Busca e remove o jogador de todas as salas onde estava
      // Nota: numa implementação real mais robusta, mantemos o index da sala do socket
      for (const roomId of socket.rooms) {
        const room = leaveRoom(roomId, socket.id);
        if (room) {
          io.to(roomId).emit('playerLeft', room.players);
        }
      }
    });
  });
}
