import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { RoomState, SurpriseCard, PowChallenge } from "./game-types";

// ─── Client-side PoW miner ─────────────────────────────────────────────────
// Runs in a loop until it finds a valid nonce. Returns { nonce, hash, iterations }.
async function clientMinePoW(
  data: string,
  difficulty: number,
  onProgress?: (nonce: number, hash: string) => void,
): Promise<{ nonce: number; hash: string; iterations: number }> {
  const target = "0".repeat(difficulty);
  let nonce = 0;

  while (true) {
    const msgBuffer = new TextEncoder().encode(`${data}:${nonce}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    if (hash.startsWith(target)) {
      return { nonce, hash, iterations: nonce + 1 };
    }

    if (nonce % 500 === 0 && onProgress) {
      onProgress(nonce, hash);
      // Yield to UI thread
      await new Promise(r => setTimeout(r, 0));
    }
    nonce++;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export type ConnectionStatus = "disconnected" | "connecting" | "connected";

export interface MiningProgress {
  nonce: number;
  currentHash: string;
  isMining: boolean;
}

export interface SocketGameState {
  connectionStatus: ConnectionStatus;
  roomCode: string | null;
  playerId: string | null;
  roomState: RoomState | null;
  lastDiceRoll: number | null;
  bankSecondsLeft: number;
  miningProgress: MiningProgress;
  serverError: string | null;
  lastPowResult: { hash: string; nonce: number } | null;
}

export function useSocketGame() {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<SocketGameState>({
    connectionStatus: "disconnected",
    roomCode: null,
    playerId: null,
    roomState: null,
    lastDiceRoll: null,
    bankSecondsLeft: 0,
    miningProgress: { nonce: 0, currentHash: "", isMining: false },
    serverError: null,
    lastPowResult: null,
  });

  const updateState = useCallback((partial: Partial<SocketGameState>) => {
    setState(s => ({ ...s, ...partial }));
  }, []);

  // ── Connect ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const serverUrl = window.location.origin;
    // The API server lives at /api, so socket.io path must be /api/socket.io
    // Use polling only — Replit's reverse proxy does not upgrade WebSocket for /api paths
    const socket = io(serverUrl, {
      path: "/api/socket.io",
      transports: ["polling"],
      upgrade: false,
    });
    socketRef.current = socket;

    socket.on("connect", () => updateState({ connectionStatus: "connected", serverError: null }));
    socket.on("disconnect", () => updateState({ connectionStatus: "disconnected" }));
    socket.on("connect_error", () => updateState({ connectionStatus: "disconnected", serverError: "Falha de conexão com o servidor." }));

    socket.on("error", ({ message }: { message: string }) => {
      updateState({ serverError: message });
      setTimeout(() => updateState({ serverError: null }), 4000);
    });

    // Room events
    socket.on("room_created", ({ roomCode, state: roomState, playerId }: { roomCode: string; state: RoomState; playerId: string }) => {
      updateState({ roomCode, roomState, playerId });
    });

    socket.on("room_joined", ({ state: roomState, playerId }: { state: RoomState; playerId: string }) => {
      updateState({ roomState, playerId });
    });

    socket.on("game_started", ({ state: roomState }: { state: RoomState }) => {
      updateState({ roomState });
    });

    socket.on("game_state_update", ({ state: roomState }: { state: RoomState }) => {
      updateState({ roomState });
    });

    // Dice
    socket.on("dice_rolled", ({ steps, state: roomState }: { steps: number; tile: unknown; state: RoomState }) => {
      updateState({ lastDiceRoll: steps, roomState });
      setTimeout(() => updateState({ lastDiceRoll: null }), 3000);
    });

    // Bank
    socket.on("bank_tick", ({ secondsLeft, state: roomState }: { secondsLeft: number; ccdLost: number; state: RoomState }) => {
      updateState({ bankSecondsLeft: secondsLeft, roomState });
    });
    socket.on("bank_complete", ({ state: roomState }: { state: RoomState }) => {
      updateState({ bankSecondsLeft: 0, roomState });
    });

    // Blockchain PoW
    socket.on("pow_challenge", ({ challenge }: { challenge: PowChallenge }) => {
      // Start client-side mining
      updateState({ miningProgress: { nonce: 0, currentHash: "", isMining: true } });
      clientMinePoW(
        challenge.data,
        challenge.difficulty,
        (nonce, hash) => setState(s => ({ ...s, miningProgress: { nonce, currentHash: hash, isMining: true } })),
      ).then(({ nonce, hash }) => {
        setState(s => {
          if (!s.playerId || !s.roomCode) return s;
          socket.emit("submit_pow_solution", { roomCode: s.roomCode, playerId: s.playerId, nonce });
          return { ...s, miningProgress: { nonce, currentHash: hash, isMining: false } };
        });
      });
    });

    socket.on("pow_accepted", ({ hash, nonce }: { hash: string; nonce: number }) => {
      updateState({ lastPowResult: { hash, nonce }, miningProgress: { nonce, currentHash: hash, isMining: false } });
      setTimeout(() => updateState({ lastPowResult: null }), 5000);
    });

    socket.on("card_drawn", ({ state: roomState }: { card: SurpriseCard; state: RoomState }) => {
      updateState({ roomState });
    });

    updateState({ connectionStatus: "connecting" });

    return () => {
      socket.disconnect();
    };
  }, [updateState]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const createRoom = useCallback((playerName: string, avatar: string) => {
    socketRef.current?.emit("create_room", { playerName, avatar });
  }, []);

  const joinRoom = useCallback((roomCode: string, playerName: string, avatar: string) => {
    updateState({ roomCode: roomCode.toUpperCase() });
    socketRef.current?.emit("join_room", { roomCode: roomCode.toUpperCase(), playerName, avatar });
  }, [updateState]);

  const startGame = useCallback(() => {
    setState(s => {
      if (s.roomCode) socketRef.current?.emit("start_game", { roomCode: s.roomCode });
      return s;
    });
  }, []);

  const rollDice = useCallback(() => {
    setState(s => {
      if (s.roomCode && s.playerId) {
        socketRef.current?.emit("roll_dice", { roomCode: s.roomCode, playerId: s.playerId });
      }
      return s;
    });
  }, []);

  const payViaBank = useCallback(() => {
    setState(s => {
      if (s.roomCode && s.playerId) {
        socketRef.current?.emit("pay_via_bank", { roomCode: s.roomCode, playerId: s.playerId });
      }
      return s;
    });
  }, []);

  const payViaBlockchain = useCallback(() => {
    setState(s => {
      if (s.roomCode && s.playerId) {
        socketRef.current?.emit("request_pow_challenge", { roomCode: s.roomCode, playerId: s.playerId });
      }
      return s;
    });
  }, []);

  const drawCard = useCallback(() => {
    setState(s => {
      if (s.roomCode && s.playerId) {
        socketRef.current?.emit("draw_card", { roomCode: s.roomCode, playerId: s.playerId });
      }
      return s;
    });
  }, []);

  const dismissError = useCallback(() => updateState({ serverError: null }), [updateState]);

  const currentPlayer = state.roomState?.players.find(p => p.id === state.playerId) ?? null;
  const isMyTurn = currentPlayer?.isCurrentTurn ?? false;

  return {
    state,
    currentPlayer,
    isMyTurn,
    actions: { createRoom, joinRoom, startGame, rollDice, payViaBank, payViaBlockchain, drawCard, dismissError },
  };
}
