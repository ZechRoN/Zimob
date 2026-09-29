import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormDialog } from "@/components/form-dialog";
import { brl, dateBR } from "@/lib/format";
import { PiggyBank, Receipt, Plus, TrendingUp, TrendingDown, Wallet, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FIN_REV_CATEGORIES, FIN_COST_CATEGORIES } from "@/lib/demo-data";

export const Route = createFileRoute("/app/financeiro")({ component: Page });

function Page() {
  const { data: cu } = useCurrentUser();
  const qc = useQueryClient();
  const costs = useQuery({ queryKey: ["costs", cu?.company?.id], enabled: !!cu?.company?.id,
    queryFn: async () => { const { data } = await supabase.from("operational_cost").select("*").order("date", { ascending: false }); return data ?? []; } });
  const revs = useQuery({ queryKey: ["revs", cu?.company?.id], enabled: !!cu?.company?.id,
    queryFn: async () => { const { data } = await supabase.from("revenue").select("*").order("date", { ascending: false }); return data ?? []; } });
  const comms = useQuery({ queryKey: ["comm-fin", cu?.company?.id], enabled: !!cu?.company?.id,
    queryFn: async () => { const { data } = await supabase.from("commission").select("*").order("date", { ascending: false }); return data ?? []; } });
  const addCost = useMutation({
    mutationFn: async (f: any) => {
      const { error } = await supabase.from("operational_cost").insert({ company_id: cu!.company.id, description: f.description, category: f.category, amount: Number(f.amount), date: f.date });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Custo lançado"); qc.invalidateQueries({ queryKey: ["costs"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const addRev = useMutation({
    mutationFn: async (f: any) => {
      const { error } = await supabase.from("revenue").insert({ company_id: cu!.company.id, description: f.description, category: f.category, amount: Number(f.amount), date: f.date });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Receita lançada"); qc.invalidateQueries({ queryKey: ["revs"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const totalC = (costs.data ?? []).reduce((s:number, r: any) => s + Number(r.amount), 0);
  const totalR = (revs.data ?? []).reduce((s:number, r: any) => s + Number(r.amount), 0);
  const totalCom = (comms.data ?? []).reduce((s:number, r: any) => s + Number(r.value), 0);
  const venda  = (revs.data ?? []).filter((r: any) => /venda/i.test(r.category ?? "")).reduce((s:number, r: any) => s + Number(r.amount), 0);
  const aluguel = (revs.data ?? []).filter((r: any) => /aluguel|administr/i.test(r.category ?? "")).reduce((s:number, r: any) => s + Number(r.amount), 0);

  const finance6m=Array.from({length:6},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-5+i);const key=d.toISOString().slice(0,7);return{month:d.toLocaleDateString('pt-BR',{month:'short'}),receitas:(revs.data||[]).filter((x:any)=>x.date?.startsWith(key)).reduce((sum:number,x:any)=>sum+Number(x.amount),0),despesas:(costs.data||[]).filter((x:any)=>x.date?.startsWith(key)).reduce((sum:number,x:any)=>sum+Number(x.amount),0)}});

  return (<div className="space-y-6">
    <PageHeader title="Financeiro" actions={
      <div className="flex gap-2">
        <FormDialog title="Nova receita" trigger={<Button variant="outline"><Plus className="h-4 w-4 mr-1" />Receita</Button>}>
          {(close) => (
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); addRev.mutate(Object.fromEntries(fd), { onSuccess: () => close() }); }} className="space-y-3">
              <div><Label>Descrição</Label><Input name="description" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Categoria</Label>
                  <Select name="category" defaultValue="Comissão Venda"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                    {FIN_REV_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent></Select>
                </div>
                <div><Label>Valor</Label><Input name="amount" type="number" required /></div>
              </div>
              <div><Label>Data</Label><Input name="date" type="date" required /></div>
              <Button type="submit" className="w-full bg-brand text-brand-foreground">Lançar</Button>
            </form>
          )}
        </FormDialog>
        <FormDialog title="Novo custo" trigger={<Button className="bg-brand text-brand-foreground"><Plus className="h-4 w-4 mr-1" />Custo</Button>}>
          {(close) => (
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); addCost.mutate(Object.fromEntries(fd), { onSuccess: () => close() }); }} className="space-y-3">
              <div><Label>Descrição</Label><Input name="description" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Categoria</Label>
                  <Select name="category" defaultValue="Marketing"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                    {FIN_COST_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent></Select>
                </div>
                <div><Label>Valor</Label><Input name="amount" type="number" required /></div>
              </div>
              <div><Label>Data</Label><Input name="date" type="date" required /></div>
              <Button type="submit" className="w-full bg-brand text-brand-foreground">Lançar</Button>
            </form>
          )}
        </FormDialog>
      </div>
    } />

    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <KpiCard label="Receita total" value={brl(totalR)} icon={PiggyBank} />
      <KpiCard label="Vendas" value={brl(venda)} icon={TrendingUp} />
      <KpiCard label="Aluguéis" value={brl(aluguel)} icon={Wallet} />
      <KpiCard label="Custos" value={brl(totalC)} icon={Receipt} />
      <KpiCard label="Saldo previsto" value={brl(totalR - totalC - totalCom)} icon={BarChart3} hint={`Comissões registradas: ${brl(totalCom)}`} />
    </div>

    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" />Receitas vs Despesas (6m)</CardTitle></CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={finance6m}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => brl(Number(v))} />
              <Legend />
              <Bar dataKey="receitas" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>

    <Tabs defaultValue="vendas">
      <TabsList>
        <TabsTrigger value="vendas">Vendas</TabsTrigger>
        <TabsTrigger value="alugueis">Aluguéis</TabsTrigger>
        <TabsTrigger value="despesas">Despesas <Badge variant="secondary" className="ml-1">{costs.data?.length ?? 0}</Badge></TabsTrigger>
        <TabsTrigger value="comissoes">Comissões <Badge variant="secondary" className="ml-1">{comms.data?.length ?? 0}</Badge></TabsTrigger>
      </TabsList>

      <TabsContent value="vendas">
        <Card><CardContent className="p-0"><Table>
          <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Categoria</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
          <TableBody>
            {(revs.data ?? []).filter((r: any) => /venda|intermedi|aval/i.test(r.category ?? "")).map((r: any) => (
              <TableRow key={r.id}><TableCell className="font-medium">{r.description}</TableCell><TableCell><Badge variant="outline">{r.category}</Badge></TableCell><TableCell>{dateBR(r.date)}</TableCell><TableCell className="text-right font-semibold text-emerald-700">{brl(r.amount)}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table></CardContent></Card>
      </TabsContent>

      <TabsContent value="alugueis">
        <Card><CardContent className="p-0"><Table>
          <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Categoria</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
          <TableBody>
            {(revs.data ?? []).filter((r: any) => /aluguel|administr/i.test(r.category ?? "")).map((r: any) => (
              <TableRow key={r.id}><TableCell className="font-medium">{r.description}</TableCell><TableCell><Badge variant="outline">{r.category}</Badge></TableCell><TableCell>{dateBR(r.date)}</TableCell><TableCell className="text-right font-semibold text-emerald-700">{brl(r.amount)}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table></CardContent></Card>
      </TabsContent>

      <TabsContent value="despesas">
        <Card><CardContent className="p-0"><Table>
          <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Categoria</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
          <TableBody>
            {(costs.data ?? []).map((r: any) => (
              <TableRow key={r.id}><TableCell className="font-medium">{r.description}</TableCell><TableCell><Badge variant="outline">{r.category}</Badge></TableCell><TableCell>{dateBR(r.date)}</TableCell><TableCell className="text-right font-semibold text-red-700">{brl(r.amount)}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table></CardContent></Card>
      </TabsContent>

      <TabsContent value="comissoes">
        <Card><CardContent className="p-0"><Table>
          <TableHeader><TableRow><TableHead>Corretor</TableHead><TableHead>Data</TableHead><TableHead>%</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
          <TableBody>
            {(comms.data ?? []).map((c: any) => (
              <TableRow key={c.id}><TableCell className="font-medium">{c.corretor_nome ?? "—"}</TableCell><TableCell>{dateBR(c.date)}</TableCell><TableCell>{c.percentage ?? "—"}%</TableCell><TableCell><Badge variant={c.payment_status === "pago" ? "default" : "secondary"}>{c.payment_status}</Badge></TableCell><TableCell className="text-right font-semibold">{brl(c.value)}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table></CardContent></Card>
      </TabsContent>
    </Tabs>
  </div>);
}
