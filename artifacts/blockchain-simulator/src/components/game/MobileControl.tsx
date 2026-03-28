import { Player } from "@/hooks/game-types";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Banknote, Link } from "lucide-react";

interface MobileControlProps {
  player: Player;
  phase: 'playing' | 'decision' | 'finished' | 'waiting';
  pendingCost: number;
  onRollDice: (steps: number) => void;
  onPay: (method: 'bank' | 'blockchain') => void;
}

export function MobileControl({ player, phase, pendingCost, onRollDice, onPay }: MobileControlProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [diceValue, setDiceValue] = useState(1);

  const handleRoll = () => {
    setIsRolling(true);
    let rolls = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls > 10) {
        clearInterval(interval);
        const finalVal = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalVal);
        setIsRolling(false);
        setTimeout(() => onRollDice(finalVal), 600);
      }
    }, 100);
  };

  const getDiceIcon = (val: number) => {
    switch(val) {
      case 1: return <Dice1 className="w-16 h-16" />;
      case 2: return <Dice2 className="w-16 h-16" />;
      case 3: return <Dice3 className="w-16 h-16" />;
      case 4: return <Dice4 className="w-16 h-16" />;
      case 5: return <Dice5 className="w-16 h-16" />;
      case 6: return <Dice6 className="w-16 h-16" />;
      default: return <Dice1 className="w-16 h-16" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex gap-4 pointer-events-none">
      
      {/* Smartphone Mockup Container */}
      <div className="w-[320px] h-[600px] bg-black rounded-[3rem] border-[8px] border-zinc-800 shadow-2xl relative overflow-hidden pointer-events-auto ring-4 ring-zinc-900/50">
        {/* Notch */}
        <div className="absolute top-0 inset-x-0 h-6 bg-zinc-800 w-1/2 mx-auto rounded-b-2xl z-20" />
        
        {/* Screen Content */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-background flex flex-col">
          
          {/* Status bar mock */}
          <div className="h-8 flex justify-between items-center px-6 text-[10px] text-zinc-400 font-bold z-30">
            <span>9:41</span>
            <div className="flex gap-1">
              <span>📶</span>
              <span>🔋</span>
              <span>100%</span>
            </div>
          </div>

          <div className="flex-1 p-5 flex flex-col">
            
            {/* Player Header */}
            <div className="flex items-center gap-4 bg-card/80 p-4 rounded-2xl border border-border/50 shadow-lg backdrop-blur-md">
              <div className="text-4xl bg-background/50 p-2 rounded-xl border border-border/50">
                {player.avatar}
              </div>
              <div>
                <div className="text-sm text-muted-foreground uppercase font-bold tracking-wider">Seu App</div>
                <div className="text-xl font-display text-foreground">{player.name}</div>
              </div>
            </div>

            {/* Balance Card */}
            <div className="mt-6 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-6 border border-primary/30 relative overflow-hidden text-center">
              <div className="absolute inset-0 bg-pattern-stars opacity-10" />
              <div className="text-sm text-primary uppercase font-bold tracking-widest mb-2 relative z-10">Saldo Digital</div>
              <div className="text-5xl font-display text-primary text-glow-primary flex items-center justify-center gap-2 relative z-10">
                <span className="text-3xl">💰</span> {player.balance}
              </div>
              <div className="text-xs text-primary/70 mt-1 relative z-10">CCD (Cripto Careco Dollars)</div>
            </div>

            {/* Interactive Area */}
            <div className="flex-1 flex flex-col items-center justify-center mt-6">
              
              <AnimatePresence mode="wait">
                {phase === 'playing' && (
                  <motion.div 
                    key="playing"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-full flex flex-col items-center gap-6"
                  >
                    <motion.div 
                      className="text-primary bg-primary/10 p-6 rounded-3xl border-2 border-primary/30 shadow-[0_0_30px_rgba(255,200,0,0.1)]"
                      animate={isRolling ? { rotate: [0, 90, 180, 270, 360] } : { rotate: 0 }}
                      transition={{ duration: 0.2, repeat: isRolling ? Infinity : 0 }}
                    >
                      {getDiceIcon(diceValue)}
                    </motion.div>
                    
                    <Button 
                      size="lg" 
                      onClick={handleRoll}
                      disabled={isRolling || !player.isCurrentTurn}
                      className={`w-full h-16 text-xl font-display rounded-2xl ${player.isCurrentTurn ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground'}`}
                    >
                      {isRolling ? 'Rolando...' : player.isCurrentTurn ? '🎲 ROLAR DADO' : 'Aguarde sua vez'}
                    </Button>
                  </motion.div>
                )}

                {phase === 'decision' && (
                  <motion.div 
                    key="decision"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full flex flex-col items-center gap-4 bg-card/90 p-5 rounded-3xl border border-destructive/50"
                  >
                    <div className="text-center mb-2">
                      <div className="text-lg font-bold text-foreground">Pagamento Necessário</div>
                      <div className="text-2xl font-display text-destructive">-{pendingCost} CCD</div>
                      <div className="text-xs text-muted-foreground mt-2">Escolha como pagar:</div>
                    </div>

                    <Button 
                      onClick={() => onPay('bank')}
                      className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-start px-4 gap-3"
                    >
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col items-start leading-tight">
                        <span className="font-bold">Banco Tradicional</span>
                        <span className="text-[10px] opacity-80">+5 CCD (Taxa) • Atraso 2 dias</span>
                      </div>
                    </Button>

                    <Button 
                      onClick={() => onPay('blockchain')}
                      className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl flex items-center justify-start px-4 gap-3"
                    >
                      <div className="bg-black/20 p-2 rounded-lg">
                        <Link className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col items-start leading-tight">
                        <span className="font-bold">Via Blockchain</span>
                        <span className="text-[10px] opacity-80">0 Taxa • Imediato</span>
                      </div>
                    </Button>
                  </motion.div>
                )}

                {phase === 'finished' && (
                  <motion.div 
                    key="finished"
                    className="text-center"
                  >
                    <div className="text-6xl mb-4">🏆</div>
                    <h3 className="text-xl font-display text-primary">Fim de Jogo!</h3>
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
