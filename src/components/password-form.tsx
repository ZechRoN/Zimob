import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

export function PasswordForm({ recovery = false }: { recovery?: boolean }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('')
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('')
    const form = new FormData(e.currentTarget)
    try {
      if (recovery) {
        const { error } = await supabase.auth.resetPasswordForEmail(String(form.get('email')).trim(), { redirectTo: window.location.origin + '/reset-senha' })
        if(error) throw error
        setMessage('Se houver uma conta com esse email, você receberá as instruções de recuperação.')
      } else {
        if (form.get('password') !== form.get('confirmation')) throw new Error('As senhas devem ser iguais')
        const { error } = await supabase.auth.updateUser({ password: String(form.get('password')) })
        if(error) throw error
        await supabase.auth.signOut(); navigate({to:'/entrar'})
      }
    } catch(e) { setError(e instanceof Error ? e.message : 'Não foi possível atualizar o acesso') }
    finally {setBusy(false)}
  }
  return <div className="min-h-screen grid place-items-center p-6"><div className="w-full max-w-md space-y-4">
    <h1 className="text-2xl font-bold">{recovery?'Recuperar acesso':'Definir nova senha'}</h1>
    {!recovery && !user ? <p>{loading?'Carregando...':'Abra o link de recuperação enviado ao seu email para continuar.'}</p> : <form className="space-y-4" onSubmit={submit}>
      {recovery ? <div><Label htmlFor="recovery-email">Email</Label><Input id="recovery-email" name="email" type="email" required /></div> : <>
        <div><Label htmlFor="new-password">Nova senha</Label><Input id="new-password" name="password" type="password" minLength={8} autoComplete="new-password" required /></div>
        <div><Label htmlFor="confirmation">Confirmar senha</Label><Input id="confirmation" name="confirmation" type="password" minLength={8} autoComplete="new-password" required /></div>
      </>}
      <Button disabled={busy}>{busy?'Aguarde...':recovery?'Enviar instruções':'Salvar senha'}</Button>
    </form>}
    {message && <p role="status">{message}</p>}{error && <p role="alert" className="text-destructive">{error}</p>}
    <Link to="/entrar" className="text-primary underline">Voltar para entrada</Link>
  </div></div>
}
