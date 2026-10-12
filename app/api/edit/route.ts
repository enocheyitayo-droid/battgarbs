import {createClient} from '@supabase/supabase-js';
import {publicSupabase} from '../../../server/public-config.mjs';
import {validateEdit} from '../../../validation.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const fail=(status:number,code:string,error:string)=>Response.json({code,error},{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request:Request){
 const connection=publicSupabase();
 if(process.env.OPENAI_LIVE_ENABLED!=='true'||!process.env.OPENAI_API_KEY||!connection.url||!connection.key)return fail(503,'NOT_CONFIGURED','Live design generation is not configured for this shared preview. You can still explore and export your design.');
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return fail(403,'ORIGIN','Same-site requests only.');
 const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];if(!token)return fail(401,'SIGN_IN_REQUIRED','Please sign in to generate a concept.');
 try{
 const client=createClient(connection.url!,connection.key!,{auth:{persistSession:false,autoRefreshToken:false}});const {data,error}=await client.auth.getUser(token);if(error||!data.user)return fail(401,'SIGN_IN_REQUIRED','Please sign in again.');
 const raw=await request.text();if(Buffer.byteLength(raw)>5_500_000)return fail(413,'IMAGE_TOO_LARGE','Use a smaller image for the shared preview (up to 3 MB).');
 let body;try{body=JSON.parse(raw);}catch{return fail(400,'INVALID_INPUT','Invalid image request.');}const validated=validateEdit(body);if(validated.error||!validated.base64)return fail(400,'INVALID_INPUT',validated.error||'Invalid image.');
 const {default:sharp}=await import('sharp');const bytes=Buffer.from(validated.base64,'base64');if(bytes.length>3*1024*1024)return fail(413,'IMAGE_TOO_LARGE','Use an image up to 3 MB.');const image=await sharp(bytes,{limitInputPixels:40000000}).resize({width:1536,height:1536,fit:'inside',withoutEnlargement:true}).png().toBuffer();
 const form=new FormData();form.append('model',process.env.OPENAI_IMAGE_MODEL||'gpt-image-1.5');form.append('image',new Blob([new Uint8Array(image)],{type:'image/png'}),'dress.png');form.append('prompt','Edit the reference dress on a clean white studio background. Preserve unspecified details. Maker review required. Requested changes: '+validated.prompt);form.append('size','1024x1536');form.append('quality','medium');
 const result=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY},body:form,signal:AbortSignal.timeout(55000)});if(!result.ok)return fail(502,'PROVIDER_ERROR','The image service could not complete this concept. Check access and billing; your previous design is unchanged.');const output=await result.json();if(typeof output.data?.[0]?.b64_json!=='string')return fail(502,'PROVIDER_ERROR','No image was returned. Your design is unchanged.');return Response.json({image:'data:image/png;base64,'+output.data[0].b64_json},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail(502,'EDIT_FAILED','The preview could not be completed. Your existing design is unchanged.');}
}
