import { AccountSecurity } from '@/components/account-security';
import { createFileRoute, Link } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { Users, Plus, Trash2, Upload, ExternalLink } from "lucide-react";
import { BookingLinkCard } from "@/components/booking-link-card";

export const Route = createFileRoute("/app/configuracoes")({ component: Config });

function Config() {
  const { data: cu, refetch } = useCurrentUser();
  if (!cu?.company) return <div className="text-muted-foreground">Carregando...</div>;
  if (!cu.isSuperAdmin && (cu.isSuspended || !["owner", "admin"].includes(cu.companyUser?.role))) return <div className="space-y-6"><PageHeader title="Minha conta" description="Gerencie a segurança do seu acesso" /><AccountSecurity /></div>;
  return (<div><PageHeader title="Configurações" description="Personalize sua imobiliária" />
    <Tabs defaultValue="empresa">
      <TabsList className="mb-6 h-auto flex-wrap">
        <TabsTrigger value="seguranca">Minha conta</TabsTrigger>
        <TabsTrigger value="empresa">Imobiliária</TabsTrigger>
        <TabsTrigger value="equipe">Equipe</TabsTrigger>
        <TabsTrigger value="vitrine">Vitrine</TabsTrigger>
        <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
      </TabsList>
      <TabsContent value="seguranca"><AccountSecurity /></TabsContent>
      <TabsContent value="empresa"><Empresa cu={cu} refetch={refetch} /></TabsContent>
      <TabsContent value="equipe"><EquipeTab /></TabsContent>
      <TabsContent value="vitrine"><Vitrine cu={cu} refetch={refetch} /></TabsContent>
      <TabsContent value="notificacoes"><Notif cu={cu} refetch={refetch} /></TabsContent>
    </Tabs>
  </div>);
}

function Empresa({ cu, refetch }: any) {
  const c = cu.company;
  const [name, setName] = useState(c.name ?? "");
  const [cnpj, setCnpj] = useState(c.cnpj ?? "");
  const [creci, setCreci] = useState(c.creci ?? "");
  const [telefone, setTelefone] = useState(c.telefone ?? "");
  const [email, setEmail] = useState(c.email ?? "");
  const [cor, setCor] = useState(c.cor_primaria ?? "#0EA5E9");
  const [logoUrl, setLogoUrl] = useState<string>(c.logo_url ?? "");
  const [uploading, setUploading] = useState(false);

  const onFile = async (file: File) => {
    setUploading(true);
    try {
      const path = `${c.id}/logo-${Date.now()}-${file.name}`;
      const up = await supabase.storage.from("logos").upload(path, file, { upsert: true });
      if (up.error) throw up.error;
      const { data: pub } = supabase.storage.from("logos").getPublicUrl(path);
      const saved=await supabase.from("company").update({ logo_url: pub.publicUrl }).eq("id", c.id);if(saved.error)throw saved.error;
      setLogoUrl(pub.publicUrl); refetch(); toast.success("Logo atualizado");
    } catch (e: any) { toast.error(e.message); } finally { setUploading(false); }
  };

  const save = async () => {
    const { error } = await supabase.from("company").update({ name, cnpj, creci, telefone, email, cor_primaria: cor }).eq("id", c.id);
    if (error) toast.error(error.message); else { toast.success("Salvo"); refetch(); }
  };

  return (<div className="grid lg:grid-cols-2 gap-4">
    <Card><CardHeader><CardTitle>Dados da imobiliária</CardTitle></CardHeader><CardContent className="space-y-3">
      <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>CNPJ</Label><Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} /></div>
        <div><Label>CRECI</Label><Input value={creci} onChange={(e) => setCreci(e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Telefone</Label><Input value={telefone} onChange={(e) => setTelefone(e.target.value)} /></div>
        <div><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      </div>
      <Button onClick={save} className="bg-brand text-brand-foreground w-full">Salvar dados</Button>
    </CardContent></Card>

    <Card><CardHeader><CardTitle>Aparência e marca</CardTitle></CardHeader><CardContent className="space-y-4">
      <div>
        <Label>Logo</Label>
        <div className="mt-2 border-2 border-dashed rounded-lg p-4 text-center">
          {logoUrl ? <img src={logoUrl} alt="Logo" className="h-20 mx-auto mb-2" /> : <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />}
          <Input type="file" accept="image/*" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} className="mt-2" />
        </div>
      </div>
      <div>
        <Label>Cor primária</Label>
        <div className="flex gap-2 items-center mt-2">
          <Input type="color" value={cor} onChange={(e) => setCor(e.target.value)} className="w-16 h-10 p-1" />
          <Input value={cor} onChange={(e) => setCor(e.target.value)} className="flex-1" />
        </div>
        <div className="mt-3 p-4 rounded-lg" style={{ background: cor }}>
          <div className="text-primary-foreground font-semibold">Preview ao vivo</div>
          <div className="text-primary-foreground/80 text-sm">Botões, links e badges usarão esta cor.</div>
        </div>
        <Button onClick={save} className="bg-brand text-brand-foreground w-full mt-3">Aplicar tema</Button>
      </div>
    </CardContent></Card>
  </div>);
}

function EquipeTab() {
  return (<Card><CardContent className="p-8 text-center">
    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
    <div className="font-semibold mb-2">Gerenciamento de equipe</div>
    <p className="text-sm text-muted-foreground mb-4">Convide corretores, defina papéis e comissões.</p>
    <Link to="/app/equipe"><Button className="bg-brand text-brand-foreground">Ir para Equipe <ExternalLink className="h-4 w-4 ml-1" /></Button></Link>
  </CardContent></Card>);
}

