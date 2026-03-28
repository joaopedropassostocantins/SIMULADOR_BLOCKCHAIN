import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Badge } from "@/components/ui";
import { useMine, useSubmitTransaction, useResetChain, useUpdateDifficulty, useBlockchainValidation } from "@/hooks/use-blockchain";
import { Pickaxe, Send, RefreshCcw, Settings2, ShieldAlert, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const txSchema = z.object({
  sender: z.string().min(1, "Sender is required"),
  recipient: z.string().min(1, "Recipient is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
});

const mineSchema = z.object({
  minerAddress: z.string().min(1, "Miner address is required"),
});

export function ControlPanel({ currentDifficulty }: { currentDifficulty: number }) {
  const [activeTab, setActiveTab] = useState<"mine" | "transact" | "settings">("mine");
  
  const { mutate: mine, isPending: isMining } = useMine();
  const { mutate: addTx, isPending: isSending } = useSubmitTransaction();
  const { mutate: resetChain, isPending: isResetting } = useResetChain();
  const { mutate: setDiff, isPending: isSettingDiff } = useUpdateDifficulty();
  const { data: validation } = useBlockchainValidation();

  const txForm = useForm<z.infer<typeof txSchema>>({
    resolver: zodResolver(txSchema),
    defaultValues: { sender: "Alice", recipient: "Bob", amount: 50 },
  });

  const mineForm = useForm<z.infer<typeof mineSchema>>({
    resolver: zodResolver(mineSchema),
    defaultValues: { minerAddress: "Satoshi_N" },
  });

  const onAddTx = (data: z.infer<typeof txSchema>) => {
    addTx({ data });
    txForm.reset();
  };

  const onMine = (data: z.infer<typeof mineSchema>) => {
    mine({ data });
  };

  const onSetDifficulty = (diff: number) => {
    if (diff >= 1 && diff <= 6) {
      setDiff({ data: { difficulty: diff } });
    }
  };

  return (
    <Card className="h-full flex flex-col border-primary/20">
      <CardHeader className="bg-primary/5 pb-0 space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-primary flex items-center gap-2">
            <Settings2 className="w-5 h-5" /> Operations
          </CardTitle>
          
          {validation && (
            <Badge variant={validation.isValid ? "success" : "destructive"} className="gap-1.5 shadow-sm">
              {validation.isValid ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
              {validation.isValid ? "Chain Valid" : "Chain Invalid"}
            </Badge>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 pb-4">
          <Button 
            variant={activeTab === "mine" ? "default" : "ghost"} 
            size="sm" 
            className="flex-1"
            onClick={() => setActiveTab("mine")}
          >
            Mine
          </Button>
          <Button 
            variant={activeTab === "transact" ? "secondary" : "ghost"} 
            size="sm" 
            className="flex-1"
            onClick={() => setActiveTab("transact")}
          >
            Transact
          </Button>
          <Button 
            variant={activeTab === "settings" ? "outline" : "ghost"} 
            size="sm" 
            className="flex-1"
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-6 relative">
        <AnimatePresence mode="wait">
          {activeTab === "mine" && (
            <motion.div key="mine" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              <form onSubmit={mineForm.handleSubmit(onMine)} className="space-y-6">
                <div className="space-y-2">
                  <Label>Miner Address</Label>
                  <Input {...mineForm.register("minerAddress")} placeholder="e.g. 0xYourWallet..." />
                </div>
                
                <div className="pt-4">
                  <Button type="submit" size="lg" className="w-full relative overflow-hidden group" disabled={isMining}>
                    <span className={cn("flex items-center gap-2", isMining && "opacity-0")}>
                      <Pickaxe className="w-5 h-5" /> Start Proof of Work
                    </span>
                    {isMining && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary text-primary-foreground font-mono text-sm">
                        <Loader2 className="w-5 h-5 animate-spin mb-1" />
                        <span className="animate-pulse">Hashing...</span>
                      </div>
                    )}
                  </Button>
                </div>
                {isMining && (
                  <p className="text-xs text-center text-muted-foreground font-mono">
                    Solving cryptographic puzzle at difficulty {currentDifficulty}...
                  </p>
                )}
              </form>
            </motion.div>
          )}

          {activeTab === "transact" && (
            <motion.div key="transact" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              <form onSubmit={txForm.handleSubmit(onAddTx)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Sender Address</Label>
                  <Input {...txForm.register("sender")} placeholder="Sender" />
                </div>
                <div className="space-y-2">
                  <Label>Recipient Address</Label>
                  <Input {...txForm.register("recipient")} placeholder="Recipient" />
                </div>
                <div className="space-y-2">
                  <Label>Amount ($)</Label>
                  <Input type="number" step="0.01" {...txForm.register("amount")} placeholder="0.00" />
                </div>
                <Button variant="secondary" type="submit" className="w-full mt-2" isLoading={isSending}>
                  <Send className="w-4 h-4 mr-2" /> Add to Pool
                </Button>
              </form>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div key="settings" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Mining Difficulty</Label>
                  <Badge variant="outline">{currentDifficulty} Zeros</Badge>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map(level => (
                    <Button
                      key={level}
                      type="button"
                      variant={currentDifficulty === level ? "default" : "outline"}
                      size="sm"
                      onClick={() => onSetDifficulty(level)}
                      disabled={isSettingDiff}
                      className="px-0"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Higher difficulty drastically increases mining time.
                </p>
              </div>

              <div className="pt-6 border-t border-border/50">
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  onClick={() => resetChain()}
                  isLoading={isResetting}
                >
                  <RefreshCcw className="w-4 h-4 mr-2" /> Reset Blockchain
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Wipes all blocks except the Genesis block.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
