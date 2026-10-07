import { createFileRoute, Link } from '@tanstack/react-router'
import { Building2, Mail, CreditCard, ArrowUpRight, Palette, Sun, Moon } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTheme } from '@/hooks/use-theme'
import { AccountSecurity } from '@/components/account-security'

export const Route = createFileRoute('/master/configuracoes')({ component: Page })

function Page() {
  const { theme, setTheme } = useTheme()
  return <div className="space-y-6">
    <PageHeader title="Configurações" description="Preferências do seu painel e orientação para administrar a plataforma." />
    <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><Palette className="mb-2 h-5 w-5 text-primary" /><CardTitle>Aparência do painel</CardTitle><CardDescription>Escolha como prefere visualizar o sistema neste navegador.</CardDescription></CardHeader><CardContent className="flex gap-3">
        <Button variant={theme === 'light' ? 'default' : 'outline'} aria-pressed={theme === 'light'} onClick={() => setTheme('light')}><Sun className="h-4 w-4" /> Claro</Button>
        <Button variant={theme === 'dark' ? 'default' : 'outline'} aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}><Moon className="h-4 w-4" /> Escuro</Button>
      </CardContent></Card>
      <AccountSecurity />
    </div>
    <Card><CardHeader><div className="flex items-center gap-3"><Building2 className="h-5 w-5 text-primary" /><CardTitle>Configurações de cada imobiliária</CardTitle></div><CardDescription>Logo, contatos, endereço e equipe pertencem à imobiliária, e não à plataforma inteira.</CardDescription></CardHeader><CardContent className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"><p className="max-w-2xl text-sm text-muted-foreground">Acesse a lista, abra o menu da imobiliária e escolha “Abrir imobiliária”. Dentro dela, use as seções Configurações e Equipe.</p><Button asChild variant="outline" className="shrink-0"><Link to="/master/lista-imobiliarias">Gerenciar imobiliárias <ArrowUpRight className="h-4 w-4" /></Link></Button></CardContent></Card>
    <div><h2 className="text-lg font-semibold">Comunicação e cobrança</h2><p className="mt-1 text-sm text-muted-foreground">O que o sistema faz hoje e o que ainda precisa de integração.</p></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><div className="flex items-center justify-between gap-3"><Mail className="h-5 w-5 text-primary" /><Badge variant="secondary">Acesso por email</Badge></div><CardTitle className="pt-2">Emails e WhatsApp</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground"><p>Confirmação de conta e recuperação de senha usam o serviço de autenticação. O remetente de produção é configurado no Supabase.</p><p>Campanhas, lembretes e mensagens automáticas por WhatsApp ainda não estão conectados. O compartilhamento de links é manual.</p></CardContent></Card>
      <Card><CardHeader><div className="flex items-center justify-between gap-3"><CreditCard className="h-5 w-5 text-primary" /><Badge variant="secondary">Gestão manual</Badge></div><CardTitle className="pt-2">Planos e pagamentos</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground"><p>O plano é definido ao cadastrar a imobiliária. Depois, você gerencia o status de acesso na lista de imobiliárias. Os valores do painel são estimativas baseadas nos planos.</p><p>Não há cobrança automática nem confirmação de pagamentos. Ativar uma conta libera o acesso, mas não gera uma cobrança.</p></CardContent></Card>
    </div>
  </div>
}
