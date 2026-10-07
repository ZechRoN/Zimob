import { HowItWorksCarousel } from '@/components/how-it-works-carousel';
import { ZimobBrand } from '@/components/zimob-brand';
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home, Play, Check, ArrowRight, AlertCircle, Clock, Target, TrendingUp, FileText, DollarSign,
  Users, GitBranch, Building2, Calendar, BarChart3, Globe, Zap, Shield, Star, ChevronRight,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zimob — CRM imobiliário premium com AI Growth Engine" },
      { name: "description", content: "CRM completo para imobiliárias: vitrine pública, pipeline kanban, gestão de visitas, propostas, financeiro e sugestões por regras para acompanhar oportunidades. 14 dias grátis." },
      { property: "og:title", content: "Zimob — CRM imobiliário com AI Growth" },
      { property: "og:description", content: "Vitrine + pipeline + AI Growth Engine para imobiliárias modernas." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
} as const;

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.section>
  );
}

const PAINS = [
  { icon: AlertCircle, t: "Leads chegando pelo WhatsApp e se perdendo no caos" },
  { icon: Clock, t: "Corretores sem visibilidade de quem ligar, visitar ou responder" },
  { icon: Target, t: "Imóveis sem visibilidade online ou refém de portais caros" },
  { icon: TrendingUp, t: "Sem dados para saber quais corretores realmente performam" },
  { icon: FileText, t: "Propostas geradas fora do sistema, sem histórico ou rastreio" },
  { icon: DollarSign, t: "Comissões e custos gerenciados em planilha desatualizada" },
];


const MODULES = [
  { icon: Users, t: "CRM de Leads", d: "Cadastro de interessados, histórico e acompanhamento pelo funil." },
  { icon: GitBranch, t: "Pipeline Kanban", d: "9 estágios visuais do funil com drag-and-drop intuitivo." },
  { icon: Building2, t: "Gestão de Imóveis", d: "Cadastro de imóveis, fotos e zonas de atuação." },
  { icon: Calendar, t: "Visitas & Agenda", d: "Agenda de visitas com status e feedback registrado pela equipe." },
  { icon: FileText, t: "Propostas", d: "Cadastro de propostas, valores, condições e status." },
  { icon: DollarSign, t: "Financeiro & Comissões", d: "Registros manuais de comissões, receitas e custos operacionais." },
  { icon: BarChart3, t: "Relatórios & Dashboard", d: "KPIs em tempo real, funil de conversão e comparativo de equipes." },
  { icon: Globe, t: "Vitrine Pública", d: "Site dos seus imóveis com SEO, filtros e formulário de interesse." },
  { icon: Zap, t: "AI Growth Engine", d: "Regras destacam registros parados para revisão da equipe." },
];

const AI_ALERTS = [
  "5 leads sem contato há mais de 7 dias — risco alto de perda",
  "3 visitas realizadas sem follow-up nas últimas 48h",
  "2 propostas paradas em negociação há mais de 10 dias",
  "Imóvel cód. 1024 sem nenhuma atividade nos últimos 45 dias",
];

const DIFFS = [
  { icon: Globe, t: "Vitrine pública integrada", d: "Cada imobiliária possui uma vitrine com endereço próprio dentro do sistema." },
  { icon: Zap, t: "Regras no CRM", d: "Sugestões por regras usam os registros reais da sua imobiliária." },
  { icon: Shield, t: "Multi-empresa isolada", d: "Cada imobiliária com dados separados, permissões e identidade própria." },
  { icon: Star, t: "White-label completo", d: "Marca, cor e logo da sua imobiliária em toda a experiência." },
];

const PLANS = [
  { name: "Básico", price: 197, sub: "Para começar com tudo no lugar", feats: ["Até 50 imóveis", "2 corretores", "Vitrine pública", "Pipeline Kanban", "Suporte por e-mail"] },
  { name: "Profissional", price: 397, sub: "Exemplo para personalizar", feats: ["Imóveis ilimitados", "Corretores ilimitados", "AI Growth Engine", "Relatórios avançados", "Suporte prioritário"], featured: true },
  { name: "Enterprise", price: 697, sub: "Oferta ilustrativa para personalizar", feats: ["Tudo do Profissional", "Domínio personalizado", "Onboarding guiado", "Gestão de equipe", "Configurações da imobiliária"] },
];

