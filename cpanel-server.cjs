const http=require('node:http');const next=require('next');
process.env.NODE_ENV='production';process.env.NEXT_TELEMETRY_DISABLED='1';
const app=next({dev:false,dir:__dirname});const handle=app.getRequestHandler();
app.prepare().then(()=>{http.createServer((req,res)=>{res.setHeader('X-Robots-Tag','noindex, nofollow');handle(req,res);}).listen(process.env.PORT||3000);}).catch(()=>{console.error('Application startup failed. Check the build and dependency installation.');process.exit(1);});
