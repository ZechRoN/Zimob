import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, UserPlus, TrendingDown, DollarSign } from "lucide-react";
import { brl } from "@/lib/format";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";

const PLANS: Record<string, number> = { starter: 99, pro: 199, enterprise: 399 };

export const Route = createFileRoute("/master/painel")({ component: Page });

function Page() {
  const q = useQuery({
    queryKey: ["master-painel"],
    queryFn: async () => {
      const { data } = await supabase.from("company").select("*").order("created_at", { ascending: false });
      const list = data ?? [];
      const active = list.filter((c: any) => c.status === "active");
      const trial = list.filter((c: any) => c.status === "trial");
      const blocked = list.filter((c: any) => c.status === "blocked");
      const canceled = list.filter((c: any) => c.status === "canceled");
      const mrr = active.reduce((s:number, c: any) => s + (PLANS[c.plano] ?? 0), 0);
      const arr = mrr * 12;
      const churnRate = list.length ? (canceled.length / list.length) * 100 : 0;

      // 6-month trend (signups + MRR by month)
      const months: { label: string; signups: number; mrr: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const inMonth = list.filter((c: any) => {
          const cd = new Date(c.created_at);
          return `${cd.getFullYear()}-${cd.getMonth()}` === key;
        });
        const monthActive = list.filter((c: any) => {
          const cd = new Date(c.created_at);
          return cd <= new Date(d.getFullYear(), d.getMonth() + 1, 0) && c.status === "active";
        });
        months.push({
          label: d.toLocaleDateString("pt-BR", { month: "short" }),
          signups: inMonth.length,
          mrr: monthActive.reduce((s:number, c: any) => s + (PLANS[c.plano] ?? 0), 0),
        });
      }

      const planDist = [
        { plan: "Starter", n: list.filter((c: any) => c.plano === "starter").length },
        { plan: "Pro", n: list.filter((c: any) => c.plano === "pro").length },
        { plan: "Enterprise", n: list.filter((c: any) => c.plano === "enterprise").length },
      ];

      const top = [...active]
        .sort((a: any, b: any) => (PLANS[b.plano] ?? 0) - (PLANS[a.plano] ?? 0))
        .slice(0, 5);

      return {
        total: list.length, active: active.length, trial: trial.length, blocked: blocked.length,
        canceled: canceled.length, mrr, arr, churnRate, months, planDist, top,
      };
    },
  });

  const d = q.data;
  return (<div>
    <PageHeader title="Painel Master" description="Visão global do SaaS" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="Imobiliárias" value={d?.total ?? 0} icon={Building2} hint={`${d?.active ?? 0} ativas · ${d?.trial ?? 0} trial`} />
      <KpiCard label="MRR" value={brl(d?.mrr ?? 0)} icon={DollarSign} hint="Receita recorrente mensal" />
      <KpiCard label="ARR" value={brl(d?.arr ?? 0)} icon={TrendingUp} hint="Projeção anual" />
      <KpiCard label="Churn" value={`${(d?.churnRate ?? 0).toFixed(1)}%`} icon={TrendingDown} hint={`${d?.canceled ?? 0} canceladas`} />
    </div>

    <div className="grid lg:grid-cols-3 gap-4 mb-6">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Tendência (últimos 6 meses)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={d?.months ?? []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" /><YAxis />
              <Tooltip /><Line type="monotone" dataKey="mrr" stroke="hsl(var(--brand))" strokeWidth={2} name="MRR (R$)" />
              <Line type="monotone" dataKey="signups" stroke="#10b981" strokeWidth={2} name="Novos cadastros" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Distribuição por plano</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={d?.planDist ?? []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="plan" /><YAxis />
              <Tooltip /><Bar dataKey="n" fill="hsl(var(--brand))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader><CardTitle>Top 5 imobiliárias (MRR)</CardTitle></CardHeader>
      <CardContent>
        {(d?.top ?? []).map((c: any, i: number) => (
          <div key={c.id} className="flex items-center justify-between py-3 border-b last:border-0">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-md bg-brand/10 text-brand font-bold flex items-center justify-center">{i + 1}</div>
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.owner_email}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="capitalize">{c.plano}</Badge>
              <div className="font-semibold">{brl(PLANS[c.plano] ?? 0)}/mês</div>
            </div>
          </div>
        ))}
        {!d?.top?.length && <div className="text-center text-muted-foreground py-8">Nenhuma imobiliária ativa</div>}
      </CardContent>
    </Card>
  </div>);
}
