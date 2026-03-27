import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Importa os manipuladores de eventos do nosso jogo (Fase 2 e 3)
import { setupSocketHandlers } from './src/socketHandler.js';

// Configuração para resolver caminhos de pastas usando ES Modules (import)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializa o Express e o Servidor HTTP
const app = express();
const server = http.createServer(app);

// Inicializa o Socket.IO acoplado ao Servidor HTTP
const io = new Server(server);

// ─── A MÁGICA DE SERVIR O FRONTEND ───────────────────────────────────────
// Dizemos ao Express: "Tudo que estiver na pasta '../public', entregue para o navegador!"
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// Se alguém acessar a raiz do site (http://localhost:3000/), envia o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// ─── LIGAÇÃO DO MOTOR DO JOGO ────────────────────────────────────────────
// Passamos o 'io' para o nosso arquivo que gerencia as regras e conexões
setupSocketHandlers(io);

// ─── INICIANDO O SERVIDOR ────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════');
  console.log(`🚀 Servidor rodando com sucesso!`);
  console.log(`🌐 Acesse o jogo no seu navegador: http://localhost:${PORT}`);
  console.log('═══════════════════════════════════════════════════');
});
