import {aiCapabilities} from './server/ai-capabilities.mjs';
import dotenv from 'dotenv';
dotenv.config({path:'.env.local',quiet:true});dotenv.config({quiet:true});
import {publicSupabase} from './server/public-config.mjs';
import express from 'express';
import sharp from 'sharp';
import {createClient} from '@supabase/supabase-js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateEdit } from './validation.mjs';

export function createApp({ apiKey = process.env.OPENAI_API_KEY, model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1.5', request = fetch, platformUrl=publicSupabase().url, publishableKey=publicSupabase().key } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use((req,res,next)=>{res.set('Cache-Control','no-store');res.set('X-Content-Type-Options','nosniff'); if(req.method==='POST' && req.headers.origin && !['http://localhost:4173','http://127.0.0.1:4173'].includes(req.headers.origin)) return res.status(403).json({code:'ORIGIN',error:'Local prototype requests only.'}); next();});
  app.use(express.json({limit:'8mb'}));
  app.get('/api/status', (_req,res)=>res.json(aiCapabilities({...process.env,OPENAI_API_KEY:apiKey})));
  app.get('/api/platform-config', (_req,res)=>{
    res.json(publicSupabase({SUPABASE_URL:platformUrl,SUPABASE_PUBLISHABLE_KEY:publishableKey}));
  });
  let busy=false;
  app.post('/api/edit', async (req,res)=>{
    if(platformUrl&&publishableKey){
      const token=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];if(!token)return res.status(401).json({code:'SIGN_IN_REQUIRED',error:'Sign in to generate a design concept.'});
      try{const client=createClient(platformUrl,publishableKey,{auth:{persistSession:false,autoRefreshToken:false}});const {data,error}=await client.auth.getUser(token);if(error||!data.user)return res.status(401).json({code:'SIGN_IN_REQUIRED',error:'Your session is invalid. Please sign in again.'});}catch{return res.status(503).json({code:'AUTH_UNAVAILABLE',error:'Account verification is unavailable. Your design is unchanged.'});}
    }
    const validation=validateEdit(req.body);
    if(validation.error) return res.status(400).json({code:'INVALID_INPUT',error:validation.error});
    if(!apiKey) return res.status(503).json({code:'NOT_CONFIGURED',error:'Live image editing needs a server-side OpenAI API key. Your design is unchanged.'});
    if(busy) return res.status(429).json({code:'BUSY',error:'Another preview is being created. Please try again shortly.'});
    busy=true;
    try {
      const bytes=Buffer.from(validation.base64,'base64');
      const metadata=await sharp(bytes,{limitInputPixels:40000000}).metadata();
      if(!['png','jpeg','webp'].includes(metadata.format)) return res.status(400).json({code:'INVALID_IMAGE',error:'Please use a valid PNG, JPEG or WebP image.'});
      const image=await sharp(bytes).resize({width:1536,height:1536,fit:'inside',withoutEnlargement:true}).png().toBuffer();
      const form=new FormData();
      form.append('model',model);form.append('image',new Blob([image],{type:'image/png'}),'dress.png');
      form.append('prompt',`Create a fashion design concept by editing this reference garment. Keep the garment identity and all unspecified construction details. Full-length front studio view on a clean white background, soft realistic lighting. Do not add text. Requested garment changes: ${validation.prompt}`);
      form.append('size','1024x1536');form.append('quality','medium');
      const upstream=await request('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`},body:form,signal:AbortSignal.timeout(180000)});
      if(!upstream.ok) {
        let details;try {details=await upstream.json();}catch{}
        const providerCode=details?.error?.code;
        const diagnostic=value=>typeof value==='string'&&/^[a-zA-Z0-9_.-]{1,80}$/.test(value)?value:'unknown';
        console.warn('OpenAI image response:',upstream.status,diagnostic(providerCode),diagnostic(details?.error?.param));
        const billing=['billing_hard_limit_reached','billing_not_active','insufficient_quota','credit_balance_exhausted'].includes(providerCode);
        const auth=upstream.status===401;
        return res.status(502).json({code:billing?'BILLING_REQUIRED':auth?'AUTH_FAILED':'PROVIDER_ERROR',error:billing?'OpenAI API billing or credits are required for image generation. Check the API project billing settings; your design is unchanged.':auth?'OpenAI rejected the server API key. Check the project key and restart the server; your design is unchanged.':upstream.status===403?'OpenAI denied image-model access. Check project permissions and organization verification; your design is unchanged.':'OpenAI could not create this preview. Check API access, billing and model availability, then retry. Your last preview is unchanged.'});
      }
      const data=await upstream.json();
      if(!data.data?.[0]?.b64_json) throw new Error('Missing image');
      return res.json({image:`data:image/png;base64,${data.data[0].b64_json}`});
    } catch(error) {
      console.warn('Image edit failed:', error?.name || 'Error', error?.cause?.code || 'NO_CONNECTION_CODE');
      const invalid= /unsupported image|corrupt|Input buffer/i.test(String(error));
      const connectionCode=error?.cause?.code;
      const certificate=['UNABLE_TO_VERIFY_LEAF_SIGNATURE','SELF_SIGNED_CERT_IN_CHAIN','UNABLE_TO_GET_ISSUER_CERT_LOCALLY'].includes(connectionCode);
      const timeout=['TimeoutError','AbortError'].includes(error?.name);
      return res.status(invalid?400:502).json({code:invalid?'INVALID_IMAGE':certificate?'CERTIFICATE_ERROR':timeout?'TIMEOUT':'EDIT_FAILED',error:invalid?'This file is not a readable image.':certificate?'The server could not verify the OpenAI connection certificate. Restart the server using npm run dev with Node.js 22.19+ or 24+. Your design is unchanged.':timeout?'OpenAI took too long to create the preview. Please retry; your design is unchanged.':'The server could not reach OpenAI or complete the preview. Check the connection and retry; your design is unchanged.'});
    } finally {busy=false;}
  });
  app.use((err,req,res,next)=>res.status(err.status===413?413:400).json({code:'BAD_REQUEST',error:'Request is invalid or too large (maximum image size: 5 MB).'}));
  return app;
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const app=createApp();const root=dirname(fileURLToPath(import.meta.url));
  const {default:next}=await import('next');const site=next({dev:!process.argv.includes('--production'),dir:root,hostname:'127.0.0.1',port:Number(process.env.PORT)||4173});await site.prepare();const handler=site.getRequestHandler();app.use((req,res)=>handler(req,res));
  app.listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log('BattGarbs preview: http://localhost:4173'));
}

