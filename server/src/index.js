import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupSocketHandlers } from './socketHandler.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Configuração do Socket.io com CORS habilitado para o frontend (Vite)
const io = new Server(server, {
  cors: {
    origin: "*", // Em produção, colocar a URL exata do frontend
    methods: ["GET", "POST"]
  }
});

// Inicializa os manipuladores de eventos do Socket
setupSocketHandlers(io);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🎮 Motor Educacional: Blockchain vs Banco Tradicional`);
});
