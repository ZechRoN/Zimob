import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, UserCheck, Calendar, FileText, Trophy, Home, UsersRound, Sparkles,
  ArrowUpRight, ArrowDownRight, TrendingUp,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { brl } from "@/lib/format";

import { BookingLinkCard } from "@/components/booking-link-card";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

const PIE_COLORS = ["#2C5F7A", "#2563EB", "#15803D", "#991B1B", "var(--app-text-muted)"];

function Kpi({ label, value, delta, icon: Icon, accent }: { label: string; value: string | number; delta?: number; icon: any; accent?: string }) {
  const up = (delta ?? 0) >= 0;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="text-2xl font-bold mt-1">{value}</div>
            {delta !== undefined && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${up ? "text-emerald-700" : "text-red-700"}`}>
                {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(delta)}% vs mês ant.
              </div>
            )}
          </div>
          <div className="h-9 w-9 rounded-md flex items-center justify-center" style={{ background: (accent ?? "#2C5F7A") + "22", color: accent ?? "#2C5F7A" }}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { data: cu } = useCurrentUser();
  const companyId = cu?.company?.id;

  const stats = useQuery({
    queryKey: ["dash-rich", companyId], enabled: !!companyId,
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const [leadsNew, leadsFollow, visits, props, closed, propsActive, team] = await Promise.all([
        supabase.from("lead").select("id", { count: "exact", head: true }).eq("company_id", cu!.company.id).gte("created_at", since),
        supabase.from("lead").select("id", { count: "exact", head: true }).eq("company_id", cu!.company.id).in("status", ["em_atendimento", "qualificado"]),
        supabase.from("visit").select("id", { count: "exact", head: true }).eq("company_id", cu!.company.id).eq("status", "agendada"),
        supabase.from("proposal").select("id", { count: "exact", head: true }).eq("company_id", cu!.company.id).eq("status", "em_analise"),
        supabase.from("proposal").select("value").eq("company_id", cu!.company.id).eq("status", "aceita").gte("updated_at", monthStart),
        supabase.from("property").select("id", { count: "exact", head: true }).eq("company_id", cu!.company.id).eq("status", "disponivel"),
        supabase.from("company_user").select("id", { count: "exact", head: true }).eq("company_id", cu!.company.id).eq("ativo", true),
      ]);
      return {
        newLeads: leadsNew.count ?? 0,
        followLeads: leadsFollow.count ?? 0,
        scheduledVisits: visits.count ?? 0,
        openProposals: props.count ?? 0,
        monthSales: (closed.data ?? []).reduce((s:number, r: any) => s + Number(r.value ?? 0), 0),
        closeCount: (closed.data ?? []).length,
        activeProps: propsActive.count ?? 0,
        teamSize: team.count ?? 0,
      };
    },
  });

  const recentActivity = useQuery({
    queryKey: ["dash-activity", companyId], enabled: !!companyId,
    queryFn: async () => {
      const [l, v, p] = await Promise.all([
        supabase.from("lead").select("name,status,created_at").eq("company_id", cu!.company.id).order("created_at", { ascending: false }).limit(4),
        supabase.from("visit").select("lead_name,property_title,scheduled_at,status").eq("company_id", cu!.company.id).order("created_at", { ascending: false }).limit(4),
        supabase.from("proposal").select("lead_name,property_title,value,status,created_at").eq("company_id", cu!.company.id).order("created_at", { ascending: false }).limit(4),
      ]);
      const items: { date: string; label: string; kind: string }[] = [];
      (l.data ?? []).forEach((x:any) => items.push({ kind: "lead", date: x.created_at, label: `Novo lead: ${x.name} (${x.status})` }));
      (v.data ?? []).forEach((x:any) => items.push({ kind: "visita", date: x.scheduled_at, label: `Visita ${x.status}: ${x.lead_name} → ${x.property_title}` }));
      (p.data ?? []).forEach((x:any) => items.push({ kind: "proposta", date: x.created_at, label: `Proposta ${brl(Number(x.value))} — ${x.lead_name}` }));
      return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
    },
  });

  const chart=useQuery({queryKey:['dash-chart',companyId],enabled:!!companyId,queryFn:async()=>{const [leads,props,proposals]=await Promise.all((['lead','property','proposal'] as const).map(t=>supabase.from(t).select('*').eq("company_id", cu!.company.id)));return{leads:leads.data||[],props:props.data||[],proposals:proposals.data||[]}}});
  const days=(v:string)=>(Date.now()-new Date(v).getTime())/86400000;
  const forgotten=(chart.data?.leads||[]).filter((x:any)=>!['fechado','perdido'].includes(x.status)&&days(x.updated_at)>15).map((x:any)=>({...x,suggestion:'Revise o cadastro e faça contato.'}));
  const aiInsights={forgotten_leads:forgotten,stalled_proposals:(chart.data?.proposals||[]).filter((x:any)=>x.status==='em_analise'&&days(x.updated_at)>3)};
  const funnelData=['novo','em_atendimento','qualificado','visita_marcada','proposta','fechado','perdido'].map(stage=>({stage,value:(chart.data?.leads||[]).filter((x:any)=>x.status===stage).length}));
  const propertyTypeData=['casa','apartamento','terreno','comercial','rural'].map(name=>({name,value:(chart.data?.props||[]).filter((x:any)=>x.type===name).length}));
  const s = stats.data;
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Visão executiva da imobiliária" />

      <BookingLinkCard slug={cu?.company?.slug} companyName={cu?.company?.name} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Leads novos"        value={s?.newLeads        ?? 0}  icon={Users}     accent="#2C5F7A" />
        <Kpi label="Em followup"        value={s?.followLeads     ?? 0}   icon={UserCheck} accent="#1E40AF" />
        <Kpi label="Visitas agendadas"  value={s?.scheduledVisits ?? 0}  icon={Calendar}  accent="#A16207" />
        <Kpi label="Propostas abertas"  value={s?.openProposals   ?? 0}  icon={FileText}  accent="#15803D" />
        <Kpi label="Fechamentos do mês" value={s?.closeCount      ?? 0}  icon={Trophy}    accent="#166534" />
        <Kpi label="Imóveis ativos"     value={s?.activeProps     ?? 0}   icon={Home}      accent="#2563EB" />
        <Kpi label="Corretores"         value={s?.teamSize        ?? 0}                          icon={UsersRound} accent="var(--app-text-muted)" />
        <Kpi label="Sugestões"         value={aiInsights.forgotten_leads.length + aiInsights.stalled_proposals.length} icon={Sparkles} accent="#991B1B" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" />Funil de conversão</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="stage" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2C5F7A" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Imóveis por tipo</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={propertyTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {propertyTypeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend /><Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Atividades recentes</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {(recentActivity.data ?? []).map((a, i) => (
                <li key={i} className="py-2 flex items-start justify-between gap-3 text-sm">
                  <div className="flex items-start gap-2"><Badge variant="outline" className="capitalize">{a.kind}</Badge><span>{a.label}</span></div>
                  <span className="text-xs text-muted-foreground shrink-0">{new Date(a.date).toLocaleDateString("pt-BR")}</span>
                </li>
              ))}
              {(recentActivity.data ?? []).length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Sem atividade recente.</li>}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-yellow-500" />Sugestões por regras</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {aiInsights.forgotten_leads.slice(0, 3).map((x:any) => (
              <div key={x.id} className="text-sm border-l-2 border-yellow-500 pl-3">
                <div className="font-medium">{x.name}</div>
                <div className="text-xs text-muted-foreground">{x.suggestion}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Vendas do mês</CardTitle></CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{brl(s?.monthSales ?? 0)}</div>
          <div className="text-sm text-muted-foreground">em propostas aceitas neste mês</div>
        </CardContent>
      </Card>
    </div>
  );
}

