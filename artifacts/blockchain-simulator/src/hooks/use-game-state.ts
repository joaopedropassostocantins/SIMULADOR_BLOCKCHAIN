import { useState, useEffect, useCallback, useMemo } from 'react';
import { GameState, Player, BoardTile, SurpriseCard, GameEvent } from './game-types';

const INITIAL_BOARD: BoardTile[] = [
  // Row 1 (Left to Right)
  { id: 0, name: "Início", emoji: "🍌", type: "start", ccdCost: 0 },
  { id: 1, name: "Conta de Luz", emoji: "⚡", type: "expense", ccdCost: 5, paymentOptions: ['bank', 'blockchain'] },
  { id: 2, name: "Imposto", emoji: "💰", type: "expense", ccdCost: 15, paymentOptions: ['bank', 'blockchain'] },
  { id: 3, name: "Bônus", emoji: "🎁", type: "bonus", ccdCost: -10 },
  { id: 4, name: "Ransomware", emoji: "💻", type: "ransomware", ccdCost: 10, paymentOptions: ['blockchain'] },
  
  // Row 2 (Right to Left - logical ordering continues, visual rendering will reverse it)
  { id: 5, name: "Banco Int.", emoji: "🌍", type: "bank", ccdCost: 20, paymentOptions: ['bank'] },
  { id: 6, name: "Remessa Int.", emoji: "🌐", type: "expense", ccdCost: 20, paymentOptions: ['bank', 'blockchain'] },
  { id: 7, name: "Conta de Luz", emoji: "⚡", type: "expense", ccdCost: 15, paymentOptions: ['bank', 'blockchain'] },
  { id: 8, name: "Imposto Mensal", emoji: "💰", type: "expense", ccdCost: 15, paymentOptions: ['bank', 'blockchain'] },
  { id: 9, name: "Bônus", emoji: "🎁", type: "bonus", ccdCost: -15 },
  
  // Row 3 (Left to Right)
  { id: 10, name: "Ransomware", emoji: "💻", type: "ransomware", ccdCost: 20, paymentOptions: ['blockchain'] },
  { id: 11, name: "Banco Int.", emoji: "🌍", type: "bank", ccdCost: 20, paymentOptions: ['bank'] },
  { id: 12, name: "Remessa", emoji: "🌐", type: "expense", ccdCost: 20, paymentOptions: ['bank', 'blockchain'] },
  { id: 13, name: "Ransomware", emoji: "💻", type: "ransomware", ccdCost: 10, paymentOptions: ['blockchain'] },
  { id: 14, name: "FIM", emoji: "🏆", type: "end", ccdCost: 0 }
];

const INITIAL_PLAYERS: Player[] = [
  { id: '1', name: 'Maria', avatar: '👩🍌', balance: 100, position: 0, isCurrentTurn: true },
  { id: '2', name: 'Pedro', avatar: '👦🍌', balance: 100, position: 0, isCurrentTurn: false },
  { id: '3', name: 'João', avatar: '🧔🍌', balance: 100, position: 0, isCurrentTurn: false },
  { id: '4', name: 'Ana', avatar: '👧🍌', balance: 100, position: 0, isCurrentTurn: false },
  { id: '5', name: 'Lucas', avatar: '👴🍌', balance: 100, position: 0, isCurrentTurn: false },
  { id: '6', name: 'Julia', avatar: '👩‍🦱🍌', balance: 100, position: 0, isCurrentTurn: false },
];

const SURPRISE_CARDS: SurpriseCard[] = [
  { title: "Erro a seu favor!", description: "O banco cometeu um erro (milagre!). Ganhe 10 CCD!", effect: 10, emoji: "🤑" },
  { title: "Hacker!", description: "Um hacker invadiu seu computador! Perca 15 CCD!", effect: -15, emoji: "👾" },
  { title: "Bônus de Mineração!", description: "Você encontrou o nonce correto rapidinho. +20 CCD!", effect: 20, emoji: "⛏️" },
  { title: "Imposto Extra!", description: "A receita federal achou suas criptos. -10 CCD!", effect: -10, emoji: "📜" },
  { title: "Adoção em Massa!", description: "O mundo todo está usando bananas! Valorizou! +15 CCD!", effect: 15, emoji: "🚀" },
  { title: "Forte Queda!", description: "Elon Musk twittou mal das bananas. -10 CCD!", effect: -10, emoji: "📉" },
];

