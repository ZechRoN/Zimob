import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Users, TrendingUp, Calendar, FileText, CheckCircle, Building2, ArrowUpRight, Zap, MapPin } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area, Line, LineChart } from "recharts";
import { demoLeads, demoProperties, brl, PIPELINE_STAGES } from "@/lib/demo-data";

export const Route = createFileRoute("/demo/dashboard")({ component: DashboardDemo });

const KPIS = [
  { label: "Leads Novos",    value: 24, delta: 12, icon: Users,       spark: [3,5,4,6,8,7,9,12] },
  { label: "Em Follow-up",   value: 18, delta: 8,  icon: TrendingUp,  spark: [4,6,8,7,9,11,10,12] },
  { label: "Visitas",        value: 13, delta: -5, icon: Calendar,    spark: [10,12,9,8,11,9,7,8] },
  { label: "Propostas",      value: 7,  delta: 20, icon: FileText,    spark: [2,3,4,3,5,6,7,8] },
  { label: "Fechamentos",    value: 4,  delta: 33, icon: CheckCircle, spark: [1,2,2,3,2,4,3,5] },
  { label: "GMV do mês",     value: "R$ 4.2M", delta: 18, icon: Building2, spark: [1.2,1.8,2.1,2.4,2.9,3.2,3.8,4.2] },
];

const PIE = [
  { name: "WhatsApp",  value: 28, color: "#2563EB" },
  { name: "Instagram", value: 22, color: "#3B82F6" },
  { name: "Site",      value: 18, color: "#1D4ED8" },
  { name: "Indicação", value: 14, color: "#5C7A8F" },
  { name: "Portal",    value: 11, color: "#2C5F7A" },
  { name: "Vitrine",   value: 7,  color: "var(--app-text-muted)" },
];

const STAGE_COUNTS = PIPELINE_STAGES.slice(0, 7).map((s, i) => ({
  name: s.label, count: demoLeads.filter((l) => l.stage === s.id).length || (7 - i + 2),
}));

const REVENUE_12W = Array.from({ length: 12 }).map((_, i) => ({
  week: `S${i + 1}`,
  gmv: 180 + Math.round(Math.sin(i / 1.4) * 90 + i * 18),
  meta: 250,
}));

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-app-card border border-app-border rounded-lg px-3 py-2 text-xs shadow-[0_8px_30px_rgba(0,0,0,0.18)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
      <div className="text-primary font-semibold tracking-wider uppercase text-[10px]">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mt-1 text-app-text">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="opacity-70">{p.name}:</span>
          <span className="font-bold">{typeof p.value === "number" ? p.value.toLocaleString("pt-BR") : p.value}</span>
        </div>
      ))}
    </div>
  );
}

