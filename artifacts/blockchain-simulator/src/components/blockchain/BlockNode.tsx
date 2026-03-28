import { Block } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Hash, Clock, Cpu, ArrowRightLeft, ShieldCheck } from "lucide-react";
import { cn, truncateHash, formatTime } from "@/lib/utils";
import { Card, Badge } from "@/components/ui";
import { motion } from "framer-motion";

interface BlockNodeProps {
  block: Block;
  isValid?: boolean;
}

export function BlockNode({ block, isValid = true }: BlockNodeProps) {
  const isGenesis = block.index === 0;

  // Visual helper to highlight leading zeros based on difficulty
  const renderHash = (hash: string, difficulty: number) => {
    const zeros = hash.substring(0, difficulty);
    const rest = truncateHash(hash.substring(difficulty), 4, 8);
    
    return (
      <span className="font-mono text-sm break-all">
        <span className="text-primary font-bold text-glow-primary">{zeros}</span>
        <span className="text-muted-foreground">{rest}</span>
      </span>
    );
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      className="relative min-w-[380px] max-w-[420px] shrink-0 group"
    >
      {/* Animated glow effect behind the card */}
      <div className={cn(
        "absolute -inset-0.5 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition duration-500",
        isValid ? "bg-primary" : "bg-destructive"
      )} />

      <Card className={cn(
        "relative h-full flex flex-col transition-all duration-300",
        isValid ? "border-primary/30 hover:border-primary/60" : "border-destructive/50"
      )}>
        {/* Block Header */}
        <div className="p-5 border-b border-border/50 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary font-display font-bold text-xl">
              #{block.index}
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground">
                {isGenesis ? "Genesis Block" : "Mined Block"}
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                {format(new Date(block.timestamp), "MMM dd, yyyy HH:mm:ss.SSS")}
              </p>
            </div>
          </div>
          {isGenesis && <Badge variant="outline" className="border-secondary text-secondary">Root</Badge>}
        </div>

        {/* Cryptographic Details */}
        <div className="p-5 space-y-4 grow">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">
              <Hash className="w-3.5 h-3.5" /> Block Hash
            </div>
            <div className="p-2.5 rounded-lg bg-background border border-border/50 shadow-inner">
              {renderHash(block.hash, block.difficulty)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">
              <ArrowRightLeft className="w-3.5 h-3.5" /> Previous Hash
            </div>
            <div className="p-2.5 rounded-lg bg-background border border-border/50 shadow-inner">
              {block.previousHash === "0" ? (
                <span className="font-mono text-sm text-muted-foreground">0 (Genesis)</span>
              ) : (
                <span className="font-mono text-sm text-muted-foreground">{truncateHash(block.previousHash, 8, 8)}</span>
              )}
            </div>
          </div>

          {/* PoW Stats Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-display text-muted-foreground uppercase">
                <Cpu className="w-3 h-3" /> Nonce
              </div>
              <p className="font-mono text-foreground">{block.nonce.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-display text-muted-foreground uppercase">
                <Clock className="w-3 h-3" /> Time
              </div>
              <p className="font-mono text-foreground">{formatTime(block.miningTime)}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-display text-muted-foreground uppercase">
                <ShieldCheck className="w-3 h-3" /> Difficulty
              </div>
              <p className="font-mono text-foreground">Level {block.difficulty}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-display text-muted-foreground uppercase">
                <ArrowRightLeft className="w-3 h-3" /> Transactions
              </div>
              <p className="font-mono text-foreground">{block.transactions.length}</p>
            </div>
          </div>
        </div>

        {/* Transactions Collapsible Area (Simplified for visualizer) */}
        {block.transactions.length > 0 && (
          <div className="bg-muted/10 p-4 border-t border-border/50 max-h-40 overflow-y-auto">
            <h4 className="text-xs font-display font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              Included Transactions
            </h4>
            <div className="space-y-2">
              {block.transactions.map(tx => (
                <div key={tx.id} className="text-xs bg-background p-2 rounded border border-border flex justify-between items-center">
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex justify-between items-center w-full">
                      <span className="font-mono text-muted-foreground truncate max-w-[100px]">{truncateHash(tx.sender, 4, 4)}</span>
                      <ArrowRightLeft className="w-3 h-3 text-primary mx-2 shrink-0" />
                      <span className="font-mono text-muted-foreground truncate max-w-[100px]">{truncateHash(tx.recipient, 4, 4)}</span>
                    </div>
                    <span className="font-mono font-bold text-foreground self-end">${tx.amount.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
