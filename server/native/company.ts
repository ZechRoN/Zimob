import{z}from'zod';
const form=z.object({name:z.string().trim().min(2).max(120),ownerEmail:z.string().email().max(200).optional(),ownerNome:z.string().max(120).optional(),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100).optional(),cnpj:z.string().max(30).optional(),creci:z.string().max(40).optional(),telefone:z.string().max(30).optional(),whatsapp:z.string().max(30).optional(),email:z.string().max(200).optional(),cor:z.string().regex(/^#[0-9a-f]{6}$/i).optional(),plano:z.enum(['starter','pro','enterprise']).default('starter')});
export async function createCompany(ctx:any,input:any,master=false){
 const {identity:u,sql}=ctx;if(!u.userId)throw Error('Autenticação necessária');if(master&&!u.master)throw Error('Acesso restrito');
 if(!master&&(await sql.sql('SELECT id FROM company_user WHERE user_id=?',[u.userId])).rows.length)throw Error('Você já possui uma imobiliária');
 const verified=(await sql.sql('SELECT email,email_verified FROM users WHERE id=?',[u.userId])).rows[0];if(!verified||Number(verified.email_verified)!==1)throw Error('Verifique seu email para continuar');
 const v=form.parse(input),email=(master?v.ownerEmail:u.email)?.trim().toLowerCase();if(!email)throw Error('Informe o email do administrador');
 const id=crypto.randomUUID(),slug=v.slug||v.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)+'-'+id.slice(0,5);
 await sql.batch([{sql:'INSERT INTO company(id,name,slug,owner_email,owner_nome,cnpj,creci,telefone,email,cor_primaria,plano,trial_ate,settings) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',args:[id,v.name,slug,email,v.ownerNome||email.split('@')[0],v.cnpj||null,v.creci||null,v.whatsapp||v.telefone||null,v.email||null,v.cor||'#2563eb',master?v.plano:'starter',new Date(Date.now()+14*86400000).toISOString().slice(0,10),JSON.stringify({public_showcase:{enabled:true}})]},{sql:"INSERT INTO company_user(id,company_id,email,nome,role,user_id) VALUES(?,?,?,?,'owner',?)",args:[crypto.randomUUID(),id,email,v.ownerNome||email.split('@')[0],email===u.email?u.userId:null]}],'write');
 return {ok:true,id,slug,email};
}
