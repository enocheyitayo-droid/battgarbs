export const dynamic='force-dynamic';
export function GET(){return Response.json({country:null,language:null},{headers:{'Cache-Control':'no-store'}});}
