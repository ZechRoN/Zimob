import { leadInterest } from '@/lib/domain-input';
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormDialog } from "@/components/form-dialog";
import { Plus, Phone, Mail, Flame, MessageCircle, MapPin, Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { dateBR } from "@/lib/format";

export const Route = createFileRoute("/app/leads")({ component: Leads });

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  novo:             { label: "Novo",         color: "#166534", bg: "#DCFCE7" },
  em_atendimento:   { label: "Em atendim.",  color: "#1E40AF", bg: "#DBEAFE" },
  qualificado:      { label: "Qualificado",  color: "#C2410C", bg: "#FFEDD5" },
  visita_marcada:   { label: "Visita",       color: "#A16207", bg: "#FEF3C7" },
  proposta:         { label: "Proposta",     color: "#15803D", bg: "#DCFCE7" },
  fechado:          { label: "Fechado",      color: "#166534", bg: "#BBF7D0" },
  perdido:          { label: "Perdido",      color: "#991B1B", bg: "#FEE2E2" },
};
const SOURCE_META: Record<string, string> = {
  site: "🌐 Site", instagram: "📷 Instagram", whatsapp: "💬 WhatsApp",
  indicacao: "🤝 Indicação", google: "🔍 Google", facebook: "📘 Facebook", outro: "📥 Outro",
};

function leadScore(l: any) {
  if (l.status === "fechado") return 100;
  if (l.status === "proposta" || l.status === "qualificado") return 85;
  if (l.status === "visita_marcada") return 72;
  if (l.status === "em_atendimento") return 55;
  if (l.status === "perdido") return 10;
  return 35;
}

function Leads() {
  const { data: cu } = useCurrentUser();
  const qc = useQueryClient();
  const [tab, setTab] = useState<string>("todos");
  const [search, setSearch] = useState("");

  const q = useQuery({
    queryKey: ["leads", cu?.company?.id], enabled: !!cu?.company?.id,
    queryFn: async () => { const { data } = await supabase.from("lead").select("*").eq("company_id", cu!.company.id).order("created_at", { ascending: false }); return data ?? []; },
  });

  const create = useMutation({
    mutationFn: async (f: any) => {
      const { error } = await supabase.from("lead").insert({
        company_id: cu!.company.id, name: f.name, phone: f.phone, email: f.email,
        source: f.source || "site", interest_type: leadInterest(f.interest_type) || null, notes: f.notes || null,
        budget_max: f.budget_max ? Number(f.budget_max) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Lead criado"); qc.invalidateQueries({ queryKey: ["leads"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const team=useQuery({queryKey:['lead-team',cu?.company?.id],enabled:!!cu?.company?.id,queryFn:async()=>(await supabase.from('company_user').select('id,nome').eq("company_id", cu!.company.id)).data||[]});
  const all = q.data ?? [];
  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: all.length, quentes: 0 };
    Object.keys(STATUS_META).forEach((k) => (c[k] = 0));
    all.forEach((l: any) => {
      c[l.status] = (c[l.status] ?? 0) + 1;
      if (leadScore(l) >= 70) c.quentes++;
    });
    return c;
  }, [all]);

  const filtered = all.filter((l: any) => {
    const match = !search || `${l.name} ${l.phone} ${l.email ?? ""}`.toLowerCase().includes(search.toLowerCase());
    if (!match) return false;
    if (tab === "todos") return true;
    if (tab === "quentes") return leadScore(l) >= 70;
    return l.status === tab;
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Leads" description={`${all.length} leads no funil — ${counts.quentes} marcados como quentes`} actions={
        <FormDialog title="Novo lead" trigger={<Button className="bg-brand text-brand-foreground"><Plus className="h-4 w-4 mr-1" />Novo lead</Button>}>
          {(close) => (
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); create.mutate(Object.fromEntries(fd), { onSuccess: () => close() }); }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nome *</Label><Input name="name" required /></div>
                <div><Label>Telefone *</Label><Input name="phone" required /></div>
              </div>
              <div><Label>Email</Label><Input name="email" type="email" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Origem</Label>
                  <Select name="source" defaultValue="site"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                    {Object.entries(SOURCE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent></Select>
                </div>
                <div><Label>Interesse</Label>
                  <Select name="interest_type" defaultValue="compra"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                    <SelectItem value="compra">Compra</SelectItem><SelectItem value="aluguel">Aluguel</SelectItem>
                  </SelectContent></Select>
                </div>
              </div>
              <div><Label>Orçamento máx (R$)</Label><Input name="budget_max" type="number" /></div>
              <div><Label>Observações</Label><Textarea name="notes" rows={2} /></div>
              <Button type="submit" className="w-full bg-brand text-brand-foreground">Criar lead</Button>
            </form>
          )}
        </FormDialog>
      } />

      <Card>
        <CardContent className="p-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, telefone ou email…" className="pl-9" />
          </div>
          <Filter className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="todos">Todos <Badge variant="secondary" className="ml-2">{counts.todos}</Badge></TabsTrigger>
          <TabsTrigger value="quentes" className="text-red-700"><Flame className="h-3 w-3 mr-1" />Quentes <Badge variant="secondary" className="ml-2">{counts.quentes}</Badge></TabsTrigger>
          {Object.entries(STATUS_META).map(([k, v]) => (
            <TabsTrigger key={k} value={k}>{v.label} <Badge variant="secondary" className="ml-2">{counts[k] ?? 0}</Badge></TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((l: any) => {
          const score = leadScore(l);
          const broker={avatar:'',name:(team.data||[]).find((b:any)=>b.id===l.assigned_to)?.nome||'Não atribuído'};
          const meta = STATUS_META[l.status] ?? STATUS_META.novo;
          return (
            <Card key={l.id} className="hover:shadow-md transition border-l-4" style={{ borderLeftColor: meta.color }}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold truncate flex items-center gap-1">
                      {l.name}
                      {score >= 70 && <Flame className="h-4 w-4 text-red-600" />}
                    </div>
                    <div className="text-xs text-muted-foreground">{SOURCE_META[l.source] ?? l.source}</div>
                  </div>
                  <Badge style={{ background: meta.bg, color: meta.color }} className="border-0">{meta.label}</Badge>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3 w-3" />{l.phone}</div>
                  {l.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3 w-3" />{l.email}</div>}
                  {l.budget_max && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3 w-3" />até R$ {Number(l.budget_max).toLocaleString("pt-BR")}</div>}
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${score}%`, background: score >= 70 ? "#DC2626" : score >= 40 ? "#F59E0B" : "#3B82F6" }} />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6"><AvatarImage src={broker.avatar} /><AvatarFallback>{broker.name[0]}</AvatarFallback></Avatar>
                    <span className="text-xs text-muted-foreground truncate max-w-[100px]">{broker.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="outline" className="h-7 w-7" asChild>
                      <a href={`https://wa.me/55${l.phone?.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><MessageCircle className="h-3 w-3" /></a>
                    </Button>
                    <span className="text-[10px] text-muted-foreground self-center">{dateBR(l.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!filtered.length && <Card className="col-span-full"><CardContent className="p-10 text-center text-muted-foreground">Nenhum lead corresponde aos filtros.</CardContent></Card>}
      </div>
    </div>
  );
}
