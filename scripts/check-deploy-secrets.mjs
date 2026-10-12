import fs from 'node:fs';import path from 'node:path';import dotenv from 'dotenv';import {createRequire} from 'node:module';
if(!process.argv[2])throw Error('Pass the installed Netlify CLI package.json path.');
const require=createRequire(path.resolve(process.argv[2])),yauzl=require('yauzl');
const env=dotenv.parse(fs.readFileSync('.env'));const secrets=Object.entries(env).filter(([name,value])=>value&&/OPENAI_API_KEY|AI_WORKER_TOKEN|SERVICE_ROLE|SECRET_KEY|PRIVATE_KEY/.test(name)).map(([,value])=>value);let matches=0;
const match=bytes=>secrets.some(secret=>bytes.includes(secret));
function scan(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())scan(file);else if(item.isFile()&&match(fs.readFileSync(file)))matches++;}}
scan('.netlify/static');scan('.netlify/functions-internal');
await new Promise((resolve,reject)=>yauzl.open('.netlify/functions/___netlify-server-handler.zip',{lazyEntries:true},(error,zip)=>{
 if(error)return reject(error);zip.on('error',reject);zip.on('end',resolve);zip.on('entry',entry=>{if(entry.fileName.endsWith('/'))return zip.readEntry();zip.openReadStream(entry,(error,stream)=>{if(error)return reject(error);let tail=Buffer.alloc(0);stream.on('data',chunk=>{const bytes=Buffer.concat([tail,chunk]);if(match(bytes))matches++;tail=bytes.subarray(-Math.max(1,...secrets.map(secret=>secret.length)));});stream.on('error',reject);stream.on('end',()=>zip.readEntry());});});zip.readEntry();
}));
console.log(JSON.stringify({secretMatchesInDeployment:matches,localEnvironmentRestored:fs.existsSync('.env')}));if(matches)process.exitCode=1;
