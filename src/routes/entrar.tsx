import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useCurrentUser } from '@/hooks/use-current-user'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
export const Route = createFileRoute('/entrar')({ component: Page })
function Page() {
  const { user } = useAuth(), current = useCurrentUser(), navigate = useNavigate()
  const [signup, setSignup] = useState(false), [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(''), [error, setError] = useState('')
  useEffect(() => {
    if (user && current.data) navigate({ to: current.data.isSuperAdmin ? '/master/painel' : current.data.company ? '/app/dashboard' : '/app/onboarding' })
  }, [user, current.data, navigate])
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email')).trim(), password = String(form.get('password'))
    try {
      const result = signup ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + '/entrar' } })
        : await supabase.auth.signInWithPassword({ email, password })
      if (result.error) throw result.error
      if (signup && !result.data.session) setMessage('Verifique seu email e confirme o cadastro antes de entrar.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível entrar') }
    finally { setBusy(false) }
  }
  return <div className="min-h-screen grid place-items-center bg-background p-4"><Card className="w-full max-w-md">
    <CardHeader><CardTitle>Zimob · {signup ? 'Criar conta' : 'Entrar'}</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm text-muted-foreground">Use o email autorizado pela sua imobiliária.</p>
      <form onSubmit={submit} className="space-y-4">
        <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div>
        <div><Label htmlFor="password">Senha</Label><Input id="password" name="password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} minLength={8} required /></div>
        {(error || current.error) && <p role="alert" className="text-sm text-destructive">{error || current.error?.message}</p>}
        {message && <p role="status" className="text-sm">{message}</p>}
        <Button className="w-full" disabled={busy}>{busy ? 'Aguarde...' : signup ? 'Criar conta' : 'Entrar'}</Button>
      </form>
      {current.error && <Button variant="outline" onClick={()=>current.refetch()}>Tentar carregar acesso novamente</Button>}
      <Button variant="ghost" className="w-full" onClick={()=>{setSignup(!signup);setError('');setMessage('')}}>{signup ? 'Já tenho conta' : 'Criar minha conta'}</Button>
      <Link className="block text-sm text-primary" to="/esqueci-senha">Esqueci minha senha</Link>
      <Link className="block text-sm text-primary" to="/demo/dashboard">Ver demonstração</Link>
    </CardContent>
  </Card></div>
}
