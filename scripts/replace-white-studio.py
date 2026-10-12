from pathlib import Path
from PIL import Image,ImageOps
import json
root=Path('work/white-studio');files=json.loads((root/'inventory.json').read_text());mapping={'satin-gown':20,'lace-gown':23,'draped-gown':17,'satin-train':15,'satin-back':8,'floral-occasion':11,'blue-occasion':22,'evening-piece':19}
report=[]
for name,index in mapping.items():
 im=ImageOps.exif_transpose(Image.open(files[index])).convert('RGB');im.thumbnail((1400,1600));dest=Path('public/images/client')/(name+'.webp');im.save(dest,'WEBP',quality=88);report.append({'asset':'/images/client/'+name+'.webp','source':Path(files[index]).name,'dimensions':im.size})
(root/'replacements.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print('White studio replacements:',len(report))
