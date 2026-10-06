import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { inviteCorretor } from "@/lib/admin.functions";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDialog } from "@/components/form-dialog";
import { Plus, Mail, Award } from "lucide-react";
import { dateTimeBR } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/app/equipe")({ component: Page });

function Page() {
  const { data: cu } = useCurrentUser();
  const qc = useQueryClient();
  const invite = inviteCorretor;

  const team = useQuery({ queryKey: ["team", cu?.company?.id], enabled: !!cu?.company?.id,
    queryFn: async () => {
      const [members, leads, props] = await Promise.all([
        supabase.from("company_user").select("*").eq("company_id", cu!.company.id).order("created_at", { ascending: false }),
        supabase.from("lead").select("id,assigned_to,status").eq("company_id", cu!.company.id),
        supabase.from("proposal").select("id,corretor_id,status").eq("company_id", cu!.company.id),
      ]);
      return (members.data ?? []).map((m: any) => ({
        ...m,
        leads_count: (leads.data ?? []).filter((l: any) => l.assigned_to === m.id).length,
        closings: (props.data ?? []).filter((p: any) => p.corretor_id === m.id && p.status === "aceita").length,
      }));
    },
  });

  return (<div>
    <PageHeader title="Equipe" description={`${team.data?.length ?? 0} membros`} actions={
      <FormDialog title="Convidar corretor" trigger={<Button className="bg-brand text-brand-foreground"><Plus className="h-4 w-4 mr-1" />Convidar</Button>}>
        {(close) => (
          <form onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            try {
              await invite({ data: {
                email: String(fd.get("email")), nome: String(fd.get("nome")),
                creci: String(fd.get("creci") || "") || undefined,
                role: fd.get("role") as any, comissao_pct: Number(fd.get("comissao_pct") || 50),
              } });
              toast.success(`Email ${fd.get("email")} autorizado. Compartilhe o link de acesso.`);
              qc.invalidateQueries({ queryKey: ["team"] }); close();
            } catch (err: any) { toast.error(err.message); }
          }} className="space-y-3">
            <div><Label>Nome</Label><Input name="nome" required /></div>
            <div><Label>Email</Label><Input name="email" type="email" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>CRECI</Label><Input name="creci" /></div>
              <div><Label>% comissão</Label><Input name="comissao_pct" type="number" defaultValue={50} /></div>
            </div>
            <div><Label>Papel</Label>
              <select name="role" defaultValue="corretor" className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                <option value="corretor">Corretor</option><option value="admin">Admin</option><option value="financeiro">Financeiro</option>
              </select>
            </div>
            <Button type="submit" className="w-full bg-brand text-brand-foreground">Enviar convite</Button>
          </form>
        )}
      </FormDialog>
    } />
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {(team.data ?? []).map((m: any) => (
        <Card key={m.id}>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12"><AvatarFallback className="bg-brand/10 text-brand font-semibold">{(m.nome ?? m.email).slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{m.nome ?? "—"}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 truncate"><Mail className="h-3 w-3" />{m.email}</div>
              </div>
              <Badge variant="outline" className="capitalize">{m.role}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div><div className="text-xl font-bold">{m.leads_count}</div><div className="text-xs text-muted-foreground">Leads</div></div>
              <div><div className="text-xl font-bold text-emerald-600">{m.closings}</div><div className="text-xs text-muted-foreground">Fechados</div></div>
              <div><div className="text-xl font-bold">{m.comissao_pct}%</div><div className="text-xs text-muted-foreground">Comissão</div></div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Award className="h-3 w-3" />CRECI {m.creci ?? "—"}</span>
              <span>Último acesso: {m.ultimo_login ? dateTimeBR(m.ultimo_login) : "—"}</span>
            </div>
          </CardContent>
        </Card>
      ))}
      {!team.data?.length && <Card className="col-span-full"><CardContent className="p-8 text-center text-muted-foreground">Nenhum membro ainda. Convide o primeiro corretor!</CardContent></Card>}
    </div>
  </div>);
}
