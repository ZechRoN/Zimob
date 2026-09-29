import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { KpiCard } from "@/components/kpi-card";
import { Plus, Calendar as CalendarIcon, Clock, MapPin, User, MessageSquare, CheckCircle2, XCircle, Phone } from "lucide-react";
import { dateTimeBR } from "@/lib/format";
import { toast } from "sonner";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/app/visitas")({ component: Visitas });

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  agendada:    { label: "Agendada",    color: "#1E40AF", bg: "#DBEAFE", icon: CalendarIcon },
  realizada:   { label: "Realizada",   color: "#166534", bg: "#BBF7D0", icon: CheckCircle2 },
  cancelada:   { label: "Cancelada",   color: "#991B1B", bg: "#FEE2E2", icon: XCircle },
  no_show:     { label: "Não compareceu", color: "var(--app-text-muted)", bg: "#F3F4F6", icon: XCircle },
};

function startOfWeek(d = new Date()) {
  const x = new Date(d);
  x.setDate(x.getDate() - x.getDay());
  x.setHours(0, 0, 0, 0);
  return x;
}

function Visitas() {
  const { data: cu } = useCurrentUser();
  const qc = useQueryClient();
  const [tab, setTab] = useState<string>("todas");

  const q = useQuery({
    queryKey: ["visitas", cu?.company?.id], enabled: !!cu?.company?.id,
    queryFn: async () => { const { data } = await supabase.from("visit").select("*").order("scheduled_at"); return data ?? []; },
  });

  const propsQ = useQuery({
    queryKey: ["properties-min", cu?.company?.id], enabled: !!cu?.company?.id,
    queryFn: async () => { const { data } = await supabase.from("property").select("id,title").eq("company_id", cu!.company.id).order("title"); return data ?? []; },
  });

  const m = useMutation({
    mutationFn: async (f: any) => {
      const prop = (propsQ.data ?? []).find((p: any) => p.id === f.property_id);
      if (!prop) throw new Error("Selecione um imóvel");
      const { error } = await supabase.from("visit").insert({
        company_id: cu!.company.id, property_title: prop.title, lead_name: f.lead_name,
        lead_phone: f.lead_phone, scheduled_at: f.scheduled_at, notes: f.notes,
        corretor_nome: f.corretor_nome, property_id: prop.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Visita agendada"); qc.invalidateQueries({ queryKey: ["visitas"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, feedback }: { id: string; status: string; feedback?: string }) => {
      const { error } = await supabase.from("visit").update({ status: status as any, feedback }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Visita atualizada"); qc.invalidateQueries({ queryKey: ["visitas"] }); },
  });

  const all = q.data ?? [];
  const sow = startOfWeek();
  const eow = new Date(sow); eow.setDate(eow.getDate() + 7);

  const kpis = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      total: all.length,
      hoje: all.filter((v: any) => { const d = new Date(v.scheduled_at); return d >= today && d < tomorrow; }).length,
      semana: all.filter((v: any) => { const d = new Date(v.scheduled_at); return d >= sow && d < eow; }).length,
      concluidas: all.filter((v: any) => v.status === "realizada").length,
    };
  }, [all]);

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(sow); d.setDate(d.getDate() + i);
    return d;
  });
  const visitsByDay = days.map((d) => {
    const next = new Date(d); next.setDate(next.getDate() + 1);
    return all.filter((v: any) => { const dd = new Date(v.scheduled_at); return dd >= d && dd < next; });
  });

  const filtered = tab === "todas" ? all : all.filter((v: any) => v.status === tab);

  return (
    <div className="space-y-6">
      <PageHeader title="Visitas" description="Calendário semanal e lista completa" actions={
        <FormDialog title="Nova visita" trigger={<Button className="bg-brand text-brand-foreground"><Plus className="h-4 w-4 mr-1" />Nova visita</Button>}>
          {(close) => (
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); m.mutate(Object.fromEntries(fd), { onSuccess: () => close() }); }} className="space-y-3">
              <div>
                <Label>Imóvel *</Label>
                <Select name="property_id" required>
                  <SelectTrigger><SelectValue placeholder={propsQ.data?.length ? "Selecione um imóvel" : "Nenhum imóvel cadastrado"} /></SelectTrigger>
                  <SelectContent>
                    {(propsQ.data ?? []).map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Lead *</Label><Input name="lead_name" required /></div>
                <div><Label>Telefone</Label><Input name="lead_phone" placeholder="(11) 99999-9999" /></div>
              </div>
              <div><Label>Corretor responsável</Label><Input name="corretor_nome" placeholder="Nome do corretor" /></div>
              <div><Label>Data e hora *</Label><Input name="scheduled_at" type="datetime-local" required /></div>
              <div><Label>Observações</Label><Textarea name="notes" rows={2} /></div>
              <Button type="submit" className="w-full bg-brand text-brand-foreground">Agendar visita</Button>
            </form>
          )}
        </FormDialog>
      } />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total" value={kpis.total} icon={CalendarIcon} />
        <KpiCard label="Hoje" value={kpis.hoje} icon={Clock} hint="próximas 24h" />
        <KpiCard label="Esta semana" value={kpis.semana} icon={CalendarIcon} />
        <KpiCard label="Concluídas" value={kpis.concluidas} icon={CheckCircle2} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Agenda da semana</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {days.map((d, i) => {
              const list = visitsByDay[i];
              const isToday = d.toDateString() === new Date().toDateString();
              return (
                <div key={i} className={`rounded-md border p-2 min-h-[140px] ${isToday ? "border-brand bg-brand/5" : "border-border"}`}>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.toLocaleDateString("pt-BR", { weekday: "short" })}</div>
                  <div className={`text-lg font-bold ${isToday ? "text-brand" : ""}`}>{d.getDate()}</div>
                  <div className="space-y-1 mt-2">
                    {list.slice(0, 3).map((v: any) => {
                      const meta = STATUS_META[v.status] ?? STATUS_META.agendada;
                      return (
                        <div key={v.id} className="text-[10px] p-1 rounded" style={{ background: meta.bg, color: meta.color }}>
                          <div className="font-semibold">{new Date(v.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                          <div className="truncate">{v.lead_name}</div>
                        </div>
                      );
                    })}
                    {list.length > 3 && <div className="text-[10px] text-muted-foreground">+{list.length - 3} mais</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="todas">Todas <Badge variant="secondary" className="ml-2">{all.length}</Badge></TabsTrigger>
          {Object.entries(STATUS_META).map(([k, v]) => (
            <TabsTrigger key={k} value={k}>{v.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((v: any) => {
          const meta = STATUS_META[v.status] ?? STATUS_META.agendada;
          const Icon = meta.icon;
          return (
            <Card key={v.id} className="border-l-4" style={{ borderLeftColor: meta.color }}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <Badge style={{ background: meta.bg, color: meta.color }} className="border-0"><Icon className="h-3 w-3 mr-1" />{meta.label}</Badge>
                  <span className="text-xs text-muted-foreground">{dateTimeBR(v.scheduled_at)}</span>
                </div>
                <div className="font-semibold text-sm flex items-start gap-2"><MapPin className="h-4 w-4 text-brand shrink-0 mt-0.5" />{v.property_title}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2"><User className="h-3 w-3" />{v.lead_name}{v.lead_phone && <> · <Phone className="h-3 w-3" />{v.lead_phone}</>}</div>
                {v.corretor_nome && (
                  <div className="flex items-center gap-2 text-xs"><Avatar className="h-5 w-5"><AvatarFallback className="text-[10px]">{v.corretor_nome[0]}</AvatarFallback></Avatar><span>{v.corretor_nome}</span></div>
                )}
                {v.feedback && (
                  <div className="text-xs p-2 rounded bg-muted/50 line-clamp-2 flex gap-1"><MessageSquare className="h-3 w-3 shrink-0 mt-0.5" />{v.feedback}</div>
                )}
                {v.status === "agendada" && (
                  <div className="flex gap-1 pt-2">
                    <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => updateStatus.mutate({ id: v.id, status: "realizada" })}><CheckCircle2 className="h-3 w-3 mr-1" />Concluir</Button>
                    <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => updateStatus.mutate({ id: v.id, status: "cancelada" })}><XCircle className="h-3 w-3 mr-1" />Cancelar</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {!filtered.length && <Card className="col-span-full"><CardContent className="p-10 text-center text-muted-foreground">Nenhuma visita.</CardContent></Card>}
      </div>
    </div>
  );
}

