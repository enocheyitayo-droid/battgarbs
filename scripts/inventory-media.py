import zipfile, json
from pathlib import Path
z=zipfile.ZipFile(r'C:\Users\HP\Downloads\12 Oct 2026.zip');root=Path('outputs/battgarbs/work/client-media').resolve();root.mkdir(parents=True,exist_ok=True)
files=[]
for i in z.infolist():
 p=(root/i.filename).resolve()
 if not p.is_relative_to(root):raise RuntimeError('Unsafe ZIP path')
 if not i.is_dir() and Path(i.filename).suffix.lower() in ['.jpg','.jpeg','.png','.webp','.mp4','.mov','.heic']:
  p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(z.read(i));files.append({'path':str(p),'name':i.filename,'bytes':i.file_size})
(root/'inventory.json').write_text(json.dumps(files,indent=2),encoding='utf-8');print('Media files:',len(files));print(json.dumps(files[:4],indent=2))
