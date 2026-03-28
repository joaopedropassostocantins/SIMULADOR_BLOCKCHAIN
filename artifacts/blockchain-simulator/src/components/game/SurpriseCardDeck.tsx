import { SurpriseCard } from "@/hooks/game-types";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface SurpriseCardDeckProps {
  currentCard: SurpriseCard | null;
  onDraw: () => void;
  disabled: boolean;
}

export function SurpriseCardDeck({ currentCard, onDraw, disabled }: SurpriseCardDeckProps) {
  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col items-center justify-between h-full gap-4 text-center">
      <div className="w-full">
        <h2 className="text-xl font-display text-secondary-foreground mb-1 text-glow-secondary">
          Baralho Surpresa
        </h2>
        <p className="text-xs text-muted-foreground uppercase tracking-widest">
          Eventos Inesperados
        </p>
      </div>

      <div className="relative flex-1 w-full flex items-center justify-center min-h-[200px]">
        {/* Deck Background representation */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <div className="w-32 h-44 border-2 border-dashed border-secondary/50 rounded-xl bg-secondary/10 rotate-[-5deg]" />
          <div className="absolute w-32 h-44 border-2 border-dashed border-secondary/50 rounded-xl bg-secondary/10 rotate-[5deg]" />
        </div>

        <AnimatePresence mode="wait">
          {currentCard ? (
            <motion.div
              key={currentCard.title}
              initial={{ rotateY: 90, scale: 0.8, opacity: 0 }}
              animate={{ rotateY: 0, scale: 1, opacity: 1 }}
              exit={{ rotateY: -90, scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.4, type: "spring" }}
              className="relative w-40 h-56 rounded-xl bg-gradient-to-br from-secondary/80 to-background border-2 border-secondary p-4 flex flex-col items-center justify-center gap-3 shadow-[0_0_30px_rgba(147,51,234,0.5)] z-10"
            >
              <div className="text-4xl">{currentCard.emoji}</div>
              <h3 className="font-bold text-sm leading-tight text-white">{currentCard.title}</h3>
              <p className="text-xs text-white/80 leading-snug">{currentCard.description}</p>
              <div className={`mt-auto font-display text-lg ${currentCard.effect > 0 ? 'text-success' : 'text-destructive'}`}>
                {currentCard.effect > 0 ? '+' : ''}{currentCard.effect} CCD
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative w-32 h-44 rounded-xl bg-gradient-to-br from-muted to-background border-2 border-muted-foreground p-4 flex flex-col items-center justify-center gap-3 z-10"
            >
              <div className="text-4xl opacity-50">❓</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Button 
        onClick={onDraw} 
        disabled={disabled}
        size="lg"
        className="w-full bg-secondary hover:bg-secondary/80 text-white font-bold tracking-wide shadow-lg"
      >
        Comprar Carta
      </Button>
    </div>
  );
}
