import { BankTx, ConfirmedBlock, BANK_STAGES } from "@/hooks/game-types";
import { motion, AnimatePresence } from "framer-motion";

interface QueuesPanelProps {
  bankTxs: BankTx[];
  confirmedBlocks: ConfirmedBlock[];
  miningNonce: number;
  isMining: boolean;
}

function BankTxCard({ tx }: { tx: BankTx }) {
  const isLiquidado = tx.stage === BANK_STAGES.length - 1 && !tx.recusado;
  const isRecusado = tx.recusado;

  return (
    <motion.div
      key={tx.id}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-md p-3 mb-2 border text-xs font-mono transition-colors ${
        isRecusado
          ? "bg-[#1f0d0d] border-[#f85149]"
          : isLiquidado
          ? "bg-[#0d1a0d] border-[#3fb950] opacity-70"
          : "bg-[#161b22] border-[#30363d]"
      }`}
    >
      <div className="flex justify-between items-baseline gap-2 mb-2">
        <span className="text-[#58a6ff] font-bold truncate">👤 {tx.playerName}</span>
        <span className="text-[#8b949e] truncate text-right">{tx.descricao}</span>
      </div>

      {/* Stage progress bar */}
      <div className="flex gap-1 mb-1.5">
        {BANK_STAGES.map((label, i) => {
          let cls = "flex-1 h-1.5 rounded-full transition-all duration-500 ";
          if (isRecusado) {
            cls += i <= tx.stage ? "bg-[#f85149]" : "bg-[#21262d]";
          } else if (isLiquidado) {
            cls += "bg-[#3fb950]";
          } else if (i < tx.stage) {
            cls += "bg-[#3fb950]";
          } else if (i === tx.stage) {
            cls += "bg-[#ffd700] animate-pulse";
          } else {
            cls += "bg-[#21262d]";
          }
          return <div key={label} className={cls} title={label} />;
        })}
      </div>

      <div
        className={`text-[10px] ${
          isRecusado
            ? "text-[#f85149]"
            : isLiquidado
            ? "text-[#3fb950]"
            : "text-[#ffd700]"
        }`}
      >
        {isRecusado
          ? "❌ Recusado pelo banco"
          : isLiquidado
          ? "✅ Liquidado"
          : `⏳ ${BANK_STAGES[tx.stage]}`}
      </div>
    </motion.div>
  );
}

function BlockCard({ block }: { block: ConfirmedBlock }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-md p-3 mb-2 border border-[#1f6feb] bg-[#161b22] font-mono text-xs"
    >
      <div className="text-[#58a6ff] mb-0.5">Bloco #{block.index}</div>
      <div className="text-[#ffd700] truncate mb-0.5" title={block.hash}>
        {block.hash.substring(0, 20)}...
      </div>
      <div className="text-[#8b949e]">
        👤 {block.playerName} — {block.descricao}
      </div>
      <div className="text-[#3fb950] mt-0.5">Nonce: {block.nonce.toLocaleString("pt-BR")}</div>
    </motion.div>
  );
}

export function QueuesPanel({ bankTxs, confirmedBlocks, miningNonce, isMining }: QueuesPanelProps) {
  const hasActivity = bankTxs.length > 0 || confirmedBlocks.length > 0 || isMining;

  return (
    <AnimatePresence>
      {hasActivity && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-[#0d1117] border border-[#30363d] rounded-2xl p-4 w-full"
        >
          <h3 className="text-[#ffd700] text-xs font-bold uppercase tracking-widest mb-3 pb-2 border-b border-[#30363d]">
            📊 Filas em Tempo Real
          </h3>

          <div className="flex gap-4">
            {/* LEFT — Bank queue */}
            <div className="flex-1 min-w-0">
              <h4 className="text-[#8b949e] text-[10px] uppercase tracking-wider font-bold mb-2">
                🏦 Fila do Banco (SPB/TED)
              </h4>
              {bankTxs.length === 0 ? (
                <p className="text-[#8b949e] text-[10px] italic">Nenhuma transação bancária ainda.</p>
              ) : (
                <div>
                  {bankTxs.slice(0, 5).map((tx) => (
                    <BankTxCard key={tx.id} tx={tx} />
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT — Mempool & Blockchain */}
            <div className="flex-1 min-w-0">
              <h4 className="text-[#8b949e] text-[10px] uppercase tracking-wider font-bold mb-2">
                ⛓️ Mempool & Blocos Confirmados
              </h4>

              {/* Mining status */}
              <AnimatePresence>
                {isMining && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-md p-3 mb-2 border border-[#ffd700]/40 bg-[#1a1700] font-mono text-xs"
                  >
                    <div className="text-[#ffd700] animate-pulse font-bold">
                      ⛏️ Minerando... {miningNonce.toLocaleString("pt-BR")} hashes
                    </div>
                    <div className="text-[#8b949e] mt-0.5">
                      Buscando prefixo "00" — Proof of Work em andamento
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {confirmedBlocks.length === 0 && !isMining ? (
                <p className="text-[#8b949e] text-[10px] italic">Aguardando blocos...</p>
              ) : (
                <div>
                  {confirmedBlocks.slice(0, 5).map((block) => (
                    <BlockCard key={block.index} block={block} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
