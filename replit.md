# Workspace — Blockchain vs Banco Tradicional: O Jogo de Tabuleiro Virtual

## Overview

pnpm monorepo educativo com jogo de tabuleiro multiplayer em tempo real.
Tema: Bananas digitais e didática de Blockchain vs Sistema Bancário Tradicional.
Desenvolvido para o Prof. João Pedro para uso em sala de aula.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **TypeScript version**: 5.9
- **API framework**: Express 5 + Socket.IO (real-time multiplayer)
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion
- **Build**: esbuild (bundle de produção)

## Artifacts

### `artifacts/api-server` (`@workspace/api-server`)

Backend Express + Socket.IO. Roda na porta 8080, exposto em `/api`.

**IMPORTANTE**: O proxy do Replit NÃO remove o prefixo `/api`, então:
- Rotas Express: `/api/*` (correto)
- Socket.IO path: `/api/socket.io` (tanto no servidor quanto no cliente)

Ficheiros chave:
- `src/index.ts` — cria `httpServer` + `SocketIOServer`, escuta na `PORT`
- `src/app.ts` — Express com CORS, JSON, rotas em `/api`
- `src/lib/gameEngine.ts` — Motor do jogo (rooms, turnos, banco, blockchain PoW)
- `src/lib/socketHandler.ts` — Eventos Socket.IO
- `src/lib/logger.ts` — Pino logger

**Socket.IO path**: `/api/socket.io` (servidor e cliente devem usar o mesmo)
**Transports**: Apenas `polling` (WebSocket não funciona com o proxy do Replit para /api)

### `artifacts/blockchain-simulator` (`@workspace/blockchain-simulator`)

Frontend React + Vite. Exposto em `/` (raiz).

Ficheiros chave:
- `src/hooks/game-types.ts` — Types compartilhados (Player, BoardTile, RoomState, etc.)
- `src/hooks/use-socket-game.ts` — Hook principal: conecta ao Socket.IO, gerencia estado
- `src/pages/Dashboard.tsx` — Tela principal: Lobby → Sala de Espera → Jogo
- `src/components/game/BoardGame.tsx` — Tabuleiro serpentina com animação de peões
- `src/components/game/MobileControl.tsx` — Painel mobile com dado, banco, blockchain
- `src/components/game/ScoreTable.tsx` — Ranking de saldo CCD
- `src/components/game/SurpriseCardDeck.tsx` — Baralho de cartas surpresa
- `src/components/game/EventLog.tsx` — Log de eventos da partida
- `src/index.css` — Tema banana (dark, gold primary, purple secondary)

## Regras de Negócio Didáticas

### Banco Tradicional
- Custo base + 5 CCD de taxa imediata
- Depois: -1 CCD/segundo por 5 segundos (corrosão por atraso)
- Total extra vs Blockchain: até 10 CCD

### Blockchain (Proof of Work)
- Custo exato, sem taxa
- Cliente minera nonce no browser (SHA-256 com `crypto.subtle`)
- Dificuldade: hash deve começar com "00"
- Servidor verifica hash antes de confirmar a transação

## Fluxo Multiplayer

```
Professor:          create_room → room_created → waiting for players → start_game
Alunos:             join_room  → room_joined   → game_state_update
Todos (em jogo):    game_state_update em cada ação
                    bank_tick (a cada segundo do delay bancário)
                    pow_challenge → submit_pow_solution → pow_accepted
```

## Estrutura do Monorepo

```text
workspace/
├── artifacts/
│   ├── api-server/         # Express + Socket.IO backend
│   └── blockchain-simulator/ # React + Vite frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas
│   └── db/                 # Drizzle ORM (PostgreSQL)
├── scripts/                # Utility scripts
└── replit.md               # Este arquivo
```

## Instalação e Dev

```bash
# Backend
pnpm --filter @workspace/api-server run dev

# Frontend
pnpm --filter @workspace/blockchain-simulator run dev
```
