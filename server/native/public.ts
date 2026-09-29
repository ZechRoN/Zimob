import{z}from'zod';import{decode}from'./database';
const fields=['id','company_id','title','description','price','type','transaction','status','area_total','area_useful','bedrooms','suites','bathrooms','parking','condo_fee','iptu','city','neighborhood','state','photos','features','video_url','slug','code','listed_at'];
const contact=z.object({name:z.string().trim().min(2).max(120),phone:z.string().trim().min(8).max(24),email:z.string().trim().email().max(200).optional().or(z.literal('')),message:z.string().max(1000).optional()});
const pick=(row:any,keys:string[])=>Object.fromEntries(keys.map(k=>[k,row[k]]));
async function load(ctx:any,slug:string,id?:string){
 if(typeof slug!=='string'||slug.length>100)throw Error('Vitrine inválida');
 const raw=(await ctx.sql.sql("SELECT * FROM company WHERE slug=? AND status IN ('active','trial') AND (status<>'trial' OR trial_ate IS NULL OR trial_ate>=?)",[slug,new Date().toISOString().slice(0,10)])).rows[0];if(!raw)throw Error('Imobiliária não encontrada');const c=decode('company',raw);
 if(c.settings?.public_showcase?.enabled===false)throw Error('Vitrine indisponível');
 const company={...pick(c,['id','name','slug','logo_url','telefone','email','creci','cor_primaria']),settings:pick(c.settings||{},['vitrine_descricao','whatsapp','depoimentos'])};
 const all=(await ctx.sql.sql("SELECT * FROM property WHERE company_id=? AND status='disponivel' ORDER BY created_at DESC LIMIT 500",[c.id])).rows.map((r:any)=>pick(decode('property',r),fields));
 const property=id?all.find((p:any)=>p.id===id):null;if(id&&!property)throw Error('Imóvel não encontrado');return{company,properties:all,property,similar:all.filter((p:any)=>p.id!==id).slice(0,3)};
}
export async function publicApi(ctx:any,input:any){
 const {action,slug,id}=input||{},data=await load(ctx,slug,id);
 if(action==='catalog')return data;
 if(!data.property)throw Error('Imóvel obrigatório');
 if(action==='slots'){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(input.date))throw Error('Data inválida');
  const rows=(await ctx.sql.sql("SELECT scheduled_at FROM visit WHERE property_id=? AND status<>'cancelada' AND scheduled_at>=? AND scheduled_at<?",[id,input.date+'T00:00:00.000Z',input.date+'T23:59:59.999Z'])).rows;return{taken:rows.map((r:any)=>r.scheduled_at)};
 }
 if(!['interest','book'].includes(action))throw Error('Ação inválida');const v=contact.parse(input);
 const recent=(await ctx.sql.sql("SELECT COUNT(*) AS n FROM lead WHERE company_id=? AND phone=? AND created_at>=?",[data.company.id,v.phone,new Date(Date.now()-3600000).toISOString()])).rows[0];if(Number(recent?.n)>5)throw Error('Solicitações demais; fale diretamente com a imobiliária');
 const leadId=crypto.randomUUID();const batch=[{sql:'INSERT INTO lead(id,company_id,name,phone,email,source,status,interest_property_id,notes) VALUES(?,?,?,?,?,?,?,?,?)',args:[leadId,data.company.id,v.name,v.phone,v.email||null,'site',action==='book'?'visita_marcada':'novo',id,v.message||null]}];
 if(action==='book'){
  const when=new Date(input.scheduled_at),now=Date.now();if(!Number.isFinite(when.getTime())||when.getTime()<now||when.getTime()>now+180*86400000||when.getUTCMinutes()!==0||when.getUTCSeconds()!==0)throw Error('Horário inválido');
  const hour=Number(new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',hour:'2-digit',hourCycle:'h23'}).format(when));if(![9,10,11,14,15,16,17,18].includes(hour))throw Error('Escolha um horário de atendimento');
  const visitId=crypto.randomUUID();batch.push({sql:"INSERT INTO visit(id,company_id,property_id,property_title,lead_id,lead_name,lead_phone,scheduled_at,status) VALUES(?,?,?,?,?,?,?,?,'agendada')",args:[visitId,data.company.id,id,data.property.title,leadId,v.name,v.phone,when.toISOString()]});
  try{await ctx.sql.batch(batch,'write')}catch(e:any){if(/unique|constraint/i.test(e.message))throw Error('Este horário já foi reservado; escolha outro');throw e}return{ok:true,protocolo:'VIS-'+visitId.slice(0,8).toUpperCase()};
 }
 await ctx.sql.batch(batch,'write');return{ok:true};
}
