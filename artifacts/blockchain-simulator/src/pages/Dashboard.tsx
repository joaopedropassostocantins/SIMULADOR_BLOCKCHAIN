import { useState } from "react";
import { useSocketGame } from "@/hooks/use-socket-game";
import { BoardGame } from "@/components/game/BoardGame";
import { ScoreTable } from "@/components/game/ScoreTable";
import { SurpriseCardDeck } from "@/components/game/SurpriseCardDeck";
import { EventLog } from "@/components/game/EventLog";
import { MobileControl } from "@/components/game/MobileControl";
import { QrCode, RotateCcw, Clock, Banana, Wifi, WifiOff, Users, Play, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const AVATARS = ["👩🍌", "👦🍌", "🧔🍌", "👧🍌", "👴🍌", "👩‍🦱🍌", "🧑‍🎓🍌", "👨‍🏫🍌"];

// ── Lobby Screen ──────────────────────────────────────────────────────────────
function LobbyScreen({ onCreateRoom, onJoinRoom, connectionStatus, error }: {
  onCreateRoom: (name: string, avatar: string) => void;
  onJoinRoom: (code: string, name: string, avatar: string) => void;
  connectionStatus: string;
  error: string | null;
}) {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4 animate-bounce">🍌</div>
          <h1 className="text-4xl font-display text-primary text-glow-primary mb-2">Blockchain vs Banco</h1>
          <p className="text-muted-foreground text-sm">O Mundo Cripto do Careco | Prof. João Pedro</p>

          <div className={`mt-4 inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full border ${
            connectionStatus === "connected" ? "border-green-500/50 text-green-400 bg-green-500/10" :
            connectionStatus === "connecting" ? "border-yellow-500/50 text-yellow-400 bg-yellow-500/10" :
            "border-red-500/50 text-red-400 bg-red-500/10"
          }`}>
            {connectionStatus === "connected" ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connectionStatus === "connected" ? "Servidor conectado" : connectionStatus === "connecting" ? "Conectando..." : "Sem conexão"}
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-xl bg-destructive/20 border border-destructive/50 text-destructive text-sm text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode Choose */}
        {mode === "choose" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-3xl p-8 space-y-4">
            <button
              onClick={() => setMode("create")}
              className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-display text-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Users className="w-6 h-6" /> Criar Sala (Professor)
            </button>
            <button
              onClick={() => setMode("join")}
              className="w-full h-16 bg-secondary hover:bg-secondary/90 text-white rounded-2xl font-display text-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
            >
              <LogIn className="w-6 h-6" /> Entrar na Sala (Aluno)
            </button>
          </motion.div>
        )}

        {/* Create Room */}
        {mode === "create" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-3xl p-8 space-y-5">
            <h2 className="font-display text-2xl text-center text-primary">Nova Sala</h2>

            <div>
              <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block">Seu Nome</label>
              <input
                className="w-full bg-background/60 border border-border rounded-xl px-4 py-3 text-foreground text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Prof. João Pedro"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && name.trim() && onCreateRoom(name.trim(), avatar)}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block">Avatar</label>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map(a => (
                  <button key={a} onClick={() => setAvatar(a)}
                    className={`text-2xl w-12 h-12 rounded-xl transition-all ${avatar === a ? "bg-primary/30 ring-2 ring-primary scale-110" : "bg-background/40 hover:bg-primary/10"}`}
                  >{a}</button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setMode("choose")} className="flex-1 h-12 bg-muted rounded-xl text-muted-foreground hover:bg-muted/80 transition-all">Voltar</button>
              <button
                onClick={() => name.trim() && onCreateRoom(name.trim(), avatar)}
                disabled={!name.trim() || connectionStatus !== "connected"}
                className="flex-1 h-12 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                Criar 🍌
              </button>
            </div>
          </motion.div>
        )}

        {/* Join Room */}
        {mode === "join" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-3xl p-8 space-y-5">
            <h2 className="font-display text-2xl text-center text-secondary-foreground">Entrar na Sala</h2>

            <div>
              <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block">Código da Sala</label>
              <input
                className="w-full bg-background/60 border border-border rounded-xl px-4 py-3 text-foreground text-2xl font-mono text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-secondary uppercase"
                placeholder="BANANA123"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                maxLength={8}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block">Seu Nome</label>
              <input
                className="w-full bg-background/60 border border-border rounded-xl px-4 py-3 text-foreground text-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="Maria"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block">Avatar</label>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map(a => (
                  <button key={a} onClick={() => setAvatar(a)}
                    className={`text-2xl w-12 h-12 rounded-xl transition-all ${avatar === a ? "bg-secondary/30 ring-2 ring-secondary scale-110" : "bg-background/40 hover:bg-secondary/10"}`}
                  >{a}</button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setMode("choose")} className="flex-1 h-12 bg-muted rounded-xl text-muted-foreground hover:bg-muted/80 transition-all">Voltar</button>
              <button
                onClick={() => code.trim() && name.trim() && onJoinRoom(code.trim(), name.trim(), avatar)}
                disabled={!code.trim() || !name.trim() || connectionStatus !== "connected"}
                className="flex-1 h-12 bg-secondary text-white rounded-xl font-bold hover:bg-secondary/90 disabled:opacity-50 transition-all"
              >
                Entrar 🍌
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ── Waiting Room ──────────────────────────────────────────────────────────────
function WaitingRoom({ roomCode, players, isProfessor, onStart, connectionStatus }: {
  roomCode: string; players: { name: string; avatar: string; isProfessor: boolean }[];
  isProfessor: boolean; onStart: () => void; connectionStatus: string;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-lg glass-panel rounded-3xl p-10">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🍌</div>
          <h1 className="font-display text-3xl text-primary text-glow-primary">Sala de Espera</h1>
          <div className="mt-4 bg-background/60 rounded-2xl p-4 border border-primary/30">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Código da Sala</p>
            <p className="font-mono text-4xl text-primary tracking-[0.3em]">{roomCode}</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider mb-3">
            Jogadores ({players.length}/6)
          </p>
          <div className="space-y-2">
            {players.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 bg-background/40 rounded-xl p-3 border border-border/50"
              >
                <span className="text-2xl">{p.avatar}</span>
                <span className="font-bold">{p.name}</span>
                {p.isProfessor && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-auto">Professor</span>}
              </motion.div>
            ))}
          </div>
        </div>

        {isProfessor ? (
          <button
            onClick={onStart}
            disabled={players.length < 2 || connectionStatus !== "connected"}
            className="w-full h-16 bg-primary text-primary-foreground rounded-2xl font-display text-2xl flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-primary/90 transition-all"
          >
            <Play className="w-7 h-7" /> ⛏️ Minerar Bloco Genesis!
          </button>
        ) : (
          <div className="text-center text-muted-foreground animate-pulse">
            Aguardando o professor iniciar a partida...
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Game Screen ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const { state, currentPlayer, isMyTurn, actions } = useSocketGame();
  const { roomCode, roomState, connectionStatus, serverError, lastDiceRoll, bankSecondsLeft, miningProgress, lastPowResult } = state;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Show lobby if no room yet
  if (!roomCode || !roomState) {
    return (
      <LobbyScreen
        onCreateRoom={actions.createRoom}
        onJoinRoom={actions.joinRoom}
        connectionStatus={connectionStatus}
        error={serverError}
      />
    );
  }

  // Show waiting room if in lobby phase
  if (roomState.phase === "lobby") {
    return (
      <WaitingRoom
        roomCode={roomCode}
        players={roomState.players}
        isProfessor={currentPlayer?.isProfessor ?? false}
        onStart={actions.startGame}
        connectionStatus={connectionStatus}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden font-sans">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      {/* Error Toast */}
      <AnimatePresence>
        {serverError && (
          <motion.div
            initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-destructive text-white px-6 py-3 rounded-xl shadow-xl text-sm font-bold"
          >
            ⚠️ {serverError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="relative z-10 glass-panel border-b border-border/50 py-3 px-6 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 p-2.5 rounded-2xl border-2 border-primary/50">
            <Banana className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold text-white text-glow-primary flex items-center gap-2">
              Blockchain vs Banco Tradicional
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase tracking-wider">O Jogo</span>
            </h1>
            <p className="text-muted-foreground text-xs font-bold tracking-wide">
              O Mundo Cripto do Careco e as Bananas Digitais | Prof. João Pedro
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Room code badge */}
          <div className="hidden md:block text-center bg-background/60 px-3 py-1.5 rounded-xl border border-border">
            <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Sala</div>
            <div className="font-mono text-sm text-primary font-bold">{roomCode}</div>
          </div>

          <div className="flex items-center gap-2 bg-background/60 px-4 py-2 rounded-xl border border-border">
            <Clock className="w-4 h-4 text-primary animate-pulse" />
            <div>
              <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest leading-none mb-0.5">Partida</div>
              <div className="font-display text-lg leading-none text-white">{formatTime(roomState.gameTime)}</div>
            </div>
          </div>

          {currentPlayer?.isProfessor && (
            <Button variant="outline" size="icon" onClick={actions.rollDice /* reset placeholder */}
              title="Reiniciar Jogo" className="rounded-xl border-border/50 hover:bg-destructive/20 hover:text-destructive"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 relative z-10 p-4 flex gap-4 max-w-[1920px] mx-auto w-full">

        {/* LEFT */}
        <div className="w-1/4 flex flex-col gap-4">
          <div className="flex-1">
            <SurpriseCardDeck
              currentCard={roomState.currentCard}
              onDraw={actions.drawCard}
              disabled={!isMyTurn || roomState.phase !== "playing"}
            />
          </div>

          {/* QR Code */}
          <div className="h-40 glass-panel rounded-2xl p-4 flex items-center gap-4">
            <div className="w-24 h-24 bg-white rounded-xl p-1.5 flex items-center justify-center flex-shrink-0">
              <QrCode className="w-full h-full text-black" />
            </div>
            <div>
              <div className="inline-block bg-primary/20 text-primary border border-primary/30 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded mb-1.5">
                Join Game
              </div>
              <h3 className="font-display text-base leading-tight mb-1">ESCANEIE PARA ENTRAR</h3>
              <p className="text-xs font-mono text-muted-foreground bg-background/50 px-2 py-0.5 rounded">{roomCode}</p>
            </div>
          </div>
        </div>

        {/* CENTER */}
        <div className="w-2/4">
          <BoardGame board={roomState.board} players={roomState.players} lastDiceRoll={lastDiceRoll} />
        </div>

        {/* RIGHT */}
        <div className="w-1/4">
          <ScoreTable players={roomState.players} />
        </div>
      </main>

      {/* FOOTER */}
      <footer className="h-44 p-4 pt-0 relative z-10 max-w-[1920px] mx-auto w-full">
        <EventLog events={roomState.eventLog} />
      </footer>

      {/* MOBILE CONTROL */}
      {currentPlayer && (
        <MobileControl
          player={currentPlayer}
          phase={roomState.phase}
          pendingCost={roomState.pendingPaymentCost}
          bankSecondsLeft={bankSecondsLeft}
          miningProgress={miningProgress}
          lastPowResult={lastPowResult}
          isMyTurn={isMyTurn}
          onRollDice={actions.rollDice}
          onPayBank={actions.payViaBank}
          onPayBlockchain={actions.payViaBlockchain}
        />
      )}
    </div>
  );
}
