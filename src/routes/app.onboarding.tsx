import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { callBackend } from "@/blink/backend";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { slugify } from "@/lib/format";
import { Check, Trash2 } from "lucide-react";

export const Route = createFileRoute("/app/onboarding")({ component: Onboarding });

const steps = ["Dados", "Branding", "Equipe", "Imóveis", "Pronto"];

type Invitee = { nome: string; email: string; creci?: string };

function Onboarding() {
  const { data: cu, refetch } = useCurrentUser();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", cnpj: "", creci: "", telefone: "", cor_primaria: "#0EA5E9" });
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [inv, setInv] = useState<Invitee>({ nome: "", email: "", creci: "" });
  const [zone, setZone] = useState("");
  const [prop, setProp] = useState({ title: "", price: "", city: "", neighborhood: "", bedrooms: "" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const saveDados = async () => {
    if (!cu?.company?.id) {try {await callBackend("/api/onboarding",{...form,cor:form.cor_primaria});await refetch();setStep(1);}catch(e:any){toast.error(e.message)}return;}
    const slug = slugify(form.name || cu.company.name);
    const { error } = await supabase.from("company").update({
      name: form.name || cu.company.name, cnpj: form.cnpj, creci: form.creci, telefone: form.telefone, slug,
    }).eq("id", cu.company.id);
    if (error) return toast.error(error.message);
    await refetch(); setStep(1);
  };
  const saveBranding = async () => {
    if (!cu?.company?.id) return;
    const {error}=await supabase.from("company").update({ cor_primaria: form.cor_primaria }).eq("id", cu.company.id);if(error)return toast.error(error.message);
    setStep(2);
  };
  const saveTeam = async () => {
    if (!cu?.company?.id) return;
    if (invitees.length) {
      const rows = invitees.map(i => ({ company_id: cu.company.id, email: i.email, nome: i.nome, creci: i.creci, role: "corretor" as const, comissao_pct: 50 }));
      for(const row of rows){const {error}=await supabase.from("company_user").insert(row);if(error)return toast.error(error.message);}
      toast.success(`${invitees.length} convite(s) registrados`);
    }
    setStep(3);
  };
  const saveImovel = async () => {
    if (!cu?.company?.id) return;
    setSaving(true);
    try {
      if (zone.trim()) await supabase.from("zone").insert({ company_id: cu.company.id, name: zone.trim() });
      let photos: string[] = [];
      if (photoFile) {
        const path = `${cu.company.id}/${Date.now()}-${photoFile.name}`;
        const up = await supabase.storage.from("property-photos").upload(path, photoFile);
        if (up.error) throw up.error;
        const { data: pub } = supabase.storage.from("property-photos").getPublicUrl(path);
        photos = [pub.publicUrl];
      }
      if (prop.title && prop.price) {
        const { error } = await supabase.from("property").insert({
          company_id: cu.company.id, title: prop.title, price: Number(prop.price),
          type: "apartamento", transaction: "venda",
          city: prop.city, neighborhood: prop.neighborhood, bedrooms: Number(prop.bedrooms || 0),
          address: { city: prop.city, neighborhood: prop.neighborhood },
          slug: slugify(prop.title), photos,
        });
        if (error) throw error;
      }
      setStep(4);
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm ${i <= step ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"}`}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className="text-xs hidden md:inline">{s}</span>
            {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>
      <Card><CardContent className="p-6 space-y-4">
        {step === 0 && (<>
          <h2 className="text-lg font-semibold">Dados da imobiliária</h2>
          <div><Label>Nome</Label><Input value={form.name} placeholder={cu?.company?.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>CNPJ</Label><Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} /></div>
            <div><Label>CRECI</Label><Input value={form.creci} onChange={(e) => setForm({ ...form, creci: e.target.value })} /></div>
          </div>
          <div><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
          <Button onClick={saveDados} className="bg-brand text-brand-foreground">Continuar</Button>
        </>)}
        {step === 1 && (<>
          <h2 className="text-lg font-semibold">Identidade visual</h2>
          <div><Label>Cor primária</Label><Input type="color" value={form.cor_primaria} onChange={(e) => setForm({ ...form, cor_primaria: e.target.value })} /></div>
          <div className="flex gap-2"><Button variant="outline" onClick={() => setStep(0)}>Voltar</Button><Button onClick={saveBranding} className="bg-brand text-brand-foreground">Continuar</Button></div>
        </>)}
        {step === 2 && (<>
          <h2 className="text-lg font-semibold">Convide sua equipe</h2>
          <p className="text-sm text-muted-foreground">Adicione corretores. O vínculo é criado no primeiro login com o email cadastrado.</p>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Nome" value={inv.nome} onChange={(e) => setInv({ ...inv, nome: e.target.value })} />
            <Input placeholder="Email" type="email" value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} />
            <Input placeholder="CRECI" value={inv.creci} onChange={(e) => setInv({ ...inv, creci: e.target.value })} />
          </div>
          <Button variant="outline" onClick={() => { if (inv.nome && inv.email) { setInvitees([...invitees, inv]); setInv({ nome: "", email: "", creci: "" }); } }}>Adicionar à lista</Button>
          {invitees.length > 0 && <ul className="text-sm space-y-1">{invitees.map((i, idx) => (
            <li key={idx} className="flex justify-between items-center border rounded px-2 py-1">
              <span>{i.nome} — {i.email}</span>
              <button onClick={() => setInvitees(invitees.filter((_, x) => x !== idx))}><Trash2 className="h-4 w-4 text-muted-foreground" /></button>
            </li>
          ))}</ul>}
          <div className="flex gap-2"><Button variant="outline" onClick={() => setStep(1)}>Voltar</Button><Button onClick={saveTeam} className="bg-brand text-brand-foreground">{invitees.length ? `Convidar ${invitees.length}` : "Pular"}</Button></div>
        </>)}
        {step === 3 && (<>
          <h2 className="text-lg font-semibold">Primeiro imóvel e zona de atuação</h2>
          <div><Label>Zona de atuação</Label><Input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Ex: Zona Sul SP" /></div>
          <div className="border-t pt-3 space-y-3">
            <div><Label>Título do imóvel</Label><Input value={prop.title} onChange={(e) => setProp({ ...prop, title: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Preço</Label><Input type="number" value={prop.price} onChange={(e) => setProp({ ...prop, price: e.target.value })} /></div>
              <div><Label>Cidade</Label><Input value={prop.city} onChange={(e) => setProp({ ...prop, city: e.target.value })} /></div>
              <div><Label>Bairro</Label><Input value={prop.neighborhood} onChange={(e) => setProp({ ...prop, neighborhood: e.target.value })} /></div>
            </div>
            <div><Label>Dormitórios</Label><Input type="number" value={prop.bedrooms} onChange={(e) => setProp({ ...prop, bedrooms: e.target.value })} /></div>
            <div><Label>Foto (opcional)</Label><Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} /></div>
          </div>
          <div className="flex gap-2"><Button variant="outline" onClick={() => setStep(2)}>Voltar</Button><Button onClick={saveImovel} disabled={saving} className="bg-brand text-brand-foreground">{saving ? "Salvando..." : (prop.title ? "Cadastrar e continuar" : "Pular")}</Button></div>
        </>)}
        {step === 4 && (<>
          <h2 className="text-lg font-semibold">Tudo pronto!</h2>
          <p className="text-sm text-muted-foreground">Seu trial de 14 dias está ativo. Bem-vindo ao ImobFlow.</p>
          <Button className="bg-brand text-brand-foreground" onClick={() => navigate({ to: "/app/dashboard" })}>Ir para o dashboard</Button>
        </>)}
      </CardContent></Card>
    </div>
  );
}
