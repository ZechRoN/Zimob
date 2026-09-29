import { Query,type QuerySpec } from '../../shared/query'
import {schema,jsonFields} from './schema'
export type Identity={userId:string;email?:string;master:boolean;companyId?:string;role?:string}
export type SQL={sql:(q:string,args?:any[])=>Promise<{rows:any[]}>;batch:(s:{sql:string,args?:any[]}[],mode?:'read'|'write')=>Promise<any>}
const q=(s:string)=>'"'+s+'"';const val=(v:any)=>typeof v==='boolean'?Number(v):v!==null&&typeof v==='object'?JSON.stringify(v):v??null
const roles=['owner','admin','corretor','captador','financeiro']
const writeRoles:Record<string,string[]>= {company:['owner','admin'],company_user:['owner'],property:['owner','admin','corretor','captador'],lead:['owner','admin','corretor'],visit:['owner','admin','corretor'],proposal:['owner','admin','corretor'],commission:['owner','admin','financeiro'],revenue:['owner','admin','financeiro'],operational_cost:['owner','admin','financeiro'],zone:['owner','admin']}
export function decode(table:string,row:any){return Object.fromEntries(Object.entries(row).map(([k,v])=>{if(schema[table]?.[k]==='BOOLEAN')return[k,v===true||v===1||v==='1'];if(schema[table]?.[k]==='REAL'&&v!==null)return[k,Number(v)];if(jsonFields.has(k)&&typeof v==='string'){try{return[k,JSON.parse(v)]}catch{}}return[k,v]}))}
export class Database{
 constructor(public sql:SQL,public identity:Identity){}
 from(table:string){return new Query(table,s=>this.execute(s))}
 async scope(table:string,write:boolean){
  const u=this.identity;if(!schema[table]||['profiles','user_roles','template_owner'].includes(table))throw Error('Tabela indisponível')
  if(!u.userId)throw Error('Autenticação necessária')
  if(table==='app_config'){if(!u.master)throw Error('Acesso restrito');return{clause:'1=1',args:[]}}
  if(u.master&&!u.companyId){if(table==='company')return{clause:'1=1',args:[]};throw Error('Selecione uma imobiliária no painel Master')}
  if(u.master&&u.companyId)return{clause:(table==='company'?'id':'company_id')+'=?',args:[u.companyId]}
  if(!u.companyId){if(table==='company_user'&&!write)return{clause:'user_id=?',args:[u.userId]};throw Error('Clínica não encontrada')}
  const c=(await this.sql.sql('SELECT status,trial_ate FROM company WHERE id=?',[u.companyId])).rows[0]
  if(table!=='company'&&table!=='company_user'&&(!c||['blocked','canceled'].includes(c.status)||c.status==='trial'&&c.trial_ate&&c.trial_ate<new Date().toISOString().slice(0,10)))throw Error('Acesso à imobiliária suspenso; contate o administrador')
  if(['commission','revenue','operational_cost'].includes(table)&&!['owner','admin','financeiro'].includes(u.role||''))throw Error('Acesso financeiro restrito')
  if(write&&!writeRoles[table]?.includes(u.role||''))throw Error('Permissão insuficiente')
  return{clause:(table==='company'?'id':'company_id')+'=?',args:[u.companyId]}
 }
 async execute(input:QuerySpec):Promise<any>{try{
  const s=structuredClone(input),t=s.table,write=s.action!=='select';if(!['select','insert','update','delete'].includes(s.action))throw Error('Operação inválida')
  const col=(k:string)=>{if(!schema[t]?.[k])throw Error('Coluna inválida: '+k);return q(k)}
  const scope=await this.scope(t,write),args:any[]=[...scope.args],where=[scope.clause];
  if(!Array.isArray(s.filters)||s.filters.length>30)throw Error('Filtros inválidos')
  for(const f of s.filters){const k=col(f.key);if(f.op==='in'){if(!Array.isArray(f.value)||f.value.length>1000)throw Error('Filtro inválido');where.push(f.value.length?k+' IN ('+f.value.map(()=>'?').join(',')+')':'0=1');args.push(...f.value.map(val));continue}if(f.op==='notnull'){where.push(k+' IS NOT NULL');continue}const op:Record<string,string>={eq:'=',neq:'!=',gt:'>',gte:'>=',lt:'<',lte:'<=',is:'IS',ilike:'LIKE'};if(!op[f.op])throw Error('Operador inválido');where.push(k+' '+op[f.op]+' ?');args.push(val(f.value))}
  const clause=where.join(' AND ');const limit=Math.min(5000,Math.max(0,Number(s.limit??1000))),offset=Math.max(0,Number(s.offset??0));if(!Number.isInteger(limit)||!Number.isInteger(offset))throw Error('Paginação inválida')
  const selected=s.columns==='*'||!s.columns?null:s.columns.split(',').map(x=>x.trim());selected?.forEach(col)
  let rows:any[]=[],count=0
  if(!write){count=Number((await this.sql.sql('SELECT COUNT(*) AS total FROM '+q(t)+' WHERE '+clause,args)).rows[0]?.total||0);if(!s.head)rows=(await this.sql.sql('SELECT * FROM '+q(t)+' WHERE '+clause+(s.orders?.length?' ORDER BY '+s.orders.map(o=>col(o.key)+(o.ascending?' ASC':' DESC')).join(','):'')+' LIMIT ? OFFSET ?',[...args,limit,offset])).rows}
  else{
   if(s.action!=='insert'&&!s.filters.length)throw Error('Alteração exige filtro explícito')
   if(t==='app_config'&&s.action!=='update')throw Error('Configuração protegida')
   if(t==='company'&&s.action==='insert')throw Error('Use o cadastro de clínica')
   if(s.action==='delete'){
    if(t==='company_user'&&(await this.sql.sql('SELECT 1 FROM company_user WHERE '+clause+" AND role='owner'",args)).rows.length)throw Error('Não é permitido excluir o proprietário')
    rows=(await this.sql.sql('DELETE FROM '+q(t)+' WHERE '+clause+' RETURNING *',args)).rows
   }else{
    const payloads=Array.isArray(s.payload)?s.payload:[s.payload];if(payloads.length!==1)throw Error('Salve um registro por vez')
    const raw=payloads[0];if(!raw||typeof raw!=='object')throw Error('Dados inválidos');const row={...raw};Object.keys(row).forEach(col)
    if(s.action==='update'){delete row.id;delete row.created_at;delete row.company_id;if(schema[t].updated_at)row.updated_at=new Date().toISOString()}
    if(t!=='company'&&t!=='app_config'&&s.action==='insert'){if(row.company_id&&row.company_id!==this.identity.companyId)throw Error('Imobiliária inválida');row.company_id=this.identity.companyId}
    if(!this.identity.master){
     if(t==='company'&&Object.keys(row).some(k=>!['name','slug','cnpj','creci','telefone','email','endereco','cor_primaria','logo_url','settings','updated_at'].includes(k)))throw Error('Campo da clínica protegido')
     if(t!=='company'&&s.action==='insert'){if(row.company_id&&row.company_id!==this.identity.companyId)throw Error('Clínica inválida');row.company_id=this.identity.companyId}
    }
    if(t==='app_config'&&('super_admin_emails'in row))throw Error('O administrador é definido no backend desta cópia')
    if(t==='company_user'){
     if('user_id'in row||'must_change_password'in row)throw Error('Acesso deve ser confirmado pelo titular do email')
     if(row.role&&(!roles.includes(row.role)||row.role==='owner'))throw Error('Perfil inválido')
     if(s.action==='update'&&(await this.sql.sql('SELECT 1 FROM company_user WHERE '+clause+" AND role='owner'",args)).rows.length)throw Error('Cadastro do proprietário protegido')
     if(row.email){row.email=String(row.email).trim().toLowerCase();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(row.email))throw Error('Email inválido');if(s.action==='update')row.user_id=null}
    }
    for(const k of ['value','price','amount','budget_max','percentage','comissao_pct','area_total','area_useful','bedrooms','bathrooms','parking','iptu','condo_fee'])if(row[k]!=null&&(!Number.isFinite(Number(row[k]))||Number(row[k])<0))throw Error('Valor inválido: '+k)
    if(row.slug&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug))throw Error('Endereço da vitrine inválido')
    if(row.cor_primaria&&!/^#[0-9a-f]{6}$/i.test(row.cor_primaria))throw Error('Cor inválida')
    if(t==='visit'&&row.scheduled_at){const d=new Date(row.scheduled_at);if(!Number.isFinite(d.getTime()))throw Error('Data inválida');row.scheduled_at=d.toISOString()}
    const statuses:Record<string,string[]>={company:['active','trial','blocked','canceled'],property:['disponivel','reservado','vendido','alugado','inativo'],lead:['novo','em_atendimento','qualificado','visita_marcada','proposta','negociacao','fechado','perdido'],proposal:['em_analise','aceita','recusada','contra_proposta','expirada'],visit:['agendada','confirmada','realizada','cancelada','no_show','nao_compareceu']};
    if(row.status&&statuses[t]&&!statuses[t].includes(row.status))throw Error('Status inválido')
    if(row.payment_status&&!['pendente','pago','atrasado','cancelado'].includes(row.payment_status))throw Error('Status de pagamento inválido')
    for(const k of ['photos','features','neighborhoods'])if(k in row&&(!Array.isArray(row[k])||row[k].length>100))throw Error('Lista inválida')
    if(t==='company_user'&&row.comissao_pct!=null&&Number(row.comissao_pct)>100)throw Error('Percentual inválido')
    if(t==='commission'&&row.percentage!=null&&Number(row.percentage)>100)throw Error('Percentual inválido')
    if(t==='proposal'&&s.action==='update'&&(await this.sql.sql('SELECT 1 FROM proposal WHERE '+clause+" AND status='aceita'",args)).rows.length&&Object.keys(row).some(k=>!['status','updated_at','observations','contract_url'].includes(k)))throw Error('Crie uma nova proposta para mudar valores de uma proposta aceita')
    if(s.action==='insert'&&!row.id)row.id=crypto.randomUUID();const keys=Object.keys(row);const params=keys.map(k=>val(row[k]));const statement=s.action==='update'?'UPDATE '+q(t)+' SET '+keys.map(k=>col(k)+'=?').join(',')+' WHERE '+clause+' RETURNING *':'INSERT INTO '+q(t)+' ('+keys.map(col).join(',')+') VALUES ('+keys.map(()=>'?').join(',')+') RETURNING *';
    rows=(await this.sql.sql(statement,s.action==='update'?[...params,...args]:params)).rows
   }count=rows.length
  }
  const data=rows.map(row=>{const d=decode(t,row);return selected?Object.fromEntries(selected.map(k=>[k,d[k]])):d});if(s.cardinality==='one'&&data.length!==1)throw Error('Registro não encontrado');if(s.cardinality==='maybe'&&data.length>1)throw Error('Mais de um registro encontrado');return{data:s.head?null:s.cardinality?data[0]??null:data,error:null,count}
 }catch(e:any){return{data:null,error:{message:e.message},count:0}}}
}
