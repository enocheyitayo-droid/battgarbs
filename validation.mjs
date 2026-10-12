export function validateEdit(body) {
  if(!body || typeof body.prompt!=='string' || !body.prompt.trim() || body.prompt.length>2000) return {error:'Describe your dress changes in 1–2000 characters.'};
  if(typeof body.image!=='string') return {error:'Please supply a reference image.'};
  const match=body.image.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if(!match || Buffer.from(match[2],'base64').length>5*1024*1024) return {error:'Use a PNG, JPEG or WebP image up to 5 MB.'};
  return {base64:match[2],prompt:body.prompt.trim()};
}
