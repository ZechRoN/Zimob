import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { callBackend } from "@/blink/backend";
import { Slider } from "@/components/ui/slider";
import { brl } from "@/lib/format";
import { Search, Menu, X, Instagram, Facebook, Phone } from "lucide-react";

export const Route = createFileRoute("/imoveis/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Coleção de imóveis — ${params.slug}` },
      { name: "description", content: "Seleção curada de residências e propriedades de alto padrão." },
      { property: "og:title", content: `Imóveis — ${params.slug}` },
      { property: "og:type", content: "website" },
    ],
  }),
  component: VitrineLuxe,
});

function VitrineLuxe() {
  const { slug } = Route.useParams();
  const q = useQuery({
    queryKey: ["luxe-vitrine", slug],
    queryFn: async () => callBackend('/api/public',{action:'catalog',slug}),
  });

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll); onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [transacao, setTransacao] = useState("todos");
  const [bairro, setBairro] = useState("todos");
  const [preco, setPreco] = useState<[number, number]>([0, 10_000_000]);
  const [busca, setBusca] = useState("");

  const bairros = useMemo(
    () => Array.from(new Set((q.data?.properties ?? []).map((p: any) => p.neighborhood).filter(Boolean))).sort(),
    [q.data],
  );
  const maxPrice = useMemo(
    () => Math.max(5_000_000, ...(q.data?.properties ?? []).map((p: any) => Number(p.price) || 0)),
    [q.data],
  );

  const filtered = useMemo(
    () => (q.data?.properties ?? []).filter((p: any) => {
      if (transacao !== "todos" && p.transaction !== transacao) return false;
      if (bairro !== "todos" && p.neighborhood !== bairro) return false;
      const price = Number(p.price) || 0;
      if (price < preco[0] || price > preco[1]) return false;
      if (busca && !`${p.title} ${p.neighborhood ?? ""}`.toLowerCase().includes(busca.toLowerCase())) return false;
      return true;
    }),
    [q.data, transacao, bairro, preco, busca],
  );

  if (q.isLoading) {
    return (
      <div className="min-h-screen bg-[var(--luxe-ivory)] flex items-center justify-center font-sans-luxe text-[var(--luxe-charcoal)]/60 text-sm tracking-luxe uppercase">
        Carregando coleção...
      </div>
    );
  }
  if (!q.data?.company) {
    return (
      <div className="min-h-screen bg-[var(--luxe-ivory)] flex items-center justify-center font-sans-luxe">
        <div className="text-center">
          <h1 className="font-serif-luxe text-4xl mb-2">Imobiliária não encontrada</h1>
          <p className="text-[var(--luxe-charcoal)]/60">Verifique o link e tente novamente.</p>
        </div>
      </div>
    );
  }

  const c = q.data.company as any;
  const hero = q.data.properties?.[0]?.photos?.[0]
    ?? "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2400&q=80";

  return (
    <div className="min-h-screen bg-[var(--luxe-ivory)] text-[var(--luxe-charcoal)] font-sans-luxe">
      <PublicHeader c={c} scrolled={scrolled} menuOpen={menuOpen} setMenuOpen={setMenuOpen} slug={slug} />

      {/* HERO */}
      <section className="relative h-[88vh] min-h-[600px] w-full overflow-hidden">
        <motion.img
          initial={{ scale: 1.08, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.8, ease: [0.2, 0.7, 0.2, 1] }}
          src={hero} alt={c.name} className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80" />
        <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 1 }}>
            <div className="tracking-luxe text-[11px] uppercase text-[var(--luxe-gold)] mb-4">Coleção exclusiva</div>
            <h1 className="font-serif-luxe text-5xl md:text-7xl lg:text-8xl leading-[1.05] max-w-4xl">{c.name}</h1>
            <p className="mt-6 max-w-xl mx-auto text-primary-foreground/75 text-base md:text-lg font-light">
              {c.settings?.vitrine_descricao ?? "Residências cuidadosamente selecionadas para quem busca o extraordinário."}
            </p>
          </motion.div>

          {/* Hero search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-12 w-full max-w-3xl bg-app-card/95 backdrop-blur px-6 py-5 flex flex-col md:flex-row gap-4 items-stretch"
          >
            <select value={transacao} onChange={(e) => setTransacao(e.target.value)}
              className="flex-1 bg-transparent border-b border-[var(--luxe-line)] py-2 text-sm text-[var(--luxe-charcoal)] focus:outline-none focus:border-[var(--luxe-gold)] uppercase tracking-wider">
              <option value="todos">Todas transações</option>
              <option value="venda">Venda</option>
              <option value="aluguel">Aluguel</option>
              <option value="temporada">Temporada</option>
            </select>
            <select value={bairro} onChange={(e) => setBairro(e.target.value)}
              className="flex-1 bg-transparent border-b border-[var(--luxe-line)] py-2 text-sm text-[var(--luxe-charcoal)] focus:outline-none focus:border-[var(--luxe-gold)] uppercase tracking-wider">
              <option value="todos">Todos bairros</option>
              {bairros.map((b: any) => <option key={b} value={b}>{b}</option>)}
            </select>
            <div className="flex-1 flex items-center gap-2 border-b border-[var(--luxe-line)]">
              <Search className="h-4 w-4 text-[var(--luxe-charcoal)]/40" />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar imóvel..."
                className="flex-1 bg-transparent py-2 text-sm focus:outline-none placeholder:text-[var(--luxe-charcoal)]/40" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sticky filter bar */}
      <div className="sticky top-[72px] z-30 bg-[var(--luxe-ivory)]/95 backdrop-blur border-b border-[var(--luxe-line)]">
        <div className="container mx-auto px-6 py-4 flex flex-wrap items-center gap-8 text-xs uppercase tracking-luxe">
          <span className="text-[var(--luxe-charcoal)]/50">{filtered.length} residências</span>
          <div className="flex items-center gap-6 ml-auto">
            <span className="text-[var(--luxe-charcoal)]/40">Preço</span>
            <div className="w-48">
              <Slider min={0} max={maxPrice} step={50_000} value={preco}
                onValueChange={(v) => setPreco([v[0], v[1]] as [number, number])} />
            </div>
            <span className="tabular-nums text-[var(--luxe-charcoal)]/70">{brl(preco[0])} — {brl(preco[1])}</span>
          </div>
        </div>
      </div>

      {/* GRID */}
      <main className="container mx-auto px-6 py-20">
        {filtered.length === 0 ? (
          <div className="text-center py-32">
            <div className="font-serif-luxe text-3xl mb-3">Nenhuma residência encontrada</div>
            <p className="text-[var(--luxe-charcoal)]/60">Ajuste os filtros para descobrir nossa coleção.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-14">
            {filtered.map((p: any, i: number) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: (i % 6) * 0.05, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <Link to="/imovel/$slug/$id" params={{ slug, id: p.id }} className="group block cursor-pointer">
                  <div className="relative aspect-[4/5] overflow-hidden bg-[var(--luxe-ivory-soft)]">
                    {p.photos?.[0] ? (
                      <img src={p.photos[0]} alt={p.title} loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.05]" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[var(--luxe-charcoal)]/30 text-xs uppercase tracking-luxe">Sem foto</div>
                    )}
                    <div className="absolute top-4 left-4 text-[10px] uppercase tracking-luxe text-[var(--luxe-gold)] bg-black/40 backdrop-blur-sm px-3 py-1.5">
                      {p.transaction}
                    </div>
                  </div>
                  <div className="pt-5 pb-2">
                    <h3 className="font-serif-luxe text-2xl leading-tight group-hover:text-[var(--luxe-gold)] transition-colors duration-500">
                      {brl(Number(p.price))}{p.transaction === "aluguel" && <span className="text-sm text-[var(--luxe-charcoal)]/40 font-sans-luxe font-light"> /mês</span>}
                    </h3>
                    <div className="mt-2 text-xs uppercase tracking-wider text-[var(--luxe-charcoal)]/50">
                      {[p.neighborhood, p.city].filter(Boolean).join(" · ")}
                    </div>
                    <div className="mt-1 text-sm text-[var(--luxe-charcoal)]/65 font-light">
                      {[p.bedrooms && `${p.bedrooms} dorm`, p.area_useful && `${p.area_useful} m²`, p.parking && `${p.parking} vaga${p.parking > 1 ? "s" : ""}`].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <PublicFooter c={c} />
    </div>
  );
}

export function PublicHeader({ c, scrolled, menuOpen, setMenuOpen, slug }: { c: any; scrolled: boolean; menuOpen: boolean; setMenuOpen: (b: boolean) => void; slug: string }) {
  useEffect(()=>{if(/^#[0-9a-f]{6}$/i.test(c.cor_primaria||''))document.documentElement.style.setProperty('--luxe-gold',c.cor_primaria);return()=>{document.documentElement.style.removeProperty('--luxe-gold')}},[c.cor_primaria]);
  return (
    <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${scrolled ? "bg-[var(--luxe-charcoal)] text-primary-foreground py-3 shadow-2xl" : "bg-transparent text-primary-foreground py-6"}`}>
      <div className="container mx-auto px-6 grid grid-cols-3 items-center">
        <div className="text-[11px] uppercase tracking-luxe space-y-0.5">
          {c.telefone && <div className="opacity-80">{c.telefone}</div>}
          {c.creci && <div className="opacity-50">CRECI {c.creci}</div>}
        </div>
        <Link to="/imoveis/$slug" params={{ slug }} className="text-center justify-self-center">
          {c.logo_url
            ? <img src={c.logo_url} alt={c.name} className="h-10 mx-auto" />
            : <div className="font-serif-luxe text-2xl tracking-tight">{c.name}</div>}
        </Link>
        <div className="justify-self-end flex items-center gap-8 text-[11px] uppercase tracking-luxe">
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden" aria-label="menu">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/imoveis/$slug" params={{ slug }} className="luxe-underline-link">Imóveis</Link>
            <a href="#sobre" className="luxe-underline-link">Sobre</a>
            <a href="#contato" className="luxe-underline-link">Contato</a>
          </nav>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter({ c }: { c: any }) {
  return (
    <footer id="contato" className="bg-[var(--luxe-charcoal)] text-primary-foreground/80 mt-24">
      <div className="container mx-auto px-6 py-20 grid md:grid-cols-4 gap-10 text-sm font-light">
        <div>
          <div className="font-serif-luxe text-2xl text-primary-foreground mb-4">{c.name}</div>
          {c.creci && <div className="text-xs uppercase tracking-luxe text-primary-foreground/40">CRECI {c.creci}</div>}
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-luxe text-[var(--luxe-gold)] mb-4">Contato</div>
          {c.telefone && <a href={`tel:${c.telefone}`} className="block hover:text-primary-foreground transition flex items-center gap-2"><Phone className="h-3 w-3" />{c.telefone}</a>}
          {c.email && <div className="mt-1">{c.email}</div>}
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-luxe text-[var(--luxe-gold)] mb-4">Imóveis</div>
          <a href={`/imoveis/${c.slug}`} className="underline">Ver imóveis disponíveis</a>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-luxe text-[var(--luxe-gold)] mb-4">Atendimento</div>
          <div className="text-sm">{c.telefone?<a href={`tel:${c.telefone}`} className="underline">Fale com nossa equipe</a>:<span>Use o formulário do imóvel para registrar seu interesse.</span>}</div>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-[10px] uppercase tracking-luxe text-[var(--luxe-gold)]/70">
        © {new Date().getFullYear()} {c.name} · Powered by ImobFlow AI
      </div>
    </footer>
  );
}
