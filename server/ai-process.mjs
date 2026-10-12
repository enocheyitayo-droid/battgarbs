import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';
import {publicSupabase} from './public-config.mjs';
const json=(status,code,error)=>Response.json({code,error},{status,headers:{'Cache-Control':'no-store'}});
export function createProcessor({env=process.env,makeClient=createClient,request=fetch,normalize}={}){
 return async function processImage(req){
  const publicConfig=publicSupabase(env);const config={...env,SUPABASE_URL:publicConfig.url,SUPABASE_PUBLISHABLE_KEY:publicConfig.key,AI_WORKER_URL:env.AI_WORKER_URL||env.PYTHON_AI_WORKER_URL};
  if(!config.SUPABASE_URL||!config.SUPABASE_PUBLISHABLE_KEY||!config.AI_WORKER_URL||!config.AI_WORKER_TOKEN)return json(503,'NOT_CONFIGURED','Private storage and the background worker must be configured first.');
  let worker;try{worker=new URL(config.AI_WORKER_URL);if(worker.pathname.includes('/runsync'))throw Error();if(worker.username||worker.password||!['https:','http:'].includes(worker.protocol)||(config.NODE_ENV==='production'&&worker.protocol!=='https:'))throw Error();}catch{return json(503,'NOT_CONFIGURED','The worker endpoint configuration is invalid.');}
  const bearer=req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];if(!bearer)return json(401,'SIGN_IN_REQUIRED','Please sign in to process your dress photo.');
  const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return json(403,'ORIGIN','Same-site requests only.');
  if(Number(req.headers.get('content-length'))>3*1024*1024)return json(413,'TOO_LARGE','Use an image up to 2 MB.');
  let client,job=null;const uploaded=[];let succeeded=false;
  try{
   client=makeClient(config.SUPABASE_URL,config.SUPABASE_PUBLISHABLE_KEY,{global:{headers:{Authorization:'Bearer '+bearer}},auth:{persistSession:false,autoRefreshToken:false}});
   const {data,error}=await client.auth.getUser(bearer);if(error||!data.user)return json(401,'SIGN_IN_REQUIRED','Your session is invalid. Please sign in again.');
   let form;try{form=await req.formData();}catch{return json(400,'INVALID_UPLOAD','A multipart image upload is required.');}const file=form.get('file');
   if(!(file instanceof Blob)||!['image/png','image/jpeg','image/webp'].includes(file.type)||!file.size||file.size>2*1024*1024)return json(400,'INVALID_UPLOAD','Use PNG, JPEG or WebP up to 2 MB.');
   const bytes=Buffer.from(await file.arrayBuffer());let original;
   if(normalize)original=await normalize(bytes);else{const {default:sharp}=await import('sharp');const meta=await sharp(bytes,{limitInputPixels:20000000}).metadata();if(!['png','jpeg','webp'].includes(meta.format))return json(400,'INVALID_UPLOAD','This file is not a supported image.');original={bytes,extension:meta.format==='jpeg'?'jpg':meta.format,mime:'image/'+meta.format};}
   const reservation=await client.rpc('reserve_image_job');if(reservation.error)return json(reservation.error.message.includes('limit')?429:503,'JOB_UNAVAILABLE',reservation.error.message.includes('limit')?'Processing limit reached. Please retry later.':'Processing records are not configured.');job=reservation.data;
   const bucket=client.storage.from('private-designs');const prefix=data.user.id+'/'+randomUUID();const originalPath=prefix+'-original.'+original.extension;
   const saved=await bucket.upload(originalPath,original.bytes,{contentType:original.mime,upsert:false});if(saved.error)throw Error('Storage');uploaded.push(originalPath);
   const input=new FormData();input.append('file',new Blob([new Uint8Array(original.bytes)],{type:original.mime}),'dress.'+original.extension);
   const output=await request(new URL('/api/clean-background',worker),{method:'POST',headers:{Authorization:'Bearer '+config.AI_WORKER_TOKEN},body:input,redirect:'error',signal:AbortSignal.timeout(25000)});
   if(!output.ok){return json(output.status===429?429:502,'WORKER_FAILED',output.status===429?'The studio processor is busy. Retry shortly.':'Background processing is unavailable. Your last preview is unchanged.');}
   if(!output.headers.get('content-type')?.startsWith('image/png'))throw Error('Invalid output');
   const reader=output.body.getReader(),chunks=[];let size=0;for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2*1024*1024){await reader.cancel();throw Error('Output too large');}chunks.push(value);}let processed=Buffer.concat(chunks);
   if(normalize)await normalize(processed);else{const {default:sharp}=await import('sharp');const meta=await sharp(processed,{limitInputPixels:20000000}).metadata();if(meta.format!=='png')throw Error('Invalid PNG');processed=await sharp(processed).png().toBuffer();}
   const processedPath=prefix+'-studio.png';const stored=await bucket.upload(processedPath,processed,{contentType:'image/png',upsert:false});if(stored.error)throw Error('Storage');uploaded.push(processedPath);
   const signed=await bucket.createSignedUrl(processedPath,300);if(signed.error)throw Error('Storage');const completed=await client.rpc('finish_image_job',{p_job:job,p_status:'succeeded',p_original:originalPath,p_processed:processedPath});if(completed.error)throw Error('Record');succeeded=true;
   return Response.json({jobId:job,originalPath,processedPath,previewUrl:signed.data.signedUrl,expiresIn:300,kind:'studio-image',requiresReview:true},{headers:{'Cache-Control':'no-store'}});
  }catch{return json(502,'PROCESSING_FAILED','The photo could not be processed. Your last preview is unchanged.');}
  finally{if(!succeeded&&client){if(uploaded.length)await client.storage.from('private-designs').remove(uploaded).catch(()=>{});if(job)await client.rpc('finish_image_job',{p_job:job,p_status:'failed',p_original:null,p_processed:null}).catch(()=>{});}}
 };
}
