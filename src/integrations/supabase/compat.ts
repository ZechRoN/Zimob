import { Query } from '../../../shared/query'
import { supabase } from './client'
export function createBlinkDataClient(){return{
 from(table:string){return new Query(table,async spec=>{try{return await callBackend('/api/query',spec)}catch(error:any){return{data:null,error:{message:error.message},count:0}}})},
 rpc(name:string,args:any){return callBackend('/api/database-operation',{name,args})},
}}
export async function callBackend(path:string, body?:unknown){
 const { data, error } = await supabase.functions.invoke('imobflow-api', { body: { path, body } })
 if(error) throw new Error(error.message || 'Falha no servidor')
 if(data?.error) throw new Error(typeof data.error === 'string' ? data.error : data.error.message || 'Falha no servidor')
 return data
}
