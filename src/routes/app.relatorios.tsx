import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend, AreaChart, Area } from "recharts";
import { Users, TrendingUp, Home, DollarSign } from "lucide-react";
import { brl } from "@/lib/format";

import { motion } from "framer-motion";

export const Route = createFileRoute("/app/relatorios")({ component: Page });

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-app-bg border border-app-border rounded-lg px-3 py-2 text-xs shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
      {label && <div className="text-primary font-semibold tracking-wider uppercase text-[10px]">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mt-1 text-app-text">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="opacity-70">{p.name}:</span>
          <span className="font-bold">{typeof p.value === "number" ? p.value.toLocaleString("pt-BR") : p.value}</span>
        </div>
      ))}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, i }: { label: string; value: string; icon: any; i: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
      className="app-card-glow p-5">
      <div className="h-9 w-9 rounded-lg flex items-center justify-center border border-blue-200/70 dark:border-blue-800/70"
           style={{ background: "rgba(37,99,235,0.08)" }}>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="text-2xl font-extrabold mt-3 text-app-text">{value}</div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-app-text-soft mt-1">{label}</div>
    </motion.div>
  );
}

function ChartCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`app-card-glow p-5 ${className}`}>
      <h3 className="font-bold text-app-text mb-3 tracking-tight">{title}</h3>
      {children}
    </motion.div>
  );
}

function Page() {
  const { data: cu } = useCurrentUser();
  const cid = cu?.company?.id;
  const leads = useQuery({ queryKey: ["rep-leads", cid], enabled: !!cid, queryFn: async () => (await supabase.from("lead").select("status,source,created_at,neighborhoods").eq("company_id", cu!.company.id)).data ?? [] });
  const props = useQuery({ queryKey: ["rep-props", cid], enabled: !!cid, queryFn: async () => (await supabase.from("property").select("id,status").eq("company_id", cu!.company.id)).data ?? [] });
  const revs = useQuery({ queryKey: ["rep-revs", cid], enabled: !!cid, queryFn: async () => (await supabase.from("revenue").select("amount,date").eq("company_id", cu!.company.id)).data ?? [] });

  const statusOrder = ["novo", "em_atendimento", "qualificado", "visita_marcada", "proposta", "fechado", "perdido"];
  const funnel = statusOrder.map(s => ({ status: s, total: (leads.data ?? []).filter((l: any) => l.status === s).length }));
  const sources: Record<string, number> = {};
  (leads.data ?? []).forEach((l: any) => { sources[l.source ?? "outro"] = (sources[l.source ?? "outro"] ?? 0) + 1; });
  const sourceData = Object.entries(sources).map(([k, v]) => ({ source: k, total: v }));

  const months: { label: string; mrr: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const total = (revs.data ?? []).filter((r: any) => r.date?.startsWith(key)).reduce((s:number, r: any) => s + Number(r.amount), 0);
    months.push({ label: d.toLocaleDateString("pt-BR", { month: "short" }), mrr: total });
  }

  const totalLeads = leads.data?.length ?? 0;
  const ganhos = (leads.data ?? []).filter((l: any) => l.status === "fechado").length;
  const conv = totalLeads ? Math.round((ganhos / totalLeads) * 100) : 0;
  const totalRev = (revs.data ?? []).reduce((s:number, r: any) => s + Number(r.amount), 0);
  const extra=useQuery({queryKey:['rep-team',cid],enabled:!!cid,queryFn:async()=>{const [team,proposals,commissions]=await Promise.all((['company_user','proposal','commission'] as const).map(t=>supabase.from(t).select('*').eq("company_id", cu!.company.id)));return{team:team.data||[],proposals:proposals.data||[],commissions:commissions.data||[]}}});
  const brokerChart=(extra.data?.team||[]).map((b:any)=>({name:b.nome||b.email,vendas:(extra.data?.proposals||[]).filter((x:any)=>x.corretor_id===b.id&&x.status==='aceita').length,comissao:(extra.data?.commissions||[]).filter((x:any)=>x.corretor_id===b.id).reduce((sum:number,x:any)=>sum+Number(x.value),0)}));
  const demand:Record<string,number>={};(leads.data||[]).forEach((x:any)=>(x.neighborhoods||[]).forEach((name:string)=>{demand[name]=(demand[name]||0)+1}));const neighborhoodDemand=Object.entries(demand).map(([name,value])=>({name,value}));
  const PIE = ["#3B82F6", "#2563EB", "#1D4ED8", "#5C7A8F", "#2C5F7A", "var(--app-text-muted)"];

  return (
    <div className="-m-6 p-6 min-h-screen bg-app-bg text-app-text space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="app-hero relative overflow-hidden rounded-2xl border border-app-border p-6">
        <div className="absolute inset-0 opacity-30 app-grid-bg pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary blue-pulse" />Analytics Executivo
          </div>
          <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            <span className="text-primary-gradient">Relatórios</span>
          </h1>
          <p className="mt-1 text-sm text-app-text-muted">Visão consolidada do desempenho · {totalLeads} leads · {props.data?.length ?? 0} imóveis</p>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-4 gap-3">
        <MetricCard i={0} label="Leads totais" value={String(totalLeads)} icon={Users} />
        <MetricCard i={1} label="Conversão" value={`${conv}%`} icon={TrendingUp} />
        <MetricCard i={2} label="Imóveis" value={String(props.data?.length ?? 0)} icon={Home} />
        <MetricCard i={3} label="Receita total" value={brl(totalRev)} icon={DollarSign} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title="Funil de leads">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={funnel}>
                <defs><linearGradient id="rGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#1D4ED8" /></linearGradient></defs>
                <CartesianGrid stroke="var(--app-grid-line)" vertical={false} />
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: "var(--app-text-soft)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--app-text-soft)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(37,99,235,0.06)" }} />
                <Bar dataKey="total" fill="url(#rGold)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Leads por origem">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={sourceData}>
                <defs><linearGradient id="rPet" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5C7A8F" /><stop offset="100%" stopColor="#2C5F7A" /></linearGradient></defs>
                <CartesianGrid stroke="var(--app-grid-line)" vertical={false} />
                <XAxis dataKey="source" tick={{ fontSize: 11, fill: "var(--app-text-soft)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--app-text-soft)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(37,99,235,0.06)" }} />
                <Bar dataKey="total" fill="url(#rPet)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="MRR (6 meses)" className="md:col-span-2">
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={months}>
                <defs><linearGradient id="rArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B82F6" stopOpacity={0.5} /><stop offset="100%" stopColor="#2563EB" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="var(--app-grid-line)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--app-text-soft)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--app-text-soft)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="mrr" stroke="#3B82F6" strokeWidth={2} fill="url(#rArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Bairros mais procurados">
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={neighborhoodDemand} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={80} paddingAngle={2}>
                  {neighborhoodDemand.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11, color: "var(--app-text-muted)" }} /><Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Performance por corretor">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={brokerChart}>
                <defs>
                  <linearGradient id="bPet" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5C7A8F" /><stop offset="100%" stopColor="#2C5F7A" /></linearGradient>
                  <linearGradient id="bGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#1D4ED8" /></linearGradient>
                </defs>
                <CartesianGrid stroke="var(--app-grid-line)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--app-text-soft)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--app-text-soft)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(37,99,235,0.06)" }} /><Legend wrapperStyle={{ fontSize: 11, color: "var(--app-text-muted)" }} />
                <Bar dataKey="vendas" fill="url(#bPet)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="comissao" fill="url(#bGold)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
