# CLAUDE.md — O Mundo Cripto do Careco

## Visão Geral do Projeto

Simulador educacional multiplayer (WebSockets) que ensina a diferença entre **Sistema Bancário Tradicional** e **Tecnologia Blockchain** por meio de um jogo de tabuleiro virtual para sala de aula.

**Arquitetura:** Servidor Autoritário — todas as regras de negócio, saldos, rolagens e tempo global vivem no backend.

---

## Stack

- **Backend:** Node.js (ESModules), Express, Socket.IO
- **Frontend:** Vanilla JS, HTML5, CSS3 — **sem React, sem Vue, sem frameworks**
- **Comunicação:** 100% eventos Socket.IO — **sem REST API**

---

## Estrutura de Pastas

```
├── package.json          (type: "module")
├── public/
│   ├── index.html        UI do Lobby, Tabuleiro e Filas em Tempo Real
│   └── app.js            Lógica do cliente: emissão de sockets, renderização DOM
└── server/
    ├── server.js         Ponto de entrada: Express + HTTP + Socket.IO
    └── src/
        ├── gameEngine.js   Regras, simHash/PoW, Relógio Global (setInterval), estado das salas
        └── socketHandler.js  Listeners: conecta app.js ↔ gameEngine.js
```

---

## Núcleo Didático — Não Alterar Sem Cuidado

### `gameEngine.js`
- **`simHash()`** — função de hash determinística que simula SHA-256. É a base do aprendizado de PoW.
- **`mineAsync()`** — mineração assíncrona com yield a cada 500 iterações para não travar o event loop.
- **`setInterval` (Relógio Global)** — processa `bankTxs` a cada 1s: avança estágio do banco com 30% de chance, aplica decaimento de 1 CCD/s no saldo do jogador enquanto a transação bancária está pendente.
- **`BANK_STAGES`** — `["Solicitação", "Caixa", "Gerente", "Compliance", "BACEN/SPB", "Liquidado"]` (índices 0–5).
- **`DIFF = 2`** — dificuldade do PoW (hash deve começar com `"00"`).

### Fluxo de Pagamento
| Via | Custo extra | Tempo | Risco |
|-----|-------------|-------|-------|
| Banco | 5 CCD taxa + 1 CCD/s decaimento | Lento (Relógio Global) | Recusa com ~5% por estágio |
| Blockchain | 2 CCD gas fee | Rápido (mineração async) | Nenhum |

---

## Convenções de Código

- Manter `ESModules` (`import`/`export`) em todo o servidor.
- Eventos Socket.IO nomeados em **camelCase** (ex: `gameStateUpdate`, `blockMined`).
- Estado global das salas vive exclusivamente em `rooms` (Map) dentro de `gameEngine.js`.
- O cliente nunca calcula saldo, posição ou resultado de dados — apenas renderiza o que o servidor envia.

---

## Fases Implementadas

| Fase | Status | Descrição |
|------|--------|-----------|
| 1–2 | ✅ | Lobby, criação/entrada em sala |
| 3 | ✅ | Tabuleiro 20 casas, movimento de avatares |
| 4 | ✅ | Sistema de pagamento Banco vs Blockchain |
| 5 | ✅ | Relógio Global, decaimento bancário, mineração PoW |
| 6a | ✅ | Visualização das Filas em Tempo Real (Banco + Mempool) |

---

## Próximas Fases

- **6b — Cartas Surpresa:** A lógica no `gameEngine.js` já sorteia e aplica `CARDS`. Falta exibir um modal/overlay didático no cliente ao invés de `alert()`.
- **7 — Condição de Vitória:** Emitir `gameOver` quando todos chegarem à casa 19 ou após X minutos; exibir ranking final.
- **8 — Tela do Professor:** Visão consolidada de todos os jogadores, saldos e histórico de blocos para projetar em sala.

---

## Eventos Socket.IO

### Cliente → Servidor
| Evento | Payload | Descrição |
|--------|---------|-----------|
| `createRoom` | `roomId` | Professor cria sala |
| `joinRoom` | `{ roomId, playerName }` | Aluno entra |
| `startGame` | `roomId` | Professor inicia |
| `rollDice` | `roomId` | Aluno rola dado |
| `payViaBank` | `roomId` | Escolhe pagamento bancário |
| `payViaBlockchain` | `roomId` | Escolhe pagamento blockchain |

### Servidor → Cliente (broadcast)
| Evento | Descrição |
|--------|-----------|
| `gameStarted` | Jogo iniciado; inclui `blocks` (genesis) |
| `playerMoved` | Jogador moveu; inclui `players`, `space`, `card` |
| `gameStateUpdate` | Tick do Relógio; inclui `players`, `bankTxs`, `globalTime` |
| `miningProgress` | Progresso PoW; inclui `playerId`, `nonce` |
| `blockMined` | Bloco confirmado; inclui `block`, `blocks`, `players` |
| `playerJoined` | Novo jogador; inclui `players` |
| `playerLeft` | Saída; inclui `players` |

---

## Regras para a IA

1. **Não migrar para React/Vue** — frontend permanece Vanilla JS.
2. **Não converter para REST** — comunicação é exclusivamente Socket.IO.
3. **Preservar `simHash`, `mineAsync` e o `setInterval` do Relógio Global** — são o coração didático.
4. **Não alterar `BANK_STAGES`** sem atualizar também o array em `app.js` (renderBankQueue).
5. Antes de modificar qualquer arquivo, ler o conteúdo atual.
