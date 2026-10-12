import fs from 'node:fs/promises';
import path from 'node:path';
import {config} from 'dotenv';
import sharp from 'sharp';
config({path:'.env.local',quiet:true});config({path:'.env',quiet:true});
const input=process.argv[2]||'public/images/ivory-dress-alone.webp';
const directory=path.resolve('outputs/worker-demo');
try{
 const endpoint=new URL(process.env.AI_WORKER_URL||'');
 if(endpoint.protocol!=='https:'||!process.env.AI_WORKER_TOKEN)throw Error('Configure the HTTPS worker URL and private token first.');
 const bytes=await fs.readFile(input);
 if(bytes.length>2*1024*1024)throw Error('Choose an image below 2 MB.');
 const meta=await sharp(bytes,{limitInputPixels:20000000}).metadata();
 if(!['png','jpeg','webp'].includes(meta.format))throw Error('Choose PNG, JPEG or WebP.');
 const body=new FormData();body.append('file',new Blob([bytes],{type:'image/'+meta.format}),'dress.'+meta.format);
 console.log('Sending one image to Modal; results will be saved locally, not to Supabase.');
 const response=await fetch(new URL('/api/clean-background',endpoint),{method:'POST',headers:{Authorization:'Bearer '+process.env.AI_WORKER_TOKEN},body,redirect:'error',signal:AbortSignal.timeout(330000)});
 if(!response.ok)throw Error('Worker returned HTTP '+response.status+'. Check the deployed worker and matching secret.');
 if(!response.headers.get('content-type')?.startsWith('image/png'))throw Error('Worker did not return a PNG image.');
 const reader=response.body.getReader();const parts=[];let size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2*1024*1024){await reader.cancel();throw Error('Worker image exceeds the limit.');}parts.push(value);}
 const result=Buffer.concat(parts);if((await sharp(result,{limitInputPixels:20000000}).metadata()).format!=='png')throw Error('Invalid PNG output.');
 await fs.mkdir(directory,{recursive:true});await fs.writeFile(path.join(directory,'original.png'),await sharp(bytes).png().toBuffer());await fs.writeFile(path.join(directory,'studio.png'),result);
 await fs.writeFile(path.join(directory,'index.html'),'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Batt Garbs worker demo</title><style>body{font-family:Arial;background:#f8f6f1;margin:40px;color:#222}main{display:flex;gap:24px;flex-wrap:wrap}figure{margin:0;flex:1;min-width:260px}img{width:100%;max-height:75vh;object-fit:contain;background:white}p{line-height:1.6}</style><h1>Batt Garbs · Background removal demo</h1><p>Real Modal processing. Files saved on this computer. No Supabase account, cloud persistence or customer authentication is demonstrated.</p><main><figure><figcaption>Original image</figcaption><img src="original.png"></figure><figure><figcaption>Processed white studio background</figcaption><img src="studio.png"></figure></main>');
 console.log('Demo ready: '+path.join(directory,'index.html'));
}catch(error){console.error(error.name==='TimeoutError'?'Worker timed out; no successful result was created.':error.cause?.code?'Worker connection failed ('+error.cause.code+'); no successful result was created.':error.message);process.exitCode=1;}
