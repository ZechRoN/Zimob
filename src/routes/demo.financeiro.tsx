import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, Clock, Plus, Trash2, Target, PiggyBank, Receipt, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { demoCommissions, demoCosts, brl } from "@/lib/demo-data";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";

export const Route = createFileRoute("/demo/financeiro")({ component: FinanceiroDemo });

const monthly = [
  { m: "Jan", receita: 142000, custo: 58000 },
  { m: "Fev", receita: 168000, custo: 62000 },
  { m: "Mar", receita: 198000, custo: 71000 },
  { m: "Abr", receita: 175000, custo: 65000 },
  { m: "Mai", receita: 224000, custo: 78000 },
  { m: "Jun", receita: 261000, custo: 84000 },
];
const costsByCat = [
  { name: "Folha", value: 24000, color: "#2563EB" },
  { name: "Escritório", value: 8500, color: "#3B82F6" },
  { name: "Marketing", value: 4800, color: "#60A5FA" },
  { name: "Jurídico", value: 3200, color: "#93C5FD" },
  { name: "Plataforma", value: 199, color: "#BFDBFE" },
];
const topBrokers = [
  { name: "Carla Oliveira", value: 163500 },
  { name: "Thiago Santos",  value: 29500 },
  { name: "Rafael Mendes",  value: 2400 },
  { name: "Bianca Lima",    value: 18200 },
  { name: "Pedro Costa",    value: 11400 },
];
const recentReceitas = [
  { id: "r1", desc: "Comissão · Apto Moema",         cat: "Venda",  val: 46000,  date: "02/06/2026", status: "Recebido" },
  { id: "r2", desc: "Comissão · Studio Vila Mada.",  cat: "Locação",val: 2400,   date: "30/05/2026", status: "Recebido" },
  { id: "r3", desc: "Comissão · Casa Alphaville",    cat: "Venda",  val: 117500, date: "18/06/2026", status: "Previsto" },
  { id: "r4", desc: "Comissão · Lançamento V. Verde",cat: "Venda",  val: 29500,  date: "22/06/2026", status: "Previsto" },
  { id: "r5", desc: "Taxa adm. · Sala Itaim",        cat: "Adm.",   val: 1800,   date: "01/06/2026", status: "Recebido" },
];

