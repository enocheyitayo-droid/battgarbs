import {createClient} from '@supabase/supabase-js';
export const cloud=fetch('/api/platform-config').then(r=>r.json()).then(c=>c.url&&c.key?createClient(c.url,c.key):null);
export async function rpc(name:string,args:Record<string,unknown>={}){const client=await cloud;if(!client)throw Error('Supabase is not configured. Follow SETUP.md; no cloud records have been saved.');const {data,error}=await client.rpc(name,args);if(error)throw Error(error.message);return data;}
