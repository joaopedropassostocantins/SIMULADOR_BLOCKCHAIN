import { Transaction } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import { Activity, ArrowRight, Wallet } from "lucide-react";
import { truncateHash } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function TransactionPool({ transactions }: { transactions: Transaction[] }) {
  return (
    <Card className="h-full flex flex-col border-secondary/20">
      <CardHeader className="bg-secondary/5 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-secondary">
            <Activity className="w-5 h-5" /> Pending Pool
          </CardTitle>
          <Badge variant="outline" className="border-secondary text-secondary">
            {transactions.length} waiting
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
          {transactions.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-50">
              <Wallet className="w-12 h-12 mb-3" />
              <p className="font-display uppercase tracking-widest text-sm">Pool is empty</p>
            </div>
          ) : (
            <AnimatePresence>
              {transactions.map((tx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-3 rounded-xl bg-background border border-border/50 flex flex-col gap-2 hover:border-secondary/50 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-muted-foreground">ID: {truncateHash(tx.id, 6, 6)}</span>
                    <span className="font-display font-bold text-success">${tx.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-2 text-xs font-mono">
                    <span className="truncate flex-1 text-right text-foreground" title={tx.sender}>{truncateHash(tx.sender, 6, 6)}</span>
                    <ArrowRight className="w-3 h-3 text-secondary shrink-0" />
                    <span className="truncate flex-1 text-foreground" title={tx.recipient}>{truncateHash(tx.recipient, 6, 6)}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
