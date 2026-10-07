import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useCurrentUser } from '@/hooks/use-current-user'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/components/auth-layout'
import { ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'
export const Route = createFileRoute('/entrar')({ component: Page })
function Page() {
  const { user } = useAuth(), current = useCurrentUser(), navigate = useNavigate()
  const [signup, setSignup] = useState(false), [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(''), [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
  return <AuthLayout>
    <div className="mb-8"><div className="mb-5 inline-flex rounded-xl bg-accent p-3 text-primary"><LockKeyhole className="h-5 w-5" /></div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Seu espaço de trabalho</p><h1 className="text-3xl font-semibold tracking-tight">{signup ? 'Comece com a Zimob' : 'Bom ter você de volta.'}</h1><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{signup ? 'Crie sua conta para organizar a rotina da sua imobiliária.' : 'Entre na sua conta e acompanhe o que move a sua imobiliária.'}</p></div>
    <div className="space-y-5">
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2"><Label htmlFor="email">Email de acesso</Label><Input className="h-12 rounded-xl" id="email" name="email" type="email" placeholder="voce@imobiliaria.com.br" autoComplete="email" required /></div>
        <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password">Senha</Label>{!signup && <Link className="text-xs font-medium text-primary" to="/esqueci-senha">Esqueci minha senha</Link>}</div><div className="relative"><Input className="h-12 rounded-xl pr-12" id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} minLength={8} placeholder={signup ? 'Crie uma senha com 8 ou mais caracteres' : 'Digite sua senha'} required /><button type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
        {(error || current.error) && <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">{error || current.error?.message}</p>}
        {message && <p role="status" className="rounded-xl bg-accent p-3 text-sm text-accent-foreground">{message}</p>}
        <Button className="h-12 w-full rounded-xl" disabled={busy}>{busy ? 'Aguarde...' : signup ? 'Criar minha conta' : 'Entrar na Zimob'}{!busy && <ArrowRight className="h-4 w-4" />}</Button>
      </form>
      {current.error && <Button variant="outline" onClick={()=>current.refetch()}>Tentar carregar acesso novamente</Button>}
      <p className="text-center text-sm text-muted-foreground">{signup ? 'Já faz parte da Zimob?' : 'Ainda não tem uma conta?'} <button type="button" disabled={busy} className="font-semibold text-primary underline-offset-4 hover:underline" onClick={()=>{setSignup(!signup);setError('');setMessage('');setShowPassword(false)}}>{signup ? 'Entrar' : 'Criar conta'}</button></p>
      <p className="border-t pt-5 text-center text-xs leading-relaxed text-muted-foreground">Convidado por uma imobiliária? Use o mesmo email do seu convite.</p>
    </div>
  </AuthLayout>
}
