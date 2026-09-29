import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Building2, User as UserIcon, AlertCircle, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { demoVisits } from "@/lib/demo-data";

export const Route = createFileRoute("/demo/visitas")({ component: VisitasDemo });

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  agendada:   { label: "Agendada",   bg: "#FEF3C7", color: "#92400E" },
  concluida:  { label: "Concluída",  bg: "#DCFCE7", color: "#166534" },
  cancelada:  { label: "Cancelada",  bg: "#FEE2E2", color: "#991B1B" },
  remarcada:  { label: "Remarcada",  bg: "#DBEAFE", color: "#1E40AF" },
};

function VisitasDemo() {
  const [q, setQ] = useState(""); const [st, setSt] = useState("");
  const list = demoVisits.filter((v) =>
    (!q || v.lead_name.toLowerCase().includes(q.toLowerCase()) || v.property.toLowerCase().includes(q.toLowerCase())) &&
    (!st || v.status === st));
  const today = new Date().toDateString();
  const todayCount = demoVisits.filter((v) => new Date(v.scheduled_at).toDateString() === today).length;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-app-text">Visitas</h1>
          <p className="text-sm text-[var(--app-text-muted)]">{todayCount} visitas hoje · {list.length} totais</p>
        </div>
        <Button className="bg-primary hover:bg-blue-700 text-primary-foreground"><Plus className="h-4 w-4 mr-1" />Nova visita</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--app-text-muted)]" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar lead ou imóvel..." className="pl-9 bg-app-card border-[var(--app-border)]" />
        </div>
        <select value={st} onChange={(e) => setSt(e.target.value)} className="h-10 rounded-md border border-[var(--app-border)] bg-app-card px-3 text-sm">
          <option value="">Todos status</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {list.map((v, i) => {
          const s = STATUS[v.status] ?? STATUS.agendada;
          const dt = new Date(v.scheduled_at);
          const alert = v.status === "concluida" && !(v as any).followup_done;
          return (
            <motion.div key={v.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-app-card border border-[var(--app-border)] rounded-xl p-4 flex items-start gap-4 hover:border-[#2C5F7A4d] transition">
              <div className="h-12 w-12 rounded-xl bg-app-card text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">{v.lead_name[0]}</div>
              <div className="flex-1 min-w-0 grid md:grid-cols-4 gap-3 items-start">
                <div>
                  <div className="text-xs text-[var(--app-text-muted)] uppercase tracking-wide">Lead</div>
                  <div className="font-semibold text-app-text">{v.lead_name}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--app-text-muted)] uppercase tracking-wide flex items-center gap-1"><Building2 className="h-3 w-3" />Imóvel</div>
                  <div className="text-sm text-app-text truncate">{v.property}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--app-text-muted)] uppercase tracking-wide flex items-center gap-1"><UserIcon className="h-3 w-3" />Corretor</div>
                  <div className="text-sm text-app-text">{v.broker}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--app-text-muted)] uppercase tracking-wide flex items-center gap-1"><Calendar className="h-3 w-3" />Data</div>
                  <div className="text-sm text-app-text">{dt.toLocaleDateString("pt-BR")} <Clock className="h-3 w-3 inline" /> {dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-[10px] uppercase font-bold px-2 py-1 rounded" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                {(v as any).feedback && <div className="text-xs text-[var(--app-text-muted)] max-w-48 text-right line-clamp-2">"{(v as any).feedback}"</div>}
                {alert && <div className="text-[10px] font-semibold text-red-700 dark:text-red-300 flex items-center gap-1"><AlertCircle className="h-3 w-3" />Sem follow-up</div>}
              </div>
            </motion.div>
          );
        })}
        {list.length === 0 && <div className="bg-app-card border border-dashed border-[var(--app-border)] rounded-xl p-12 text-center text-[var(--app-text-muted)]">Nenhuma visita encontrada.</div>}
      </div>
    </div>
  );
}

