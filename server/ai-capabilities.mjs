import {publicSupabase} from './public-config.mjs';
export function aiCapabilities(env=process.env){
 const connection=publicSupabase(env);
 const workerConfigured=Boolean(env.AI_WORKER_URL&&env.AI_WORKER_TOKEN);
 const editingConfigured=Boolean(env.OPENAI_LIVE_ENABLED==='true'&&env.OPENAI_API_KEY&&connection.url&&connection.key);
 return {configured:workerConfigured||editingConfigured,workerConfigured,editingConfigured,privateStorageConfigured:Boolean(connection.url&&connection.key),localBackgroundDemo:env.NODE_ENV!=='production'&&env.LOCAL_BACKGROUND_DEMO==='true'};
}
