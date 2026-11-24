"""Install matching compiler binaries from the locally installed GDevelop app.

Only compiler files and normal compiled previews belong in GD_VALIDATION_HOME.
No source-project copy or backup is made. Set GD_VALIDATION_HOME explicitly.
"""
import hashlib,json,os,struct
from pathlib import Path

dest=Path(os.environ['GD_VALIDATION_HOME']).resolve()
archive=Path(os.environ.get('GD_APP_ASAR',str(Path(os.environ['LOCALAPPDATA'])/'Programs/GDevelop/resources/app.asar')))
assert archive.is_file(),archive
dest.mkdir(parents=True,exist_ok=True)
with archive.open('rb') as f:
 header=struct.unpack('<4I',f.read(16));table=json.loads(f.read(header[3]));start=8+header[1]
 for name in ['libGD.js','libGD.wasm']:
  entry=table['files']['www']['files'][name];f.seek(start+int(entry['offset']));data=f.read(entry['size']);(dest/name).write_bytes(data)
  print(name,len(data),hashlib.sha256(data).hexdigest())
print('Native compiler ready:',dest)
