import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Users, TrendingUp, Wallet, Calendar } from "lucide-react";
import { demoLeads, demoBrokers, brokerStats, demoCommissions, demoVisits, demoProperties, PIPELINE_STAGES, brl } from "@/lib/demo-data";

export const Route = createFileRoute("/demo/relatorios")({ component: RelatoriosDemo });

const PIE_COLORS = ["#3B82F6", "#2563EB", "#1D4ED8", "#5C7A8F", "#2C5F7A", "var(--app-text-muted)"];

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

function RelatoriosDemo() {
  const closed = demoLeads.filter((l) => l.stage === "fechado").length;
  const convRate = ((closed / demoLeads.length) * 100).toFixed(1);
  const totalComm = demoCommissions.reduce((s:number, c) => s + c.value, 0);
  const visitsRealized = demoVisits.filter((v) => v.status === "concluida").length;

  const kpis = [
    { label: "Total Leads",        value: demoLeads.length, icon: Users },
    { label: "Taxa Conversão",     value: `${convRate}%`,   icon: TrendingUp },
    { label: "Comissões",          value: brl(totalComm),   icon: Wallet },
    { label: "Visitas Realizadas", value: visitsRealized,   icon: Calendar },
  ];

  const funnel = PIPELINE_STAGES.map((s) => ({ name: s.label, count: demoLeads.filter((l) => l.stage === s.id).length }));
  const origin = Array.from(new Set(demoLeads.map((l) => l.source))).map((s) => ({ name: s, value: demoLeads.filter((l) => l.source === s).length }));
  const brokers = demoBrokers.filter((b) => b.role !== "sdr" && b.role !== "financeiro").map((b) => ({
    name: b.name.split(" ")[0],
    leads: demoLeads.filter((l) => l.broker_id === b.id).length,
    fechados: demoLeads.filter((l) => l.broker_id === b.id && l.stage === "fechado").length,
  }));
  const types = Array.from(new Set(demoProperties.map((p) => p.type))).map((t) => ({ name: t, value: demoProperties.filter((p) => p.type === t).length }));
  const hoods = Array.from(new Set(demoProperties.map((p) => p.neighborhood))).map((n) => ({ name: n, value: demoProperties.filter((p) => p.neighborhood === n).length })).sort((a, b) => b.value - a.value).slice(0, 6);

  return (
    <div className="-m-4 md:-m-6 p-4 md:p-6 min-h-screen bg-app-bg text-app-text space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="app-hero relative overflow-hidden rounded-2xl border border-app-border p-6">
        <div className="absolute inset-0 opacity-30 app-grid-bg pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary blue-pulse" />Analytics · Performance
          </div>
          <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            <span className="text-primary-gradient">Relatórios</span> executivos
          </h1>
          <p className="mt-1 text-sm text-app-text-muted">Análise consolidada · {demoLeads.length} leads · {demoProperties.length} imóveis</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="app-card-glow p-5">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center border border-blue-200/70 dark:border-blue-800/70"
                 style={{ background: "rgba(37,99,235,0.08)" }}>
              <k.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-extrabold mt-3 text-app-text">{k.value}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-app-text-soft mt-1">{k.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Funil de Vendas">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={funnel} margin={{ left: -20, right: 5 }}>
              <defs><linearGradient id="rGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#1D4ED8" /></linearGradient></defs>
              <CartesianGrid stroke="var(--app-grid-line)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--app-text-soft)" }} angle={-25} textAnchor="end" height={60} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--app-text-soft)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(37,99,235,0.06)" }} />
              <Bar dataKey="count" fill="url(#rGold)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Origem dos Leads">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={origin} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={75} paddingAngle={2}>
                {origin.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} /><Legend wrapperStyle={{ fontSize: 11, color: "var(--app-text-muted)" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Performance por Corretor">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={brokers}>
              <defs>
                <linearGradient id="rPetrol" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5C7A8F" /><stop offset="100%" stopColor="#2C5F7A" /></linearGradient>
                <linearGradient id="rGold2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#1D4ED8" /></linearGradient>
              </defs>
              <CartesianGrid stroke="var(--app-grid-line)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--app-text-soft)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--app-text-soft)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(37,99,235,0.06)" }} /><Legend wrapperStyle={{ fontSize: 11, color: "var(--app-text-muted)" }} />
              <Bar dataKey="leads" fill="url(#rPetrol)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="fechados" fill="url(#rGold2)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Imóveis por Tipo">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={types}>
              <CartesianGrid stroke="var(--app-grid-line)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--app-text-soft)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--app-text-soft)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(37,99,235,0.06)" }} />
              <Bar dataKey="value" fill="url(#rGold)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Top Bairros" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hoods} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid stroke="var(--app-grid-line)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--app-text-soft)" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--app-text-muted)" }} width={80} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(37,99,235,0.06)" }} />
              <Bar dataKey="value" fill="url(#rGold)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Ranking de Corretores">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-[0.18em] text-app-text-soft">
            <tr className="border-b border-app-border"><th className="text-left py-2 font-semibold">Corretor</th><th className="text-right py-2 font-semibold">Leads</th><th className="text-right py-2 font-semibold">Fechamentos</th><th className="text-right py-2 font-semibold">Taxa</th><th className="text-right py-2 font-semibold">Comissão</th></tr>
          </thead>
          <tbody className="divide-y divide-app-border">
            {brokerStats.filter(b => b.active_props > 0).map((b) => {
              const leads = demoLeads.filter((l) => l.broker_id === b.id).length;
              const closed = demoLeads.filter((l) => l.broker_id === b.id && l.stage === "fechado").length;
              const rate = leads ? ((closed / leads) * 100).toFixed(0) : "0";
              return (
                <tr key={b.id} className="hover:bg-blue-50/70 dark:bg-blue-950/25 transition-colors">
                  <td className="py-3 flex items-center gap-2.5"><img src={b.avatar} alt="" className="h-7 w-7 rounded-full ring-1 ring-blue-200 dark:ring-blue-800" /><span className="font-medium text-app-text">{b.name}</span></td>
                  <td className="text-right text-app-text-muted">{leads}</td>
                  <td className="text-right font-semibold text-app-text">{closed}</td>
                  <td className="text-right text-app-text-muted">{rate}%</td>
                  <td className="text-right font-extrabold text-primary">{brl(b.commission_month)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ChartCard>
    </div>
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

