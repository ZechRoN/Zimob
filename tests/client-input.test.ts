import { test } from 'node:test'
import assert from 'node:assert/strict'
import { leadInterest, visitInstant, companyAccess } from '../src/lib/domain-input'

test('Compra do formulário é gravada como venda no Supabase',()=>{
 assert.equal(leadInterest('compra'),'venda')
 assert.equal(leadInterest('aluguel'),'aluguel')
})
test('visita digitada às 9h em Fortaleza é enviada como 12h UTC',()=>{
 process.env.TZ='America/Fortaleza'
 assert.equal(visitInstant('2026-11-01T09:00'),'2026-11-01T12:00:00.000Z')
})
test('trial de ontem bloqueia hoje sem depender do arredondamento',()=>{
 assert.equal(companyAccess({status:'trial',trial_ate:'2026-10-04'},new Date('2026-10-05T10:00:00Z')).isSuspended,true)
 assert.equal(companyAccess({status:'trial',trial_ate:'2026-10-05'},new Date('2026-10-05T10:00:00Z')).isSuspended,false)
 assert.equal(companyAccess({status:'active',trial_ate:'2026-10-04'},new Date('2026-10-05T10:00:00Z')).isSuspended,false)
})
