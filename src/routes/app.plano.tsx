import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/integrations/supabase/client";
import { brl, dateBR } from "@/lib/format";
import { Check, Download, CreditCard, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/plano")({ component: Page });

const PLANS = [
  { id: "starter", name: "Starter", price: 99, features: ["Até 3 corretores", "100 leads/mês", "50 imóveis", "Vitrine pública", "Suporte por email"] },
  { id: "pro", name: "Pro", price: 199, features: ["Até 15 corretores", "500 leads/mês", "200 imóveis", "Sugestões por regras", "Links de WhatsApp", "Suporte prioritário"], highlight: true },
  { id: "enterprise", name: "Enterprise", price: 399, features: ["Corretores ilimitados", "Leads ilimitados", "Imóveis ilimitados", "Cadastro de equipe", "Multi-imobiliária", "Configuração personalizada"] },
];

function Page() {
  const { data: cu, refetch } = useCurrentUser();
  const c = cu?.company;
  const planoAtual = c?.plano ?? "starter";
  const valor = PLANS.find(p => p.id === planoAtual)?.price ?? 99;

  const invoices:any[]=[];
  const trocarPlano=async(_novo:string)=>toast.info('Entre em contato com o administrador para alterar seu plano. Nenhuma cobrança será feita aqui.');

  return (<div><PageHeader title="Plano e Cobrança" description="Plano cadastrado. Valores e limites ilustrativos; cobrança e gateway não conectados." />
    <Card className="mb-6 bg-gradient-to-br from-brand/10 to-brand/5 border-brand/20">
      <CardContent className="p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-brand" />
              <span className="text-sm text-muted-foreground">Plano atual</span>
            </div>
            <div className="text-3xl font-bold capitalize">{planoAtual}</div>
            <Badge variant="outline" className="mt-2 capitalize">{c?.status ?? "trial"}</Badge>
            {c?.trial_ate && c.status === "trial" && <div className="text-xs text-muted-foreground mt-2">Trial termina em {dateBR(c.trial_ate)}</div>}
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-brand">{brl(valor)}</div>
            <div className="text-sm text-muted-foreground">por mês</div>
          </div>
        </div>
      </CardContent>
    </Card>

    <h2 className="text-lg font-semibold mb-3">Trocar de plano</h2>
    <div className="grid md:grid-cols-3 gap-4 mb-6">
      {PLANS.map((p) => {
        const isCurrent = p.id === planoAtual;
        return (
          <Card key={p.id} className={p.highlight ? "border-brand shadow-lg relative" : ""}>
            {p.highlight && <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-brand text-brand-foreground">Recomendado</Badge>}
            <CardHeader>
              <CardTitle>{p.name}</CardTitle>
              <div className="text-3xl font-bold">{brl(p.price)}<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-4 text-sm">
                {p.features.map((f) => (<li key={f} className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />{f}</li>))}
              </ul>
              <Button onClick={() => trocarPlano(p.id)} disabled={isCurrent} className={p.highlight ? "bg-brand text-brand-foreground w-full" : "w-full"} variant={p.highlight ? "default" : "outline"}>
                {isCurrent ? "Plano atual" : "Mudar para " + p.name}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>

    <Card><CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Cobrança manual</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Não há faturas automáticas neste template. Combine o pagamento com o administrador.</p>
        {invoices.map(f => (
          <div key={f.id} className="flex items-center justify-between py-3 border-b last:border-0">
            <div><span className="font-medium">{f.id}</span><span className="text-muted-foreground ml-3 text-sm">{dateBR(f.date)}</span></div>
            <div className="flex items-center gap-3"><span className="font-semibold">{brl(f.amount)}</span>
              <Badge variant={f.status === "atual" ? "default" : "outline"} className={f.status === "atual" ? "bg-brand text-brand-foreground" : "bg-emerald-500/10 text-emerald-700"}>{f.status}</Badge>
              <Button size="sm" variant="ghost"><Download className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>);
}
