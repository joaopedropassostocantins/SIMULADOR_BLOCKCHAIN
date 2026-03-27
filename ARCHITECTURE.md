# Arquitetura do Sistema: Simulador Educacional Carecodólar (CCD)

Este documento descreve a arquitetura planejada para a transição do simulador estático (Single-Page Application) para um **Jogo de Tabuleiro Multiplayer Online em Tempo Real**.

## 1. Visão Geral da Arquitetura
O sistema adotará uma arquitetura Cliente-Servidor baseada em eventos (Event-Driven Architecture) para garantir sincronização em tempo real entre o painel do professor (Lobby/Tabuleiro Geral) e os dispositivos dos alunos (Controles/Jogadores).

## 2. Stack Tecnológica
* **Frontend (Cliente):** React.js (Vite/Create React App), `react-router-dom` para roteamento, `qrcode.react` para geração de convites.
* **Backend (Servidor):** Node.js com Express.js.
* **Comunicação Real-Time:** Socket.io (WebSockets).
* **Estado (Temporário):** Memória RAM do servidor (Map/Objetos em Node.js) para gerenciar as sessões ativas (não requer banco de dados persistente como PostgreSQL nesta fase).

## 3. Topologia e Componentes

A aplicação será dividida em três frentes principais de interação:

### A. Frontend: Painel do Professor (Tela Principal/Projetor)
* **Rota:** `/sala/:idSala`
* **Função:** Atua como o "Tabuleiro Físico" e o Lider da partida.
* **Responsabilidades:**
    * Gerar a sala e exibir o QR Code de entrada.
    * Renderizar o tabuleiro virtual e a posição dos peões (alunos).
    * Exibir o Log global (eventos surpresa, blocos minerados, atrasos bancários).
    * Apresentar o Ranking (pontuação/CCD) em tempo real.

### B. Frontend: Controle do Aluno (Mobile-First)
* **Rota:** `/jogar/:idSala`
* **Função:** Atua como o "Controle de Videogame" ou a "Mão de Cartas" do jogador.
* **Responsabilidades:**
    * Escanear o QR Code (via câmera ou link direto) e entrar na sala com um Nickname.
    * Visualizar saldo atual (100 pontos iniciais).
    * Ações de turno: "Rolar Dado", "Escolher via Banco", "Escolher via Blockchain".
    * Receber alertas individuais (Ex: "Seu banco bloqueou a transação").

### C. Backend: Motor do Jogo (O "Sistema" Automatizado)
* **Função:** Servidor central (Autoridade) que rege as regras, o Banco Central e o Protocolo Blockchain.
* **Responsabilidades:**
    * **Gerenciamento de Salas:** Criar, manter e destruir salas (Rooms via Socket.io).
    * **Máquina de Estado:** Manter o placar, a posição de cada jogador no tabuleiro e de quem é a vez.
    * **Motor Bancário (NPC):** Calcular probabilidade de atraso (Caixa, Gerente, Compliance), aplicar taxas e descontar pontos por tempo (Decaimento).
    * **Motor Blockchain (NPC):** Simular o tempo de mineração (PoW), cobrar o *gas fee* e registrar a transação no ledger em memória.
    * **Event-Spawner (Cartas Surpresa):** Sortear eventos aleatórios quando um jogador cai em casas específicas.

## 4. Fluxo de Dados (Data Flow) - Exemplo de Turno

1.  **Ação (Aluno):** Aluno aperta "Transferir via Banco" no celular. Cliente emite evento Socket: `socket.emit('acao_turno', { tipo: 'banco', valor: 10 })`.
2.  **Processamento (Backend):** * Servidor recebe a ação.
    * Rola dados virtuais de Dificuldade/Compliance.
    * Calcula o custo em pontos/tempo.
    * Atualiza o saldo do jogador no Estado Global.
3.  **Sincronização (Emissão):**
    * Servidor emite `socket.emit('estado_atualizado', novoEstado)` para toda a sala.
    * Servidor emite `socket.emit('evento_log', 'Transação retida no Compliance!')` para o Projetor.
4.  **Reatividade (Frontend):** O projetor anima o peão e atualiza o ranking; o celular do aluno atualiza o saldo e passa o turno.
