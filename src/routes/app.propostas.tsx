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
import { Textarea } from "@/components/ui/textarea";
import { FormDialog } from "@/components/form-dialog";
import { Plus } from "lucide-react";
import { brl } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/app/propostas")({ component: Page });

function Page() {
  const { data: cu } = useCurrentUser();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["props", cu?.company?.id], enabled: !!cu?.company?.id,
    queryFn: async () => { const { data } = await supabase.from("proposal").select("*").order("created_at", { ascending: false }); return data ?? []; } });
  const leads = useQuery({ queryKey: ["leads-mini", cu?.company?.id], enabled: !!cu?.company?.id,
    queryFn: async () => { const { data } = await supabase.from("lead").select("id,name"); return data ?? []; } });
  const props = useQuery({ queryKey: ["props-mini", cu?.company?.id], enabled: !!cu?.company?.id,
    queryFn: async () => { const { data } = await supabase.from("property").select("id,title"); return data ?? []; } });
  const m = useMutation({
    mutationFn: async (f: any) => {
      const lead = (leads.data ?? []).find((l: any) => l.id === f.lead_id);
      const prop = (props.data ?? []).find((p: any) => p.id === f.property_id);
      const { error } = await supabase.from("proposal").insert({
        company_id: cu!.company.id, lead_id: f.lead_id, lead_name: lead?.name,
        property_id: f.property_id, property_title: prop?.title,
        value: Number(f.value), payment_terms: f.payment_terms, observations: f.observations,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Proposta criada"); qc.invalidateQueries({ queryKey: ["props"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  return (<div>
    <PageHeader title="Propostas" actions={
      <FormDialog title="Nova proposta" trigger={<Button className="bg-brand text-brand-foreground"><Plus className="h-4 w-4 mr-1" />Nova</Button>}>
        {(close) => (
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); m.mutate(Object.fromEntries(fd), { onSuccess: () => close() }); }} className="space-y-3">
            <div><Label>Lead</Label>
              <select name="lead_id" required className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                <option value="">Selecione...</option>
                {(leads.data ?? []).map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select></div>
            <div><Label>Imóvel</Label>
              <select name="property_id" required className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                <option value="">Selecione...</option>
                {(props.data ?? []).map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select></div>
            <div><Label>Valor</Label><Input name="value" type="number" required /></div>
            <div><Label>Condições</Label><Input name="payment_terms" placeholder="Ex: 30% entrada + financiamento" /></div>
            <div><Label>Observações</Label><Textarea name="observations" rows={2} /></div>
            <Button type="submit" className="w-full bg-brand text-brand-foreground">Criar</Button>
          </form>
        )}
      </FormDialog>
    } />
    <div className="bg-card rounded-md border"><Table>
      <TableHeader><TableRow><TableHead>Imóvel</TableHead><TableHead>Lead</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
      <TableBody>
        {(q.data ?? []).map((p: any) => (<TableRow key={p.id}><TableCell>{p.property_title}</TableCell><TableCell>{p.lead_name}</TableCell><TableCell>{brl(p.value)}</TableCell><TableCell><select aria-label="Status da proposta" value={p.status} className="border rounded p-1 bg-background" onChange={async e=>{const r=await supabase.from('proposal').update({status:e.target.value}).eq('id',p.id);if(r.error)toast.error(r.error.message);else{toast.success('Status atualizado. Registre as receitas e comissões separadamente no financeiro.');qc.invalidateQueries({queryKey:['props']})}}}>{['em_analise','aceita','recusada','contra_proposta'].map(st=><option key={st} value={st}>{st.replaceAll('_',' ')}</option>)}</select></TableCell></TableRow>))}
        {!q.data?.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhuma proposta</TableCell></TableRow>}
      </TableBody>
    </Table></div>
  </div>);
}
