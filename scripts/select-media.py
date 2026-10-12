from PIL import Image,ImageOps
from pathlib import Path
import json
root=Path('outputs/battgarbs/work/client-media');items=json.loads((root/'inventory.json').read_text());out=Path('outputs/battgarbs/public/images/client');out.mkdir(parents=True,exist_ok=True)
selected={35:'satin-gown',10:'lace-gown',29:'draped-gown',60:'bridal-fitting',24:'pattern-making',62:'atelier-fitting',36:'sewing-detail',92:'floral-occasion',59:'evening-piece',43:'blue-occasion',93:'satin-train',67:'satin-back'}
for index,name in selected.items():
 im=ImageOps.exif_transpose(Image.open(items[index]['path'])).convert('RGB');im.thumbnail((1400,1600));im.save(out/(name+'.webp'),'WEBP',quality=85)
(root/'selection.json').write_text(json.dumps([{'index':i,'source':items[i]['name'],'asset':'/images/client/'+n+'.webp'} for i,n in selected.items()],indent=2),encoding='utf-8');print('Selected images:',len(selected))
