import { useState, useEffect, useRef, useCallback } from "react";

// ════════════════════════════════════════════════════════════
// MOTOR CRIPTOGRÁFICO EDUCACIONAL
// ════════════════════════════════════════════════════════════
function simHash(input) {
  let h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const str = String(input);
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h[0] = (h[0] ^ (c * 0x9e3779b9 + (h[1] << 6)  + (h[2] >> 2)))  >>> 0;
    h[1] = (h[1] ^ (h[0]* 0x85ebca6b + (h[2] << 13) + (h[3] >> 7)))  >>> 0;
    h[2] = (h[2] ^ (h[1]* 0xc2b2ae35 + (h[3] << 3)  + (h[0] >> 11))) >>> 0;
    h[3] = (h[3] ^ (h[2]* 0x27d4eb2f + (h[0] << 9)  + (h[1] >> 5)))  >>> 0;
    [h[4],h[5],h[6],h[7]] = [(h[7]+h[0])>>>0,(h[4]+h[1])>>>0,(h[5]+h[2])>>>0,(h[6]+h[3])>>>0];
  }
  return h.map(v => v.toString(16).padStart(8,"0")).join("");
}
function calcHash(idx, ts, data, prev, nonce) {
  return simHash(`${idx}${ts}${JSON.stringify(data)}${prev}${nonce}`);
}
async function mineAsync(idx, ts, data, prev, diff, onProg) {
  const prefix = "0".repeat(diff);
  let nonce = 0, hash = "";
  while (true) {
    nonce++;
    hash = calcHash(idx, ts, data, prev, nonce);
    if (hash.startsWith(prefix)) break;
    if (nonce % 500 === 0) { if (onProg) onProg(nonce); await new Promise(r => setTimeout(r,0)); }
  }
  return { nonce, hash };
}
const DIFF = 2;
const G0 = "0".repeat(64);
function validateChain(blocks) {
  let pv = true, ph = G0;
  return blocks.map((b) => {
    const exp = calcHash(b.index, b.timestamp, b.data, ph, b.nonce);
    const ok = pv && exp === b.hash && b.previousHash === ph && b.hash.startsWith("0".repeat(DIFF));
    pv = ok; ph = b.hash;
    return { ...b, _valid: ok };
  });
}

// ════════════════════════════════════════════════════════════
// DADOS EDUCACIONAIS — EXPLICAÇÕES CONTEXTUAIS
// ════════════════════════════════════════════════════════════
const EXPLAIN = {
  genesis: {
    titulo: "Bloco Genesis — O ponto zero",
    texto: "Todo blockchain começa com um bloco especial chamado Genesis. Ele nao tem bloco anterior — sua funcao e ser a ancora imutavel da cadeia. E como a Constituicao de uma cadeia: tudo se origina dele. Na Bitcoin, o Genesis Block foi minerado por Satoshi Nakamoto em 3 de janeiro de 2009.",
    lei: "Art. 10, MP 2.200-2/2001 — validade juridica de documentos digitais assinados com ICP-Brasil.",
    cor: "#fbbf24",
  },
  mineracao: {
    titulo: "Prova de Trabalho (Proof of Work)",
    texto: "Para adicionar um bloco, o minerador precisa encontrar um numero (nonce) tal que o hash resultante comece com zeros. Isso exige tentativas computacionais. Quanto mais zeros exigidos, mais dificil. E como um carimbo notarial digital: custoso de criar, instantaneo de verificar.",
    lei: "Res. BCB 96/2021 — registro de ativos virtuais. O PoW e o mecanismo que torna fraudes economicamente inviaveis.",
    cor: "#a78bfa",
  },
  adulteracao: {
    titulo: "Tentativa de Adulteracao Detectada",
    texto: "Alterar qualquer byte de um bloco muda completamente seu hash. O bloco seguinte guarda o hash anterior — entao toda a cadeia subsequente se torna invalida. Para forjar um bloco, o atacante precisaria refazer toda a cadeia com mais poder computacional do que os mineradores honestos reunidos: o ataque 51%.",
    lei: "Art. 313-A, CP — adulteracao de sistema de dados publicos. Art. 154-A — invasao de dispositivo.",
    cor: "#f87171",
  },
  hash: {
    titulo: "O que e um Hash Criptografico?",
    texto: "Uma funcao hash transforma qualquer dado em uma sequencia de tamanho fixo. Propriedades: (1) deterministica — mesma entrada, mesma saida; (2) efeito avalanche — 1 bit diferente muda ~50% da saida; (3) irreversivel — nao e possivel recuperar o dado original a partir do hash; (4) resistente a colisoes — quase impossivel dois dados terem o mesmo hash.",
    lei: "ITI/ICP-Brasil — DOC-ICP-01.01: algoritmos SHA-256 e SHA-512 aprovados para assinatura digital.",
    cor: "#00d4ff",
  },
  banco_inicio: {
    titulo: "Modelo Bancario Tradicional — Centralizado",
    texto: "No sistema bancario, toda transacao passa por intermediarios: caixa, gerente, banco compensador, BACEN. Cada etapa adiciona custo, tempo e um ponto de falha ou censura. O banco e o unico detentor da 'verdade' sobre os saldos — voce confia na instituicao, nao no protocolo.",
    lei: "Lei 4.595/1964 — Sistema Financeiro Nacional. Res. CMN 4.658/2018 — seguranca cibernetica bancaria.",
    cor: "#f59e0b",
  },
  banco_aprovacao: {
    titulo: "Etapa de Aprovacao Bancaria",
    texto: "O banco verifica saldo, limites, compliance (PLD/FT — Prevencao a Lavagem de Dinheiro), e pode recusar, bloquear ou atrasar a transacao. Esse poder centralizado e ao mesmo tempo protecao (fraudes) e risco (censura, falencia do banco, erro humano). Na blockchain, nenhuma entidade tem esse poder.",
    lei: "Lei 9.613/1998 — PLD/FT. Circ. BCB 3.978/2020 — KYC obrigatorio. Lei 13.974/2020 — COAF.",
    cor: "#f59e0b",
  },
  banco_liquidacao: {
    titulo: "Liquidacao e Compensacao (D+1 / D+3)",
    texto: "No Brasil, TEDs liquidam em D+0, DOCs em D+1, cheques em D+2. O sistema SPB (Sistema de Pagamentos Brasileiro) opera via STRO/STR do BACEN. O PIX revolucionou isso com liquidacao imediata 24/7 — mas ainda e centralizado no BACEN, diferente da blockchain onde nao ha entidade central.",
    lei: "Lei 10.214/2001 — SPB. Res. BCB 1/2020 — Regulamento do PIX. Circ. BCB 3.115/2002 — STR.",
    cor: "#f59e0b",
  },
  comparacao: {
    titulo: "Blockchain x Banco — Quadro Comparativo",
    texto: "A blockchain nao e superior ao banco em todos os casos: bancos oferecem estorno, suporte e regulacao protetora ao consumidor (CDC, Lei 8.078/90). A blockchain oferece autonomia, transparencia e resistencia a censura. O desafio juridico e acomodar os dois mundos — DeFi regulado, CBDCs, tokenizacao de ativos.",
    lei: "PL 4.401/2021 — Marco das Criptomoedas. Lei 14.478/2022 — Ativos Virtuais no Brasil. LGPD x imutabilidade.",
    cor: "#4ade80",
  },
};