function FinanceiroDemo() {
  const [costs] = useState(demoCosts);
  const totalComm = demoCommissions.reduce((s:number, c) => s + c.value, 0);
  const received = demoCommissions.filter((c) => c.status === "recebida").reduce((s:number, c) => s + c.value, 0);
  const pending = demoCommissions.filter((c) => c.status === "prevista").reduce((s:number, c) => s + c.value, 0);
  const totalCosts = costs.reduce((s:number, c) => s + c.amount, 0);
  const liquido = received - totalCosts;
  const margem = received > 0 ? Math.round((liquido / received) * 100) : 0;
  const ticketMedio = Math.round(totalComm / Math.max(demoCommissions.length, 1));

  const kpis = [
    { label: "Total Comissões", value: brl(totalComm),   delta: "+18%",  icon: Wallet,       bg: "#DCFCE7", color: "#166534" },
    { label: "Recebido",        value: brl(received),    delta: "+12%",  icon: TrendingUp,   bg: "#DBEAFE", color: "#1D4ED8" },
    { label: "A Receber",       value: brl(pending),     delta: "8 deals", icon: Clock,      bg: "#FEF3C7", color: "#92400E" },
    { label: "Custos do mês",   value: brl(totalCosts),  delta: "-4%",   icon: TrendingDown, bg: "#FEE2E2", color: "#991B1B" },
    { label: "Lucro Líquido",   value: brl(liquido),     delta: `${margem}% margem`, icon: PiggyBank, bg: "#E0E7FF", color: "#3730A3" },
    { label: "Ticket Médio",    value: brl(ticketMedio), delta: "por deal", icon: Target,    bg: "#F3E8FF", color: "#6B21A8" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-app-text">Financeiro</h1>
          <p className="text-sm text-[var(--app-text-muted)]">Comissões, custos, fluxo de caixa e DRE simplificado</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-[var(--app-border)]"><Receipt className="h-3 w-3 mr-1" />Exportar DRE</Button>
          <Button size="sm" className="bg-primary hover:bg-blue-700 text-primary-foreground"><Plus className="h-3 w-3 mr-1" />Novo lançamento</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-app-card border border-[var(--app-border)] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: k.bg, color: k.color }}><k.icon className="h-4 w-4" /></div>
              <span className="text-[10px] font-semibold text-[var(--app-text-muted)]">{k.delta}</span>
            </div>
            <div className="text-xl font-extrabold mt-3 text-app-text">{k.value}</div>
            <div className="text-[11px] uppercase tracking-wider text-[var(--app-text-muted)] mt-0.5">{k.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-app-card border border-[var(--app-border)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-app-text">Receita × Custos · 6 meses</h3>
              <p className="text-xs text-[var(--app-text-muted)]">Evolução mensal consolidada</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-[var(--app-text-muted)]">Margem média</div>
              <div className="text-lg font-extrabold text-primary">62%</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563EB" stopOpacity={0.35}/><stop offset="100%" stopColor="#2563EB" stopOpacity={0}/></linearGradient>
                <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F87171" stopOpacity={0.30}/><stop offset="100%" stopColor="#F87171" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid stroke="var(--app-grid-line)" vertical={false} />
              <XAxis dataKey="m" stroke="var(--app-text-muted)" fontSize={11} axisLine={false} tickLine={false}/>
              <YAxis stroke="var(--app-text-muted)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v)=>`${v/1000}k`}/>
              <Tooltip contentStyle={{ background: "var(--app-card)", border: "1px solid var(--app-border)", borderRadius: 8, fontSize: 12 }} formatter={(v:number)=>brl(v)}/>
              <Area type="monotone" dataKey="receita" stroke="#2563EB" strokeWidth={2} fill="url(#gr)" />
              <Area type="monotone" dataKey="custo"   stroke="#F87171" strokeWidth={2} fill="url(#gc)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-app-card border border-[var(--app-border)] rounded-xl p-5">
          <h3 className="font-bold text-app-text">Custos por categoria</h3>
          <p className="text-xs text-[var(--app-text-muted)] mb-2">Distribuição do mês corrente</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={costsByCat} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                {costsByCat.map((c)=>(<Cell key={c.name} fill={c.color} />))}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--app-card)", border: "1px solid var(--app-border)", borderRadius: 8, fontSize: 12 }} formatter={(v:number)=>brl(v)}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {costsByCat.map(c=>(
              <div key={c.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-app-text"><span className="h-2 w-2 rounded-full" style={{background:c.color}} />{c.name}</span>
                <span className="font-semibold text-[var(--app-text-muted)]">{brl(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top brokers + DRE */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-app-card border border-[var(--app-border)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-app-text">Top corretores · comissão acumulada</h3>
            </div>
            <span className="text-xs text-[var(--app-text-muted)]">Últimos 90 dias</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topBrokers} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid stroke="var(--app-grid-line)" horizontal={false} />
              <XAxis type="number" stroke="var(--app-text-muted)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v)=>`${v/1000}k`}/>
              <YAxis dataKey="name" type="category" stroke="var(--app-text)" fontSize={11} axisLine={false} tickLine={false} width={110}/>
              <Tooltip contentStyle={{ background: "var(--app-card)", border: "1px solid var(--app-border)", borderRadius: 8, fontSize: 12 }} formatter={(v:number)=>brl(v)}/>
              <Bar dataKey="value" fill="#2563EB" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-app-card border border-[var(--app-border)] rounded-xl p-5">
          <h3 className="font-bold text-app-text">DRE simplificado</h3>
          <p className="text-xs text-[var(--app-text-muted)] mb-4">Mês atual</p>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between"><dt className="text-[var(--app-text-muted)]">(+) Receita bruta</dt><dd className="font-semibold text-app-text">{brl(261000)}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--app-text-muted)]">(-) Impostos</dt><dd className="font-semibold text-app-text">- {brl(18270)}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--app-text-muted)]">(-) Comissões pagas</dt><dd className="font-semibold text-app-text">- {brl(78300)}</dd></div>
            <div className="flex justify-between border-t border-[var(--app-border)] pt-2"><dt className="font-semibold text-app-text">(=) Receita líquida</dt><dd className="font-extrabold text-app-text">{brl(164430)}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--app-text-muted)]">(-) Custos op.</dt><dd className="font-semibold text-app-text">- {brl(totalCosts)}</dd></div>
            <div className="flex justify-between border-t border-[var(--app-border)] pt-2"><dt className="font-bold text-app-text">(=) Lucro operacional</dt><dd className="font-extrabold text-primary">{brl(164430 - totalCosts)}</dd></div>
          </dl>
        </div>
      </div>

      <Tabs defaultValue="costs">
        <TabsList>
          <TabsTrigger value="receitas">Receitas</TabsTrigger>
          <TabsTrigger value="costs">Custos Operacionais</TabsTrigger>
          <TabsTrigger value="comm">Comissões</TabsTrigger>
        </TabsList>

        <TabsContent value="receitas" className="mt-4">
          <div className="bg-app-card border border-[var(--app-border)] rounded-xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[var(--app-border)]">
              <h3 className="font-bold text-app-text">Entradas previstas e recebidas</h3>
              <span className="text-xs text-[var(--app-text-muted)]">{recentReceitas.length} lançamentos</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-[var(--app-card-2)] text-[11px] uppercase text-[var(--app-text-muted)]">
                <tr><th className="text-left px-4 py-2 font-semibold">Descrição</th><th className="text-left px-3 py-2 font-semibold">Categoria</th><th className="text-right px-3 py-2 font-semibold">Valor</th><th className="text-left px-3 py-2 font-semibold">Data</th><th className="text-left px-3 py-2 font-semibold">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-[var(--app-border)]">
                {recentReceitas.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--app-card-2)]">
                    <td className="px-4 py-3 font-medium text-app-text">{r.desc}</td>
                    <td className="px-3 py-3"><span className="text-xs px-2 py-1 rounded bg-[var(--app-card-2)] text-[var(--app-text-muted)]">{r.cat}</span></td>
                    <td className="px-3 py-3 text-right font-semibold text-emerald-700 dark:text-emerald-300">+ {brl(r.val)}</td>
                    <td className="px-3 py-3 text-xs text-[var(--app-text-muted)]">{r.date}</td>
                    <td className="px-3 py-3"><span className="text-[10px] uppercase font-bold px-2 py-1 rounded" style={{ background: r.status === "Recebido" ? "#DCFCE7" : "#DBEAFE", color: r.status === "Recebido" ? "#166534" : "#1D4ED8" }}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="costs" className="mt-4">
          <div className="bg-app-card border border-[var(--app-border)] rounded-xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[var(--app-border)]">
              <h3 className="font-bold text-app-text">Custos do mês</h3>
              <Button size="sm" className="bg-primary hover:bg-blue-700 text-primary-foreground"><Plus className="h-3 w-3 mr-1" />Novo custo</Button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-[var(--app-card-2)] text-[11px] uppercase text-[var(--app-text-muted)]">
                <tr><th className="text-left px-4 py-2 font-semibold">Descrição</th><th className="text-left px-3 py-2 font-semibold">Categoria</th><th className="text-right px-3 py-2 font-semibold">Valor</th><th className="text-left px-3 py-2 font-semibold">Data</th><th className="w-10"></th></tr>
              </thead>
              <tbody className="divide-y divide-[var(--app-border)]">
                {costs.map((c) => (
                  <tr key={c.id} className="hover:bg-[var(--app-card-2)]">
                    <td className="px-4 py-3 font-medium text-app-text">{c.description}</td>
                    <td className="px-3 py-3"><span className="text-xs px-2 py-1 rounded bg-[var(--app-card-2)] text-[var(--app-text-muted)]">{c.category}</span></td>
                    <td className="px-3 py-3 text-right font-semibold text-red-700 dark:text-red-300">- {brl(c.amount)}</td>
                    <td className="px-3 py-3 text-xs text-[var(--app-text-muted)]">{new Date(c.date).toLocaleDateString("pt-BR")}</td>
                    <td className="px-2"><Trash2 className="h-4 w-4 text-[var(--app-text-muted)] cursor-pointer hover:text-red-700 dark:text-red-300" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="comm" className="mt-4">
          <div className="bg-app-card border border-[var(--app-border)] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--app-card-2)] text-[11px] uppercase text-[var(--app-text-muted)]">
                <tr><th className="text-left px-4 py-2 font-semibold">Corretor</th><th className="text-left px-3 py-2 font-semibold">Negócio</th><th className="text-right px-3 py-2 font-semibold">Comissão</th><th className="text-left px-3 py-2 font-semibold">Status</th><th className="text-left px-3 py-2 font-semibold">Data</th></tr>
              </thead>
              <tbody className="divide-y divide-[var(--app-border)]">
                {demoCommissions.map((c) => (
                  <tr key={c.id} className="hover:bg-[var(--app-card-2)]">
                    <td className="px-4 py-3 font-medium">{c.broker}</td>
                    <td className="px-3 py-3 text-[var(--app-text-muted)]">{c.deal}</td>
                    <td className="px-3 py-3 text-right font-extrabold text-primary">{brl(c.value)}</td>
                    <td className="px-3 py-3"><span className="text-[10px] uppercase font-bold px-2 py-1 rounded" style={{ background: c.status === "recebida" ? "#DCFCE7" : "#FEF3C7", color: c.status === "recebida" ? "#166534" : "#92400E" }}>{c.status}</span></td>
                    <td className="px-3 py-3 text-xs text-[var(--app-text-muted)]">{new Date(c.date).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