function Vitrine({ cu, refetch }: any) {
  const c = cu.company;
  const s = (c.settings ?? {}) as any;
  const [slug, setSlug] = useState(c.slug ?? "");
  const [descricao, setDescricao] = useState<string>(s.vitrine_descricao ?? "");
  const [whatsapp, setWhatsapp] = useState<string>(s.whatsapp ?? "");
  const [depoimentos, setDepoimentos] = useState<{ nome: string; texto: string }[]>(s.depoimentos ?? []);

  const save = async () => {
    const settings = { ...s, vitrine_descricao: descricao, whatsapp, depoimentos };
    const { error } = await supabase.from("company").update({ slug, settings }).eq("id", c.id);
    if (error) toast.error(error.message); else { toast.success("Vitrine atualizada"); refetch(); }
  };

  return (<div className="grid lg:grid-cols-2 gap-4">
    <div className="lg:col-span-2"><BookingLinkCard slug={c.slug} companyName={c.name} /></div>
    <Card><CardHeader><CardTitle>Configurações públicas</CardTitle></CardHeader><CardContent className="space-y-3">
      <div><Label>Slug da URL</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">/vitrine/</span>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="minha-imobiliaria" />
        </div>
      </div>
      <div><Label>Descrição pública</Label>
        <Textarea rows={4} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Conte sobre sua imobiliária..." />
      </div>
      <div><Label>WhatsApp para contato</Label><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="5511999999999" /></div>
      <Button onClick={save} className="bg-brand text-brand-foreground w-full">Salvar vitrine</Button>
      {slug && <Link to="/vitrine/$slug" params={{ slug }} target="_blank" className="text-sm text-brand flex items-center gap-1 justify-center mt-2">Ver vitrine pública <ExternalLink className="h-3 w-3" /></Link>}
    </CardContent></Card>

    <Card><CardHeader><CardTitle className="flex items-center justify-between">Depoimentos
      <Button size="sm" variant="outline" onClick={() => setDepoimentos([...depoimentos, { nome: "", texto: "" }])}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
    </CardTitle></CardHeader><CardContent className="space-y-3">
      {depoimentos.map((d, i) => (
        <div key={i} className="border rounded-md p-3 space-y-2">
          <div className="flex gap-2"><Input placeholder="Nome" value={d.nome} onChange={(e) => setDepoimentos(depoimentos.map((x, j) => j === i ? { ...x, nome: e.target.value } : x))} />
            <Button size="icon" variant="ghost" onClick={() => setDepoimentos(depoimentos.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
          </div>
          <Textarea rows={2} placeholder="Depoimento" value={d.texto} onChange={(e) => setDepoimentos(depoimentos.map((x, j) => j === i ? { ...x, texto: e.target.value } : x))} />
        </div>
      ))}
      {!depoimentos.length && <p className="text-sm text-muted-foreground text-center py-4">Nenhum depoimento ainda</p>}
      <Button onClick={save} className="bg-brand text-brand-foreground w-full">Salvar depoimentos</Button>
    </CardContent></Card>
  </div>);
}

function Notif({ cu, refetch }: any) {
  const c = cu.company;
  const s = (c.settings ?? {}) as any;
  const initial = s.notifications ?? {};
  const [n, setN] = useState<Record<string, { email: boolean; whatsapp: boolean }>>({
    novo_lead: initial.novo_lead ?? { email: true, whatsapp: false },
    visita_agendada: initial.visita_agendada ?? { email: true, whatsapp: true },
    proposta_recebida: initial.proposta_recebida ?? { email: true, whatsapp: true },
    comissao_paga: initial.comissao_paga ?? { email: true, whatsapp: false },
    trial_expirando: initial.trial_expirando ?? { email: true, whatsapp: false },
  });
  const labels: Record<string, string> = {
    novo_lead: "Novo lead capturado", visita_agendada: "Visita agendada",
    proposta_recebida: "Proposta recebida", comissao_paga: "Comissão paga",
    trial_expirando: "Trial expirando",
  };
  const save = async () => {
    const { error } = await supabase.from("company").update({ settings: { ...s, notifications: n } }).eq("id", c.id);
    if (error) toast.error(error.message); else { toast.success("Preferências salvas. O envio automático precisa de integração."); refetch(); }
  };
  return (<Card><CardHeader><CardTitle>Preferências de notificação</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground mb-4">Estas preferências ficam salvas, mas os envios automáticos precisam ser integrados. Nenhuma mensagem será enviada ao marcar as opções.</p>
    <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center mb-3 pb-2 border-b">
      <span className="font-semibold text-sm">Evento</span>
      <Badge variant="outline">Email</Badge><Badge variant="outline">WhatsApp</Badge>
    </div>
    <div className="space-y-3">
      {Object.entries(labels).map(([key, label]) => (
        <div key={key} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center py-2">
          <span className="text-sm">{label}</span>
          <Switch checked={n[key].email} onCheckedChange={(v) => setN({ ...n, [key]: { ...n[key], email: v } })} />
          <Switch checked={n[key].whatsapp} onCheckedChange={(v) => setN({ ...n, [key]: { ...n[key], whatsapp: v } })} />
        </div>
      ))}
    </div>
    <Button onClick={save} className="bg-brand text-brand-foreground w-full mt-4">Salvar preferências</Button>
  </CardContent></Card>);
}
