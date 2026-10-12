import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.cwd(),moved=[];
const local=name=>{const p=path.resolve(root,name);if(!p.startsWith(root+path.sep))throw Error('Build path outside project');return p;};
try{
 // Next standalone copies loaded .env files. Keep all local credentials out
 // of this client demonstration, while preserving the user's originals.
 for(const name of ['.env','.env.local','.env.production','.env.production.local']){
  const source=local(name),backup=local(name+'.deploy-private');
  if(fs.existsSync(source)){if(fs.existsSync(backup))throw Error('An environment backup already exists: '+name);fs.renameSync(source,backup);moved.push([source,backup]);}
 }
 for(const name of ['.next/standalone/.env','.netlify/functions-internal/___netlify-server-handler/.env']){const file=local(name);if(fs.existsSync(file))fs.unlinkSync(file);}
 const env={...process.env,OPENAI_LIVE_ENABLED:'false',NEXT_TELEMETRY_DISABLED:'1'};
 for(const name of ['OPENAI_API_KEY','SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SERVICE_ROLE_KEY','LOCAL_BACKGROUND_DEMO','AI_WORKER_TOKEN','AI_WORKER_URL','PYTHON_AI_WORKER_URL','NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'])delete env[name];
 const result=spawnSync(process.execPath,[local('node_modules/next/dist/bin/next'),'build'],{cwd:root,env,stdio:'inherit'});
 if(result.error)throw result.error;process.exitCode=result.status??1;
}finally{
 for(const [source,backup] of moved.reverse()){if(fs.existsSync(source))throw Error('Environment changed during build; original preserved at '+path.basename(backup));fs.renameSync(backup,source);}
}
