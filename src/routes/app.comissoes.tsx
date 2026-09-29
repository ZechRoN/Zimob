import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDialog } from "@/components/form-dialog";
import { Plus } from "lucide-react";
import { brl, dateBR } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/app/comissoes")({ component: Page });

function Page() {
  const { data: cu } = useCurrentUser();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["coms", cu?.company?.id], enabled: !!cu?.company?.id,
    queryFn: async () => { const { data } = await supabase.from("commission").select("*").order("date", { ascending: false }); return data ?? []; } });
  const team = useQuery({ queryKey: ["team-mini", cu?.company?.id], enabled: !!cu?.company?.id,
    queryFn: async () => { const { data } = await supabase.from("company_user").select("id,nome,user_id"); return data ?? []; } });
  const m = useMutation({
    mutationFn: async (f: any) => {
      const c = (team.data ?? []).find((t: any) => t.id === f.corretor_id);
      const { error } = await supabase.from("commission").insert({
        company_id: cu!.company.id, corretor_id: c?.id, corretor_nome: c?.nome ?? f.corretor_nome,
        value: Number(f.value), percentage: Number(f.percentage || 0), date: f.date, notes: f.notes,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Comissão registrada"); qc.invalidateQueries({ queryKey: ["coms"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  return (<div>
    <PageHeader title="Comissões" actions={
      <FormDialog title="Nova comissão" trigger={<Button className="bg-brand text-brand-foreground"><Plus className="h-4 w-4 mr-1" />Nova</Button>}>
        {(close) => (
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); m.mutate(Object.fromEntries(fd), { onSuccess: () => close() }); }} className="space-y-3">
            <div><Label>Corretor</Label>
              <select name="corretor_id" required className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                <option value="">Selecione...</option>
                {(team.data ?? []).map((t: any) => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor</Label><Input name="value" type="number" required /></div>
              <div><Label>%</Label><Input name="percentage" type="number" defaultValue={50} /></div>
            </div>
            <div><Label>Data</Label><Input name="date" type="date" required /></div>
            <div><Label>Notas</Label><Input name="notes" /></div>
            <Button type="submit" className="w-full bg-brand text-brand-foreground">Registrar</Button>
          </form>
        )}
      </FormDialog>
    } />
    <div className="bg-card rounded-md border"><Table>
      <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Corretor</TableHead><TableHead>Valor</TableHead><TableHead>%</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
      <TableBody>{(q.data ?? []).map((c: any) => (<TableRow key={c.id}><TableCell>{dateBR(c.date)}</TableCell><TableCell>{c.corretor_nome}</TableCell><TableCell>{brl(c.value)}</TableCell><TableCell>{c.percentage}%</TableCell><TableCell><select aria-label="Pagamento da comissão" value={c.payment_status} className="border rounded p-1 bg-background" onChange={async e=>{const r=await supabase.from('commission').update({payment_status:e.target.value}).eq('id',c.id);if(r.error)toast.error(r.error.message);else qc.invalidateQueries({queryKey:['coms']})}}><option value="pendente">Pendente</option><option value="pago">Pago</option></select></TableCell></TableRow>))}
        {!q.data?.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma comissão</TableCell></TableRow>}
      </TableBody>
    </Table></div>
  </div>);
}
