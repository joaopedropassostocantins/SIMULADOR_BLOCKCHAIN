import { BoardTile, Player } from "@/hooks/game-types";
import { motion } from "framer-motion";

interface BoardGameProps {
  board: BoardTile[];
  players: Player[];
}

export function BoardGame({ board, players }: BoardGameProps) {
  // We need to shape the board into a serpentine path.
  // 3 rows of 5 items.
  // Row 0: 0, 1, 2, 3, 4 (LTR)
  // Row 1: 9, 8, 7, 6, 5 (RTL)
  // Row 2: 10, 11, 12, 13, 14 (LTR)

  const rows = [
    board.slice(0, 5),
    board.slice(5, 10).reverse(),
    board.slice(10, 15)
  ];

  return (
    <div className="glass-panel rounded-3xl p-8 h-full flex flex-col shadow-2xl relative border-primary/20">
      
      {/* Decorative Bananas */}
      <div className="absolute top-4 right-8 text-4xl opacity-20 transform rotate-12">🍌</div>
      <div className="absolute bottom-4 left-8 text-4xl opacity-20 transform -rotate-12">🍌</div>

      <h2 className="text-3xl font-display text-center mb-8 text-primary text-glow-primary">
        Caminho das Bananas Digitais
      </h2>

      <div className="flex-1 flex flex-col justify-around relative">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className={`flex justify-between items-center relative ${rowIdx === 1 ? 'flex-row-reverse' : ''}`}>
            
            {/* Connecting lines between rows */}
            {rowIdx < 2 && (
              <div 
                className={`absolute top-1/2 w-8 h-full border-r-8 border-b-8 border-primary/30 rounded-br-[40px]
                  ${rowIdx === 0 ? 'right-12' : 'hidden'}
                `} 
              />
            )}
            {rowIdx === 1 && (
              <div 
                className="absolute top-1/2 left-12 w-8 h-full border-l-8 border-b-8 border-primary/30 rounded-bl-[40px]"
              />
            )}

            {row.map((tile, colIdx) => {
              const tilePlayers = players.filter(p => p.position === tile.id);
              
              let bgColor = "bg-card";
              let borderColor = "border-border";
              
              if (tile.type === "start" || tile.type === "end") {
                bgColor = "bg-primary/20";
                borderColor = "border-primary";
              } else if (tile.type === "bonus") {
                bgColor = "bg-success/20";
                borderColor = "border-success";
              } else if (tile.type === "ransomware") {
                bgColor = "bg-destructive/20";
                borderColor = "border-destructive";
              } else if (tile.type === "bank" || tile.type === "expense") {
                bgColor = "bg-secondary/20";
                borderColor = "border-secondary";
              }

              return (
                <div key={tile.id} className="relative group">
                  {/* The Tile */}
                  <div className={`
                    w-28 h-28 rounded-2xl flex flex-col items-center justify-center p-2 text-center
                    border-2 ${bgColor} ${borderColor} shadow-lg transition-transform hover:scale-105
                    relative z-10 backdrop-blur-md
                  `}>
                    <div className="text-3xl mb-1 filter drop-shadow-md">{tile.emoji}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider leading-tight">{tile.name}</div>
                    {tile.ccdCost !== 0 && (
                      <div className={`text-xs font-display mt-1
                        ${tile.ccdCost < 0 ? 'text-success' : 'text-destructive'}
                      `}>
                        {tile.ccdCost < 0 ? '+' : '-'}{Math.abs(tile.ccdCost)} CCD
                      </div>
                    )}
                  </div>

                  {/* Path connecting line within row */}
                  {colIdx < 4 && (
                    <div className={`absolute top-1/2 w-full h-2 bg-primary/30 z-0
                      ${rowIdx === 1 ? '-left-full' : 'left-1/2'}
                    `} />
                  )}

                  {/* Players on this tile */}
                  {tilePlayers.length > 0 && (
                    <div className="absolute -top-6 -right-6 flex flex-wrap w-16 gap-1 z-20 pointer-events-none">
                      {tilePlayers.map((p, i) => (
                        <motion.div
                          key={p.id}
                          layoutId={`player-${p.id}`}
                          initial={{ scale: 0.5, y: -20 }}
                          animate={{ 
                            scale: 1, 
                            y: [0, -10, 0],
                          }}
                          transition={{ 
                            type: "spring", 
                            stiffness: 300, 
                            damping: 20,
                            y: {
                              duration: 1.5,
                              repeat: p.isCurrentTurn ? Infinity : 0,
                              ease: "easeInOut"
                            }
                          }}
                          className={`
                            text-2xl bg-background/80 rounded-full border-2 p-1 shadow-xl
                            ${p.isCurrentTurn ? 'border-primary shadow-[0_0_15px_rgba(255,200,0,0.8)] z-30' : 'border-border z-10'}
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
