import {aiCapabilities} from '../../../server/ai-capabilities.mjs';
export const dynamic='force-dynamic';
export function GET(){return Response.json(aiCapabilities(),{headers:{'Cache-Control':'no-store'}});}
