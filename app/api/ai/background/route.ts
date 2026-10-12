import {createProcessor} from '../../../../server/ai-process.mjs';
import {aiCapabilities} from '../../../../server/ai-capabilities.mjs';
import sharp from 'sharp';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 const capability=aiCapabilities();
 if(capability.privateStorageConfigured)return createProcessor()(req);
 const url=new URL(req.url);
 if(!capability.localBackgroundDemo||!['localhost','127.0.0.1','[::1]'].includes(url.hostname))return Response.json({error:'Sign-in and private storage must be configured before processing customer photos.'},{status:503});
 if(req.headers.get('origin')&&req.headers.get('origin')!==url.origin)return Response.json({error:'Same-site requests only.'},{status:403});
 if(!capability.workerConfigured)return Response.json({error:'Background worker is not configured.'},{status:503});
 try{
  if(Number(req.headers.get('content-length'))>3*1024*1024)return Response.json({error:'Use an image up to 2 MB.'},{status:413});
  const form=await req.formData();const file=form.get('file');
  if(!(file instanceof Blob)||!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size===0||file.size>2*1024*1024)return Response.json({error:'Use PNG, JPEG or WebP up to 2 MB.'},{status:400});
  const bytes=Buffer.from(await file.arrayBuffer());const meta=await sharp(bytes,{limitInputPixels:20000000}).metadata();
  if(!['png','jpeg','webp'].includes(meta.format||''))return Response.json({error:'Invalid image.'},{status:400});
  const worker=new URL(process.env.AI_WORKER_URL!);if(worker.protocol!=='https:'||worker.username||worker.password)throw Error();
  const body=new FormData();body.append('file',new Blob([new Uint8Array(bytes)],{type:file.type}),'dress.'+meta.format);
  const response=await fetch(new URL('/api/clean-background',worker),{method:'POST',headers:{Authorization:'Bearer '+process.env.AI_WORKER_TOKEN},body,redirect:'error',signal:AbortSignal.timeout(330000)});
  if(!response.ok||!response.headers.get('content-type')?.startsWith('image/png'))return Response.json({error:'Background worker is unavailable. Your original reference is preserved.'},{status:502});
  const reader=response.body!.getReader();const chunks:Uint8Array[]=[];let size=0;for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2*1024*1024){await reader.cancel();throw Error();}chunks.push(value);}
  const image=Buffer.concat(chunks);if((await sharp(image,{limitInputPixels:20000000}).metadata()).format!=='png')throw Error();
  return Response.json({image:'data:image/png;base64,'+image.toString('base64'),kind:'studio-image',persistence:'device-demo',requiresReview:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Background processing failed. Your original reference is preserved.'},{status:502});}
}
