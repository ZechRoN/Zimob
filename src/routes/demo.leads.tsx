import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, ChevronRight, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { demoLeads, demoBrokers, PIPELINE_STAGES, TAG_COLORS, brl } from "@/lib/demo-data";

export const Route = createFileRoute("/demo/leads")({ component: LeadsDemo });

function daysAgo(iso: string) { return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86400000)); }

function LeadsDemo() {
  const [q, setQ] = useState(""); const [stage, setStage] = useState("");
  const filtered = demoLeads.filter((l) =>
    (!q || l.name.toLowerCase().includes(q.toLowerCase()) || l.interest.toLowerCase().includes(q.toLowerCase())) &&
    (!stage || l.stage === stage));

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-app-text">Leads</h1>
          <p className="text-sm text-[var(--app-text-muted)]">{filtered.length} de {demoLeads.length} leads</p>
        </div>
        <Button className="bg-primary hover:bg-blue-700 text-primary-foreground"><Plus className="h-4 w-4 mr-1" />Novo lead</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--app-text-muted)]" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou interesse..." className="pl-9 bg-app-card border-[var(--app-border)]" />
        </div>
        <select value={stage} onChange={(e) => setStage(e.target.value)}
          className="h-10 rounded-md border border-[var(--app-border)] bg-app-card px-3 text-sm">
          <option value="">Todos estágios</option>
          {PIPELINE_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-app-card border border-[var(--app-border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--app-card-2)] text-[11px] uppercase tracking-wider text-[var(--app-text-muted)]">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Lead</th>
                <th className="text-left px-3 py-3 font-semibold">Origem</th>
                <th className="text-left px-3 py-3 font-semibold">Estágio</th>
                <th className="text-left px-3 py-3 font-semibold">Tag</th>
                <th className="text-left px-3 py-3 font-semibold">Corretor</th>
                <th className="text-left px-3 py-3 font-semibold">Faixa</th>
                <th className="text-left px-3 py-3 font-semibold">Últ. contato</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-border)]">
              {filtered.map((l) => {
                const broker = demoBrokers.find((b) => b.id === l.broker_id);
                const stageObj = PIPELINE_STAGES.find((s) => s.id === l.stage)!;
                const tc = TAG_COLORS[l.tag];
                const d = daysAgo(l.last_contact);
                const stale = d > 15;
                return (
                  <tr key={l.id} className="hover:bg-[var(--app-card-2)] transition cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">{l.name[0]}</div>
                        <div className="min-w-0">
                          <div className="font-semibold text-app-text">{l.name}</div>
                          <div className="text-xs text-[var(--app-text-muted)] truncate">{l.interest}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3"><span className="text-xs px-2 py-1 rounded-full bg-[var(--app-card-2)] text-[var(--app-text-muted)] font-medium">{l.source}</span></td>
                    <td className="px-3 py-3"><span className="text-[10px] uppercase font-bold px-2 py-1 rounded-md" style={{ background: stageObj.bg, color: stageObj.color }}>{stageObj.label}</span></td>
                    <td className="px-3 py-3"><span className="text-[10px] uppercase font-bold px-2 py-1 rounded" style={{ background: tc.bg, color: tc.color }}>{l.tag}</span></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <img src={broker?.avatar} alt="" className="h-6 w-6 rounded-full" />
                        <span className="text-xs">{broker?.name.split(" ")[0]}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap">{brl(l.value_min)} – {brl(l.value_max)}</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs flex items-center gap-1 ${stale ? "text-red-700 dark:text-red-300 font-semibold" : "text-[var(--app-text-muted)]"}`}>
                        {stale && <AlertCircle className="h-3 w-3" />}há {d}d
                      </span>
                    </td>
                    <td className="px-2"><ChevronRight className="h-4 w-4 text-[var(--app-text-muted)]" /></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center text-[var(--app-text-muted)] py-12">Nenhum lead encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

