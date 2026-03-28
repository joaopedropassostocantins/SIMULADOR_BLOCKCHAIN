import { useGameState } from "@/hooks/use-game-state";
import { BoardGame } from "@/components/game/BoardGame";
import { ScoreTable } from "@/components/game/ScoreTable";
import { SurpriseCardDeck } from "@/components/game/SurpriseCardDeck";
import { EventLog } from "@/components/game/EventLog";
import { MobileControl } from "@/components/game/MobileControl";
import { QrCode, RotateCcw, Clock, Banana } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { state, currentPlayer, actions } = useGameState();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden font-sans">
      
      {/* Background Animated Elements */}
      <div className="absolute inset-0 bg-pattern-stars pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER */}
      <header className="relative z-10 glass-panel border-b border-border/50 py-4 px-8 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 p-3 rounded-2xl border-2 border-primary/50 coin-spin">
            <Banana className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white text-glow-primary flex items-center gap-2">
              Blockchain vs Banco Tradicional 
              <span className="text-sm bg-primary text-primary-foreground px-2 py-1 rounded-full uppercase tracking-wider ml-2">
                O Jogo
              </span>
            </h1>
            <p className="text-muted-foreground text-sm font-bold tracking-wide">
              O Mundo Cripto do Careco e as Bananas Digitais | Prof. João Pedro
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-background/60 px-4 py-2 rounded-xl border border-border">
            <Clock className="w-5 h-5 text-primary animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none mb-1">Tempo de Partida</span>
              <span className="font-display text-xl leading-none text-white">{formatTime(state.gameTime)}</span>
            </div>
          </div>
          
          <Button variant="outline" size="icon" onClick={actions.resetGame} title="Reiniciar Jogo" className="rounded-xl border-border/50 hover:bg-destructive/20 hover:text-destructive hover:border-destructive/50 transition-colors">
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="flex-1 relative z-10 p-6 flex gap-6 max-w-[1920px] mx-auto w-full">
        
        {/* LEFT COLUMN (25%) */}
        <div className="w-1/4 flex flex-col gap-6">
          
          <div className="flex-1">
            <SurpriseCardDeck 
              currentCard={state.currentCard} 
              onDraw={actions.drawCard}
              disabled={state.phase !== 'playing' || !currentPlayer.isCurrentTurn}
            />
          </div>

          <div className="h-48 glass-panel rounded-2xl p-5 flex items-center gap-6">
            <div className="w-32 h-32 bg-white rounded-xl p-2 flex flex-col items-center justify-center gap-2 relative">
              <QrCode className="w-24 h-24 text-black" />
              {/* Fake QR pattern */}
              <div className="absolute inset-2 grid grid-cols-4 grid-rows-4 gap-1 opacity-50 pointer-events-none">
                 {[...Array(16)].map((_, i) => (
                   <div key={i} className={`bg-black rounded-sm ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-0'}`} />
                 ))}
              </div>
            </div>
            <div className="flex-1">
              <div className="inline-block bg-primary/20 text-primary border border-primary/30 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded mb-2">
                Join Game
              </div>
              <h3 className="font-display text-xl leading-tight mb-1">ESCANEIE PARA ENTRAR</h3>
              <p className="text-sm font-mono text-muted-foreground bg-background/50 px-2 py-1 rounded inline-block">ROOM: BANANA123</p>
            </div>
          </div>

        </div>

        {/* CENTER COLUMN (50%) */}
        <div className="w-2/4">
          <BoardGame board={state.board} players={state.players} />
        </div>

        {/* RIGHT COLUMN (25%) */}
        <div className="w-1/4 flex flex-col gap-6">
          <div className="flex-1">
            <ScoreTable players={state.players} />
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="h-48 p-6 pt-0 relative z-10 max-w-[1920px] mx-auto w-full">
        <EventLog events={state.eventLog} />
      </footer>

      {/* INSET MOBILE */}
      <MobileControl 
        player={currentPlayer}
        phase={state.phase}
        pendingCost={state.pendingPaymentCost}
        onRollDice={actions.moveCurrentPlayer}
        onPay={actions.processPayment}
      />

    </div>
  );
}
