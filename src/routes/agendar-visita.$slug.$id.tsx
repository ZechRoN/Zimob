import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { callBackend } from "@/integrations/supabase/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { brl } from "@/lib/format";
import { Check, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { PublicHeader, PublicFooter } from "./imoveis.$slug";

export const Route = createFileRoute("/agendar-visita/$slug/$id")({
  head: () => ({ meta: [{ title: "Agendar visita exclusiva — ImobFlow" }, { name: "robots", content: "noindex" }] }),
  component: AgendarLuxe,
});

const HORARIOS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const schema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(20),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  message: z.string().trim().max(500).optional().or(z.literal("")),
});

function AgendarLuxe() {
  const { slug, id } = Route.useParams();
  const q = useQuery({
    queryKey: ["luxe-agendar", slug, id],
    queryFn: async () => callBackend('/api/public',{action:'catalog',slug,id}),
  });

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll); onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [date, setDate] = useState<Date | undefined>();
  const [hora, setHora] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<{ protocolo: string } | null>(null);

  // Check already-taken slots for chosen date (frontend conflict prevention)
  const taken = useQuery({
    queryKey: ["taken-slots", id, date?.toDateString()],
    enabled: !!date && !!q.data?.property,
    queryFn: async () => {const d=new Date(date!);const day=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');const r=await callBackend('/api/public',{action:'slots',slug,id,date:day});return r.taken.map((v:string)=>new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'}).format(new Date(v)));},
  });
  const takenSet = useMemo(() => new Set(taken.data ?? []), [taken.data]);

  if (q.isLoading) return <div className="min-h-screen bg-[var(--luxe-ivory)] flex items-center justify-center text-sm uppercase tracking-luxe text-[var(--luxe-charcoal)]/50">Carregando...</div>;
  const c = q.data?.company as any;
  const p = q.data?.property as any;
  if (!c || !p) return <div className="min-h-screen bg-[var(--luxe-ivory)] flex items-center justify-center font-serif-luxe text-3xl">Imóvel não encontrado</div>;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!date || !hora) { toast.error("Selecione data e horário."); return; }
    if (takenSet.has(hora)) { toast.error("Esse horário acabou de ser reservado. Escolha outro."); return; }
    setLoading(true);
    const [h, m] = hora.split(":").map(Number);
    const when=new Date(date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0')+'T'+hora+':00-03:00');
    try{const result=await callBackend('/api/public',{action:'book',slug,id,...parsed.data,scheduled_at:when.toISOString()});setConfirm({protocolo:result.protocolo});}catch(e:any){toast.error(e.message);return;}finally{setLoading(false)}
    toast.success("Visita solicitada");
  };

  if (confirm) {
    const waText = encodeURIComponent(`Olá ${c.name}! Acabei de solicitar uma visita ao imóvel ${p.title}. Protocolo: ${confirm.protocolo}`);
    const waLink = c.telefone ? `https://wa.me/55${String(c.telefone).replace(/\D/g, "")}?text=${waText}` : null;
    return (
      <div className="min-h-screen bg-[var(--luxe-ivory)] flex items-center justify-center px-6 font-sans-luxe">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="max-w-md w-full bg-app-card border border-[var(--luxe-line)] p-12 text-center">
          <div className="h-14 w-14 mx-auto rounded-full bg-[var(--luxe-gold)]/15 flex items-center justify-center mb-6">
            <Check className="h-7 w-7 text-[var(--luxe-gold)]" />
          </div>
          <div className="text-[11px] uppercase tracking-luxe text-[var(--luxe-gold)] mb-3">Solicitação registrada</div>
          <h1 className="font-serif-luxe text-3xl mb-3">Em breve entraremos em contato</h1>
          <p className="text-sm text-[var(--luxe-charcoal)]/60 mb-8 font-light">A equipe da {c.name} recebeu sua solicitação no painel. Você também pode falar pelo WhatsApp.</p>
          <div className="text-[10px] uppercase tracking-luxe text-[var(--luxe-charcoal)]/40">Protocolo</div>
          <div className="font-serif-luxe text-xl tabular-nums mb-8">{confirm.protocolo}</div>
          <div className="flex flex-col gap-2">
            {waLink && <a href={waLink} target="_blank" rel="noreferrer">
              <Button className="w-full bg-[var(--luxe-charcoal)] hover:bg-[var(--luxe-navy)] text-primary-foreground uppercase tracking-luxe text-xs rounded-none h-11">
                <MessageCircle className="h-4 w-4 mr-2" /> Falar no WhatsApp
              </Button>
            </a>}
            <Link to="/imoveis/$slug" params={{ slug }}>
              <Button variant="outline" className="w-full uppercase tracking-luxe text-xs rounded-none h-11 border-[var(--luxe-line)]">Voltar à coleção</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--luxe-ivory)] text-[var(--luxe-charcoal)] font-sans-luxe">
      <PublicHeader c={c} scrolled={scrolled} menuOpen={menuOpen} setMenuOpen={setMenuOpen} slug={slug} />

      <main className="pt-24 grid lg:grid-cols-2 min-h-[calc(100vh-96px)]">
        {/* LEFT - property snapshot */}
        <div className="relative bg-[var(--luxe-charcoal)] text-primary-foreground overflow-hidden min-h-[400px]">
          {p.photos?.[0] && (
            <img src={p.photos[0]} alt={p.title} className="absolute inset-0 w-full h-full object-cover opacity-55" />
          )}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/40 to-transparent" />
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}
            className="relative h-full flex flex-col justify-end p-12 lg:p-16">
            <div className="text-[11px] uppercase tracking-luxe text-[var(--luxe-gold)] mb-3">{p.transaction} · {p.type}</div>
            <h1 className="font-serif-luxe text-4xl md:text-5xl leading-tight">{p.title}</h1>
            <div className="text-sm text-primary-foreground/70 mt-3 font-light">{[p.neighborhood, p.city].filter(Boolean).join(" · ")}</div>
            <div className="font-serif-luxe text-3xl mt-8">{brl(Number(p.price))}</div>
            <div className="mt-6 pt-6 border-t border-white/15 text-xs uppercase tracking-luxe text-primary-foreground/50">
              Agendamento exclusivo · {c.name}
            </div>
          </motion.div>
        </div>

        {/* RIGHT - form */}
        <div className="bg-[var(--luxe-ivory)] p-10 lg:p-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15 }}>
            <div className="text-[11px] uppercase tracking-luxe text-[var(--luxe-gold)] mb-3">Agendamento</div>
            <h2 className="font-serif-luxe text-4xl mb-2">Visite a residência</h2>
            <p className="text-sm text-[var(--luxe-charcoal)]/60 font-light mb-10">Selecione data, horário e seus dados. A equipe verá seu pedido no painel.</p>

            <form onSubmit={submit} className="space-y-8">
              <div>
                <div className="text-[10px] uppercase tracking-luxe text-[var(--luxe-charcoal)]/50 mb-3">Data</div>
                <div className="inline-block border border-[var(--luxe-line)] bg-app-card p-3">
                  <Calendar mode="single" selected={date} onSelect={setDate}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} className="pointer-events-auto" />
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-luxe text-[var(--luxe-charcoal)]/50 mb-3">Horário de Brasília</div>
                <div className="grid grid-cols-4 gap-2">
                  {HORARIOS.map((h) => {
                    const isTaken = takenSet.has(h);
                    const active = hora === h;
                    return (
                      <button type="button" key={h} disabled={isTaken}
                        onClick={() => setHora(h)}
                        className={`py-3 text-xs uppercase tracking-luxe transition-all border tabular-nums ${
                          isTaken
                            ? "border-[var(--luxe-line)] text-[var(--luxe-charcoal)]/25 line-through cursor-not-allowed bg-[var(--luxe-ivory-soft)]"
                            : active
                              ? "bg-[var(--luxe-charcoal)] text-[var(--luxe-gold)] border-[var(--luxe-charcoal)]"
                              : "bg-app-card border-[var(--luxe-line)] hover:border-[var(--luxe-gold)]"
                        }`}>
                        {h}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-5 pt-4 border-t border-[var(--luxe-line)]">
                <Input name="name" placeholder="Nome completo" required maxLength={120} className="luxe-input rounded-none" />
                <Input name="phone" placeholder="Telefone / WhatsApp" required maxLength={20} className="luxe-input rounded-none" />
                <Input name="email" type="email" placeholder="Email" maxLength={160} className="luxe-input rounded-none" />
                <Textarea name="message" rows={3} placeholder="Mensagem (opcional)" maxLength={500} className="luxe-input rounded-none resize-none" />
              </div>
              <Button type="submit" disabled={loading}
                className="w-full h-14 bg-[var(--luxe-gold)] hover:bg-[var(--luxe-gold-soft)] text-[var(--luxe-charcoal)] uppercase tracking-luxe text-xs font-medium rounded-none">
                {loading ? "Enviando..." : "Solicitar visita"}
              </Button>
            </form>
          </motion.div>
        </div>
      </main>

      <PublicFooter c={c} />
    </div>
  );
}
