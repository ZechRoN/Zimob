import{callBackend}from'@/integrations/supabase/api';import{supabase}from'@/integrations/supabase/client';
export const createCompanyWithOwner=async({data}:any)=>callBackend('/api/master/company',data);
export const setCompanyStatus=async({data}:any)=>{const r=await supabase.from('company').update({status:data.status}).eq('id',data.companyId);if(r.error)throw Error(r.error.message);return{ok:true}};
export const inviteCorretor=async({data}:any)=>{const c=await callBackend('/api/bootstrap');const r=await supabase.from('company_user').insert({...data,company_id:c.company?.id});if(r.error)throw Error(r.error.message);return{ok:true}};
