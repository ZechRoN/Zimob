import { useEffect, useState } from 'react'
import { KeyRound } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function AccountSecurity() {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  useEffect(() => {
    if (!cooldown) return
    const timer = window.setTimeout(() => setCooldown(n => Math.max(0, n - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])
  const request = async () => {
    if (busy || cooldown || !user?.email) return
    setBusy(true)
    setError('')
    setSent(false)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-senha`,
      })
      if (error) throw error
      setSent(true)
      setCooldown(60)
    } catch {
      setError('Não foi possível enviar o link. Aguarde um minuto e tente novamente. Se persistir, verifique o serviço de email da conta.')
      setCooldown(60)
    } finally { setBusy(false) }
  }
  return <Card>
    <CardHeader><KeyRound className="mb-2 h-5 w-5 text-primary" /><CardTitle>Senha e segurança</CardTitle><CardDescription>Solicite um link para escolher uma nova senha, sem precisar sair do sistema.</CardDescription></CardHeader>
    <CardContent className="space-y-4">
      <p className="break-all text-sm font-medium">{user?.email}</p>
      <p className="text-sm text-muted-foreground">O link será enviado para o email da sua conta. Abra a mensagem e siga as instruções para definir sua nova senha.</p>
      <Button type="button" disabled={busy || cooldown > 0 || !user?.email} onClick={request}>{busy ? 'Enviando…' : cooldown > 0 ? `Aguarde ${cooldown}s para reenviar` : 'Solicitar alteração de senha'}</Button>
      {sent && <p role="status" className="text-sm">Solicitação enviada. Confira sua caixa de entrada e a pasta de spam.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </CardContent>
  </Card>
}
