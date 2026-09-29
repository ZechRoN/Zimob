import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, AlertCircle, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { demoProposals, brl } from "@/lib/demo-data";

export const Route = createFileRoute("/demo/propostas")({ component: PropostasDemo });

const ST: Record<string, { label: string; bg: string; color: string }> = {
  enviada:     { label: "Enviada",     bg: "#DBEAFE", color: "#1E40AF" },
  em_analise:  { label: "Em análise",  bg: "#FEF3C7", color: "#92400E" },
  negociacao:  { label: "Negociação",  bg: "#E8F0F5", color: "#2C5F7A" },
  aceita:      { label: "Aceita",      bg: "#DCFCE7", color: "#166534" },
  recusada:    { label: "Recusada",    bg: "#FEE2E2", color: "#991B1B" },
};

function days(iso: string) { return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86400000)); }

function PropostasDemo() {
  const [q, setQ] = useState(""); const [st, setSt] = useState("");
  const list = demoProposals.filter((p) =>
    (!q || p.lead_name.toLowerCase().includes(q.toLowerCase()) || p.property.toLowerCase().includes(q.toLowerCase())) &&
    (!st || p.status === st));

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-app-text">Propostas</h1>
          <p className="text-sm text-[var(--app-text-muted)]">{list.length} propostas</p>
        </div>
        <Button className="bg-primary hover:bg-blue-700 text-primary-foreground"><Plus className="h-4 w-4 mr-1" />Nova proposta</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--app-text-muted)]" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." className="pl-9 bg-app-card border-[var(--app-border)]" />
        </div>
        <select value={st} onChange={(e) => setSt(e.target.value)} className="h-10 rounded-md border border-[var(--app-border)] bg-app-card px-3 text-sm">
          <option value="">Todos status</option>
          {Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="grid gap-3">
        {list.map((p, i) => {
          const s = ST[p.status];
          const d = days(p.sent_at);
          const stalled = d > 7 && (p.status === "enviada" || p.status === "em_analise");
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-app-card border border-[var(--app-border)] rounded-xl p-4 flex items-center gap-4 hover:border-[#2C5F7A4d] transition">
              <div className="h-11 w-11 rounded-lg bg-[#E8F0F5] text-primary flex items-center justify-center"><FileText className="h-5 w-5" /></div>
              <div className="flex-1 min-w-0 grid md:grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-[var(--app-text-muted)] uppercase tracking-wide">Lead</div>
                  <div className="font-semibold text-app-text">{p.lead_name}</div>
                  <div className="text-xs text-[var(--app-text-muted)] truncate">{p.property}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--app-text-muted)] uppercase tracking-wide">Valor proposto</div>
                  <div className="text-lg font-extrabold text-primary">{brl(p.value)}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--app-text-muted)] uppercase tracking-wide">Enviada</div>
                  <div className={`text-sm flex items-center gap-1 ${stalled ? "text-red-700 dark:text-red-300 font-semibold" : "text-app-text"}`}>
                    {stalled && <AlertCircle className="h-3 w-3" />}há {d} dias
                  </div>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-1 rounded flex-shrink-0" style={{ background: s.bg, color: s.color }}>{s.label}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

