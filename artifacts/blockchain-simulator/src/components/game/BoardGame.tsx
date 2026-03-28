import { BoardTile, Player } from "@/hooks/game-types";
import { motion, AnimatePresence } from "framer-motion";

interface BoardGameProps {
  board: BoardTile[];
  players: Player[];
  lastDiceRoll?: number | null;
}

export function BoardGame({ board, players, lastDiceRoll }: BoardGameProps) {
  const rows = [
    board.slice(0, 5),
    board.slice(5, 10).reverse(),
    board.slice(10, 15),
  ];

  return (
    <div className="glass-panel rounded-3xl p-6 h-full flex flex-col shadow-2xl relative border-primary/20">
      <div className="absolute top-3 right-6 text-3xl opacity-20 rotate-12">🍌</div>
      <div className="absolute bottom-3 left-6 text-3xl opacity-20 -rotate-12">🍌</div>

      <div className="flex items-center justify-center gap-4 mb-5">
        <h2 className="text-2xl font-display text-center text-primary text-glow-primary">
          Caminho das Bananas Digitais 🍌
        </h2>
        <AnimatePresence>
          {lastDiceRoll && (
            <motion.div
              key={lastDiceRoll}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              className="bg-primary text-primary-foreground font-display text-2xl w-12 h-12 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,200,0,0.5)]"
            >
              {lastDiceRoll}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 flex flex-col justify-around relative gap-2">
        {rows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className={`flex justify-between items-center relative ${rowIdx === 1 ? "flex-row-reverse" : ""}`}
          >
            {row.map((tile) => {
              const tilePlayers = players.filter(p => p.position === tile.id);

              let bgColor = "bg-card";
              let borderColor = "border-border";
              let glowColor = "";

              if (tile.type === "start" || tile.type === "end") {
                bgColor = "bg-primary/20"; borderColor = "border-primary"; glowColor = "shadow-[0_0_12px_rgba(255,200,0,0.3)]";
              } else if (tile.type === "bonus") {
                bgColor = "bg-success/20"; borderColor = "border-success"; glowColor = "shadow-[0_0_12px_rgba(34,197,94,0.3)]";
              } else if (tile.type === "ransomware") {
                bgColor = "bg-destructive/20"; borderColor = "border-destructive"; glowColor = "shadow-[0_0_12px_rgba(239,68,68,0.3)]";
              } else if (tile.type === "bank") {
                bgColor = "bg-blue-900/30"; borderColor = "border-blue-500"; glowColor = "shadow-[0_0_12px_rgba(59,130,246,0.3)]";
              } else if (tile.type === "expense") {
                bgColor = "bg-secondary/20"; borderColor = "border-secondary";
              }

              return (
                <div key={tile.id} className="relative group">
                  <div className={`
                    w-24 h-24 rounded-2xl flex flex-col items-center justify-center p-1.5 text-center
                    border-2 ${bgColor} ${borderColor} ${glowColor}
                    transition-transform hover:scale-105 relative z-10 backdrop-blur-md
                  `}>
                    <div className="text-2xl mb-0.5 filter drop-shadow-md">{tile.emoji}</div>
                    <div className="text-[9px] font-bold uppercase tracking-wider leading-tight">{tile.name}</div>
                    {tile.ccdCost !== 0 && (
                      <div className={`text-[10px] font-display mt-0.5 font-bold ${tile.ccdCost < 0 ? "text-success" : "text-destructive"}`}>
                        {tile.ccdCost < 0 ? "+" : "-"}{Math.abs(tile.ccdCost)} CCD
                      </div>
                    )}
                  </div>

                  {/* Players on this tile */}
                  {tilePlayers.length > 0 && (
                    <div className="absolute -top-5 -right-5 flex flex-wrap w-14 gap-0.5 z-20 pointer-events-none">
                      {tilePlayers.map((p) => (
                        <motion.div
                          key={p.id}
                          layoutId={`player-${p.id}`}
                          initial={{ scale: 0.5, y: -15 }}
                          animate={{ scale: 1, y: p.isCurrentTurn ? [0, -8, 0] : 0 }}
                          transition={{
                            type: "spring", stiffness: 300, damping: 20,
                            y: p.isCurrentTurn ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : {},
                          }}
                          className={`
                            text-xl bg-background/80 rounded-full border-2 p-0.5 shadow-xl
                            ${p.isCurrentTurn
                              ? "border-primary shadow-[0_0_12px_rgba(255,200,0,0.8)] z-30"
                              : "border-border z-10"}
                          `}
                        >
                          {p.avatar}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
