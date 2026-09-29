import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { useState } from "react";
import { dateTimeBR, dateBR } from "@/lib/format";
import { Calendar, FileText, XCircle, Phone, Mail, User, Flame, Snowflake, Sparkles, TrendingUp } from "lucide-react";
import { PIPELINE_STAGES, TAG_COLORS, brl } from "@/lib/demo-data";
import { motion } from "framer-motion";

export const Route = createFileRoute("/app/pipeline")({ component: Pipeline });

// Map DB lead.status to our 9 stages
const DB_TO_STAGE: Record<string, string> = {
  novo: "lead_novo", em_atendimento: "contato_iniciado", qualificado: "qualificado",
  visita_marcada: "visita_marcada", proposta: "proposta_enviada", fechado: "fechado", perdido: "perdido",
};

function leadTag(l: any): keyof typeof TAG_COLORS {
  if (l.status === "perdido") return "frio";
  if (l.status === "novo") return "novo";
  if (["qualificado", "proposta", "visita_marcada"].includes(l.status)) return "quente";
  return "morno";
}

const TAG_ICONS: Record<string, any> = { quente: Flame, morno: TrendingUp, frio: Snowflake, novo: Sparkles };

function Pipeline() {
  const { data: cu } = useCurrentUser();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["pipeline", cu?.company?.id], enabled: !!cu?.company?.id,
    queryFn: async () => { const { data } = await supabase.from("lead").select("*").order("created_at", { ascending: false }); return data ?? []; },
  });

  const onDragEnd = async (r: DropResult) => {
    if (!r.destination) return;
    const targetStage = r.destination.droppableId;
    // map our stage back to DB status
    const reverse: Record<string, string> = {
      lead_novo: "novo", contato_iniciado: "em_atendimento", qualificado: "qualificado",
      visita_marcada: "visita_marcada", visita_realizada: "visita_marcada",
      proposta_enviada: "proposta", negociacao: "proposta", fechado: "fechado", perdido: "perdido",
    };
    const newStatus = reverse[targetStage] ?? targetStage;
    const id = r.draggableId;
    qc.setQueryData(["pipeline", cu?.company?.id], (old: any[] = []) => old.map((l) => l.id === id ? { ...l, status: newStatus } : l));
    const { error } = await supabase.from("lead").update({ status: newStatus as any }).eq("id", id);
    if (error) { toast.error(error.message); qc.invalidateQueries({ queryKey: ["pipeline"] }); }
    else toast.success("Lead movido");
  };

  const selectedLead = (q.data ?? []).find((l: any) => l.id === selectedId);

  return (
    <div className="-m-6 p-6 min-h-screen bg-app-bg text-app-text">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="app-hero relative overflow-hidden rounded-2xl border border-app-border p-6 mb-5">
        <div className="absolute inset-0 opacity-30 app-grid-bg pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary blue-pulse" />Pipeline · 9 estágios
          </div>
          <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Pipeline <span className="text-primary-gradient">de Vendas</span>
          </h1>
          <p className="mt-1 text-sm text-app-text-muted">Arraste leads entre estágios · {(q.data ?? []).length} oportunidades</p>
        </div>
      </motion.div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-6">
          {PIPELINE_STAGES.map((col) => {
            const items = (q.data ?? []).filter((l: any) => (DB_TO_STAGE[l.status] ?? l.status) === col.id);
            return (
              <Droppable droppableId={col.id} key={col.id}>
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="w-80 shrink-0">
                    <div className="flex items-center justify-between mb-2 px-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full blue-pulse" style={{ background: col.color, boxShadow: `0 0 12px ${col.color}` }} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-text">{col.label}</span>
                      </div>
                      <span className="min-w-5 h-5 px-1.5 flex items-center justify-center text-[10px] font-bold rounded-full border border-blue-200/70 dark:border-blue-800/70 bg-blue-50 dark:bg-blue-950/35 text-primary">{items.length}</span>
                    </div>
                    <div className="h-[2px] mb-2 rounded-full" style={{ background: `linear-gradient(90deg, ${col.color}, transparent)` }} />
                    <div className={`space-y-3 min-h-[520px] rounded-xl p-3 border transition-all duration-300 ${snapshot.isDraggingOver ? "border-primary bg-blue-50 dark:bg-blue-950/30 blue-glow" : "border-app-border bg-app-card-2"}`}>
                      {items.map((l: any, idx:number) => {
                        const tag = leadTag(l);
                        const tc = TAG_COLORS[tag];
                        const Icon = TAG_ICONS[tag] ?? Sparkles;
                        const hot = tag === "quente";
                        return (
                          <Draggable draggableId={l.id} index={idx} key={l.id}>
                            {(p, snap) => (
                              <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}
                                onClick={() => setSelectedId(l.id)}
                                className={`relative bg-app-card border rounded-xl p-4 cursor-pointer transition-all duration-300 shadow-sm ${snap.isDragging ? "border-primary blue-glow-strong scale-[1.02] rotate-1" : "border-app-border hover:border-blue-300 dark:hover:border-blue-700 hover:-translate-y-0.5"}`}
                                style={{ borderLeftWidth: 3, borderLeftColor: col.color }}>
                                {hot && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary blue-pulse" />}
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div className="font-semibold text-base leading-tight text-app-text">{l.name}</div>
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border inline-flex items-center gap-1 shrink-0"
                                    style={{ background: tc.bg + "20", color: tc.color, borderColor: tc.color + "44" }}>
                                    <Icon className="h-2.5 w-2.5" />{tag}
                                  </span>
                                </div>
                                {l.notes && <div className="text-xs text-app-text-muted line-clamp-2 mb-2">{l.notes}</div>}
                                <div className="mt-3 rounded-lg border border-app-border bg-app-card-2 px-3 py-2 text-[11px] text-app-text-muted">
                                  <div className="flex justify-between gap-3"><span>Status</span><span className="font-semibold text-app-text">{l.status}</span></div>
                                  {l.source && <div className="mt-1 flex justify-between gap-3"><span>Origem</span><span className="font-semibold text-primary">{l.source}</span></div>}
                                </div>
                                <div className="flex items-center justify-between text-xs mt-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground"
                                          style={{ background: "var(--gradient-blue)" }}>
                                      {(l.assigned_to ?? "??").slice(0, 1).toUpperCase()}
                                    </span>
                                    <span className="text-[10px] text-app-text-muted truncate max-w-24">Corretor</span>
                                  </div>
                                  {!!l.budget_max && <span className="font-bold text-primary">{brl(Number(l.budget_max))}</span>}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      <LeadSheet leadId={selectedId} lead={selectedLead} onClose={() => setSelectedId(null)} companyId={cu?.company?.id} />
    </div>
  );
}

function LeadSheet({ leadId, lead, onClose, companyId }: any) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"info" | "visita" | "proposta" | "perdido">("info");
  const timeline = useQuery({
    queryKey: ["lead-timeline", leadId], enabled: !!leadId,
    queryFn: async () => {
      const [v, p] = await Promise.all([
        supabase.from("visit").select("*").eq("lead_id", leadId).order("created_at", { ascending: false }),
        supabase.from("proposal").select("*").eq("lead_id", leadId).order("created_at", { ascending: false }),
      ]);
      const items: any[] = [];
      (v.data ?? []).forEach((x:any) => items.push({ kind: "visit", date: x.created_at, label: `Visita ${x.status} em ${dateTimeBR(x.scheduled_at)}` }));
      (p.data ?? []).forEach((x:any) => items.push({ kind: "proposal", date: x.created_at, label: `Proposta R$ ${x.value} — ${x.status}` }));
      return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
  });
  const properties = useQuery({
    queryKey: ["props-pick", companyId], enabled: !!companyId && !!leadId,
    queryFn: async () => { const { data } = await supabase.from("property").select("id,title").limit(100); return data ?? []; },
  });
  const closeAll = () => { setTab("info"); onClose(); };
  const markLost = async (reason: string) => {
    const { error } = await supabase.from("lead").update({ status: "perdido", lost_reason: reason }).eq("id", leadId);
    if (error) toast.error(error.message); else { toast.success("Lead marcado como perdido"); qc.invalidateQueries({ queryKey: ["pipeline"] }); closeAll(); }
  };
  const createVisit = async (form: any) => {
    const prop = properties.data?.find((p: any) => p.id === form.property_id);
    const { error } = await supabase.from("visit").insert({
      company_id: companyId, lead_id: leadId, lead_name: lead?.name, lead_phone: lead?.phone,
      property_id: form.property_id, property_title: prop?.title, scheduled_at: form.scheduled_at, notes: form.notes,
    });
    if (error) toast.error(error.message);
    else { toast.success("Visita criada"); await supabase.from("lead").update({ status: "visita_marcada" }).eq("id", leadId); qc.invalidateQueries({ queryKey: ["pipeline"] }); qc.invalidateQueries({ queryKey: ["lead-timeline", leadId] }); setTab("info"); }
  };
  const createProposal = async (form: any) => {
    const prop = properties.data?.find((p: any) => p.id === form.property_id);
    const { error } = await supabase.from("proposal").insert({
      company_id: companyId, lead_id: leadId, lead_name: lead?.name,
      property_id: form.property_id, property_title: prop?.title, value: Number(form.value), payment_terms: form.payment_terms,
    });
    if (error) toast.error(error.message);
    else { toast.success("Proposta criada"); await supabase.from("lead").update({ status: "proposta" }).eq("id", leadId); qc.invalidateQueries({ queryKey: ["pipeline"] }); qc.invalidateQueries({ queryKey: ["lead-timeline", leadId] }); setTab("info"); }
  };
  return (
    <Sheet open={!!leadId} onOpenChange={(o) => !o && closeAll()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {lead && (<>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><User className="h-5 w-5" />{lead.name}</SheetTitle>
            <SheetDescription>
              <span className="flex items-center gap-3 text-xs mt-1">
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>
                {lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>}
              </span>
            </SheetDescription>
          </SheetHeader>
          <div className="flex gap-2 mt-4 flex-wrap">
            <Button size="sm" variant={tab === "visita" ? "default" : "outline"} onClick={() => setTab("visita")}><Calendar className="h-3 w-3 mr-1" />Agendar visita</Button>
            <Button size="sm" variant={tab === "proposta" ? "default" : "outline"} onClick={() => setTab("proposta")}><FileText className="h-3 w-3 mr-1" />Criar proposta</Button>
            <Button size="sm" variant={tab === "perdido" ? "destructive" : "outline"} onClick={() => setTab("perdido")}><XCircle className="h-3 w-3 mr-1" />Perdido</Button>
          </div>
          {tab === "info" && (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge>{lead.source}</Badge>
                <Badge variant="outline">{lead.status}</Badge>
                {!!lead.budget_max && <Badge variant="outline">Até {brl(Number(lead.budget_max))}</Badge>}
              </div>
              {lead.notes && <div><div className="text-xs uppercase text-muted-foreground mb-1">Notas</div><p className="text-sm">{lead.notes}</p></div>}
              <div>
                <div className="text-xs uppercase text-muted-foreground mb-2">Histórico</div>
                {(timeline.data ?? []).length === 0
                  ? <p className="text-sm text-muted-foreground">Sem eventos ainda.</p>
                  : <ul className="space-y-3">{timeline.data!.map((t, i) => (
                      <li key={i} className="text-sm border-l-2 border-brand pl-3">
                        <div>{t.label}</div>
                        <div className="text-xs text-muted-foreground">{dateBR(t.date)}</div>
                      </li>))}</ul>}
              </div>
            </div>
          )}
          {tab === "visita" && (
            <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); createVisit(Object.fromEntries(fd)); }}>
              <div><Label>Imóvel</Label>
                <Select name="property_id" required><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{(properties.data ?? []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Data e hora</Label><Input name="scheduled_at" type="datetime-local" required /></div>
              <div><Label>Notas</Label><Textarea name="notes" rows={2} /></div>
              <Button type="submit" className="w-full bg-brand text-brand-foreground">Agendar visita</Button>
            </form>
          )}
          {tab === "proposta" && (
            <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); createProposal(Object.fromEntries(fd)); }}>
              <div><Label>Imóvel</Label>
                <Select name="property_id" required><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{(properties.data ?? []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Valor (R$)</Label><Input name="value" type="number" step="0.01" required /></div>
              <div><Label>Condições</Label><Textarea name="payment_terms" rows={2} /></div>
              <Button type="submit" className="w-full bg-brand text-brand-foreground">Criar proposta</Button>
            </form>
          )}
          {tab === "perdido" && (
            <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); markLost(String(fd.get("reason") || "")); }}>
              <div><Label>Motivo</Label><Textarea name="reason" rows={3} required placeholder="Ex.: optou pela concorrência" /></div>
              <Button type="submit" variant="destructive" className="w-full">Marcar como perdido</Button>
            </form>
          )}
        </>)}
      </SheetContent>
    </Sheet>
  );
}

