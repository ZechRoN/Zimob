import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, MapPin, Bed, Bath, Maximize2, Star, Globe, Lock, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { demoProperties, demoBrokers, brl } from "@/lib/demo-data";

export const Route = createFileRoute("/demo/imoveis")({ component: ImoveisDemo });

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  disponivel:    { label: "Ativo",        bg: "#DCFCE7", color: "#166534" },
  reservado:     { label: "Reservado",    bg: "#FEF3C7", color: "#92400E" },
  vendido:       { label: "Vendido",      bg: "#DCFCE7", color: "#166534" },
  alugado:       { label: "Alugado",      bg: "#DBEAFE", color: "#1E40AF" },
  indisponivel:  { label: "Indisponível", bg: "#F3F4F6", color: "var(--app-text-muted)" },
};

function ImoveisDemo() {
  const [q, setQ] = useState(""); const [type, setType] = useState(""); const [fin, setFin] = useState("");
  const list = demoProperties.filter((p) =>
    (!q || p.title.toLowerCase().includes(q.toLowerCase()) || p.neighborhood.toLowerCase().includes(q.toLowerCase())) &&
    (!type || p.type === type) && (!fin || p.finalidade === fin));

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-app-text">Imóveis</h1>
          <p className="text-sm text-[var(--app-text-muted)]">{list.length} imóveis cadastrados</p>
        </div>
        <Button className="bg-primary hover:bg-blue-700 text-primary-foreground"><Plus className="h-4 w-4 mr-1" />Novo imóvel</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--app-text-muted)]" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título ou bairro..." className="pl-9 bg-app-card border-[var(--app-border)]" />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className="h-10 rounded-md border border-[var(--app-border)] bg-app-card px-3 text-sm">
          <option value="">Todos tipos</option>
          {["apartamento","casa","comercial","terreno"].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={fin} onChange={(e) => setFin(e.target.value)} className="h-10 rounded-md border border-[var(--app-border)] bg-app-card px-3 text-sm">
          <option value="">Venda + Aluguel</option>
          <option value="venda">Venda</option>
          <option value="aluguel">Aluguel</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((p, i) => {
          const broker = demoBrokers.find((b) => b.id === p.broker_id);
          const st = STATUS_BADGE[p.status] ?? STATUS_BADGE.disponivel;
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-app-card border border-[var(--app-border)] rounded-xl overflow-hidden group hover:shadow-md hover:border-[#2C5F7A66] hover:-translate-y-0.5 transition">
              <div className="relative h-44 overflow-hidden bg-[var(--app-card-2)]">
                <img src={p.image_url} alt={p.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <span className="absolute top-3 left-3 text-[10px] uppercase font-bold px-2 py-1 rounded" style={{ background: p.finalidade === "venda" ? "#DCFCE7" : "#DBEAFE", color: p.finalidade === "venda" ? "#166534" : "#1E40AF" }}>{p.finalidade}</span>
                <div className="absolute top-3 right-3 flex gap-1">
                  {p.featured && <span className="bg-[#FEF3C7] text-[#92400E] p-1 rounded" title="Destaque"><Star className="h-3 w-3" /></span>}
                  {p.publish ? <span className="bg-[#DBEAFE] text-[#1E40AF] p-1 rounded" title="Vitrine"><Globe className="h-3 w-3" /></span>
                            : <span className="bg-[#F3F4F6] text-[var(--app-text-muted)] p-1 rounded" title="Privado"><Lock className="h-3 w-3" /></span>}
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-app-text line-clamp-1">{p.title}</h3>
                <div className="text-xs text-[var(--app-text-muted)] flex items-center gap-1"><MapPin className="h-3 w-3" />{p.neighborhood}, {p.city}</div>
                <div className="flex items-center gap-3 text-xs text-[var(--app-text-muted)]">
                  {p.bedrooms > 0 && <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{p.bedrooms}</span>}
                  {p.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{p.bathrooms}</span>}
                  <span className="flex items-center gap-1"><Maximize2 className="h-3 w-3" />{p.area}m²</span>
                </div>
                <div className="text-lg font-extrabold text-primary">{brl(p.price)}{p.finalidade === "aluguel" ? <span className="text-xs font-normal text-[var(--app-text-muted)]">/mês</span> : null}</div>
                <div className="flex items-center justify-between pt-2 border-t border-[var(--app-border)]">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  {broker && <div className="flex items-center gap-1.5"><img src={broker.avatar} alt="" className="h-5 w-5 rounded-full" /><span className="text-[10px] text-[var(--app-text-muted)]">{broker.name.split(" ")[0]}</span></div>}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      {list.length === 0 && (
        <div className="bg-app-card border border-dashed border-[var(--app-border)] rounded-xl p-12 text-center text-[var(--app-text-muted)]">
          <Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />Nenhum imóvel encontrado.
        </div>
      )}
    </div>
  );
}

