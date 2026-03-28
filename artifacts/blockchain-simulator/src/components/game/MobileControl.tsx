import { Player, GamePhase } from "@/hooks/game-types";
import { MiningProgress } from "@/hooks/use-socket-game";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Banknote, Link, Clock, Cpu } from "lucide-react";

interface MobileControlProps {
  player: Player;
  phase: GamePhase;
  pendingCost: number;
  bankSecondsLeft: number;
  miningProgress: MiningProgress;
  lastPowResult: { hash: string; nonce: number } | null;
  isMyTurn: boolean;
  onRollDice: () => void;
  onPayBank: () => void;
  onPayBlockchain: () => void;
}

const DiceIcon = ({ val, className }: { val: number; className: string }) => {
  const icons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
  const Icon = icons[(val - 1) % 6] ?? Dice1;
  return <Icon className={className} />;
};

export function MobileControl({
  player, phase, pendingCost, bankSecondsLeft, miningProgress,
  lastPowResult, isMyTurn, onRollDice, onPayBank, onPayBlockchain,
}: MobileControlProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [diceValue, setDiceValue] = useState(1);

  const handleRoll = () => {
    if (!isMyTurn || isRolling) return;
    setIsRolling(true);
    let rolls = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls > 12) {
        clearInterval(interval);
        setIsRolling(false);
        onRollDice();
      }
    }, 80);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
      <div className="w-[300px] h-[580px] bg-zinc-950 rounded-[2.5rem] border-[7px] border-zinc-800 shadow-[0_0_60px_rgba(0,0,0,0.8)] relative overflow-hidden pointer-events-auto ring-2 ring-zinc-900/50">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-zinc-800 rounded-b-2xl z-20" />

        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-[hsl(240,15%,8%)] flex flex-col">
          {/* Status bar */}
          <div className="h-7 flex justify-between items-center px-5 text-[10px] text-zinc-400 font-bold z-30 mt-1">
            <span>9:41</span>
            <div className="flex items-center gap-1">📶 🔋 <span>100%</span></div>
          </div>

          <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
            {/* Player Header */}
            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
              <div className="text-3xl bg-white/5 p-1.5 rounded-xl border border-white/10">{player.avatar}</div>
              <div>
                <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Seu App</div>
                <div className="text-base font-display text-white">{player.name}</div>
              </div>
              {!isMyTurn && (
                <div className="ml-auto text-[10px] bg-zinc-700 text-zinc-300 px-2 py-1 rounded-full">Aguardando</div>
              )}
            </div>

            {/* Balance */}
            <div className="bg-gradient-to-br from-primary/25 to-primary/5 rounded-2xl p-4 border border-primary/30 text-center relative overflow-hidden">
              <div className="text-[10px] text-primary uppercase font-bold tracking-widest mb-1">Saldo Digital</div>
              <div className="text-4xl font-display text-primary text-glow-primary flex items-center justify-center gap-1">
                <span className="text-2xl">💰</span>
                <motion.span key={player.balance} initial={{ scale: 1.3 }} animate={{ scale: 1 }}>{player.balance}</motion.span>
              </div>
              <div className="text-[10px] text-primary/60 mt-0.5">CCD (Cripto Careco Dollars)</div>
            </div>

            {/* Interactive Area */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">

                {/* PLAYING → Roll dice */}
                {(phase === "playing") && (
                  <motion.div key="playing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="w-full flex flex-col items-center gap-4"
                  >
                    <motion.div
                      className="text-primary bg-primary/10 p-5 rounded-3xl border-2 border-primary/30 cursor-pointer"
                      animate={isRolling ? { rotate: [0, 90, 180, 270, 360], scale: [1, 1.1, 1] } : { rotate: 0 }}
                      transition={{ duration: 0.2, repeat: isRolling ? Infinity : 0 }}
                      onClick={handleRoll}
                    >
                      <DiceIcon val={diceValue} className="w-14 h-14" />
                    </motion.div>

                    <Button
                      size="lg"
                      onClick={handleRoll}
                      disabled={isRolling || !isMyTurn}
                      className={`w-full h-14 text-lg font-display rounded-2xl transition-all ${
                        isMyTurn
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(255,200,0,0.3)]"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      }`}
                    >
                      {isRolling ? "🎲 Rolando..." : isMyTurn ? "🎲 ROLAR DADO" : "⏳ Aguarde sua vez"}
                    </Button>
                  </motion.div>
                )}

                {/* DECISION → Choose payment */}
                {phase === "decision" && (
                  <motion.div key="decision" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="w-full flex flex-col gap-3 bg-black/30 p-4 rounded-3xl border border-destructive/40"
                  >
                    <div className="text-center">
                      <div className="text-base font-bold text-white">💳 Pagamento Necessário</div>
                      <div className="text-2xl font-display text-destructive mt-0.5">-{pendingCost} CCD</div>
                      <div className="text-[10px] text-zinc-400 mt-1">Como deseja pagar?</div>
                    </div>

                    {/* Bank button — shows extra cost warning */}
                    <button
                      onClick={onPayBank}
                      disabled={!isMyTurn}
                      className="w-full rounded-xl bg-blue-700 hover:bg-blue-600 text-white p-3 flex items-center gap-3 disabled:opacity-40 transition-all text-left"
                    >
                      <div className="bg-white/20 p-2 rounded-lg flex-shrink-0"><Banknote className="w-5 h-5" /></div>
                      <div className="flex-1">
                        <div className="font-bold text-sm">🏦 Banco Tradicional</div>
                        <div className="text-[10px] text-blue-200 leading-tight">+5 CCD taxa + 1 CCD/s por 5s de atraso</div>
                        <div className="text-[10px] text-red-300 font-bold">Total extra: até 10 CCD a mais!</div>
                      </div>
                    </button>

                    {/* Blockchain button — exact cost */}
                    <button
                      onClick={onPayBlockchain}
                      disabled={!isMyTurn}
                      className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground p-3 flex items-center gap-3 disabled:opacity-40 transition-all text-left"
                    >
                      <div className="bg-black/20 p-2 rounded-lg flex-shrink-0"><Link className="w-5 h-5" /></div>
                      <div className="flex-1">
                        <div className="font-bold text-sm">⛏️ Via Blockchain</div>
                        <div className="text-[10px] text-primary-foreground/80 leading-tight">Exatos {pendingCost} CCD • Sem taxas</div>
                        <div className="text-[10px] text-green-300 font-bold">Requer Proof of Work!</div>
                      </div>
                    </button>
                  </motion.div>
                )}

                {/* BANK PROCESSING → Show decay timer */}
                {phase === "bank_processing" && (
                  <motion.div key="bank" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="w-full flex flex-col items-center gap-3 bg-blue-950/50 p-5 rounded-3xl border border-blue-500/40"
                  >
                    <Clock className="w-10 h-10 text-blue-400 animate-pulse" />
                    <div className="text-center">
                      <div className="font-bold text-blue-200">🏦 Banco Processando...</div>
                      <div className="text-3xl font-display text-blue-400 mt-1">{bankSecondsLeft}s</div>
                      <div className="text-[10px] text-blue-300 mt-1">-1 CCD por segundo de atraso</div>
                    </div>
                    <div className="w-full bg-blue-900/50 rounded-full h-2">
                      <motion.div
                        className="bg-blue-400 h-2 rounded-full"
                        initial={{ width: "100%" }}
                        animate={{ width: `${(bankSecondsLeft / 5) * 100}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                    <div className="text-[10px] text-blue-200/60 italic text-center">
                      Enquanto isso, a Blockchain já teria concluído...
                    </div>
                  </motion.div>
                )}

                {/* BLOCKCHAIN MINING → Show PoW progress */}
                {phase === "blockchain_mining" && (
                  <motion.div key="mining" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="w-full flex flex-col items-center gap-3 bg-primary/10 p-4 rounded-3xl border border-primary/40"
                  >
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <Cpu className="w-10 h-10 text-primary" />
                    </motion.div>
                    <div className="text-center">
                      <div className="font-bold text-primary">⛏️ Minerando...</div>
                      {miningProgress.isMining ? (
                        <>
                          <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                            Nonce: <span className="text-primary">{miningProgress.nonce.toLocaleString()}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 font-mono break-all">
                            Hash: {miningProgress.currentHash.substring(0, 16)}...
                          </div>
                        </>
                      ) : (
                        <div className="text-[10px] text-primary/70 mt-1">Enviando solução ao servidor...</div>
                      )}
                    </div>
                    <div className="text-[10px] text-primary/50 italic text-center">
                      Procurando hash com zeros iniciais (dificuldade: 2)
                    </div>
                  </motion.div>
                )}

                {/* FINISHED */}
                {phase === "finished" && (
                  <motion.div key="finished" initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
                    <div className="text-5xl mb-3">🏆</div>
                    <h3 className="text-xl font-display text-primary">Fim de Jogo!</h3>
                    <p className="text-xs text-muted-foreground mt-1">Saldo final: {player.balance} CCD</p>
                  </motion.div>
                )}

              </AnimatePresence>

              {/* PoW success toast */}
              <AnimatePresence>
                {lastPowResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mt-3 w-full bg-green-900/50 border border-green-500/40 rounded-xl p-2 text-center"
                  >
                    <div className="text-[10px] text-green-400 font-bold">✅ Bloco Minerado!</div>
                    <div className="font-mono text-[9px] text-green-300 break-all">
                      {lastPowResult.hash.substring(0, 20)}...
                    </div>
                    <div className="text-[9px] text-green-400/70">Nonce: {lastPowResult.nonce}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
