from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
import zipfile,json
root=Path('work/white-studio').resolve();root.mkdir(parents=True,exist_ok=True);files=[]
with zipfile.ZipFile(r'C:\Users\HP\Downloads\White_Studio_Photos.zip') as z:
 for item in z.infolist():
  if item.is_dir() or Path(item.filename).suffix.lower() not in ['.jpg','.jpeg','.png','.webp']:continue
  dest=(root/item.filename).resolve()
  if not dest.is_relative_to(root):raise RuntimeError('Unsafe path')
  dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(z.read(item));files.append(str(dest))
(root/'inventory.json').write_text(json.dumps(files,indent=2),encoding='utf-8')
print('Images:',len(files))
for start in range(0,len(files),24):
 sheet=Image.new('RGB',(1200,1200),'#ddd');draw=ImageDraw.Draw(sheet)
 for n,p in enumerate(files[start:start+24]):
  im=ImageOps.exif_transpose(Image.open(p));im.thumbnail((285,170));x=n%4*300;y=n//4*200;sheet.paste(im,(x+(300-im.width)//2,y));draw.text((x+8,y+174),str(start+n)+' '+Path(p).name[:30],fill='black')
 sheet.save(root/f'sheet-{start//24}.jpg')
