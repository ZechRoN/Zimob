import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Clock, FileText, Building2, ChevronDown, MessageCircle, ClipboardCheck, BellRing, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoLeads, aiInsights, brl } from "@/lib/demo-data";
import { toast } from "sonner";

export const Route = createFileRoute("/demo/ai-growth")({ component: AIGrowthDemo });

const CARDS = [
  {
    id: "forgotten", title: "Leads sem contato +15 dias", icon: AlertCircle, color: "#991B1B", bg: "#FEE2E2",
    items: aiInsights.forgotten_leads, action: "Reativar contato", actionIcon: MessageCircle,
  },
  {
    id: "noFollow", title: "Visitas sem follow-up", icon: Clock, color: "#92400E", bg: "#FEF3C7",
    items: aiInsights.visits_without_followup, action: "Marcar follow-up", actionIcon: ClipboardCheck,
  },
  {
    id: "stalled", title: "Propostas paradas +7 dias", icon: FileText, color: "#2C5F7A", bg: "#E8F0F5",
    items: aiInsights.stalled_proposals, action: "Cobrar resposta", actionIcon: BellRing,
  },
  {
    id: "lowProps", title: "Imóveis com baixa atividade +30 dias", icon: Building2, color: "var(--app-text-muted)", bg: "var(--app-card-2)",
    items: aiInsights.low_activity_properties, action: "Republicar", actionIcon: RefreshCw,
  },
];

function AIGrowthDemo() {
  const [open, setOpen] = useState<string | null>("forgotten");

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-[#2C5F7A1A] flex items-center justify-center"><Zap className="h-6 w-6 text-primary" /></div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-app-text">AI Growth Engine</h1>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#E8F0F5] text-primary border border-[#2C5F7A33]">Beta</span>
          </div>
          <p className="text-sm text-[var(--app-text-muted)] mt-0.5">Inteligência que detecta oportunidades perdidas e sugere ações</p>
        </div>
      </div>

      <div className="space-y-3">
        {CARDS.map((c, i) => {
          const isOpen = open === c.id;
          return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-app-card border border-[var(--app-border)] rounded-xl overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : c.id)} className="w-full flex items-center gap-4 p-4 hover:bg-[var(--app-card-2)] transition text-left">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: c.bg, color: c.color }}><c.icon className="h-5 w-5" /></div>
                <div className="flex-1">
                  <div className="font-bold text-app-text">{c.title}</div>
                  <div className="text-xs text-[var(--app-text-muted)] mt-0.5">{c.items.length} oportunidade{c.items.length !== 1 ? "s" : ""} detectada{c.items.length !== 1 ? "s" : ""}</div>
                </div>
                <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ background: c.bg, color: c.color }}>{c.items.length}</span>
                <ChevronDown className={`h-4 w-4 text-[var(--app-text-muted)] transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="border-t border-[var(--app-border)] divide-y divide-[var(--app-border)]">
                  {c.items.map((it: any) => {
                    const lead = demoLeads.find((l) => l.id === it.id);
                    const phone = lead?.phone?.replace(/\D/g, "");
                    const wa = phone ? `https://wa.me/55${phone}` : "#";
                    return (
                      <div key={it.id} className="p-4 flex items-start gap-3">
                        <div className="flex-1">
                          <div className="font-semibold text-app-text">{it.name ?? it.lead ?? it.title}</div>
                          <div className="text-xs text-[var(--app-text-muted)] mt-1">há {it.days_since}d · {it.suggestion}</div>
                          {lead && <div className="text-xs text-primary font-semibold mt-1">{brl(lead.value_min)} – {brl(lead.value_max)} · {lead.source}</div>}
                        </div>
                        <Button asChild={c.id === "forgotten"} size="sm" variant="outline" className="border-[var(--app-border)]"
                          onClick={c.id === "forgotten" ? undefined : () => toast.success(`${c.action} disparado (demo)`)}>
                          {c.id === "forgotten" ? (
                            <a href={wa} target="_blank" rel="noreferrer"><c.actionIcon className="h-3 w-3 mr-1" />{c.action}</a>
                          ) : (
                            <span><c.actionIcon className="h-3 w-3 mr-1" />{c.action}</span>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

