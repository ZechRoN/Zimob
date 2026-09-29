import{createClient}from'@blinkdotnew/sdk';import{ensureDatabase}from'./bootstrap';import{adaptBlinkSql}from'./sql-adapter';import{ownerEligible}from'./owner';import{Database,type Identity}from'./database';
export async function makeContext(request:Request,env:Record<string,string>,anonymous=false){
 const blink=createClient({projectId:env.BLINK_PROJECT_ID,secretKey:env.BLINK_SECRET_KEY,auth:{mode:'headless'}}),sql=adaptBlinkSql(blink.db);await ensureDatabase(sql,env.BLINK_PROJECT_ID);
 const h=anonymous?null:request.headers.get('authorization');const auth:any=h?await blink.auth.verifyToken(h):{valid:false};if(h&&(!auth.valid||!auth.userId||auth.projectId!==env.BLINK_PROJECT_ID))throw Error('Sessão inválida');
 const userId=auth.valid?auth.userId:'',email=auth.valid?String(auth.email||'').trim().toLowerCase():'';
 if(userId){
  await sql.sql('INSERT INTO profiles(user_id,email) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET email=excluded.email',[userId,email]);
  if(await ownerEligible({userId,email},env,sql))await sql.batch([{sql:"INSERT INTO template_owner(id,user_id) VALUES('owner',?) ON CONFLICT(id) DO NOTHING",args:[userId]},{sql:"INSERT INTO user_roles(id,user_id,role) SELECT ?,?,'super_admin' WHERE EXISTS(SELECT 1 FROM template_owner WHERE id='owner' AND user_id=?) ON CONFLICT(user_id,role) DO NOTHING",args:['owner:'+userId,userId,userId]}],'write');
  const v=(await sql.sql('SELECT email,email_verified FROM users WHERE id=?',[userId])).rows[0];if(Number(v?.email_verified)===1&&String(v.email).toLowerCase()===email)await sql.sql('UPDATE company_user SET user_id=? WHERE lower(email)=? AND user_id IS NULL',[userId,email]);
 }
 const master=!!userId&&!!(await sql.sql("SELECT 1 FROM user_roles WHERE user_id=? AND role='super_admin'",[userId])).rows.length;
 const selected=master?request.headers.get('x-company-id'):null;const member=selected?(await sql.sql('SELECT id AS company_id FROM company WHERE id=?',[selected])).rows[0]:userId?(await sql.sql('SELECT company_id,role FROM company_user WHERE user_id=? AND ativo=1 ORDER BY created_at LIMIT 1',[userId])).rows[0]:null;
 const identity:Identity={userId,email,master,companyId:member?.company_id,role:master?'owner':member?.role};return{blink,sql,identity,db:new Database(sql,identity),env};
}
