from PIL import Image,ImageOps,ImageDraw
from pathlib import Path
import json
root=Path('outputs/battgarbs/work/client-media');items=json.loads((root/'inventory.json').read_text());images=[x for x in items if Path(x['path']).suffix.lower()!='.mp4'];videos=[x for x in items if Path(x['path']).suffix.lower() in ['.mp4','.mov']];print('Images',len(images),'Videos',len(videos))
for start in range(0,len(images),30):
 sheet=Image.new('RGB',(1200,1400),'#eee');draw=ImageDraw.Draw(sheet)
 for n,item in enumerate(images[start:start+30]):
  index=items.index(item)
  try:
   im=ImageOps.exif_transpose(Image.open(item['path']));im.thumbnail((230,205));x=n%5*240;y=n//5*233;sheet.paste(im,(x+(240-im.width)//2,y));draw.text((x+5,y+208),f'{index:03}  {Image.open(item["path"]).size}',fill='black')
  except Exception as e:print('Unreadable',index,type(e).__name__)
 sheet.save(root/f'contact-{start//30}.jpg')
