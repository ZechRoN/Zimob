/** Normalize the buyer-facing label to the property's transaction vocabulary. */
export function leadInterest(value: string): 'venda' | 'aluguel' | 'temporada' {
 const normalized=value==='compra'?'venda':value
 if(!['venda','aluguel','temporada'].includes(normalized)) throw new Error('Tipo de interesse inválido')
 return normalized as 'venda' | 'aluguel' | 'temporada'
}
/** datetime-local is in the user's browser timezone; send an explicit instant. */
export function visitInstant(value: string) {
 const date=new Date(value)
 if(!Number.isFinite(date.getTime())) throw new Error('Data da visita inválida')
 return date.toISOString()
}
export function companyAccess(company: {status: string; trial_ate?: string | null} | null, now = new Date()) {
 // Supabase PostgreSQL uses UTC for current_date; keep the UI boundary identical.
 const today=now.toISOString().slice(0,10)
 const trialDaysLeft=company?.trial_ate ? Math.round((Date.parse(company.trial_ate+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/86400000) : null
 return {trialDaysLeft,isSuspended:['blocked','canceled'].includes(company?.status??'') || (company?.status==='trial' && !!company.trial_ate && company.trial_ate<today)}
}
