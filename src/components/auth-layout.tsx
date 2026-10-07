import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowUpRight, Building2, CalendarDays, UsersRound } from 'lucide-react'
import { ZimobBrand } from './zimob-brand'

export function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-svh bg-background lg:grid lg:grid-cols-[1.05fr_1fr]">
    <aside className="relative hidden overflow-hidden bg-[#09172e] p-12 text-white lg:flex lg:flex-col xl:p-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_10%_0%,#0c58ab_0%,transparent_65%)]" />
      <Link to="/" aria-label="Voltar à página inicial" title="Voltar à página inicial" className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-200"><ArrowLeft className="h-5 w-5" /></Link>
      <div className="relative my-auto py-14"><p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">Gestão imobiliária, conectada.</p><h2 className="max-w-lg text-4xl font-semibold leading-[1.15] tracking-tight xl:text-5xl">Mais clareza na rotina.<br /><span className="text-blue-300">Mais espaço para crescer.</span></h2><p className="mt-6 max-w-md text-base leading-relaxed text-slate-300">Seus imóveis, clientes e negociações no mesmo lugar. Do primeiro contato à próxima conquista.</p>
        <div className="mt-10 space-y-3">
          {[
            { icon: Building2, title: 'Seu portfólio organizado', text: 'Imóveis e vitrine em uma só gestão.' },
            { icon: UsersRound, title: 'Cada oportunidade à vista', text: 'Clientes e propostas ao longo do funil.' },
            { icon: CalendarDays, title: 'Uma equipe em sintonia', text: 'Visitas e próximos passos bem definidos.' },
          ].map(item => <div key={item.title} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"><div className="rounded-xl bg-blue-400/15 p-3 text-blue-200"><item.icon className="h-5 w-5" /></div><div><p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-slate-300">{item.text}</p></div></div>)}
        </div>
      </div>
      <p className="relative text-xs text-slate-400">Zimob · Tecnologia para a sua imobiliária.</p>
    </aside>
    <main className="flex min-h-svh flex-col px-6 py-8 sm:px-12 lg:px-14 xl:px-24">
      <div className="flex items-center justify-between gap-4"><Link to="/" aria-label="Zimob — página inicial"><ZimobBrand className="h-10" /></Link><Link to="/demo/dashboard" className="inline-flex items-center gap-1 text-sm font-medium text-primary">Conhecer o sistema <ArrowUpRight className="h-4 w-4" /></Link></div>
      <div className="mx-auto my-auto w-full max-w-md py-12">{children}</div>
      <p className="text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Zimob. Sua próxima conquista começa aqui.</p>
    </main>
  </div>
}
