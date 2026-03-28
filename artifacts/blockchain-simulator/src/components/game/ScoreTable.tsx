import { Player } from "@/hooks/game-types";
import { motion } from "framer-motion";

interface ScoreTableProps {
  players: Player[];
}

export function ScoreTable({ players }: ScoreTableProps) {
  // Sort by balance descending
  const sortedPlayers = [...players].sort((a, b) => b.balance - a.balance);

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col h-full">
      <h2 className="text-xl font-display text-primary mb-4 flex items-center gap-2">
        <span>🏆</span> Ranking
      </h2>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {sortedPlayers.map((player, idx) => (
          <motion.div
            key={player.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              relative flex items-center gap-4 p-3 rounded-xl border
              ${idx === 0 ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(255,200,0,0.2)]' : 'bg-background/40 border-border/50'}
              ${player.isCurrentTurn ? 'ring-2 ring-secondary' : ''}
            `}
          >
            <div className="font-display text-xl w-6 text-center">
              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}º`}
            </div>
            
            <div className="text-3xl bg-background/50 p-2 rounded-lg border border-border/50">
              {player.avatar}
            </div>

            <div className="flex-1">
              <div className="font-bold text-foreground text-lg flex items-center gap-2">
                {player.name}
                {player.isCurrentTurn && (
                  <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full uppercase tracking-wider">Vez</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">Casa Atual: {player.position}</div>
            </div>

            <div className="text-right">
              <div className="text-primary font-display text-xl">{player.balance}</div>
              <div className="text-[10px] text-primary/70 uppercase font-bold">CCD</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
