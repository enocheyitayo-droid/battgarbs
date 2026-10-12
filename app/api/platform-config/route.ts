import {publicSupabase} from '../../../server/public-config.mjs';
export const dynamic='force-dynamic';
export function GET(){return Response.json(publicSupabase(),{headers:{'Cache-Control':'no-store'}});}