// ════════════════════════════════════════════════════════════
// PAPÉIS DOS ALUNOS NO MODO BANCO
// ════════════════════════════════════════════════════════════
const ROLES = [
  { id: "remetente", label: "Remetente", icon: "👤", desc: "Aluno que envia o dinheiro. Preenche o formulario e assina o documento.", cor: "#60a5fa" },
  { id: "destinatario", label: "Destinatario", icon: "👤", desc: "Aluno que recebe. Aguarda a confirmacao — sem visibilidade do processo.", cor: "#60a5fa" },
  { id: "caixa", label: "Caixa Bancario", icon: "🏦", desc: "Recebe a solicitacao, verifica documentos, carimba e encaminha ao gerente.", cor: "#fbbf24" },
  { id: "gerente", label: "Gerente", icon: "👔", desc: "Aprova ou recusa com base em limite, historico e politica do banco. Pode pedir mais documentos.", cor: "#fbbf24" },
  { id: "compliance", label: "Compliance / PLD", icon: "🔍", desc: "Analisa a transacao quanto a lavagem de dinheiro (Lei 9.613/1998). Pode bloquear.", cor: "#f87171" },
  { id: "bacen", label: "BACEN / SPB", icon: "🏛️", desc: "Banco Central processa a liquidacao final. Mantem o registro oficial. Pode intervir.", cor: "#a78bfa" },
  { id: "minerador", label: "Minerador (Blockchain)", icon: "⛏️", desc: "Valida a transacao resolvendo o PoW. Qualquer pessoa pode ser minerador — sem permissao.", cor: "#4ade80" },
];

