import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

type Company = { id: string; name: string }
export function DeleteCompanyDialog({ company, onClose, onDeleted }: { company: Company; onClose: () => void; onDeleted: () => void }) {
  const [token, setToken] = useState<string>()
  const [remaining, setRemaining] = useState(10)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let disposed = false
    let timer: number | undefined
    async function prepare() {
      try {
        const { data, error } = await supabase.rpc('zimob_delete_company', { input: { companyId: company.id } })
        if (disposed) return
        if (error) throw error
        const result = data as { token: string; waitSeconds: number }
        if (!result?.token) throw new Error('Não foi possível preparar a confirmação.')
        setToken(result.token)
        const deadline = performance.now() + 10000
        timer = window.setInterval(() => setRemaining(Math.max(0, Math.ceil((deadline - performance.now()) / 1000))), 200)
      } catch (e) {
        if (!disposed) setError(e instanceof Error ? e.message : 'Não foi possível preparar a exclusão. Verifique se a atualização do banco foi aplicada.')
      }
    }
    void prepare()
    return () => { disposed = true; window.clearInterval(timer) }
  }, [company.id])
  async function confirm() {
    if (!token || remaining || busy) return
    setBusy(true)
    setError('')
    try {
      const { error } = await supabase.rpc('zimob_delete_company', { input: { companyId: company.id, token } })
      if (error) throw error
      if (sessionStorage.getItem('imob-company') === company.id) sessionStorage.removeItem('imob-company')
      onDeleted()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível excluir. Feche esta janela e tente novamente.')
    } finally { setBusy(false) }
  }
  return <AlertDialog open onOpenChange={open => { if (!open && !busy) onClose() }}>
    <AlertDialogContent>
      <AlertDialogHeader><AlertDialogTitle>Excluir {company.name}?</AlertDialogTitle><AlertDialogDescription>Esta ação é definitiva. Serão apagados o cadastro da imobiliária, os imóveis, leads, visitas, propostas, vínculos da equipe e lançamentos financeiros. As contas de acesso dos usuários serão preservadas. Arquivos já enviados ao armazenamento não são apagados por esta operação.</AlertDialogDescription></AlertDialogHeader>
      <p className="text-sm text-muted-foreground">Confira se você já guardou os dados necessários antes de confirmar. Somente imobiliárias suspensas ou canceladas podem ser excluídas.</p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <AlertDialogFooter>
        <Button variant="outline" disabled={busy} onClick={onClose}>Voltar</Button>
        <Button variant="destructive" disabled={!token || remaining > 0 || busy} onClick={confirm}>{busy ? 'Excluindo…' : !token ? 'Preparando confirmação…' : remaining > 0 ? `Aguarde ${remaining}s para excluir` : 'Excluir definitivamente'}</Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
}
