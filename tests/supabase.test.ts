import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

const ids = {
 master: '00000000-0000-0000-0000-000000000001',
 owner: '00000000-0000-0000-0000-000000000002',
 broker: '00000000-0000-0000-0000-000000000003',
 other: '00000000-0000-0000-0000-000000000004',
 a: '10000000-0000-0000-0000-000000000001',
 b: '10000000-0000-0000-0000-000000000002',
 pa: '20000000-0000-0000-0000-000000000001',
 pb: '20000000-0000-0000-0000-000000000002',
}
async function fixture() {
 const db = new PGlite()
 await db.exec(`
 CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
 CREATE SCHEMA auth; CREATE SCHEMA storage;
 CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
 GRANT USAGE ON SCHEMA public,auth TO anon,authenticated;
 CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text,owner_id text);
 ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
 GRANT USAGE ON SCHEMA storage TO anon,authenticated;
 GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO authenticated;
 CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql AS $$ SELECT (string_to_array($1,'/'))[1:array_length(string_to_array($1,'/'),1)-1] $$;
 `)
 const paths = existsSync('supabase/migrations')
  ? readdirSync('supabase/migrations').filter(n=>n.endsWith('.sql')).sort().map(n=>'supabase/migrations/'+n)
  : ['scripts/native/supabase-database.sql']
 for(const path of paths) await db.exec(readFileSync(path,'utf8').replace(/create extension if not exists pgcrypto;/ig,''))
 await db.exec(`
 INSERT INTO auth.users VALUES('${ids.master}','contato@zivello.com.br',now()),('${ids.owner}','owner@example.com',now()),('${ids.broker}','broker@example.com',now()),('${ids.other}','other@example.com',now());
 SELECT set_config('request.jwt.claim.sub','${ids.master}',false);
 SELECT set_config('request.jwt.claims','{"email":"contato@zivello.com.br"}',false);
 INSERT INTO company(id,name,slug,owner_email,status) VALUES('${ids.a}','A','agency-a','owner@example.com','active'),('${ids.b}','B','agency-b','other@example.com','active');
 INSERT INTO company_user(company_id,email,user_id,role) VALUES('${ids.a}','owner@example.com','${ids.owner}','owner'),('${ids.a}','broker@example.com','${ids.broker}','corretor'),('${ids.b}','other@example.com','${ids.other}','owner');
 INSERT INTO property(id,company_id,title,price,owner_email) VALUES('${ids.pa}','${ids.a}','Casa A',100,'private@example.com'),('${ids.pb}','${ids.b}','Casa B',200,'private-b@example.com');
 INSERT INTO revenue(company_id,amount,description,date) VALUES('${ids.a}',100,'Receita',current_date);
 `)
 return db
}
async function login(db:PGlite,id:string,role='authenticated') {
 await db.exec('RESET ROLE')
 await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[id])
 await db.query("SELECT set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:id,email:id===ids.master?'contato@zivello.com.br':id===ids.owner?'owner@example.com':'broker@example.com'})])
 await db.exec('SET ROLE '+role)
}
async function rpc(db:PGlite,name:string,args:object) {
 return (await db.query<{result:any}>(`SELECT public.${name}($1::jsonb) AS result`,[JSON.stringify(args)])).rows[0].result
}

