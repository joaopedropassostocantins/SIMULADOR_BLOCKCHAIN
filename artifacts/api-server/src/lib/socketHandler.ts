import { Server as SocketIOServer, Socket } from "socket.io";
import {
  createRoom, joinRoom, getRoomBySocket, removePlayerBySocket,
  startGame, rollDice, startBankPayment, generatePowChallenge,
  verifyAndApplyBlockchainPayment, serverSolvePow, drawSurpriseCard,
  getRoomSafeState, getRoom,
} from "./gameEngine";
import { logger } from "./logger";

export function setupSocketIO(io: SocketIOServer) {
  io.on("connection", (socket: Socket) => {
    logger.info({ socketId: socket.id }, "Client connected");

    // ── CREATE ROOM (Professor) ───────────────────────────────────────────────
    socket.on("create_room", ({ playerName, avatar }: { playerName: string; avatar: string }) => {
      try {
        if (!playerName?.trim()) return socket.emit("error", { message: "Nome inválido." });
        const room = createRoom(socket.id, playerName.trim(), avatar || "👨‍🏫🍌");
        socket.join(room.code);
        logger.info({ roomCode: room.code, playerName }, "Room created");
        socket.emit("room_created", { roomCode: room.code, state: getRoomSafeState(room), playerId: room.players[0].id });
      } catch (err) {
        logger.error({ err }, "Error creating room");
        socket.emit("error", { message: "Erro ao criar sala." });
      }
    });

    // ── JOIN ROOM (Student) ───────────────────────────────────────────────────
    socket.on("join_room", ({ roomCode, playerName, avatar }: { roomCode: string; playerName: string; avatar: string }) => {
      try {
        if (!playerName?.trim()) return socket.emit("error", { message: "Nome inválido." });
        const result = joinRoom(roomCode?.toUpperCase(), socket.id, playerName.trim(), avatar || "👦🍌");
        if ("error" in result) return socket.emit("error", { message: result.error });

        socket.join(roomCode.toUpperCase());
        logger.info({ roomCode, playerName }, "Player joined room");
        socket.emit("room_joined", { state: getRoomSafeState(result.room), playerId: result.player.id });
        socket.to(roomCode.toUpperCase()).emit("game_state_update", { state: getRoomSafeState(result.room) });
      } catch (err) {
        logger.error({ err }, "Error joining room");
        socket.emit("error", { message: "Erro ao entrar na sala." });
      }
    });

    // ── START GAME ────────────────────────────────────────────────────────────
    socket.on("start_game", ({ roomCode }: { roomCode: string }) => {
      try {
        const room = getRoom(roomCode);
        if (!room) return socket.emit("error", { message: "Sala não encontrada." });
        const professor = room.players.find(p => p.socketId === socket.id && p.isProfessor);
        if (!professor) return socket.emit("error", { message: "Apenas o professor pode iniciar." });

        const result = startGame(room, (r) => {
          io.to(r.code).emit("game_state_update", { state: getRoomSafeState(r) });
        });

        if (result.error) return socket.emit("error", { message: result.error });

        logger.info({ roomCode }, "Game started");
        io.to(roomCode).emit("game_started", { state: getRoomSafeState(room) });
      } catch (err) {
        logger.error({ err }, "Error starting game");
        socket.emit("error", { message: "Erro ao iniciar partida." });
      }
    });

    // ── ROLL DICE ─────────────────────────────────────────────────────────────
    socket.on("roll_dice", ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
      try {
        const room = getRoom(roomCode);
        if (!room) return socket.emit("error", { message: "Sala não encontrada." });

        const result = rollDice(room, playerId);
        if ("error" in result) return socket.emit("error", { message: result.error });

        io.to(roomCode).emit("dice_rolled", { steps: result.steps, tile: result.tile, state: getRoomSafeState(room) });
      } catch (err) {
        logger.error({ err }, "Error rolling dice");
        socket.emit("error", { message: "Erro ao rolar dado." });
      }
    });

    // ── PAY VIA BANK ──────────────────────────────────────────────────────────
    socket.on("pay_via_bank", ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
      try {
        const room = getRoom(roomCode);
        if (!room) return socket.emit("error", { message: "Sala não encontrada." });

        const result = startBankPayment(
          room,
          playerId,
          (r, secondsLeft, lost) => {
            // tick: broadcast decay to everyone
            io.to(r.code).emit("bank_tick", { secondsLeft, ccdLost: lost, state: getRoomSafeState(r) });
          },
          (r) => {
            // complete: broadcast final state
            io.to(r.code).emit("bank_complete", { state: getRoomSafeState(r) });
          },
        );

        if (result?.error) return socket.emit("error", { message: result.error });

        io.to(roomCode).emit("game_state_update", { state: getRoomSafeState(room) });
      } catch (err) {
        logger.error({ err }, "Error processing bank payment");
        socket.emit("error", { message: "Erro ao processar pagamento bancário." });
      }
    });

    // ── PAY VIA BLOCKCHAIN (request challenge) ────────────────────────────────
    socket.on("request_pow_challenge", ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
      try {
        const room = getRoom(roomCode);
        if (!room) return socket.emit("error", { message: "Sala não encontrada." });

        const result = generatePowChallenge(room, playerId);
        if ("error" in result) return socket.emit("error", { message: result.error });

        // Send challenge to the specific player only
        socket.emit("pow_challenge", { challenge: result.challenge });
        // Broadcast phase change to everyone
        io.to(roomCode).emit("game_state_update", { state: getRoomSafeState(room) });
      } catch (err) {
        logger.error({ err }, "Error generating PoW challenge");
        socket.emit("error", { message: "Erro ao gerar desafio de mineração." });
      }
    });

    // ── SUBMIT PoW SOLUTION ───────────────────────────────────────────────────
    socket.on("submit_pow_solution", ({ roomCode, playerId, nonce }: { roomCode: string; playerId: string; nonce: number }) => {
      try {
        const room = getRoom(roomCode);
        if (!room) return socket.emit("error", { message: "Sala não encontrada." });

        const result = verifyAndApplyBlockchainPayment(room, playerId, nonce);
        if (!result.success) return socket.emit("pow_rejected", { error: result.error });

        io.to(roomCode).emit("pow_accepted", { hash: result.hash, nonce });
        io.to(roomCode).emit("game_state_update", { state: getRoomSafeState(room) });
      } catch (err) {
        logger.error({ err }, "Error verifying PoW");
        socket.emit("error", { message: "Erro ao verificar prova de trabalho." });
      }
    });

    // ── AUTO-MINE (server solves PoW for demo/speed) ─────────────────────────
    socket.on("auto_mine", ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
      try {
        const room = getRoom(roomCode);
        if (!room) return socket.emit("error", { message: "Sala não encontrada." });
        if (!room.currentPowChallenge) return socket.emit("error", { message: "Nenhum desafio ativo." });

        const { data, difficulty } = room.currentPowChallenge;
        const { nonce, hash } = serverSolvePow(data, difficulty);

        const result = verifyAndApplyBlockchainPayment(room, playerId, nonce);
        if (!result.success) return socket.emit("error", { message: result.error || "Falha na mineração." });

        io.to(roomCode).emit("pow_accepted", { hash, nonce });
        io.to(roomCode).emit("game_state_update", { state: getRoomSafeState(room) });
      } catch (err) {
        logger.error({ err }, "Error in auto_mine");
        socket.emit("error", { message: "Erro na mineração automática." });
      }
    });

    // ── DRAW SURPRISE CARD ────────────────────────────────────────────────────
    socket.on("draw_card", ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
      try {
        const room = getRoom(roomCode);
        if (!room) return socket.emit("error", { message: "Sala não encontrada." });

        const result = drawSurpriseCard(room, playerId);
        if ("error" in result) return socket.emit("error", { message: result.error });

        io.to(roomCode).emit("card_drawn", { card: result.card, state: getRoomSafeState(room) });
      } catch (err) {
        logger.error({ err }, "Error drawing card");
        socket.emit("error", { message: "Erro ao comprar carta." });
      }
    });

    // ── DISCONNECT ────────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "Client disconnected");
      try {
        const result = removePlayerBySocket(socket.id);
        if (result) {
          io.to(result.room.code).emit("game_state_update", { state: getRoomSafeState(result.room) });
        }
      } catch (err) {
        logger.error({ err }, "Error on disconnect cleanup");
      }
    });
  });
}
