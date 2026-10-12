import {test} from 'node:test';import assert from 'node:assert/strict';import sharp from 'sharp';
import {aiCapabilities} from '../server/ai-capabilities.mjs';
import {POST} from '../app/api/ai/background/route.ts';
test('worker capability does not require an OpenAI key or expose worker token',()=>{const result=aiCapabilities({AI_WORKER_URL:'https://worker.example',AI_WORKER_TOKEN:'private-token'});assert.equal(result.configured,true);assert.equal(result.workerConfigured,true);assert.equal(result.editingConfigured,false);assert(!JSON.stringify(result).includes('private-token'));});
test('local background upload calls Modal and returns a real PNG without cloud storage claims',async()=>{
 const previous={...process.env};const oldFetch=global.fetch;const image=await sharp({create:{width:10,height:10,channels:3,background:'white'}}).png().toBuffer();
 try{for(const key of ['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'])delete process.env[key];Object.assign(process.env,{NODE_ENV:'development',LOCAL_BACKGROUND_DEMO:'true',AI_WORKER_URL:'https://worker.example',AI_WORKER_TOKEN:'private-token'});
 global.fetch=async(url,options)=>{assert.equal(url.pathname,'/api/clean-background');assert.equal(options.headers.Authorization,'Bearer private-token');assert(options.body.get('file') instanceof Blob);return new Response(image,{headers:{'Content-Type':'image/png'}});};
 const request=()=>{const form=new FormData();form.append('file',new Blob([image],{type:'image/png'}),'dress.png');return new Request('http://localhost:4173/api/ai/background',{method:'POST',headers:{Origin:'http://localhost:4173'},body:form});};
 const response=await POST(request());assert.equal(response.status,200);const result=await response.json();assert.equal(result.persistence,'device-demo');assert(result.image.startsWith('data:image/png;base64,'));assert(!JSON.stringify(result).includes('private-token'));
 process.env.NODE_ENV='production';assert.equal((await POST(request())).status,503);
 process.env.NODE_ENV='development';global.fetch=async()=>new Response('bad',{status:503});assert.equal((await POST(request())).status,502);
 }finally{global.fetch=oldFetch;for(const key of Object.keys(process.env))if(!(key in previous))delete process.env[key];Object.assign(process.env,previous);}
});
