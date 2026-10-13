from pathlib import Path
import zipfile,json
from datetime import datetime
from dotenv import dotenv_values
root=Path('.').resolve();out=root/'outputs/cpanel-staging.zip';out.parent.mkdir(exist_ok=True)
secrets=[v.encode() for f in ['.env','.env.local'] if (root/f).exists() for k,v in dotenv_values(root/f).items() if v and ('TOKEN' in k or 'SECRET' in k or k=='OPENAI_API_KEY')]
files=[]
for folder in ['.next','public']:
 for p in (root/folder).rglob('*'):
  if p.is_file() and not any(x in ['cache','dev','standalone','node_modules'] for x in p.relative_to(root).parts):files.append(p)
for name in ['cpanel-server.cjs','next.config.mjs','package-lock.json']:files.append(root/name)
package=json.loads((root/'package.json').read_text());package['scripts']={'start':'node cpanel-server.cjs'};package.pop('devDependencies',None)
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 z.writestr('package.json',json.dumps(package,indent=2))
 for p in files:
  content=p.read_bytes()
  if p.name.startswith('.env') or any(secret in content for secret in secrets):raise RuntimeError('Private content in package')
  info=zipfile.ZipInfo(p.relative_to(root).as_posix(), date_time=datetime.now().timetuple()[:6]);info.create_system=3;info.external_attr=(0o100644<<16);info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,content)
print('Package:',out,'files:',len(files),'bytes:',out.stat().st_size,'secret scan: passed')
