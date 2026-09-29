import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { setCompanyStatus } from "@/lib/admin.functions";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { MoreHorizontal, Search, MessageCircle, Copy } from "lucide-react";
import { brl, dateBR } from "@/lib/format";
import { toast } from "sonner";

const PLANS: Record<string, number> = { starter: 99, pro: 199, enterprise: 399 };

export const Route = createFileRoute("/master/lista-imobiliarias")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const setStatus = setCompanyStatus;


  const [newPass, setNewPass] = useState<null | { email: string; password: string }>(null);
  const [confirmCancel, setConfirmCancel] = useState<null | { id: string; name: string }>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [q, setQ] = useState(""); const [status, setStatus_] = useState("all"); const [plano, setPlano] = useState("all");

  const list = useQuery({ queryKey: ["master-list"], queryFn: async () => {
    const { data } = await supabase.from("company").select("*").order("created_at", { ascending: false });
    return data ?? [];
  } });

  const filtered = useMemo(() => (list.data ?? []).filter((c: any) => {
    if (status !== "all" && c.status !== status) return false;
    if (plano !== "all" && c.plano !== plano) return false;
    if (q && !`${c.name} ${c.owner_email ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [list.data, status, plano, q]);

  const action = async (fn: () => Promise<any>, msg: string) => {
    try { await fn(); toast.success(msg); qc.invalidateQueries({ queryKey: ["master-list"] }); }
    catch (e: any) { toast.error(e.message); }
  };

  const totalMrr = filtered.filter((c: any) => c.status === "active").reduce((s:number, c: any) => s + (PLANS[c.plano] ?? 0), 0);

  return (<div>
    <PageHeader title="Imobiliárias" description={`${filtered.length} resultados · MRR ${brl(totalMrr)}`} />
    <div className="flex flex-wrap gap-2 mb-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou email..." className="pl-9" />
      </div>
      <select value={status} onChange={(e) => setStatus_(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
        <option value="all">Todos status</option>
        <option value="active">Ativa</option><option value="trial">Trial</option>
        <option value="blocked">Suspensa</option><option value="canceled">Cancelada</option>
      </select>
      <select value={plano} onChange={(e) => setPlano(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
        <option value="all">Todos planos</option>
        <option value="starter">Starter</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option>
      </select>
    </div>

    <div className="bg-card rounded-md border overflow-hidden">
      <Table>
        <TableHeader><TableRow>
          <TableHead>Imobiliária</TableHead><TableHead>Owner</TableHead><TableHead>Plano</TableHead>
          <TableHead>Status</TableHead><TableHead>MRR</TableHead><TableHead>Criada</TableHead><TableHead className="w-10"></TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {filtered.map((c: any) => (
            <TableRow key={c.id}>
              <TableCell><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{c.slug ?? "—"}</div></TableCell>
              <TableCell className="text-sm">{c.owner_email ?? "—"}</TableCell>
              <TableCell><Badge variant="outline" className="capitalize">{c.plano}</Badge></TableCell>
              <TableCell><StatusBadge s={c.status} /></TableCell>
              <TableCell className="font-semibold">{c.status === "active" ? brl(PLANS[c.plano] ?? 0) : "—"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{dateBR(c.created_at)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setDetail(c)}>Ver detalhes</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {c.status !== "blocked" && <DropdownMenuItem onClick={() => action(() => setStatus({ data: { companyId: c.id, status: "blocked" } }), "Suspensa")}>Suspender</DropdownMenuItem>}
                    {c.status !== "active" && <DropdownMenuItem onClick={() => action(() => setStatus({ data: { companyId: c.id, status: "active" } }), "Reativada")}>Reativar</DropdownMenuItem>}
                    {c.status !== "canceled" && <DropdownMenuItem className="text-destructive" onClick={() => setConfirmCancel({ id: c.id, name: c.name })}>Cancelar conta</DropdownMenuItem>}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={()=>{sessionStorage.setItem('imob-company',c.id);window.location.assign('/app/dashboard')}}>Abrir imobiliária</DropdownMenuItem>
                    <DropdownMenuItem onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/entrar\nEntre com o email ${c.owner_email}.`);toast.success('Acesso copiado')}}>Copiar instruções de acesso</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {!filtered.length && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma imobiliária</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
    <AlertDialog open={!!confirmCancel} onOpenChange={(o) => !o && setConfirmCancel(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar conta de {confirmCancel?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            A imobiliária deixará de ter acesso ao painel e a vitrine pública sairá do ar. Esta ação pode ser revertida com "Reativar".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => { const id = confirmCancel!.id; setConfirmCancel(null); action(() => setStatus({ data: { companyId: id, status: "canceled" } }), "Conta cancelada"); }}>
            Cancelar conta
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        {detail && <>
          <SheetHeader>
            <SheetTitle>{detail.name}</SheetTitle>
            <SheetDescription>Detalhes completos da imobiliária</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4 text-sm">
            <Field label="Slug">{detail.slug ?? "—"}</Field>
            <Field label="Owner">{detail.owner_email ?? "—"}</Field>
            <Field label="Status"><StatusBadge s={detail.status} /></Field>
            <Field label="Plano"><Badge variant="outline" className="capitalize">{detail.plano}</Badge> · {brl(PLANS[detail.plano] ?? 0)}/mês</Field>
            <Field label="CNPJ">{detail.cnpj ?? "—"}</Field>
            <Field label="CRECI">{detail.creci ?? "—"}</Field>
            <Field label="Telefone">{detail.telefone ?? "—"}</Field>
            <Field label="Email">{detail.email ?? "—"}</Field>
            <Field label="Trial até">{detail.trial_ate ? dateBR(detail.trial_ate) : "—"}</Field>
            <Field label="Criada em">{dateBR(detail.created_at)}</Field>
            {detail.slug && <Field label="Vitrine pública"><a href={`/imoveis/${detail.slug}`} target="_blank" rel="noreferrer" className="text-primary underline break-all">/imoveis/{detail.slug}</a></Field>}
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground mb-1.5">Cor primária</div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded border" style={{ background: detail.cor_primaria ?? "#0EA5E9" }} />
                <span className="font-mono text-xs">{detail.cor_primaria ?? "#0EA5E9"}</span>
              </div>
            </div>
          </div>
        </>}
      </SheetContent>
    </Sheet>
  </div>);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><div className="text-xs text-muted-foreground">{label}</div><div className="font-medium mt-0.5">{children}</div></div>);
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = { active: "bg-emerald-500/10 text-emerald-700", trial: "bg-blue-500/10 text-blue-700", blocked: "bg-amber-500/10 text-amber-700", canceled: "bg-rose-500/10 text-rose-700" };
  return <Badge variant="outline" className={map[s] ?? ""}>{s}</Badge>;
}