function Kpi({ k, i }: { k: typeof KPIS[number]; i: number }) {
  const up = k.delta >= 0;
  const sparkData = k.spark.map((v, idx) => ({ x: idx, y: v }));
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07, duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
      onMouseMove={(e) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        (e.currentTarget as HTMLElement).style.setProperty("--mx", `${e.clientX - r.left}px`);
        (e.currentTarget as HTMLElement).style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      className="app-card-glow p-5"
    >
      <div className="flex items-start justify-between">
        <div className="h-9 w-9 rounded-lg flex items-center justify-center border border-blue-200/70 dark:border-blue-800/70"
             style={{ background: "rgba(37,99,235,0.08)" }}>
          <k.icon className="h-4 w-4 text-primary" />
        </div>
        <span className={`text-[11px] font-semibold flex items-center gap-0.5 px-2 py-1 rounded-full ${up ? "text-[#86E4A0] bg-[rgba(134,228,160,0.10)]" : "text-[#F08585] bg-[rgba(240,133,133,0.10)]"}`}>
          <ArrowUpRight className={`h-3 w-3 ${up ? "" : "rotate-90"}`} />{Math.abs(k.delta)}%
        </span>
      </div>
      <div className="text-2xl font-extrabold mt-3 text-app-text tracking-tight">{k.value}</div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-app-text-soft mt-1">{k.label}</div>
      <div className="h-8 mt-2 -mx-1">
        <ResponsiveContainer>
          <LineChart data={sparkData}>
            <Line type="monotone" dataKey="y" stroke="#2563EB" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

function DashboardDemo() {
  const recentLeads = demoLeads.slice(0, 5);
  const showcaseProps = demoProperties.filter((p) => p.publish).slice(0, 4);
  return (
    <div className="p-4 md:p-6 min-h-screen bg-app-bg text-app-text space-y-6">
      {/* Hero executivo */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="app-hero relative overflow-hidden rounded-2xl border border-app-border p-6 md:p-8">
        <div className="absolute inset-0 opacity-40 app-grid-bg pointer-events-none" />
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl pointer-events-none"
             style={{ background: "radial-gradient(circle, rgba(37,99,235,0.22), transparent 70%)" }} />
        <div className="relative">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary blue-pulse" />
            Imobiliária Excellence · Tempo real
          </div>
          <h1 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight text-app-text">
            Boa noite, <span className="text-imob-text dark:text-white">Rafael</span>.
          </h1>
          <p className="mt-1 text-sm text-app-text-muted">
            4 leads quentes aguardando contato · GMV do mês <span className="text-primary font-semibold">R$ 4.2M</span> · meta 92%
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {KPIS.map((k, i) => <Kpi key={k.label} k={k} i={i} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 app-card-glow p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-app-text tracking-tight">GMV Semanal · 12 semanas</h3>
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary">Meta R$ 250k/sem</span>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer>
              <AreaChart data={REVENUE_12W} margin={{ top: 10, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--app-grid-line)" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "var(--app-text-soft)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--app-text-soft)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="gmv" stroke="#3B82F6" strokeWidth={2} fill="url(#goldFill)" />
                <Line type="monotone" dataKey="meta" stroke="#5C7A8F" strokeWidth={1} strokeDasharray="4 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
          className="app-card-glow p-5">
          <h3 className="font-bold text-app-text mb-3 tracking-tight">Origem dos Leads</h3>
          <div className="h-[170px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={PIE} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={2}>
                  {PIE.map((p, i) => <Cell key={i} fill={p.color} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1">
            {PIE.map((p) => (
              <li key={p.name} className="flex items-center justify-between text-xs text-app-text-muted">
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: p.color }} />{p.name}</span>
                <span className="font-semibold text-app-text">{p.value}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Pipeline mini com barras azuis */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="app-card-glow p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-app-text tracking-tight">Pipeline por Estágio</h3>
          <Link to="/demo/pipeline" className="blue-link text-[11px] uppercase tracking-[0.2em]">Abrir Kanban</Link>
        </div>
        <div className="h-[160px]">
          <ResponsiveContainer>
            <BarChart data={STAGE_COUNTS} margin={{ top: 10, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="goldBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#1D4ED8" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--app-grid-line)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--app-text-soft)" }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" height={48} />
              <YAxis tick={{ fontSize: 10, fill: "var(--app-text-soft)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(37,99,235,0.06)" }} />
              <Bar dataKey="count" fill="url(#goldBar)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
          className="app-card-glow p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-app-text tracking-tight">Leads Recentes</h3>
            <Link to="/demo/leads" className="blue-link text-[11px] uppercase tracking-[0.2em]">Ver todos</Link>
          </div>
          <ul className="space-y-2">
            {recentLeads.map((l) => {
              const stage = PIPELINE_STAGES.find((s) => s.id === l.stage)!;
              return (
                <li key={l.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 dark:bg-blue-950/30 transition-colors">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-app-text"
                       style={{ background: "var(--gradient-blue)" }}>{l.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-app-text truncate">{l.name}</div>
                    <div className="text-[11px] text-app-text-soft truncate">{l.source} · {l.interest}</div>
                  </div>
                  <span className="text-[9px] uppercase font-semibold tracking-wider px-2 py-1 rounded-md border border-blue-200/70 dark:border-blue-800/70 text-primary bg-blue-50 dark:bg-blue-950/35">{stage.label}</span>
                </li>
              );
            })}
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}
          className="app-card-glow p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-app-text tracking-tight">Imóveis na Vitrine</h3>
            <Link to="/demo/imoveis" className="blue-link text-[11px] uppercase tracking-[0.2em]">Ver todos</Link>
          </div>
          <ul className="space-y-2">
            {showcaseProps.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 dark:bg-blue-950/30 transition-colors">
                <img src={p.image_url} alt="" className="h-10 w-12 object-cover rounded-md border border-app-border" loading="lazy" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-app-text truncate">{p.title}</div>
                  <div className="text-[11px] text-app-text-soft flex items-center gap-1"><MapPin className="h-3 w-3" />{p.neighborhood}, {p.city}</div>
                </div>
                <span className="text-sm font-bold text-primary">{brl(p.price)}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      <Link to="/demo/ai-growth" className="block">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.54 }}
          whileHover={{ scale: 1.005 }}
          className="relative overflow-hidden rounded-2xl border border-app-border p-5 flex items-center gap-4 bg-gradient-to-r from-[#FFFCEF] via-[#FDF6D9] to-[#F7E9B3] dark:from-[#F8FAFC] dark:via-[#F8FAFC] dark:to-[rgba(37,99,235,0.15)]">
          <div className="absolute inset-0 blue-sheen opacity-20 pointer-events-none" />
          <div className="h-12 w-12 rounded-xl flex items-center justify-center blue-glow relative"
               style={{ background: "var(--gradient-blue)" }}>
            <Zap className="h-5 w-5 text-app-text" />
          </div>
          <div className="flex-1 relative">
            <div className="font-bold text-app-text text-base">AI Growth Engine · 10 oportunidades em aberto</div>
            <div className="text-xs text-app-text-muted mt-0.5">Leads esquecidos, visitas sem follow-up e propostas paradas</div>
          </div>
          <ArrowUpRight className="h-5 w-5 text-primary relative" />
        </motion.div>
      </Link>
    </div>
  );
}

