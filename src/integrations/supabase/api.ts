import { supabase } from './client'
import type { Json } from './types'

/** Existing screen contracts, implemented entirely by Supabase RPC. */
export async function callBackend(path: string, body?: Record<string, unknown>): Promise<any> {
  const name = path === '/api/bootstrap' ? 'zimob_bootstrap'
    : path === '/api/public' ? 'zimob_public_api'
    : path === '/api/onboarding' || path === '/api/master/company' ? 'zimob_create_company'
    : null
  if (!name) throw new Error('Operação desconhecida')
  const input = path === '/api/bootstrap'
    ? { companyId: window.location.pathname.startsWith('/app') ? sessionStorage.getItem('imob-company') : null }
    : body ?? {}
  const { data, error } = await supabase.rpc(name, { input: input as Json })
  if (error) throw new Error(error.message)
  return data
}
