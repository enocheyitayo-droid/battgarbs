// Local packaging helper: Netlify's Next adapter copies symlinks that require
// Windows administrator/developer privileges. Dereference them into ordinary
// files only within this project's generated server-function staging folder.
const fs=require('node:fs/promises');
const path=require('node:path');
const {syncBuiltinESMExports}=require('node:module');
const original=fs.cp.bind(fs);
const target=path.resolve(__dirname,'..','.netlify','functions-internal').toLowerCase();
fs.cp=(source,destination,options={})=>{
 const resolved=path.resolve(String(destination)).toLowerCase();
 const local=resolved===target||resolved.startsWith(target+path.sep);
 return original(source,destination,local?{...options,dereference:true,verbatimSymlinks:false}:options);
};
syncBuiltinESMExports();
