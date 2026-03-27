# 🏦 Blockchain vs Banco Tradicional: O Jogo de Tabuleiro Virtual

Uma simulação educacional multiplayer online para ensino prático sobre criptoeconomia, descentralização, intermediários financeiros e tecnologia blockchain. Projetado para uso em sala de aula (Professor + Celulares dos Alunos).

## 📖 Sobre o Projeto

Compreender a diferença entre o Sistema Financeiro Nacional (centralizado, dependente de confiança, sujeito a censura e atrasos) e a rede Blockchain (descentralizada, *trustless*, imutável e com taxas variáveis) pode ser abstrato apenas na teoria. 

Este projeto transforma esses conceitos em um **Jogo de Tabuleiro Multiplayer Online**. 
Cada aluno inicia com 100 pontos (Carecodólares - CCD) e um objetivo. Ao longo do tabuleiro, eles precisam tomar decisões financeiras reais: usar o caminho bancário tradicional (com NPCs automatizados de Gerente, BACEN e Compliance) ou o protocolo Blockchain (com cálculos de *Proof of Work* e *Gas Fees*). 

O sistema pune a lentidão do banco e os custos da rede em tempo real, gerando discussões pedagógicas sobre os prós e contras de cada modelo jurídico e tecnológico.

## ✨ Funcionalidades Principais (Visão de Produto)

* **🕹️ Multiplayer Assíncrono:** O professor cria a sala (via tela do projetor) e os alunos entram escaneando um QR Code, usando seus celulares como "controles" (Mobile-First).
* **🤖 "O Sistema" Automatizado:** Diferente de um Roleplay manual, o Backend atua como os intermediários. O Banco pode recusar transferências via Compliance (Lei 9.613/98) e a Blockchain exige mineração automática e cobrança de rede.
* **⏳ Fator Decaimento:** O tempo é dinheiro. Atrasos na liquidação (D+1, D+3 do sistema bancário) sangram os pontos do jogador em tempo real.
* **🃏 Cartas Surpresa e Eventos:** Simulação de riscos sistêmicos como "Ataque Hacker", "Esquecimento de Seed Phrase", "Feriado Bancário" ou "Aumento na taxa de Gas".
* **📊 Painel Comparativo:** O projetor exibe em tempo real quem está perdendo mais capital financeiro ou tempo de acordo com suas escolhas.

## 🛠️ Tecnologias Utilizadas

* **Frontend:** React.js, Vite
* **Backend & Tempo Real:** Node.js, Express, Socket.io
* **Estilização:** CSS-in-JS / Styled Modules

## 🚀 Como Executar Localmente (Ambiente de Desenvolvimento)

*(Aviso: O projeto está em transição da versão estática V1 para a versão Multiplayer V2. Estas instruções refletem a arquitetura final).*

### Pré-requisitos
* [Node.js](https://nodejs.org/) (versão 16 ou superior)
* Gerenciador de pacotes (npm ou yarn)

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git](https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git)
   cd SEU_REPOSITORIO
