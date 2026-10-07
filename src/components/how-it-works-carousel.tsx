import { useEffect, useState } from 'react'
import { Building2, Users, GitBranch, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { Button } from '@/components/ui/button'

const steps = [
  { title: 'Cadastre seus imóveis', description: 'Organize fotos, valores e detalhes dos imóveis e publique a vitrine da sua imobiliária.', icon: Building2, label: 'Portfólio organizado', detail: 'Seu próximo negócio começa com uma boa apresentação.' },
  { title: 'Receba interessados da vitrine', description: 'Os formulários dos imóveis levam os interessados ao seu CRM, com as informações para iniciar o atendimento.', icon: Users, label: 'Conexões que viram oportunidades', detail: 'Cada novo contato tem um lugar na sua rotina.' },
  { title: 'Acompanhe cada negociação', description: 'Mova os clientes pelas etapas do pipeline e mantenha sua equipe por dentro do andamento de cada oportunidade.', icon: GitBranch, label: 'Do primeiro contato à proposta', detail: 'Enxergue o próximo passo de cada negociação.' },
  { title: 'Revise suas oportunidades', description: 'Identifique contatos sem retorno, visitas que precisam de acompanhamento e propostas paradas para priorizar suas ações.', icon: Sparkles, label: 'Mais atenção ao que importa', detail: 'Transforme os registros do dia a dia em próximos passos.' },
]

export function HowItWorksCarousel() {
  const [api, setApi] = useState<CarouselApi>()
  const [selected, setSelected] = useState(0)
  useEffect(() => {
    if (!api) return
    const update = () => setSelected(api.selectedScrollSnap())
    update()
    api.on('select', update)
    api.on('reInit', update)
    return () => { api.off('select', update); api.off('reInit', update) }
  }, [api])
  return <Carousel setApi={setApi} opts={{ align: 'start', loop: false }} aria-label="Como funciona a Zimob" tabIndex={0} className="mx-auto max-w-6xl rounded-3xl focus-visible:outline-2 focus-visible:outline-blue-600">
    <CarouselContent>
      {steps.map((step, index) => <CarouselItem key={step.title} aria-label={`Etapa ${index + 1} de ${steps.length}`}>
        <div className="grid overflow-hidden rounded-3xl border border-imob-border bg-imob-bg md:grid-cols-[1.15fr_1fr]">
          <div className="flex min-h-72 flex-col items-start justify-center p-7 sm:p-12">
            <span className="mb-6 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold tracking-widest text-blue-700">ETAPA 0{index + 1}</span>
            <h3 className="max-w-md text-2xl font-bold tracking-tight text-imob-text sm:text-3xl">{step.title}</h3>
            <p className="mt-4 max-w-md text-base leading-relaxed text-imob-text-secondary">{step.description}</p>
          </div>
          <div className="relative flex min-h-60 flex-col items-start justify-end overflow-hidden bg-gradient-to-br from-blue-600 to-slate-950 p-7 text-white sm:p-12">
            <span aria-hidden="true" className="absolute -right-2 -top-10 select-none text-[180px] font-black leading-none text-white/10">0{index + 1}</span>
            <div className="relative mb-8 rounded-2xl border border-white/20 bg-white/10 p-4"><step.icon className="h-8 w-8" /></div>
            <p className="relative text-xl font-semibold">{step.label}</p><p className="relative mt-2 max-w-xs text-sm leading-relaxed text-blue-100">{step.detail}</p>
          </div>
        </div>
      </CarouselItem>)}
    </CarouselContent>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
      <p aria-live="polite" aria-atomic="true" className="text-sm text-imob-muted">Etapa {selected + 1} de {steps.length}</p>
      <div className="flex gap-2" aria-label="Escolher etapa">{steps.map((step, index) => <button key={step.title} type="button" aria-label={`Ir para etapa ${index + 1}: ${step.title}`} aria-current={selected === index ? 'step' : undefined} onClick={() => api?.scrollTo(index)} className="flex h-10 w-10 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-blue-600"><span className={`h-2.5 rounded-full transition-all motion-reduce:transition-none ${selected === index ? 'w-8 bg-blue-600' : 'w-2.5 bg-slate-300'}`} /></button>)}</div>
      <div className="flex gap-2"><Button type="button" variant="outline" size="icon" className="h-11 w-11 rounded-full" aria-label="Etapa anterior" disabled={!api || selected === 0} onClick={() => api?.scrollPrev()}><ArrowLeft className="h-4 w-4" /></Button><Button type="button" size="icon" className="h-11 w-11 rounded-full" aria-label="Próxima etapa" disabled={!api || selected === steps.length - 1} onClick={() => api?.scrollNext()}><ArrowRight className="h-4 w-4" /></Button></div>
    </div>
  </Carousel>
}
