from pathlib import Path
import zipfile
root=Path('.').resolve();out=root/'outputs/cpanel-public-fix.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for p in (root/'public').rglob('*'):
  if p.is_file():
   info=zipfile.ZipInfo(p.relative_to(root).as_posix());info.create_system=3;info.external_attr=(0o100644<<16);info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,p.read_bytes())
print('Public-media permission repair package bytes:',out.stat().st_size)
