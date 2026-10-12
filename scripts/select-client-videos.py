from pathlib import Path
import json,shutil
root=Path('work/client-media');items=json.loads((root/'inventory.json').read_text());out=Path('public/videos/client');out.mkdir(parents=True,exist_ok=True)
selection={80:'satin-gown',89:'lace-gown',50:'sewing-detail'}
for i,name in selection.items():shutil.copyfile(items[i]['path'],out/(name+'.mp4'))
(root/'selected-videos.json').write_text(json.dumps([{'index':i,'source':items[i]['name'],'asset':'/videos/client/'+n+'.mp4','bytes':items[i]['bytes']} for i,n in selection.items()],indent=2),encoding='utf-8')
p=Path('src/ClientGallery.tsx');s=p.read_text(encoding='utf-8');s=s.replace('</div></section>;}', '</div><h2 className="client-film-heading">{t(\'Inside the atelier\',\'Im Atelier\')}</h2><div className="client-films">{[\'satin-gown\',\'lace-gown\',\'sewing-detail\'].map(asset=><figure key={asset}><video controls playsInline preload="none" poster={\'/images/client/\'+asset+\'.webp\'} src={\'/videos/client/\'+asset+\'.mp4\'} aria-label={asset.replaceAll(\'-\',\' \')}/><figcaption>{t(\'Batt Garbs atelier footage\',\'Aufnahmen aus dem Batt Garbs Atelier\')}</figcaption></figure>)}</div></section>;}');p.write_text(s,encoding='utf-8')
