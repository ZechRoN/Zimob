import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { UserX, CalendarCheck, FileWarning, HomeIcon, MessageCircle, ClipboardCheck, BellRing, Tag } from "lucide-react";
import {useQuery} from "@tanstack/react-query";import{supabase}from"@/integrations/supabase/client";import{useCurrentUser}from"@/hooks/use-current-user";import{useNavigate}from"@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/app/ai-growth")({ component: Page });

const CARDS = [
  {
    id: "forgotten", title: "Leads esquecidos", icon: UserX, color: "#991B1B", bg: "#FEE2E2",
    desc: "Leads sem contato há mais de 15 dias e ainda não fechados",
    items: [] as any[], actionLabel: "Reativar via WhatsApp", actionIcon: MessageCircle,
  },
  {
    id: "noFollowup", title: "Visitas sem follow-up", icon: CalendarCheck, color: "#A16207", bg: "#FEF3C7",
    desc: "Visitas concluídas sem registro de feedback",
    items: [] as any[], actionLabel: "Registrar feedback", actionIcon: ClipboardCheck,
  },
  {
    id: "stalled", title: "Propostas paradas", icon: FileWarning, color: "#1E40AF", bg: "#DBEAFE",
    desc: "Propostas em análise há mais de 3 dias",
    items: [] as any[], actionLabel: "Cobrar resposta", actionIcon: BellRing,
  },
  {
    id: "lowProps", title: "Imóveis com baixa atividade", icon: HomeIcon, color: "#15803D", bg: "#DCFCE7",
    desc: "Imóveis sem visitas ou contatos há 30+ dias",
    items: [] as any[], actionLabel: "Marcar destaque", actionIcon: Tag,
  },
];

function Page() {
 const {data:u}=useCurrentUser(),nav=useNavigate();
 const q=useQuery({queryKey:['growth',u?.company?.id],enabled:!!u?.company?.id,queryFn:async()=>{const tables=['lead','visit','proposal','property'];const all=await Promise.all(tables.map(t=>supabase.from(t).select('*')));const err=all.find(r=>r.error);if(err)throw Error(err.error.message);return all.map(r=>r.data||[])}});
 const [leads,visits,proposals,properties]=q.data||[[],[],[],[]];const days=(v:string)=>Math.floor((Date.now()-new Date(v).getTime())/86400000);
 const lists=[leads.filter((x:any)=>!['fechado','perdido'].includes(x.status)&&days(x.updated_at)>15).map((x:any)=>({...x,days_since:days(x.updated_at),suggestion:'Revise a negociação e faça contato.'})),visits.filter((x:any)=>x.status==='realizada'&&!x.feedback).map((x:any)=>({...x,name:x.lead_name,days_since:days(x.scheduled_at),suggestion:'Registre o resultado da visita.'})),proposals.filter((x:any)=>x.status==='em_analise'&&days(x.updated_at)>3).map((x:any)=>({...x,name:x.lead_name,days_since:days(x.updated_at),suggestion:'Revise a proposta e acompanhe a resposta.'})),properties.filter((x:any)=>x.status==='disponivel'&&days(x.created_at)>30&&!visits.some((v:any)=>v.property_id===x.id)&&!leads.some((l:any)=>l.interest_property_id===x.id)).map((x:any)=>({...x,days_since:days(x.created_at),suggestion:'Revise preço, fotos e divulgação.'}))];
 const cards=CARDS.map((c,i)=>({...c,items:lists[i]}));

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Growth Engine"
        description="Sugestões por regras com base nos seus registros; não envia mensagens automaticamente."
        actions={<Badge className="bg-yellow-400 text-black">Regras</Badge>}
      />

      {q.isLoading&&<p>Carregando seus registros...</p>}{q.error&&<p role="alert">{q.error.message}</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md flex items-center justify-center" style={{ background: c.bg, color: c.color }}>
                  <c.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{c.items.length}</div>
                  <div className="text-xs text-muted-foreground">{c.title}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Accordion type="multiple" defaultValue={["forgotten"]} className="space-y-3">
        {cards.map((c) => (
          <Card key={c.id}>
            <AccordionItem value={c.id} className="border-0">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <div className="h-9 w-9 rounded-md flex items-center justify-center" style={{ background: c.bg, color: c.color }}>
                    <c.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold">{c.title}</div>
                    <div className="text-xs text-muted-foreground font-normal">{c.desc}</div>
                  </div>
                  <Badge className="ml-3" style={{ background: c.bg, color: c.color }}>{c.items.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <ul className="space-y-2">
                  {c.items.map((it: any) => (
                    <li key={it.id} className="flex items-start justify-between gap-3 p-3 rounded-md border bg-muted/30">
                      <div>
                        <div className="font-medium text-sm">{it.name ?? it.lead ?? it.title}</div>
                        <div className="text-xs text-muted-foreground">há {it.days_since}d — {it.suggestion}</div>
                      </div>
                      <Button size="sm" variant="outline" onClick={()=>nav({to:c.id==="forgotten"?"/app/leads":c.id==="noFollowup"?"/app/visitas":c.id==="stalled"?"/app/propostas":"/app/imoveis"})}>
                        <c.actionIcon className="h-3 w-3 mr-1" />{c.actionLabel}
                      </Button>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Card>
        ))}
      </Accordion>
    </div>
  );
}

