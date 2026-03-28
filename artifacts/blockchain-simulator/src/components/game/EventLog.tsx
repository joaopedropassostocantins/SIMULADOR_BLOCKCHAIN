import { GameEvent } from "@/hooks/game-types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface EventLogProps {
  events: GameEvent[];
}

export function EventLog({ events }: EventLogProps) {
  return (
    <div className="glass-panel rounded-xl overflow-hidden flex flex-col h-full">
      <div className="bg-background/50 p-3 border-b border-border">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          📜 Log de Eventos Recentes
        </h3>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {events.map((ev) => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                className="text-sm border-l-2 pl-3 py-1 bg-background/20 rounded-r-md"
                style={{
                  borderLeftColor: 
                    ev.type === 'gain' ? 'hsl(var(--success))' :
                    ev.type === 'loss' ? 'hsl(var(--destructive))' :
                    'hsl(var(--primary))'
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-muted-foreground">{ev.timestamp}</span>
                  {ev.playerName && <span className="text-xs font-bold text-foreground">{ev.playerName}</span>}
                </div>
                <p className={`
                  ${ev.type === 'gain' ? 'text-success' : ''}
                  ${ev.type === 'loss' ? 'text-destructive' : ''}
                  ${ev.type === 'info' ? 'text-foreground' : ''}
                  ${ev.type === 'neutral' ? 'text-muted-foreground' : ''}
                `}>
                  {ev.message}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