function Landing() {
  return (
    <div className="min-h-screen bg-imob-bg text-imob-text font-sans antialiased">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/90 border-b border-imob-border backdrop-blur-xl">
        <div className="container mx-auto h-16 px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <ZimobBrand className="h-10" />
          </Link>
          <nav className="hidden sm:flex items-center gap-7 text-sm font-medium text-imob-muted">
            <a href="#modulos" className="hover:text-imob-accent transition">Módulos</a>
            <a href="#como-funciona" className="hover:text-imob-accent transition">Como funciona</a>
            <Link to="/demo/dashboard" className="hover:text-imob-accent transition">Demo</Link>
            <Link to="/demo/imoveis" className="hover:text-imob-accent transition">Vitrine demo</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/entrar"><Button variant="outline" size="sm" className="border-imob-border bg-white text-imob-text hover:bg-imob-bg">Entrar</Button></Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-white text-imob-text overflow-hidden relative border-b border-imob-border">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fc_100%)]" />
        <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_70%_20%,rgba(37,99,235,0.14),transparent_55%)]" />
        <div className="container mx-auto px-4 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center relative">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <Badge className="bg-imob-accent/15 text-imob-accent border border-imob-accent/30 mb-6 px-3 py-1 font-semibold tracking-wide text-[11px]">
              <Sparkles className="h-3 w-3 mr-1.5" />AI GROWTH ENGINE
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] text-imob-text">
              O sistema que faltava para a sua imobiliária{" "}
              <span className="relative inline-block">
                vender mais
                <span className="absolute left-0 right-0 -bottom-1 h-[6px] bg-imob-accent/20 rounded-sm -z-10" />
              </span>
            </h1>
            <p className="mt-6 text-base md:text-lg text-imob-text-secondary max-w-xl leading-relaxed">
              CRM completo com vitrine pública, pipeline Kanban, gestão de visitas, propostas, financeiro e
              sugestões por regras para acompanhar as oportunidades.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/demo/dashboard">
                <Button size="lg" className="bg-imob-accent hover:bg-imob-accent-hover text-primary-foreground shadow-lg shadow-imob-accent/20 font-semibold">
                  <Play className="h-4 w-4 mr-2 fill-white" />Ver demonstração
                </Button>
              </Link>
              <Link to="/demo/imoveis">
                <Button size="lg" variant="outline" className="border-imob-border bg-white text-imob-text hover:bg-imob-bg font-semibold">
                  Vitrine pública demo
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-imob-muted">
              {["Demo sem login", "Dados fictícios", "Multi-empresa", "Sugestões por regras"].map((c) => (
                <span key={c} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-imob-accent" />{c}</span>
              ))}
            </div>
          </motion.div>

          {/* Mock dashboard */}
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }}>
            <div className="bg-imob-bg text-imob-text rounded-xl border border-imob-border-light shadow-2xl overflow-hidden">
              <div className="bg-app-card border-b border-imob-border-subtle px-4 py-2.5 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <div className="text-xs text-imob-muted ml-2">Zimob — Dashboard</div>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { l: "Leads Ativos", v: "28", c: "text-imob-accent" },
                    { l: "Visitas Hoje", v: "6", c: "text-imob-info" },
                    { l: "Propostas", v: "3", c: "text-imob-success" },
                  ].map((k) => (
                    <div key={k.l} className="bg-app-card border border-imob-border-subtle rounded-lg p-3">
                      <div className="text-[10px] uppercase tracking-wider text-imob-muted">{k.l}</div>
                      <div className={`text-2xl font-bold mt-1 ${k.c}`}>{k.v}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-app-card border border-imob-border-subtle rounded-lg p-3">
                  <div className="text-[10px] uppercase tracking-wider text-imob-muted mb-2">Pipeline</div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[["Novo",8],["Qualif",6],["Visita",5],["Proposta",3],["Fechado",2]].map(([n,v]:any) => (
                      <div key={n} className="bg-imob-bg-alt rounded p-2 text-center">
                        <div className="text-[9px] text-imob-muted truncate">{n}</div>
                        <div className="text-sm font-bold text-imob-text">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-imob-accent/10 border border-imob-accent/30 rounded-lg p-3 flex items-start gap-2">
                  <Zap className="h-4 w-4 text-imob-accent shrink-0 mt-0.5" />
                  <div className="text-[11px] text-imob-text-secondary leading-relaxed">
                    <span className="font-semibold text-imob-accent">AI Growth:</span> 5 leads sem contato · 3 visitas sem follow-up · 2 propostas paradas
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* GESTÃO IMOBILIÁRIA */}
      <Section className="bg-app-card py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="bg-imob-accent/10 text-imob-accent border-0 mb-3 tracking-wide font-semibold">SUA IMOBILIÁRIA, CONECTADA</Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-imob-text dark:text-white">
              Tudo o que move sua imobiliária{" "}
              <span className="relative inline-block">
                em um só lugar
                <span className="absolute left-0 right-0 -bottom-1 h-[6px] bg-imob-accent/25 rounded-sm -z-10" />
              </span>
            </h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
            <div className="bg-imob-bg rounded-xl border border-imob-border-light p-7">
              <h3 className="font-bold text-lg mb-5">Uma rotina mais organizada</h3>
              <ol className="space-y-4">
                {[
                  ["1","Organize seu portfólio","Fotos, valores e informações dos imóveis sempre à mão."],
                  ["2","Centralize seus atendimentos","Acompanhe interessados e o histórico de cada negociação."],
                  ["3","Conecte sua equipe","Distribua oportunidades e acompanhe visitas e propostas."],
                  ["4","Decida com mais clareza","Consulte indicadores e priorize os próximos passos."],
                ].map(([n,t,d]) => (
                  <li key={n} className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-imob-accent text-primary-foreground font-bold flex items-center justify-center shrink-0">{n}</div>
                    <div><div className="font-semibold">{t}</div><div className="text-sm text-imob-muted mt-0.5">{d}</div></div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="bg-imob-bg rounded-xl border border-imob-border-light p-7">
              <h3 className="font-bold text-lg mb-5">Recursos para o seu dia a dia</h3>
              <ul className="space-y-3">
                {["Cadastro de imóveis com fotos e informações completas","Vitrine com a identidade da sua imobiliária","CRM para organizar clientes e interessados","Pipeline visual para acompanhar negociações","Agenda de visitas e registro de propostas","Controle de receitas, custos e comissões","Permissões de acesso para sua equipe"].map((f) => (
                  <li key={f} className="flex gap-2.5 text-sm"><Check className="h-4 w-4 text-imob-success shrink-0 mt-0.5" />{f}</li>
                ))}
              </ul>
              <div className="mt-6 bg-imob-accent text-primary-foreground rounded-lg p-4 font-semibold text-center">
                Mais organização para cuidar de cada oportunidade.
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* PAIN POINTS */}
      <Section className="bg-imob-bg py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge variant="outline" className="border-imob-error/30 text-imob-error bg-imob-error-bg mb-3 tracking-wide font-semibold">O PROBLEMA REAL DO MERCADO</Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              A maioria das imobiliárias ainda opera no caos
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {PAINS.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="bg-app-card rounded-xl border border-imob-border-light p-5 hover:shadow-md hover:border-imob-accent/30 transition">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-imob-error-bg flex items-center justify-center shrink-0 relative">
                    <p.icon className="h-5 w-5 text-imob-error" />
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-imob-error" />
                  </div>
                  <p className="text-sm text-imob-text-secondary leading-relaxed pt-1">{p.t}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section className="bg-app-card py-20">
        <div className="container mx-auto px-4" id="como-funciona">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Badge className="bg-imob-accent/10 text-imob-accent border-0 mb-3 tracking-wide font-semibold">COMO FUNCIONA NA PRÁTICA</Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Da captação ao fechamento — em um fluxo organizado
            </h2>
          </div>
          <HowItWorksCarousel />
        </div>
      </Section>

      {/* MODULES */}
      <Section className="bg-imob-bg py-20" >
        <div className="container mx-auto px-4" id="modulos">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Badge className="bg-imob-accent/10 text-imob-accent border-0 mb-3 tracking-wide font-semibold">MÓDULOS COMPLETOS</Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Tudo que a sua imobiliária precisa para operar
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {MODULES.map((m, i) => (
              <motion.div key={m.t} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="group bg-app-card border border-imob-border-light rounded-xl p-6 hover:shadow-lg hover:border-imob-accent/40 hover:-translate-y-0.5 transition-all">
                <div className="h-11 w-11 rounded-lg bg-imob-accent/10 group-hover:bg-imob-accent/15 flex items-center justify-center mb-4 transition">
                  <m.icon className="h-5 w-5 text-imob-accent" />
                </div>
                <div className="font-bold mb-1.5">{m.t}</div>
                <p className="text-sm text-imob-muted leading-relaxed">{m.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* AI GROWTH ENGINE */}
      <Section className="bg-white text-imob-text py-20 relative overflow-hidden border-y border-imob-border-light">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(37,99,235,0.07),transparent_55%)]" />
        <div className="container mx-auto px-4 relative grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="bg-imob-accent/15 text-imob-accent border border-imob-accent/30 mb-5 tracking-wide font-semibold text-[11px]">
              <Zap className="h-3 w-3 mr-1.5" />SUGESTÕES POR REGRAS
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-imob-text">
              Encontre registros que precisam da sua atenção
            </h2>
            <p className="mt-5 text-imob-text-secondary max-w-lg leading-relaxed">
              Ao abrir o painel, regras destacam leads, visitas, propostas e imóveis que merecem atenção. Os exemplos ao lado são ilustrativos. Não há envio automático.
            </p>
          </div>
          <div className="space-y-3">
            {AI_ALERTS.map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-white border border-imob-border-light rounded-lg p-4 flex items-start gap-3 hover:border-imob-accent/40 hover:shadow-md transition">
                <div className="h-8 w-8 rounded-md bg-imob-accent/10 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-imob-accent" />
                </div>
                <div className="text-sm text-imob-text leading-relaxed">{a}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* DIFFERENTIALS */}
      <Section className="bg-app-card py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Por que Zimob é diferente
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {DIFFS.map((d) => (
              <div key={d.t} className="bg-imob-bg border border-imob-border-light rounded-xl p-6 hover:border-imob-accent/40 hover:shadow-md transition">
                <div className="h-11 w-11 rounded-lg bg-imob-accent/10 flex items-center justify-center mb-4">
                  <d.icon className="h-5 w-5 text-imob-accent" />
                </div>
                <div className="font-bold mb-1.5">{d.t}</div>
                <p className="text-sm text-imob-muted leading-relaxed">{d.d}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* PRICING */}
      <Section className="bg-imob-bg py-20" >
        <div className="container mx-auto px-4" id="planos">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="bg-imob-accent/10 text-imob-accent border-0 mb-3 tracking-wide font-semibold">EXEMPLOS DE PLANOS</Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Escolha o plano da sua imobiliária</h2>
            <p className="text-imob-muted mt-3">Preços e limites ilustrativos para você personalizar. Cobranças não são automáticas.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {PLANS.map((p) => (
              <div key={p.name} className={`relative bg-app-card rounded-2xl p-7 border transition ${p.featured ? "border-imob-accent shadow-2xl md:scale-105 ring-1 ring-imob-accent" : "border-imob-border-light hover:border-imob-accent/40 hover:shadow-md"}`}>
                {p.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-imob-accent text-primary-foreground text-[11px] font-bold tracking-wider px-3 py-1 rounded-full uppercase">Exemplo</div>
                )}
                <div className="text-xl font-bold">{p.name}</div>
                <p className="text-sm text-imob-muted mt-1">{p.sub}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight">R${p.price}</span>
                  <span className="text-imob-muted text-sm">/mês</span>
                </div>
                <ul className="mt-6 space-y-2.5">
                  {p.feats.map((f) => (
                    <li key={f} className="flex gap-2.5 text-sm"><Check className="h-4 w-4 text-imob-success shrink-0 mt-0.5" />{f}</li>
                  ))}
                </ul>
                <Link to="/entrar">
                  <Button className={`w-full mt-7 font-semibold ${p.featured ? "bg-imob-accent hover:bg-imob-accent-hover text-white" : "bg-slate-900 hover:bg-slate-800 text-white"}`}>
                    Começar agora <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 pt-14 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-4">
                <ZimobBrand compact /><span className="text-2xl font-bold text-white">Zimob</span>
              </Link>
              <p className="text-xs text-slate-500 leading-relaxed">CRM imobiliário com sugestões por regras, vitrine pública e pipeline visual.</p>
            </div>
            <div>
              <div className="text-white font-semibold text-sm mb-3">Produto</div>
              <ul className="space-y-2 text-sm">
                <li><a href="#modulos" className="hover:text-white">Módulos</a></li>
                <li><a href="#como-funciona" className="hover:text-white">Como funciona</a></li>
                <li><a href="#planos" className="hover:text-white">Planos</a></li>
              </ul>
            </div>
            <div>
              <div className="text-white font-semibold text-sm mb-3">Recursos</div>
              <ul className="space-y-2 text-sm">
                <li><Link to="/demo/dashboard" className="hover:text-white">Demo interativa</Link></li>
                <li><Link to="/demo/imoveis" className="hover:text-white">Vitrine demo</Link></li>
                <li><Link to="/entrar" className="hover:text-white">Entrar</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-white font-semibold text-sm mb-3">Legal</div>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Termos de uso</a></li>
                <li><a href="#" className="hover:text-white">Política de privacidade</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
            <span>© 2026 Zimob — Gestão imobiliária.</span>
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-300">Feito por <img src="/brand/zivello-logo.png" alt="Zivello" width={1100} height={350} className="h-8 w-auto object-contain" /> para imobiliárias modernas.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
