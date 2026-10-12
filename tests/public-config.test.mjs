import {test} from 'node:test';import assert from 'node:assert/strict';import {publicSupabase} from '../server/public-config.mjs';
const jwt=role=>'header.'+Buffer.from(JSON.stringify({role})).toString('base64url')+'.signature';
test('Supabase environment aliases support public keys, never service-role secrets',()=>{
 const url='https://test.supabase.co';assert.equal(publicSupabase({NEXT_PUBLIC_SUPABASE_URL:url,NEXT_PUBLIC_SUPABASE_ANON_KEY:jwt('anon')}).key,jwt('anon'));
 assert.deepEqual(publicSupabase({SUPABASE_URL:url,SUPABASE_PUBLISHABLE_KEY:jwt('service_role')}),{url:null,key:null});
 assert.deepEqual(publicSupabase({SUPABASE_URL:url,SUPABASE_SERVICE_ROLE_KEY:jwt('service_role')}),{url:null,key:null});
 assert.deepEqual(publicSupabase({SUPABASE_URL:url,SUPABASE_PUBLISHABLE_KEY:'sb_secret_private'}),{url:null,key:null});
});