export function useGameState() {
  const [state, setState] = useState<GameState>({
    players: INITIAL_PLAYERS,
    currentPlayerIndex: 0,
    board: INITIAL_BOARD,
    eventLog: [{ id: 'init', timestamp: new Date().toLocaleTimeString(), message: 'Partida iniciada!', type: 'info' }],
    currentCard: null,
    gameTime: 0,
    phase: 'playing',
    pendingPaymentCost: 0
  });

  // Timer
  useEffect(() => {
    if (state.phase === 'playing' || state.phase === 'decision') {
      const interval = setInterval(() => {
        setState(s => ({ ...s, gameTime: s.gameTime + 1 }));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state.phase]);

  const addEvent = useCallback((message: string, type: GameEvent['type'] = 'info', playerName?: string) => {
    setState(s => ({
      ...s,
      eventLog: [
        { id: Math.random().toString(), timestamp: new Date().toLocaleTimeString(), message, type, playerName },
        ...s.eventLog
      ].slice(0, 50)
    }));
  }, []);

  const nextTurn = useCallback(() => {
    setState(s => {
      const nextIdx = (s.currentPlayerIndex + 1) % s.players.length;
      return {
        ...s,
        currentPlayerIndex: nextIdx,
        players: s.players.map((p, i) => ({ ...p, isCurrentTurn: i === nextIdx })),
        phase: 'playing',
        pendingPaymentCost: 0
      };
    });
  }, []);

  const moveCurrentPlayer = useCallback((steps: number) => {
    setState(s => {
      const cp = s.players[s.currentPlayerIndex];
      const newPos = Math.min(cp.position + steps, s.board.length - 1);
      const tile = s.board[newPos];
      
      const newPlayers = [...s.players];
      newPlayers[s.currentPlayerIndex] = { ...cp, position: newPos };
      
      let nextPhase = s.phase;
      let pendingCost = 0;
      let newBalance = cp.balance;

      if (newPos === s.board.length - 1) {
        nextPhase = 'finished';
      } else if (tile.type === 'bonus') {
        newBalance += Math.abs(tile.ccdCost); // bonus is negative cost
        // auto-apply bonus
        newPlayers[s.currentPlayerIndex].balance = newBalance;
      } else if (tile.paymentOptions && tile.paymentOptions.length > 0) {
        nextPhase = 'decision';
        pendingCost = tile.ccdCost;
      } else if (tile.ccdCost > 0) {
        // forced cost
        newBalance -= tile.ccdCost;
        newPlayers[s.currentPlayerIndex].balance = newBalance;
      }

      return {
        ...s,
        players: newPlayers,
        phase: nextPhase,
        pendingPaymentCost: pendingCost
      };
    });
  }, []);

  const processPayment = useCallback((method: 'bank' | 'blockchain') => {
    setState(s => {
      const cp = s.players[s.currentPlayerIndex];
      const cost = s.pendingPaymentCost;
      let finalCost = cost;
      
      if (method === 'bank') {
        finalCost += 5; // bank fee
        addEvent(`🏦 ${cp.name} usou o Banco e pagou taxa extra. Total: ${finalCost} CCD. (Atraso: 2 dias)`, 'loss', cp.name);
      } else {
        addEvent(`🔗 ${cp.name} usou Blockchain! Pagou exatos ${finalCost} CCD. Transação imediata!`, 'gain', cp.name);
      }

      const newPlayers = [...s.players];
      newPlayers[s.currentPlayerIndex] = { ...cp, balance: cp.balance - finalCost };

      return { ...s, players: newPlayers };
    });
    nextTurn();
  }, [addEvent, nextTurn]);

  const drawCard = useCallback(() => {
    const card = SURPRISE_CARDS[Math.floor(Math.random() * SURPRISE_CARDS.length)];
    setState(s => {
      const cp = s.players[s.currentPlayerIndex];
      const newPlayers = [...s.players];
      newPlayers[s.currentPlayerIndex] = { ...cp, balance: cp.balance + card.effect };
      return { ...s, currentCard: card, players: newPlayers };
    });
    const cp = state.players[state.currentPlayerIndex];
    addEvent(`🃏 ${cp.name} tirou carta: "${card.title}" (${card.effect > 0 ? '+' : ''}${card.effect} CCD)`, card.effect >= 0 ? 'gain' : 'loss', cp.name);
  }, [state.players, state.currentPlayerIndex, addEvent]);

  const resetGame = useCallback(() => {
    setState({
      players: INITIAL_PLAYERS.map(p => ({...p, balance: 100, position: 0})),
      currentPlayerIndex: 0,
      board: INITIAL_BOARD,
      eventLog: [{ id: 'init2', timestamp: new Date().toLocaleTimeString(), message: 'Partida reiniciada!', type: 'info' }],
      currentCard: null,
      gameTime: 0,
      phase: 'playing',
      pendingPaymentCost: 0
    });
  }, []);

  return {
    state,
    currentPlayer: state.players[state.currentPlayerIndex],
    actions: {
      moveCurrentPlayer,
      processPayment,
      drawCard,
      nextTurn,
      resetGame,
      addEvent
    }
  };
}