// ════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function App() {
  const [modo, setModo] = useState("comparar"); // comparar | blockchain | banco
  const [explain, setExplain] = useState(EXPLAIN.comparacao);
  const [blocks, setBlocks] = useState([]);
  const [form, setForm] = useState({ remetente: "", destinatario: "", valor: "", descricao: "" });
  const [status, setStatus] = useState("idle");
  const [miningNonce, setMiningNonce] = useState(0);
  const [reminingIdx, setReminingIdx] = useState(null);
  const [selected, setSelected] = useState(null);
  const [editMode, setEditMode] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [bankTxs, setBankTxs] = useState([]);
  const [bankForm, setBankForm] = useState({ remetente: "", destinatario: "", valor: "", descricao: "" });
  const [bankStep, setBankStep] = useState(null); // null | idx
  const [rolesOpen, setRolesOpen] = useState(false);
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  // Inicializa genesis
  useEffect(() => {
    (async () => {
      setStatus("mining");
      const ts = Date.now();
      const data = { descricao: "Bloco Genesis — Origem da cadeia Carecodolar" };
      const { nonce, hash } = await mineAsync(0, ts, data, G0, DIFF);
      setBlocks([{ index: 0, timestamp: ts, data, previousHash: G0, nonce, hash }]);
      setStatus("idle");
      setExplain(EXPLAIN.genesis);
    })();
  }, []);

  const validBlocks = validateChain(blocks);
  const chainOk = validBlocks.length > 0 && validBlocks.every(b => b._valid);
  const isBusy = status !== "idle";

  // ── BLOCKCHAIN: adicionar bloco ──────────────────────────
  const addBlock = useCallback(async () => {
    if (isBusy) return;
    if (!form.remetente.trim() && !form.descricao.trim()) return;
    setStatus("mining"); setMiningNonce(0);
    setExplain(EXPLAIN.mineracao);
    const cur = blocksRef.current;
    const prev = cur[cur.length - 1];
    const ts = Date.now();
    const data = { ...form };
    const { nonce, hash } = await mineAsync(cur.length, ts, data, prev.hash, DIFF, n => setMiningNonce(n));
    setBlocks(b => [...b, { index: cur.length, timestamp: ts, data, previousHash: prev.hash, nonce, hash }]);
    setForm({ remetente: "", destinatario: "", valor: "", descricao: "" });
    setStatus("idle"); setMiningNonce(0);
  }, [isBusy, form]);

  const tamperBlock = (idx) => {
    const b = blocks[idx];
    setEditVal(b.data.descricao || b.data.remetente || "");
    setEditMode(idx); setSelected(idx);
    setExplain(EXPLAIN.adulteracao);
  };
  const confirmTamper = (idx) => {
    setBlocks(prev => prev.map((b, i) => {
      if (i !== idx) return b;
      const nd = b.data.descricao !== undefined ? { ...b.data, descricao: editVal } : { ...b.data, remetente: editVal };
      return { ...b, data: nd };
    }));
    setEditMode(null);
  };
  const remineFrom = useCallback(async (idx) => {
    if (isBusy) return;
    setStatus("remining"); setReminingIdx(idx);
    setExplain(EXPLAIN.mineracao);
    const cur = [...blocksRef.current];
    let ph = idx === 0 ? G0 : cur[idx - 1].hash;
    for (let i = idx; i < cur.length; i++) {
      const b = cur[i];
      const { nonce, hash } = await mineAsync(b.index, b.timestamp, b.data, ph, DIFF);
      cur[i] = { ...b, previousHash: ph, nonce, hash };
      ph = hash;
      setBlocks([...cur]);
    }
    setStatus("idle"); setReminingIdx(null);
  }, [isBusy]);

  const resetChain = async () => {
    if (isBusy) return;
    setBlocks([]); setSelected(null); setEditMode(null); setStatus("mining");
    const ts = Date.now();
    const data = { descricao: "Bloco Genesis — Origem da cadeia Carecodolar" };
    const { nonce, hash } = await mineAsync(0, ts, data, G0, DIFF);
    setBlocks([{ index: 0, timestamp: ts, data, previousHash: G0, nonce, hash }]);
    setStatus("idle"); setExplain(EXPLAIN.genesis);
  };

  // ── BANCO: simular transação com etapas ─────────────────
  const BANK_STAGES = ["Solicitacao", "Caixa", "Gerente", "Compliance", "BACEN/SPB", "Liquidado"];
  const addBankTx = () => {
    if (!bankForm.remetente.trim() && !bankForm.descricao.trim()) return;
    const tx = { ...bankForm, id: Date.now(), stage: 0, recusado: false, taxa: (Math.random() * 8 + 2).toFixed(2), prazo: Math.floor(Math.random() * 3) + 1 };
    setBankTxs(b => [tx, ...b]);
    setBankForm({ remetente: "", destinatario: "", valor: "", descricao: "" });
    setExplain(EXPLAIN.banco_inicio);
  };
  const advanceBankTx = (id) => {
    setBankTxs(prev => prev.map(tx => {
      if (tx.id !== id) return tx;
      if (tx.recusado) return tx;
      const next = tx.stage + 1;
      if (next === 2) setExplain(EXPLAIN.banco_aprovacao);
      if (next === 3) setExplain(EXPLAIN.banco_aprovacao);
      if (next === 4) setExplain(EXPLAIN.banco_liquidacao);
      if (next === 5) setExplain(EXPLAIN.banco_liquidacao);
      return { ...tx, stage: Math.min(next, 5) };
    }));
  };
  const recusarBankTx = (id) => {
    setBankTxs(prev => prev.map(tx => tx.id === id ? { ...tx, recusado: true } : tx));
    setExplain(EXPLAIN.banco_aprovacao);
  };

  // ════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: "100vh", background: "#080d18", fontFamily: "'Courier New',monospace", color: "#e2e8f0", fontSize: 13 }}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div style={{ background: "rgba(0,15,35,0.98)", borderBottom: "2px solid #00d4ff", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 40px rgba(0,212,255,0.1)" }}>
        <div>
          <div style={{ fontSize: 9, color: "#00d4ff", letterSpacing: 4, marginBottom: 2 }}>SIMULADOR EDUCACIONAL — PROF. JOAO PEDRO</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>
            BLOCKCHAIN{" "}
            <span style={{ color: "#64748b" }}>vs</span>{" "}
            <span style={{ color: "#f59e0b" }}>BANCO</span>{" "}
            <span style={{ color: "#64748b", fontSize: 12 }}>|</span>{" "}
            <span style={{ color: "#00d4ff" }}>Carecodolar</span>{" "}
            <span style={{ color: "#a78bfa", fontSize: 11 }}>(CCD)</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setRolesOpen(r => !r)} style={tabBtn("#60a5fa", rolesOpen)}>PAPEIS DOS ALUNOS</button>
          {["comparar","blockchain","banco"].map(m => (
            <button key={m} onClick={() => { setModo(m); if (m === "comparar") setExplain(EXPLAIN.comparacao); }} style={tabBtn(m === "blockchain" ? "#00d4ff" : m === "banco" ? "#f59e0b" : "#4ade80", modo === m)}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── PAINEL PAPÉIS DOS ALUNOS ───────────────────────── */}
      {rolesOpen && (
        <div style={{ background: "rgba(0,15,35,0.97)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 24px" }}>
          <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 3, marginBottom: 12 }}>DISTRIBUICAO DE PAPEIS EM SALA</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
            {ROLES.map(r => (
              <div key={r.id} style={{ background: `${r.cor}12`, border: `1px solid ${r.cor}30`, borderRadius: 8, padding: "10px 10px" }}>
                <div style={{ fontSize: 18, marginBottom: 6 }}>{r.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: r.cor, marginBottom: 4 }}>{r.label}</div>
                <div style={{ fontSize: 9, color: "#94a3b8", lineHeight: 1.5 }}>{r.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 9, color: "#475569", lineHeight: 1.8 }}>
            <strong style={{ color: "#fbbf24" }}>Dinamica sugerida:</strong> O professor representa o protocolo Blockchain (imparcial, automatico). Os alunos jogam os papeis bancarios — cada um pode tomar decisoes autonomas em seu papel. Compare o numero de etapas, o tempo e a possibilidade de recusa entre os dois modelos.
          </div>
        </div>
      )}

      {/* ── PAINEL EXPLICATIVO CONTEXTUAL ─────────────────── */}
      <div style={{ background: `${explain.cor}10`, borderBottom: `1px solid ${explain.cor}25`, padding: "12px 24px" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{ width: 3, flexShrink: 0, alignSelf: "stretch", background: explain.cor, borderRadius: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: explain.cor, letterSpacing: 2, marginBottom: 4 }}>{explain.titulo.toUpperCase()}</div>
            <div style={{ fontSize: 11, color: "#cbd5e1", lineHeight: 1.7, marginBottom: 4 }}>{explain.texto}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}><span style={{ color: explain.cor }}>Lei/Norma:</span> {explain.lei}</div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {Object.entries(EXPLAIN).map(([k, v]) => (
              <button key={k} onClick={() => setExplain(v)} style={{
                background: explain === v ? `${v.cor}30` : "transparent",
                border: `1px solid ${v.cor}40`, borderRadius: 4,
                padding: "3px 7px", color: v.cor, cursor: "pointer",
                fontSize: 8, fontFamily: "inherit", letterSpacing: 1,
              }}>
                {k.toUpperCase().replace("_"," ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 24px", maxWidth: 1400, margin: "0 auto" }}>

        {/* ══ MODO COMPARAR ══════════════════════════════════ */}
        {modo === "comparar" && (
          <div>
            <div style={{ fontSize: 9, color: "#475569", letterSpacing: 3, marginBottom: 14, textAlign: "center" }}>
              ENVIE A MESMA TRANSACAO NOS DOIS SISTEMAS E COMPARE O FLUXO
            </div>
            {/* Formulário único compartilhado */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
              <div style={{ fontSize: 9, color: "#94a3b8", letterSpacing: 3, marginBottom: 12 }}>NOVA TRANSACAO — ENVIAR NOS DOIS SISTEMAS SIMULTANEAMENTE</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 0.6fr 1.2fr", gap: 10, marginBottom: 10 }}>
                {[{k:"remetente",ph:"Remetente"},{k:"destinatario",ph:"Destinatario"},{k:"valor",ph:"Valor (CCD)"},{k:"descricao",ph:"Descricao"}].map(f => (
                  <input key={f.k} value={form[f.k]}
                    onChange={e => { setForm(p=>({...p,[f.k]:e.target.value})); setBankForm(p=>({...p,[f.k]:e.target.value})); }}
                    placeholder={f.ph} style={inputSt(false)} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { addBlock(); setBankTxs(b=>[{...form,id:Date.now(),stage:0,recusado:false,taxa:(Math.random()*8+2).toFixed(2),prazo:Math.floor(Math.random()*3)+1},...b]); setExplain(EXPLAIN.banco_inicio); }}
                  disabled={isBusy}
                  style={{ background: isBusy?"#1e293b":"linear-gradient(135deg,#0ea5e9,#0284c7)", border:"none", borderRadius:6, padding:"9px 20px", color:"#fff", cursor:isBusy?"not-allowed":"pointer", fontFamily:"inherit", fontSize:10, fontWeight:700, letterSpacing:2, flex:1 }}>
                  {isBusy ? "MINERANDO..." : "ENVIAR NOS DOIS SISTEMAS"}
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Coluna Blockchain */}
              <div>
                <SectionHeader cor="#00d4ff" label="BLOCKCHAIN — CARECODOLAR (CCD)" sub={`${blocks.length} blocos | ${chainOk ? "INTEGRA" : "COMPROMETIDA"}`} />
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {validateChain(blocks).map((b, i) => (
                    <MiniBlock key={b.index} block={b} isFirst={i===0}
                      onSelect={() => { setSelected(selected===i?null:i); setExplain(i===0?EXPLAIN.genesis:EXPLAIN.hash); }}
                      isSelected={selected===i} />
                  ))}
                </div>
                {isBusy && <div style={{ textAlign:"center", padding:"12px 0", fontSize:10, color:"#fbbf24", letterSpacing:2 }}>MINERANDO — nonce #{miningNonce.toLocaleString("pt-BR")}</div>}
              </div>
              {/* Coluna Banco */}
              <div>
                <SectionHeader cor="#f59e0b" label="BANCO TRADICIONAL" sub="intermediarios, taxas, prazo" />
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {bankTxs.map(tx => (
                    <BankTxCard key={tx.id} tx={tx} stages={BANK_STAGES}
                      onAdvance={() => advanceBankTx(tx.id)}
                      onRecusar={() => recusarBankTx(tx.id)} />
                  ))}
                  {bankTxs.length === 0 && <EmptyState label="Nenhuma transacao bancaria ainda" />}
                </div>
              </div>
            </div>

            {/* Tabela comparativa */}
            <CompTable />
          </div>
        )}

        {/* ══ MODO BLOCKCHAIN ════════════════════════════════ */}
        {modo === "blockchain" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Blocos", value: blocks.length, color: "#00d4ff" },
                { label: "Dificuldade", value: `${DIFF} zeros`, color: "#a78bfa" },
                { label: "Integridade", value: chainOk ? "VALIDA" : "COMPROMETIDA", color: chainOk ? "#4ade80" : "#f87171" },
                { label: "Status", value: status === "mining" ? `PoW #${miningNonce.toLocaleString("pt-BR")}` : status === "remining" ? "RE-MINERANDO" : "PRONTO", color: status !== "idle" ? "#fbbf24" : "#4ade80" },
              ].map(m => (
                <div key={m.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 8, color: "#64748b", letterSpacing: 2, marginBottom: 4 }}>{m.label.toUpperCase()}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Formulário blockchain */}
            <div style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.18)", borderRadius: 10, padding: "16px 20px", marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: "#00d4ff", letterSpacing: 3, marginBottom: 12 }}>+ NOVA TRANSACAO CARECODOLAR</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 0.6fr 1.2fr auto", gap: 10 }}>
                {[{k:"remetente",ph:"Remetente"},{k:"destinatario",ph:"Destinatario"},{k:"valor",ph:"Valor (CCD)"},{k:"descricao",ph:"Descricao / Contrato"}].map(f => (
                  <input key={f.k} value={form[f.k]} onChange={e => setForm(p=>({...p,[f.k]:e.target.value}))}
                    onKeyDown={e => e.key==="Enter" && addBlock()} placeholder={f.ph} disabled={isBusy} style={inputSt(isBusy)} />
                ))}
                <button onClick={addBlock} disabled={isBusy} style={{ background:isBusy?"#1e293b":"linear-gradient(135deg,#0ea5e9,#0284c7)", border:"none", borderRadius:6, padding:"9px 16px", color:"#fff", cursor:isBusy?"not-allowed":"pointer", fontFamily:"inherit", fontSize:10, fontWeight:700, letterSpacing:2, opacity:isBusy?0.6:1 }}>
                  {status==="mining" ? "MINERANDO..." : "MINERAR"}
                </button>
              </div>
              {status==="mining" && <div style={{ marginTop:8, fontSize:9, color:"#fbbf24", letterSpacing:2 }}>Proof of Work — tentativa #{miningNonce.toLocaleString("pt-BR")} — buscando hash com {DIFF} zeros iniciais</div>}
            </div>

            {blocks.length === 0 && <div style={{ textAlign:"center", padding:"40px 0", color:"#475569", letterSpacing:3, fontSize:10 }}>MINERANDO BLOCO GENESIS...</div>}

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {validateChain(blocks).map((block, idx) => (
                <FullBlock key={block.index} block={block} idx={idx} isFirst={idx===0}
                  isSelected={selected===idx}
                  onSelect={() => { setSelected(selected===idx?null:idx); setExplain(idx===0?EXPLAIN.genesis:EXPLAIN.hash); }}
                  onTamper={() => tamperBlock(idx)}
                  onRemine={() => remineFrom(idx)}
                  editMode={editMode===idx} editVal={editVal} setEditVal={setEditVal}
                  onConfirmTamper={() => confirmTamper(idx)}
                  onCancelEdit={() => setEditMode(null)}
                  isRemining={reminingIdx===idx} isBusy={isBusy} />
              ))}
            </div>

            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={resetChain} disabled={isBusy} style={{ background:"transparent", border:"1px solid #334155", color:"#64748b", padding:"6px 14px", borderRadius:5, cursor:"pointer", fontSize:9, letterSpacing:2, fontFamily:"inherit" }}>REINICIAR CADEIA</button>
            </div>
          </div>
        )}

        {/* ══ MODO BANCO ═════════════════════════════════════ */}
        {modo === "banco" && (
          <div>
            <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "16px 20px", marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: "#f59e0b", letterSpacing: 3, marginBottom: 12 }}>+ NOVA TRANSFERENCIA BANCARIA (ALUNOS CONTROLAM CADA ETAPA)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 0.6fr 1.2fr auto", gap: 10 }}>
                {[{k:"remetente",ph:"Remetente (aluno)"},{k:"destinatario",ph:"Destinatario (aluno)"},{k:"valor",ph:"Valor (R$)"},{k:"descricao",ph:"Descricao / Finalidade"}].map(f => (
                  <input key={f.k} value={bankForm[f.k]} onChange={e => setBankForm(p=>({...p,[f.k]:e.target.value}))}
                    placeholder={f.ph} style={inputSt(false)} />
                ))}
                <button onClick={addBankTx} style={{ background:"linear-gradient(135deg,#f59e0b,#d97706)", border:"none", borderRadius:6, padding:"9px 16px", color:"#fff", cursor:"pointer", fontFamily:"inherit", fontSize:10, fontWeight:700, letterSpacing:2, minWidth:100 }}>
                  SOLICITAR
                </button>
              </div>
            </div>

            {bankTxs.length === 0 && <EmptyState label="Nenhuma transacao bancaria ainda. Alunos podem criar transacoes acima." />}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {bankTxs.map(tx => (
                <BankTxFull key={tx.id} tx={tx} stages={BANK_STAGES}
                  onAdvance={() => advanceBankTx(tx.id)}
                  onRecusar={() => recusarBankTx(tx.id)} />
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes glowR{0%,100%{opacity:1}50%{opacity:0.3}}
        input::placeholder{color:#2d3f55}
        input:focus{outline:none;border-color:rgba(0,212,255,0.4)!important}
      `}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ════════════════════════════════════════════════════════════

function SectionHeader({ cor, label, sub }) {
  return (
    <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:10 }}>
      <div style={{ width:3, height:16, background:cor, borderRadius:2, flexShrink:0 }} />
      <div style={{ fontSize:10, fontWeight:700, color:cor, letterSpacing:2 }}>{label}</div>
      {sub && <div style={{ fontSize:9, color:"#475569", letterSpacing:1 }}>{sub}</div>}
    </div>
  );
}

function EmptyState({ label }) {
  return <div style={{ textAlign:"center", padding:"28px 0", color:"#334155", fontSize:10, letterSpacing:2, border:"1px dashed #1e293b", borderRadius:8 }}>{label}</div>;
}

function MiniBlock({ block, isFirst, isSelected, onSelect }) {
  const ok = block._valid;
  const bc = !ok ? "#f87171" : isFirst ? "#fbbf24" : "#4ade80";
  return (
    <div onClick={onSelect} style={{ display:"flex", alignItems:"center", gap:0, cursor:"pointer" }}>
      <div style={{ width:3, flexShrink:0, alignSelf:"stretch", background:bc, borderRadius:"3px 0 0 3px", animation:!ok?"glowR 1.5s infinite":"none" }} />
      <div style={{ flex:1, background:isSelected?`${bc}12`:`${bc}06`, border:`1px solid ${bc}20`, borderLeft:"none", borderRadius:"0 6px 6px 0", padding:"9px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <span style={{ fontSize:9, color:isFirst?"#fbbf24":"#00d4ff", fontWeight:700 }}>#{block.index.toString().padStart(3,"0")}</span>
          <span style={{ fontSize:10, color:"#94a3b8", maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {block.data.descricao || `${block.data.remetente||"—"} → ${block.data.destinatario||"—"}`}
          </span>
          {block.data.valor && <span style={{ fontSize:9, color:"#a78bfa" }}>{block.data.valor} CCD</span>}
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {!ok && <span style={{ fontSize:8, color:"#f87171", letterSpacing:1, fontWeight:700 }}>INVALIDO</span>}
          <span style={{ fontSize:8, color:bc }}>{ok ? (isFirst ? "GENESIS" : "OK") : "ERRO"}</span>
        </div>
      </div>
    </div>
  );
}

function BankTxCard({ tx, stages, onAdvance, onRecusar }) {
  const pct = (tx.stage / (stages.length - 1)) * 100;
  const cor = tx.recusado ? "#f87171" : tx.stage === stages.length - 1 ? "#4ade80" : "#f59e0b";
  return (
    <div style={{ background:`${cor}08`, border:`1px solid ${cor}25`, borderRadius:8, padding:"10px 14px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <div style={{ fontSize:10, color:"#94a3b8" }}>
          {tx.remetente||"—"} → {tx.destinatario||"—"}
          {tx.valor && <span style={{ color:"#f59e0b", marginLeft:8 }}>R$ {tx.valor}</span>}
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {!tx.recusado && tx.stage < stages.length - 1 && (
            <>
              <button onClick={onAdvance} style={{ background:"#f59e0b22", border:"1px solid #f59e0b44", borderRadius:3, padding:"2px 8px", color:"#f59e0b", cursor:"pointer", fontSize:8, fontFamily:"inherit", fontWeight:700 }}>AVANCAR</button>
              <button onClick={onRecusar} style={{ background:"#f8717122", border:"1px solid #f8717144", borderRadius:3, padding:"2px 8px", color:"#f87171", cursor:"pointer", fontSize:8, fontFamily:"inherit" }}>RECUSAR</button>
            </>
          )}
          <span style={{ fontSize:9, fontWeight:700, color:cor }}>
            {tx.recusado ? "RECUSADA" : stages[tx.stage].toUpperCase()}
          </span>
        </div>
      </div>
      <div style={{ height:4, background:"#1e293b", borderRadius:2, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:cor, transition:"width 0.4s", borderRadius:2 }} />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:8, color:"#475569" }}>
        <span>Taxa: R$ {tx.taxa}</span>
        <span>Prazo: D+{tx.prazo}</span>
        <span>Etapa {tx.stage+1}/{stages.length}</span>
      </div>
    </div>
  );
}

function BankTxFull({ tx, stages, onAdvance, onRecusar }) {
  const cor = tx.recusado ? "#f87171" : tx.stage === stages.length - 1 ? "#4ade80" : "#f59e0b";
  return (
    <div style={{ background:`${cor}07`, border:`1px solid ${cor}28`, borderRadius:10, padding:"14px 18px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
        <div>
          <div style={{ fontSize:11, color:"#e2e8f0", marginBottom:3 }}>
            <strong style={{ color:"#f59e0b" }}>{tx.remetente||"—"}</strong>
            <span style={{ color:"#475569", margin:"0 6px" }}>→</span>
            <strong style={{ color:"#60a5fa" }}>{tx.destinatario||"—"}</strong>
            {tx.valor && <span style={{ color:"#a78bfa", marginLeft:10 }}>R$ {tx.valor}</span>}
          </div>
          {tx.descricao && <div style={{ fontSize:9, color:"#64748b" }}>{tx.descricao}</div>}
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:10, fontWeight:700, color:cor, letterSpacing:2 }}>{tx.recusado ? "RECUSADA" : stages[tx.stage].toUpperCase()}</div>
          <div style={{ fontSize:8, color:"#475569", marginTop:2 }}>Taxa: R$ {tx.taxa} | Prazo: D+{tx.prazo}</div>
        </div>
      </div>

      {/* Progress por etapa */}
      <div style={{ display:"flex", gap:4, marginBottom:12 }}>
        {stages.map((s, i) => {
          const done = i <= tx.stage && !tx.recusado;
          const active = i === tx.stage && !tx.recusado;
          const blocked = tx.recusado && i >= tx.stage;
          return (
            <div key={s} style={{ flex:1, textAlign:"center" }}>
              <div style={{ height:6, borderRadius:3, background: blocked?"#f8717130": done?"#f59e0b": "#1e293b", border:`1px solid ${blocked?"#f8717140":done?"#f59e0b60":"#334155"}`, marginBottom:4, transition:"all 0.3s" }} />
              <div style={{ fontSize:7, color: active?"#fbbf24": done?"#f59e0b": blocked?"#f87171": "#334155", letterSpacing:1 }}>{s.toUpperCase()}</div>
            </div>
          );
        })}
      </div>

      {/* Papel do aluno na etapa atual */}
      {!tx.recusado && tx.stage < stages.length - 1 && (
        <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:6, padding:"10px 12px", marginBottom:10 }}>
          <div style={{ fontSize:9, color:"#f59e0b", fontWeight:700, letterSpacing:1, marginBottom:4 }}>
            AGUARDANDO: {ROLES.find(r => r.label.toLowerCase().includes(stages[tx.stage].toLowerCase().split("/")[0].trim().toLowerCase()))?.label || stages[tx.stage]}
          </div>
          <div style={{ fontSize:9, color:"#94a3b8" }}>
            {stages[tx.stage] === "Caixa" && "Aluno-caixa: verifique os documentos e carimbos. Voce pode aprovar ou devolver."}
            {stages[tx.stage] === "Gerente" && "Aluno-gerente: analise limite, historico e politica do banco. Voce tem poder de recusar."}
            {stages[tx.stage] === "Compliance" && "Aluno-compliance: analise PLD/FT (Lei 9.613/1998). Algum sinal de lavagem de dinheiro?"}
            {stages[tx.stage] === "BACEN/SPB" && "Processamento no Sistema de Pagamentos Brasileiro. Liquidacao no SPB/STR do Banco Central."}
            {stages[tx.stage] === "Solicitacao" && "Remetente solicitou a transferencia. Avance para o caixa processar."}
          </div>
        </div>
      )}
      {tx.stage === stages.length - 1 && !tx.recusado && (
        <div style={{ background:"rgba(74,222,128,0.08)", border:"1px solid rgba(74,222,128,0.2)", borderRadius:6, padding:"8px 12px", fontSize:9, color:"#4ade80" }}>
          TRANSACAO LIQUIDADA — Passou por {stages.length} etapas, cobrou R$ {tx.taxa} de taxa e levou D+{tx.prazo}.
        </div>
      )}
      {tx.recusado && (
        <div style={{ background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:6, padding:"8px 12px", fontSize:9, color:"#f87171" }}>
          TRANSACAO RECUSADA pelo intermediario. Na blockchain, nenhuma entidade central pode recusar uma transacao valida.
        </div>
      )}

      {!tx.recusado && tx.stage < stages.length - 1 && (
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onAdvance} style={{ flex:1, background:"#f59e0b22", border:"1px solid #f59e0b55", borderRadius:5, padding:"7px", color:"#f59e0b", cursor:"pointer", fontSize:9, fontFamily:"inherit", fontWeight:700, letterSpacing:1 }}>
            APROVAR E AVANCAR ETAPA
          </button>
          <button onClick={onRecusar} style={{ background:"#f8717122", border:"1px solid #f8717155", borderRadius:5, padding:"7px 14px", color:"#f87171", cursor:"pointer", fontSize:9, fontFamily:"inherit" }}>
            RECUSAR
          </button>
        </div>
      )}
    </div>
  );
}

function FullBlock({ block, idx, isFirst, isSelected, onSelect, onTamper, onRemine,
                     editMode, editVal, setEditVal, onConfirmTamper, onCancelEdit,
                     isRemining, isBusy }) {
  const ok = block._valid;
  const bc = !ok ? "#f87171" : isFirst ? "#fbbf24" : "#4ade80";
  return (
    <div style={{ display:"flex", alignItems:"stretch" }}>
      <div style={{ width:3, flexShrink:0, borderRadius:"3px 0 0 3px", background:bc, animation:!ok?"glowR 1.5s infinite":"none" }} />
      <div style={{ flex:1, background:`${bc}06`, border:`1px solid ${bc}22`, borderLeft:"none", borderRadius:"0 8px 8px 0" }}>
        <div onClick={onSelect} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", cursor:"pointer", borderBottom:isSelected?"1px solid rgba(255,255,255,0.05)":"none" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:9, fontWeight:700, color:isFirst?"#fbbf24":"#00d4ff", background:`${isFirst?"#fbbf24":"#00d4ff"}15`, padding:"2px 8px", borderRadius:4, letterSpacing:1 }}>#{block.index.toString().padStart(4,"0")}</span>
            <span style={{ fontSize:9, color:"#475569" }}>{new Date(block.timestamp).toLocaleTimeString("pt-BR")}</span>
            <span style={{ fontSize:10, color:"#94a3b8", maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {block.data.descricao || `${block.data.remetente||"—"} → ${block.data.destinatario||"—"}`}
            </span>
            {block.data.valor && <span style={{ fontSize:9, color:"#a78bfa" }}>{block.data.valor} CCD</span>}
            {!ok && <span style={{ fontSize:8, color:"#f87171", fontWeight:700, letterSpacing:1 }}>HASH INVALIDO</span>}
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            {!isFirst && !isBusy && (
              <>
                <SmBtn label="ADULTERAR" color="#f87171" onClick={e=>{e.stopPropagation();onTamper();}} />
                <SmBtn label="RE-MINERAR" color="#a78bfa" onClick={e=>{e.stopPropagation();onRemine();}} />
              </>
            )}
            {isRemining && <span style={{ fontSize:8, color:"#fbbf24", letterSpacing:1 }}>MINERANDO...</span>}
            <span style={{ color:"#334155", fontSize:10 }}>{isSelected?"▲":"▼"}</span>
          </div>
        </div>
        {isSelected && (
          <div style={{ padding:"12px 16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div>
              <SLabel text="DADOS DO BLOCO" />
              {editMode ? (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  <div style={{ fontSize:8, color:"#f87171", marginBottom:2 }}>Altere o dado. O hash original sera preservado — evidenciando adulteracao:</div>
                  <input value={editVal} onChange={e=>setEditVal(e.target.value)} style={{ ...inputSt(false), borderColor:"#f87171", color:"#fca5a5", background:"rgba(248,113,113,0.07)" }} />
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={onConfirmTamper} style={{ background:"#f87171", border:"none", borderRadius:4, padding:"5px 10px", color:"#fff", cursor:"pointer", fontSize:9, fontWeight:700, fontFamily:"inherit" }}>CONFIRMAR</button>
                    <button onClick={onCancelEdit} style={{ background:"transparent", border:"1px solid #334155", borderRadius:4, padding:"5px 10px", color:"#64748b", cursor:"pointer", fontSize:9, fontFamily:"inherit" }}>CANCELAR</button>
                  </div>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  {Object.entries(block.data).filter(([,v])=>String(v).trim()).map(([k,v])=>(
                    <div key={k} style={{ display:"flex", gap:8 }}>
                      <span style={{ fontSize:8, color:"#475569", minWidth:75, textTransform:"uppercase", letterSpacing:1 }}>{k}:</span>
                      <span style={{ fontSize:10, color:"#e2e8f0" }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <SLabel text="CRIPTOGRAFIA" />
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <HashRow label="Hash anterior" value={block.previousHash} color="#475569" />
                <HashRow label="Hash deste bloco" value={block.hash} color={ok?"#4ade80":"#f87171"} />
                <div style={{ display:"flex", gap:12 }}>
                  <KV label="Nonce" value={block.nonce.toLocaleString("pt-BR")} />
                  <KV label="Prefixo PoW" value={block.hash.substring(0,6)+"..."} />
                </div>
                {!ok && <div style={{ background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:5, padding:"8px 10px", fontSize:9, color:"#f87171", lineHeight:1.6 }}>Hash recalculado diverge do armazenado. Use RE-MINERAR para demonstrar o custo de um ataque 51%.</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CompTable() {
  const rows = [
    ["Controle", "Banco central (instituicao)", "Protocolo (codigo aberto)"],
    ["Intermediarios", "Caixa, Gerente, BACEN, SPB", "Nenhum — ponto a ponto"],
    ["Prazo", "D+0 a D+3", "Segundos a minutos"],
    ["Taxas", "R$ 2 a R$ 15+ por TED", "Gas fee (variavel, geralmente baixo)"],
    ["Transparencia", "Sigilo bancario (LC 105/2001)", "Publica e auditavel (pseudonimo)"],
    ["Recusa possivel?", "Sim — compliance, limite, PLD", "Nao — transacao valida nao pode ser bloqueada"],
    ["Estorno", "Possivel (CDC, Art. 42)", "Impossivel — imutabilidade"],
    ["Regulacao BR", "BACEN, CMN, CVM, Res. 4.658/2018", "Lei 14.478/2022, Res. BCB 96/2021"],
    ["Dado pessoal", "Sigilo bancario + LGPD", "Imutabilidade vs LGPD Art. 18 (conflito)"],
    ["Falha unica", "Banco pode falir / ser hackeado", "Sem ponto central de falha"],
  ];
  return (
    <div style={{ marginTop:20, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"16px 20px" }}>
      <div style={{ fontSize:9, color:"#475569", letterSpacing:3, marginBottom:12 }}>QUADRO COMPARATIVO — BANCO TRADICIONAL vs BLOCKCHAIN</div>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:10 }}>
          <thead>
            <tr>
              {["CRITERIO","BANCO TRADICIONAL","BLOCKCHAIN (CCD)"].map((h,i)=>(
                <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:8, letterSpacing:2, color:i===0?"#64748b":i===1?"#f59e0b":"#00d4ff", borderBottom:"1px solid rgba(255,255,255,0.06)", fontWeight:700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([crit,banco,bc],i)=>(
              <tr key={crit} style={{ background:i%2===0?"transparent":"rgba(255,255,255,0.015)" }}>
                <td style={{ padding:"7px 12px", color:"#94a3b8", fontSize:9, borderBottom:"1px solid rgba(255,255,255,0.03)", fontWeight:600 }}>{crit}</td>
                <td style={{ padding:"7px 12px", color:"#fbbf24", fontSize:9, borderBottom:"1px solid rgba(255,255,255,0.03)" }}>{banco}</td>
                <td style={{ padding:"7px 12px", color:"#4ade80", fontSize:9, borderBottom:"1px solid rgba(255,255,255,0.03)" }}>{bc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SmBtn({ label, color, onClick }) {
  return <button onClick={onClick} style={{ background:"transparent", border:`1px solid ${color}40`, borderRadius:3, padding:"2px 8px", color, cursor:"pointer", fontSize:8, letterSpacing:1, fontFamily:"inherit", fontWeight:700 }}>{label}</button>;
}
function SLabel({ text }) {
  return <div style={{ fontSize:8, color:"#475569", letterSpacing:2, marginBottom:8 }}>{text}</div>;
}
function HashRow({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize:8, color:"#334155", letterSpacing:1, marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:8, color, fontFamily:"monospace", wordBreak:"break-all", lineHeight:1.5, background:"rgba(255,255,255,0.02)", borderRadius:3, padding:"5px 7px", border:"1px solid rgba(255,255,255,0.04)" }}>
        {value.substring(0,32)}<span style={{ opacity:0.35 }}>{value.substring(32)}</span>
      </div>
    </div>
  );
}
function KV({ label, value }) {
  return (
    <div>
      <div style={{ fontSize:8, color:"#334155", letterSpacing:1, marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:11, color:"#a78bfa", fontWeight:700 }}>{value}</div>
    </div>
  );
}
function inputSt(disabled) {
  return { background:disabled?"rgba(255,255,255,0.01)":"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:5, padding:"8px 10px", color:"#e2e8f0", fontFamily:"'Courier New',monospace", fontSize:10, width:"100%", boxSizing:"border-box", opacity:disabled?0.4:1 };
}
function tabBtn(color, active) {
  return { background:active?`${color}20`:"transparent", border:`1px solid ${active?color:color+"44"}`, borderRadius:5, padding:"6px 12px", color:active?color:color+"99", cursor:"pointer", fontSize:9, letterSpacing:2, fontFamily:"inherit", fontWeight:active?700:400, transition:"all 0.2s" };
}