test('Supabase: corretor não lê financeiro e owner enxerga apenas sua imobiliária',async()=>{
 const db=await fixture();try{
 await login(db,ids.broker)
 assert.equal((await db.query('SELECT * FROM revenue')).rows.length,0)
 await login(db,ids.owner)
 assert.deepEqual((await db.query('SELECT title FROM property')).rows.map((r:any)=>r.title),['Casa A'])
 }finally{await db.close()}
})
test('Supabase: bootstrap vincula convite confirmado e seleciona a imobiliária do Master',async()=>{
 const db=await fixture();try{
 await db.exec(`INSERT INTO company_user(company_id,email,role) VALUES('${ids.a}','invited@example.com','corretor'); INSERT INTO auth.users VALUES('00000000-0000-0000-0000-000000000009','invited@example.com',now());`)
 await login(db,'00000000-0000-0000-0000-000000000009')
 const invited=await rpc(db,'zimob_bootstrap',{})
 assert.equal(invited.company.id,ids.a)
 await login(db,ids.master)
 assert.equal((await rpc(db,'zimob_bootstrap',{companyId:ids.b})).company.id,ids.b)
 assert.equal((await rpc(db,'zimob_bootstrap',{})).company,null)
 }finally{await db.close()}
})
test('Supabase: cadastro cria empresa e owner atomicamente',async()=>{
 const db=await fixture();try{
 await login(db,ids.master)
 const created=await rpc(db,'zimob_create_company',{name:'Nova',slug:'nova',ownerEmail:'new@example.com'})
 assert.ok(created.id)
 assert.equal((await db.query('SELECT * FROM company_user WHERE company_id=$1',[created.id])).rows.length,1)
 await assert.rejects(rpc(db,'zimob_create_company',{name:'Duplicada',slug:'nova',ownerEmail:'new2@example.com'}))
 assert.equal((await db.query("SELECT * FROM company WHERE slug='nova'")).rows.length,1)
 }finally{await db.close()}
})
test('Supabase: catálogo anônimo omite dados privados e reserva duplicada não cria lead órfão',async()=>{
 const db=await fixture();try{
 await login(db,'','anon')
 const catalog=await rpc(db,'zimob_public_api',{action:'catalog',slug:'agency-a'})
 assert.equal(catalog.properties.length,1)
 assert.equal(catalog.properties[0].owner_email,undefined)
 assert.equal(catalog.company.owner_email,undefined)
 const day=new Date(Date.now()+7*86400000);day.setUTCHours(12,0,0,0)
 const payload={action:'book',slug:'agency-a',id:ids.pa,name:'Cliente Teste',phone:'11999999999',scheduled_at:day.toISOString()}
 assert.ok((await rpc(db,'zimob_public_api',payload)).protocolo)
 await assert.rejects(rpc(db,'zimob_public_api',payload),/reservado/)
 await login(db,ids.owner)
 assert.equal((await db.query('SELECT * FROM lead')).rows.length,1)
 assert.equal((await db.query('SELECT * FROM visit')).rows.length,1)
 }finally{await db.close()}
})
test('Supabase: vínculos entre imobiliárias são rejeitados',async()=>{
 const db=await fixture();try{
 await login(db,ids.owner)
 await assert.rejects(db.query("INSERT INTO lead(company_id,name,phone,interest_property_id) VALUES($1,'Lead','11999999999',$2)",[ids.a,ids.pb]),/imobiliária/)
 }finally{await db.close()}
})
test('Supabase: suspensão bloqueia tabelas privadas e vitrine',async()=>{
 const db=await fixture();try{
 await db.query("UPDATE company SET status='blocked' WHERE id=$1",[ids.a])
 await login(db,ids.owner)
 assert.equal((await db.query('SELECT * FROM property')).rows.length,0)
 await assert.rejects(db.query("INSERT INTO lead(company_id,name,phone) VALUES($1,'Lead','11999999999')",[ids.a]))
 await login(db,'','anon')
 await assert.rejects(rpc(db,'zimob_public_api',{action:'catalog',slug:'agency-a'}))
 }finally{await db.close()}
})
test('Supabase: storage permite imagem na própria imobiliária e rejeita outra',async()=>{
 const db=await fixture();try{
 await login(db,ids.owner)
 await db.query("INSERT INTO storage.objects(bucket_id,name) VALUES('property-photos',$1)",[ids.a+'/photo.jpg'])
 await assert.rejects(db.query("INSERT INTO storage.objects(bucket_id,name) VALUES('property-photos',$1)",[ids.b+'/photo.jpg']))
 }finally{await db.close()}
})
