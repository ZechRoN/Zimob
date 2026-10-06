import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { createCompanyWithOwner } from "@/lib/admin.functions";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Copy, ExternalLink, MessageCircle, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/master/nova-imobiliaria")({ component: Page });

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

function Page() {
  const navigate = useNavigate();
  const fn = createCompanyWithOwner;
  const [loading, setLoading] = useState(false);
  const [creds, setCreds] = useState<null | { name: string; slug: string; email: string; password: string }>(null);

  const [form, setForm] = useState({
    name: "", slug: "", creci: "", cnpj: "",
    email: "", telefone: "", whatsapp: "",
    ownerEmail: "", ownerNome: "",
    plano: "starter" as "starter" | "pro" | "enterprise",
    cor: "#2563EB",
  });

  const setF = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.ownerEmail) { toast.error("Nome e email do owner são obrigatórios"); return; }
    setLoading(true);
    try {
      const r: any = await fn({ data: {...form,slug:form.slug||undefined} });
      setCreds({ name: form.name, slug: r.slug, email: r.owner_email, password: "" });
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Nova imobiliária" description="Cadastre a imobiliária e autorize o email de seu administrador." />

      <form onSubmit={submit} className="max-w-3xl space-y-5">
        <Section title="1. Identidade">
          <Field label="Nome da imobiliária *"><Input value={form.name} onChange={(e) => { setF("name", e.target.value); if (!form.slug) setF("slug", slugify(e.target.value)); }} required /></Field>
          <Field label="Slug (URL pública /imoveis/SLUG)"><Input value={form.slug} onChange={(e) => setF("slug", slugify(e.target.value))} placeholder="ex: imobprime" /></Field>
          <Field label="CRECI"><Input value={form.creci} onChange={(e) => setF("creci", e.target.value)} /></Field>
          <Field label="CNPJ"><Input value={form.cnpj} onChange={(e) => setF("cnpj", e.target.value)} /></Field>
        </Section>

        <Section title="2. Contato">
          <Field label="Email institucional"><Input type="email" value={form.email} onChange={(e) => setF("email", e.target.value)} /></Field>
          <Field label="Telefone"><Input value={form.telefone} onChange={(e) => setF("telefone", e.target.value)} placeholder="(11) 0000-0000" /></Field>
          <Field label="WhatsApp"><Input value={form.whatsapp} onChange={(e) => setF("whatsapp", e.target.value)} placeholder="(11) 90000-0000" /></Field>
        </Section>

        <Section title="3. Owner / Admin">
          <Field label="Nome do owner"><Input value={form.ownerNome} onChange={(e) => setF("ownerNome", e.target.value)} /></Field>
          <Field label="Email do owner *"><Input type="email" required value={form.ownerEmail} onChange={(e) => setF("ownerEmail", e.target.value)} /></Field>
        </Section>

        <Section title="4. Plano">
          <Field label="Plano">
            <select value={form.plano} onChange={(e) => setF("plano", e.target.value)} className="w-full h-10 rounded-md border bg-background px-3 text-sm">
              <option value="starter">Starter — R$ 99/mês</option>
              <option value="pro">Pro — R$ 199/mês</option>
              <option value="enterprise">Enterprise — R$ 399/mês</option>
            </select>
          </Field>
        </Section>

        <Section title="5. Branding">
          <Field label="Cor primária da vitrine">
            <div className="flex items-center gap-3">
              <input type="color" value={form.cor} onChange={(e) => setF("cor", e.target.value)} className="h-10 w-16 rounded border cursor-pointer" />
              <Input value={form.cor} onChange={(e) => setF("cor", e.target.value)} className="w-32" />
              <div className="flex-1 h-10 rounded" style={{ background: form.cor }} />
            </div>
          </Field>
        </Section>

        <Card><CardContent className="p-6">
          <div className="text-sm text-muted-foreground mb-3">6. Confirmação</div>
          <div className="text-xs text-muted-foreground mb-4">O administrador entra com o email autorizado e confirma sua identidade na tela de acesso.</div>
          <Button type="submit" disabled={loading} className="bg-[var(--luxe-charcoal)] text-primary-foreground hover:bg-[var(--luxe-navy)]">{loading ? "Criando..." : "Criar imobiliária"}</Button>
        </CardContent></Card>
      </form>

      <CredentialsDialog creds={creds} onClose={() => { setCreds(null); navigate({ to: "/master/lista-imobiliarias" }); }} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (<Card><CardContent className="p-6 space-y-4">
    <div className="text-sm font-semibold">{title}</div>
    <div className="grid sm:grid-cols-2 gap-4">{children}</div>
  </CardContent></Card>);
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>);
}

function CredentialsDialog({creds,onClose}:{creds:any;onClose:()=>void}){if(!creds)return null;const access=window.location.origin+'/entrar';const showcase=window.location.origin+'/imoveis/'+creds.slug;return <Dialog open onOpenChange={o=>!o&&onClose()}><DialogContent><DialogHeader><DialogTitle>Imobiliária cadastrada</DialogTitle></DialogHeader><p>Compartilhe o acesso com o administrador. Ele deve entrar ou criar uma conta usando <b>{creds.email}</b>.</p><p className="text-sm">Nenhum email foi enviado automaticamente.</p><code className="p-3 bg-muted rounded break-all">{access}</code><Button variant="outline" onClick={()=>{navigator.clipboard.writeText(`Acesso: ${access}\nEntre com o email ${creds.email}.\nVitrine: ${showcase}`);toast.success('Instruções copiadas')}}>Copiar instruções de acesso</Button><DialogFooter><Button onClick={onClose}>Concluir</Button></DialogFooter></DialogContent></Dialog>}
