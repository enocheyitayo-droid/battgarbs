export function publicSupabase(env=process.env){
 const url=env.SUPABASE_URL||env.NEXT_PUBLIC_SUPABASE_URL||'';
 const key=env.SUPABASE_PUBLISHABLE_KEY||env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'';
 let safe=key.startsWith('sb_publishable_');
 if(!safe&&key.split('.').length===3){try{safe=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString()).role==='anon';}catch{}}
 try{if(!safe||new URL(url).protocol!=='https:')return {url:null,key:null};}catch{return {url:null,key:null};}
 return {url,key};
}
