import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { callBackend } from "@/integrations/supabase/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { brl } from "@/lib/format";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Bed, Bath, Square, Car, Check } from "lucide-react";
import { toast } from "sonner";
import { PublicHeader, PublicFooter } from "./imoveis.$slug";

export const Route = createFileRoute("/imovel/$slug/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "Residência exclusiva — Zimob" },
      { name: "description", content: "Detalhes da residência." },
      { property: "og:url", content: `/imovel/${params.slug}/${params.id}` },
    ],
    links: [{ rel: "canonical", href: `/imovel/${params.slug}/${params.id}` }],
  }),
  component: ImovelLuxe,
});

function ImovelLuxe() {
  const { slug, id } = Route.useParams();
  const q = useQuery({
    queryKey: ["luxe-imovel", id, slug],
    queryFn: async () => callBackend('/api/public',{action:'catalog',slug,id}),
  });
  const [idx, setIdx] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll); onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (q.isLoading) return <div className="min-h-screen bg-[var(--luxe-ivory)] flex items-center justify-center text-sm uppercase tracking-luxe text-[var(--luxe-charcoal)]/50">Carregando...</div>;
  const p = q.data?.property;
  const c = q.data?.company;
  if (!p || !c) return <div className="min-h-screen bg-[var(--luxe-ivory)] flex items-center justify-center font-serif-luxe text-3xl">Imóvel não encontrado</div>;

  const photos: string[] = p.photos ?? [];
  const features: string[] = p.features ?? [];

  return (
    <div className="min-h-screen bg-[var(--luxe-ivory)] text-[var(--luxe-charcoal)] font-sans-luxe">
      <PublicHeader c={c} scrolled={scrolled} menuOpen={menuOpen} setMenuOpen={setMenuOpen} slug={slug} />

      {/* GALERIA */}
      <section className="relative pt-24 bg-[var(--luxe-charcoal)]">
        <div className="relative h-[78vh] min-h-[520px] w-full overflow-hidden bg-black">
          {photos[idx] ? (
            <motion.img key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}
              src={photos[idx]} alt={p.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary-foreground/30">Sem foto</div>
          )}
          {photos.length > 1 && (
            <>
              <button onClick={() => setIdx((i) => (i - 1 + photos.length) % photos.length)}
                className="absolute left-6 top-1/2 -translate-y-1/2 h-12 w-12 bg-app-card/10 hover:bg-[var(--luxe-gold)] text-primary-foreground backdrop-blur transition-all flex items-center justify-center">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={() => setIdx((i) => (i + 1) % photos.length)}
                className="absolute right-6 top-1/2 -translate-y-1/2 h-12 w-12 bg-app-card/10 hover:bg-[var(--luxe-gold)] text-primary-foreground backdrop-blur transition-all flex items-center justify-center">
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-6 right-6 text-[var(--luxe-gold)] text-sm tracking-luxe font-serif-luxe tabular-nums">
                {String(idx + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
              </div>
            </>
          )}
        </div>
        {photos.length > 1 && (
          <div className="container mx-auto px-6 py-6 flex gap-3 overflow-x-auto">
            {photos.map((src, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`shrink-0 w-24 h-16 overflow-hidden transition ${i === idx ? "ring-2 ring-[var(--luxe-gold)]" : "opacity-60 hover:opacity-100"}`}>
                <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* MAIN */}
      <main className="container mx-auto px-6 py-20 grid lg:grid-cols-[1fr_400px] gap-16">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="min-w-0">
          <div className="text-[11px] uppercase tracking-luxe text-[var(--luxe-gold)] mb-4">{p.transaction} · {p.type}{p.code && ` · Cód. ${p.code}`}</div>
          <h1 className="font-serif-luxe text-5xl md:text-6xl leading-tight">{p.title}</h1>
          {(p.neighborhood || p.city) && (
            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--luxe-charcoal)]/60">
              <MapPin className="h-4 w-4" />{[p.neighborhood, p.city, p.state].filter(Boolean).join(" · ")}
            </div>
          )}

          {/* Specs */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 border-y border-[var(--luxe-line)] divide-x divide-[var(--luxe-line)]">
            {[
              { icon: Bed, label: "Dormitórios", v: p.bedrooms },
              { icon: Bath, label: "Banheiros", v: p.bathrooms },
              { icon: Square, label: "Área útil", v: p.area_useful ? `${p.area_useful} m²` : null },
              { icon: Car, label: "Vagas", v: p.parking },
            ].filter((s) => s.v).map(({ icon: Icon, label, v }) => (
              <div key={label} className="p-5 text-center">
                <Icon className="h-4 w-4 mx-auto text-[var(--luxe-gold)]" />
                <div className="font-serif-luxe text-2xl mt-2 tabular-nums">{v}</div>
                <div className="text-[10px] uppercase tracking-luxe text-[var(--luxe-charcoal)]/50 mt-1">{label}</div>
              </div>
            ))}
          </div>

          {p.description && (
            <div className="mt-14">
              <div className="text-[11px] uppercase tracking-luxe text-[var(--luxe-gold)] mb-4">Sobre a residência</div>
              <p className="text-[var(--luxe-charcoal)]/75 whitespace-pre-line leading-[1.9] text-[15px] font-light max-w-prose">{p.description}</p>
            </div>
          )}

          {features.length > 0 && (
            <div className="mt-14">
              <div className="text-[11px] uppercase tracking-luxe text-[var(--luxe-gold)] mb-4">Diferenciais</div>
              <div className="grid sm:grid-cols-2 gap-y-3 gap-x-8 text-sm text-[var(--luxe-charcoal)]/75 font-light">
                {features.map((f) => (
                  <div key={f} className="flex items-center gap-3 border-b border-[var(--luxe-line)] pb-2">
                    <Check className="h-3.5 w-3.5 text-[var(--luxe-gold)]" />{f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Map placeholder */}
          <div className="mt-14">
            <div className="text-[11px] uppercase tracking-luxe text-[var(--luxe-gold)] mb-4">Localização</div>
            <div className="aspect-[16/7] bg-gradient-to-br from-[var(--luxe-navy)] via-[#243042] to-[var(--luxe-charcoal)] flex items-center justify-center text-primary-foreground/40 text-sm uppercase tracking-luxe">
              {p.neighborhood ?? "Localização privilegiada"}
            </div>
          </div>
        </motion.div>

        {/* SIDEBAR sticky */}
        <aside className="lg:sticky lg:top-32 self-start space-y-6">
          <div className="bg-app-card border border-[var(--luxe-line)] p-8">
            <div className="text-[10px] uppercase tracking-luxe text-[var(--luxe-charcoal)]/50">Valor</div>
            <div className="font-serif-luxe text-4xl mt-1">{brl(Number(p.price))}</div>
            {p.transaction === "aluguel" && <div className="text-xs text-[var(--luxe-charcoal)]/50 mt-1">por mês</div>}
            {(p.condo_fee || p.iptu) && (
              <div className="mt-4 pt-4 border-t border-[var(--luxe-line)] space-y-1 text-xs text-[var(--luxe-charcoal)]/65">
                {!!p.condo_fee && <div className="flex justify-between"><span>Condomínio</span><span className="tabular-nums">{brl(Number(p.condo_fee))}</span></div>}
                {!!p.iptu && <div className="flex justify-between"><span>IPTU</span><span className="tabular-nums">{brl(Number(p.iptu))}</span></div>}
              </div>
            )}
            <Link to="/agendar-visita/$slug/$id" params={{ slug, id: p.id }}>
              <Button className="w-full mt-6 h-12 bg-[var(--luxe-gold)] hover:bg-[var(--luxe-gold-soft)] text-[var(--luxe-charcoal)] uppercase tracking-luxe text-xs font-medium rounded-none">
                <CalendarIcon className="h-4 w-4 mr-2" /> Agendar visita
              </Button>
            </Link>
          </div>

          <InteresseLuxe companyId={c.id} propertyId={p.id} />

          <div className="bg-[var(--luxe-charcoal)] text-primary-foreground p-8">
            <div className="text-[10px] uppercase tracking-luxe text-[var(--luxe-gold)] mb-2">Corretor responsável</div>
            <div className="font-serif-luxe text-xl">{c.name}</div>
            {c.creci && <div className="text-xs text-primary-foreground/50 mt-1">CRECI {c.creci}</div>}
            {c.telefone && <a href={`tel:${c.telefone}`} className="block mt-4 text-sm text-[var(--luxe-gold)] luxe-underline-link inline-block">{c.telefone}</a>}
          </div>
        </aside>
      </main>

      {/* SIMILARES */}
      {q.data?.similar && q.data.similar.length > 0 && (
        <section className="bg-[var(--luxe-ivory-soft)] py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <div className="text-[11px] uppercase tracking-luxe text-[var(--luxe-gold)] mb-2">Você também pode gostar</div>
              <h2 className="font-serif-luxe text-4xl">Residências similares</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {q.data.similar.map((sp: any) => (
                <Link key={sp.id} to="/imovel/$slug/$id" params={{ slug, id: sp.id }} className="group block">
                  <div className="aspect-[4/5] overflow-hidden bg-[var(--luxe-ivory)]">
                    {sp.photos?.[0] && <img src={sp.photos[0]} alt={sp.title} loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-[1400ms] group-hover:scale-105" />}
                  </div>
                  <div className="pt-4">
                    <div className="font-serif-luxe text-xl">{brl(Number(sp.price))}</div>
                    <div className="text-xs uppercase tracking-wider text-[var(--luxe-charcoal)]/50 mt-1">{[sp.neighborhood, sp.city].filter(Boolean).join(" · ")}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <PublicFooter c={c} />
    </div>
  );
}

function InteresseLuxe({ companyId, propertyId }: { companyId: string; propertyId: string }) {
  const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    if (name.length < 2 || phone.length < 8) { toast.error("Informe nome e telefone."); return; }
    try{await callBackend('/api/public',{action:'interest',slug:window.location.pathname.split('/')[2],id:propertyId,name,phone,email:String(fd.get('email')||''),message:String(fd.get('notes')||'')})}catch(e:any){toast.error(e.message);return;}
    setSent(true); toast.success("Obrigado! Em breve entraremos em contato.");
  };
  return (
    <div className="bg-app-card border border-[var(--luxe-line)] p-8">
      <div className="text-[10px] uppercase tracking-luxe text-[var(--luxe-charcoal)]/50 mb-1">Demonstre interesse</div>
      <div className="font-serif-luxe text-xl mb-5">Receba mais detalhes</div>
      {sent ? (
        <p className="text-sm text-[var(--luxe-charcoal)]/60 font-light">Mensagem enviada. Aguarde nosso contato exclusivo.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Input name="name" placeholder="Nome completo" required className="luxe-input rounded-none" />
          <Input name="phone" placeholder="Telefone / WhatsApp" required className="luxe-input rounded-none" />
          <Input name="email" type="email" placeholder="Email" className="luxe-input rounded-none" />
          <Textarea name="notes" rows={3} placeholder="Mensagem (opcional)" className="luxe-input rounded-none resize-none" />
          <Button type="submit" className="w-full h-11 bg-[var(--luxe-charcoal)] hover:bg-[var(--luxe-navy)] text-primary-foreground uppercase tracking-luxe text-xs rounded-none">Enviar</Button>
        </form>
      )}
    </div>
  );
}
